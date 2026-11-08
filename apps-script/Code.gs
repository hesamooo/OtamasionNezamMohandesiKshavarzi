const ROOT_FOLDER_NAME = "Nezam636_Automation_Archive";
const MASTER_DB_FILE = "Nezam636_Master_DB.json";
const LEGACY_DB_FILE = "db.json";
const CASE_FOLDER_TAG = "NEZAM636_CASE_ID:";
const DOC_META_PREFIX = "NEZAM636_DOC_V1:";
const AUTH_ALLOWED_EMAILS_PROPERTY = "NEZAM636_ALLOWED_EMAILS";
const AUTH_SESSION_PREFIX = "NEZAM636_SESSION_";
const AUTH_OTP_PREFIX = "NEZAM636_OTP_";
const AUTH_RATE_PREFIX = "NEZAM636_OTP_RATE_";
const AUTH_SESSION_TTL_SECONDS = 6 * 60 * 60;
const AUTH_OTP_TTL_SECONDS = 5 * 60;
const AUTH_RESEND_COOLDOWN_SECONDS = 60;
const AUTH_MAX_OTP_ATTEMPTS = 5;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MiB per file; batches are uploaded sequentially by the client.
const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "tif", "tiff", "bmp",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf",
  "odt", "ods", "odp"
];

function getOrCreateRootFolder() {
  const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function safeDriveName_(value, fallback) {
  return String(value || fallback || "document")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || String(fallback || "document");
}

function createJsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(message, code) {
  // success:false / ok:false برای اینکه کلاینت خطای واقعی سرور (از جمله تعارض نسخه) را تشخیص دهد.
  return createJsonOutput({ status: "error", success: false, ok: false, apiVersion: 2, code: code || "ERROR", message: String(message || "خطای نامشخص") });
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function getAllowedEmails_() {
  const configured = PropertiesService.getScriptProperties().getProperty(AUTH_ALLOWED_EMAILS_PROPERTY);
  const source = configured || "";
  if (!source.trim()) throw new Error("فهرست ایمیل‌های مجاز در Script Properties تنظیم نشده است.");
  return source.split(/[;,\s]+/).map(normalizeEmail_).filter(function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });
}

function randomSixDigitCode_() {
  const hex = Utilities.getUuid().replace(/-/g, "").slice(0, 12);
  return String(parseInt(hex, 16) % 1000000).padStart(6, "0");
}

function hashText_(value) {
  return sha256Hex_(Utilities.newBlob(String(value || ""), "text/plain").getBytes());
}

function requestLoginCode_(payload) {
  const email = normalizeEmail_(payload && payload.email);
  const allowed = getAllowedEmails_();
  if (!email || allowed.indexOf(email) === -1) {
    throw new Error("این نشانی ایمیل مجوز ورود به اتوماسیون را ندارد.");
  }

  const cache = CacheService.getScriptCache();
  const emailKey = hashText_(email).slice(0, 32);
  const rateKey = AUTH_RATE_PREFIX + emailKey;
  const hourlyKey = AUTH_RATE_PREFIX + "HOUR_" + emailKey;
  if (cache.get(rateKey)) throw new Error("برای ارسال کد جدید، یک دقیقه صبر کنید.");
  const hourlyCount = Number(cache.get(hourlyKey) || 0);
  if (hourlyCount >= 5) throw new Error("سقف درخواست کد ورود برای این ایمیل در یک ساعت گذشته تکمیل شده است.");

  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota < 1) {
    throw new Error("سهمیه روزانه ارسال ایمیل Apps Script تمام شده است؛ بعداً دوباره تلاش کنید یا حساب اجراکننده را بررسی کنید.");
  }

  const code = randomSixDigitCode_();
  try {
    MailApp.sendEmail({
      to: email,
      subject: "کد ورود اتوماسیون مرکز ۶۳۶ خفر",
      body: "کد یک‌بارمصرف ورود شما: " + code + "\n\nاین کد تا ۵ دقیقه معتبر است و فقط یک بار قابل استفاده است. اگر شما درخواست ورود نداده‌اید، این پیام را نادیده بگیرید."
    });
  } catch (mailError) {
    // در صورت شکست ارسال، محدودیت زمانی و شمارنده ساعتی ثبت نمی‌شوند تا کاربر قفل نشود.
    throw new Error("ارسال ایمیل توسط Google انجام نشد: " + String(mailError && mailError.message ? mailError.message : mailError));
  }

  // فقط پس از ارسال موفق، کد و محدودیت درخواست بعدی ذخیره می‌شوند.
  const otpRecord = {
    email: email,
    codeHash: hashText_(email + "|" + code),
    attempts: 0,
    createdAt: Date.now()
  };
  cache.put(AUTH_OTP_PREFIX + emailKey, JSON.stringify(otpRecord), AUTH_OTP_TTL_SECONDS);
  cache.put(rateKey, "1", AUTH_RESEND_COOLDOWN_SECONDS);
  cache.put(hourlyKey, String(hourlyCount + 1), 3600);

  return { status: "success", apiVersion: 2, message: "کد ورود به ایمیل مجاز ارسال شد.", expiresIn: AUTH_OTP_TTL_SECONDS };
}

function verifyLoginCode_(payload) {
  const email = normalizeEmail_(payload && payload.email);
  const code = String(payload && payload.code || "").replace(/\D/g, "");
  if (!email || getAllowedEmails_().indexOf(email) === -1) throw new Error("درخواست ورود معتبر نیست.");
  if (!/^\d{6}$/.test(code)) throw new Error("کد ورود باید دقیقاً ۶ رقم باشد.");

  const cache = CacheService.getScriptCache();
  const emailKey = hashText_(email).slice(0, 32);
  const otpKey = AUTH_OTP_PREFIX + emailKey;
  const raw = cache.get(otpKey);
  if (!raw) throw new Error("کد ورود منقضی شده یا درخواست کد وجود ندارد؛ کد تازه بگیرید.");
  const record = JSON.parse(raw);
  if (Number(record.attempts || 0) >= AUTH_MAX_OTP_ATTEMPTS) {
    cache.remove(otpKey);
    throw new Error("تعداد تلاش‌های ناموفق بیش از حد مجاز است؛ کد تازه درخواست کنید.");
  }
  if (record.email !== email || record.codeHash !== hashText_(email + "|" + code)) {
    record.attempts = Number(record.attempts || 0) + 1;
    const remaining = Math.max(1, Math.ceil((AUTH_OTP_TTL_SECONDS * 1000 - (Date.now() - Number(record.createdAt || Date.now()))) / 1000));
    if (record.attempts >= AUTH_MAX_OTP_ATTEMPTS) cache.remove(otpKey);
    else cache.put(otpKey, JSON.stringify(record), remaining);
    throw new Error("کد ورود صحیح نیست.");
  }

  cache.remove(otpKey);
  const token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  cache.put(AUTH_SESSION_PREFIX + hashText_(token), email, AUTH_SESSION_TTL_SECONDS);
  return { status: "success", apiVersion: 2, sessionToken: token, expiresIn: AUTH_SESSION_TTL_SECONDS, email: email };
}

function requireDocumentAccess_(payload) {
  const token = String(payload && payload.sessionToken || "").trim();
  if (!token || token.length < 48) throw new Error("نشست ورود معتبر نیست؛ دوباره وارد شوید.");
  const email = CacheService.getScriptCache().get(AUTH_SESSION_PREFIX + hashText_(token));
  if (!email || getAllowedEmails_().indexOf(normalizeEmail_(email)) === -1) {
    throw new Error("نشست ورود منقضی یا نامعتبر است؛ دوباره وارد شوید.");
  }
  return email;
}


// فقط برای اجرای دستی مدیر پروژه از محیط Apps Script؛ محدودیت‌های باقی‌مانده
// ناشی از تلاش‌های ناموفق قبلی را برای ایمیل‌های مجاز پاک می‌کند.
function resetNezamLoginThrottle() {
  const cache = CacheService.getScriptCache();
  const allowed = getAllowedEmails_();
  allowed.forEach(function(email) {
    const emailKey = hashText_(email).slice(0, 32);
    cache.remove(AUTH_RATE_PREFIX + emailKey);
    cache.remove(AUTH_RATE_PREFIX + "HOUR_" + emailKey);
    cache.remove(AUTH_OTP_PREFIX + emailKey);
  });
  return "محدودیت ارسال و کدهای قبلی برای ایمیل‌های مجاز پاک شد؛ اکنون یک بار درخواست کد بدهید.";
}

// آزمایش دستی ارسال ایمیل؛ فقط با اجرای مدیر پروژه از محیط Apps Script.
function testNezamEmailDelivery() {
  const allowed = getAllowedEmails_();
  if (!allowed.length) throw new Error("هیچ ایمیل مجازی در Script Properties ثبت نشده است.");
  const recipient = allowed[0];
  const quota = MailApp.getRemainingDailyQuota();
  if (quota < 1) throw new Error("سهمیه روزانه ارسال ایمیل Apps Script تمام شده است.");
  MailApp.sendEmail({
    to: recipient,
    subject: "آزمایش ارسال ایمیل اتوماسیون مرکز ۶۳۶ خفر",
    body: "این یک پیام آزمایشی از Google Apps Script است. اگر آن را دریافت کرده‌اید، مجوز و سرویس ارسال ایمیل فعال است."
  });
  return "پیام آزمایشی برای " + recipient + " ارسال شد. سهمیه باقی‌مانده پیش از ارسال: " + quota;
}

// این تابع را یک بار از محیط Apps Script اجرا کنید تا مجوز ارسال ایمیل و دسترسی Drive صادر شود.
function authorizeNezamSecurity() {
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder().getId();
  return "مجوزهای ارسال کد ورود و دسترسی Drive تأیید شد.";
}

function getCaseFolder_(payload, createIfMissing) {
  const root = getOrCreateRootFolder();
  const caseId = String(payload.caseId || "").trim();
  if (!caseId || caseId.length > 160) throw new Error("شناسه پرونده معتبر نیست.");

  const tag = CASE_FOLDER_TAG + caseId;
  const folders = root.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    const description = String(folder.getDescription() || "");
    if (description.indexOf(tag) === 0 || description.indexOf("\n" + tag) !== -1) return folder;
  }

  const fullName = safeDriveName_(payload.fullName, "متقاضی");
  const nationalCode = safeDriveName_(payload.nationalCode, "بدون_شناسه");
  const folderName = (fullName + "_" + nationalCode).slice(0, 180);
  const matches = root.getFoldersByName(folderName);
  let folder = matches.hasNext() ? matches.next() : null;
  if (!folder && createIfMissing) folder = root.createFolder(folderName);
  if (!folder) return null;

  const oldDescription = String(folder.getDescription() || "");
  if (oldDescription.indexOf(tag) === -1) {
    folder.setDescription((oldDescription ? oldDescription + "\n" : "") + tag);
  }
  return folder;
}

function getDocMeta_(file) {
  const description = String(file.getDescription() || "");
  const index = description.indexOf(DOC_META_PREFIX);
  if (index < 0) return null;
  try {
    return JSON.parse(description.substring(index + DOC_META_PREFIX.length));
  } catch (err) {
    return null;
  }
}

function setDocMeta_(file, meta) {
  file.setDescription(DOC_META_PREFIX + JSON.stringify(meta));
}

function getOrCreateDocumentFolder_(caseFolder, docCode, docTitle) {
  const folderName = (safeDriveName_(docCode, "OTHER") + " - " + safeDriveName_(docTitle, "سایر مدارک")).slice(0, 180);
  const matches = caseFolder.getFoldersByName(folderName);
  if (matches.hasNext()) return matches.next();
  const folder = caseFolder.createFolder(folderName);
  folder.setDescription("NEZAM636_DOCUMENT_CATEGORY:" + String(docCode || "OTHER"));
  return folder;
}

function getAllCaseFiles_(caseFolder) {
  const result = [];
  const rootFiles = caseFolder.getFiles();
  while (rootFiles.hasNext()) result.push(rootFiles.next());
  const childFolders = caseFolder.getFolders();
  while (childFolders.hasNext()) {
    const child = childFolders.next();
    const childFiles = child.getFiles();
    while (childFiles.hasNext()) result.push(childFiles.next());
  }
  return result;
}

function isFileInsideFolder_(file, folder) {
  const parents = file.getParents();
  while (parents.hasNext()) {
    const parent = parents.next();
    if (parent.getId() === folder.getId()) return true;
    const grandParents = parent.getParents();
    while (grandParents.hasNext()) {
      if (grandParents.next().getId() === folder.getId()) return true;
    }
  }
  return false;
}

function fileToResponse_(file, meta) {
  const m = meta || {};
  const id = file.getId();
  return {
    id: id,
    fileId: id,
    name: file.getName(),
    fileName: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    updatedAt: file.getLastUpdated().getTime(),
    webViewLink: file.getUrl(),
    downloadUrl: "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(id),
    caseId: String(m.caseId || ""),
    docCode: String(m.docCode || "LEGACY"),
    docTitle: String(m.docTitle || "فایل قدیمی / پیوست"),
    uploadedAt: Number(m.uploadedAt || file.getDateCreated().getTime()),
    version: Number(m.version || 1),
    sha256: String(m.sha256 || ""),
    legacy: !meta
  };
}

function listCaseDocuments_(payload) {
  const folder = getCaseFolder_(payload, false);
  if (!folder) return { status: "success", caseId: String(payload.caseId), folderName: "", documents: [] };
  const documents = [];
  const files = getAllCaseFiles_(folder);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.isTrashed()) continue;
    const name = file.getName();
    if (name === "Applicant_Data.json" || name === "مشخصات_کامل_پرونده.txt") continue;
    const meta = getDocMeta_(file);
    documents.push(fileToResponse_(file, meta));
  }
  documents.sort(function(a, b) { return Number(b.updatedAt || 0) - Number(a.updatedAt || 0); });
  return {
    status: "success",
    caseId: String(payload.caseId),
    folderId: folder.getId(),
    folderName: folder.getName(),
    folderUrl: folder.getUrl(),
    documents: documents
  };
}

// دریافت محتوای واقعی سند برای پیش‌نمایش و چاپ پیوست؛ فقط پس از OTP و فقط از پوشه همان پرونده.
// فایل‌های Word با Drive API به سند موقت Google Docs تبدیل و سپس به PDF خروجی گرفته می‌شوند.
function getCaseDocumentContent_(payload) {
  const folder = getCaseFolder_(payload, false);
  if (!folder) throw new Error("پوشه پرونده برای دریافت پیوست پیدا نشد.");
  const fileId = String(payload.fileId || "").trim();
  if (!fileId) throw new Error("شناسه فایل پیوست ارسال نشده است.");

  const file = DriveApp.getFileById(fileId);
  if (file.isTrashed() || !isFileInsideFolder_(file, folder)) {
    throw new Error("این فایل در بایگانی پرونده انتخاب‌شده وجود ندارد یا قابل دسترسی نیست.");
  }
  if (file.getSize() > MAX_DOCUMENT_BYTES) {
    throw new Error("حجم فایل برای درج مستقیم در پیش‌نمایش چاپ بیش از ۱۰ مگابایت است.");
  }

  const extension = getExtension_(file.getName());
  let blob = file.getBlob();
  let outputMimeType = file.getMimeType() || blob.getContentType() || "application/octet-stream";
  let convertedFrom = "";
  let temporaryGoogleDocId = "";
  const isNativeGoogleDoc = file.getMimeType() === "application/vnd.google-apps.document";

  if (isNativeGoogleDoc) {
    if (typeof Drive === "undefined" || !Drive.Files || typeof Drive.Files.export !== "function") {
      throw new Error("برای چاپ Google Docs، سرویس پیشرفته Drive API باید در Apps Script فعال شود (Services > + > Drive API). سپس نسخه جدید Web App را منتشر کنید.");
    }
    try {
      blob = Drive.Files.export(fileId, "application/pdf");
      blob.setName(file.getName() + ".pdf");
      outputMimeType = "application/pdf";
      convertedFrom = "Google Docs";
    } catch (exportError) {
      throw new Error("خروجی PDF از Google Docs ناموفق بود: " + String(exportError && exportError.message ? exportError.message : exportError));
    }
  } else if (extension === "doc" || extension === "docx") {
    if (typeof Drive === "undefined" || !Drive.Files || typeof Drive.Files.create !== "function" || typeof Drive.Files.export !== "function") {
      throw new Error("برای چاپ فایل Word، سرویس پیشرفته Drive API باید در Apps Script فعال شود (Services > + > Drive API). سپس نسخه جدید Web App را منتشر کنید.");
    }
    try {
      const converted = Drive.Files.create({
        name: "NEZAM636_TEMP_PRINT_" + file.getName(),
        mimeType: "application/vnd.google-apps.document"
      }, blob, { fields: "id,mimeType,name" });
      temporaryGoogleDocId = String(converted && converted.id || "");
      if (!temporaryGoogleDocId) throw new Error("تبدیل فایل Word به Google Docs شناسه معتبری برنگرداند.");
      blob = Drive.Files.export(temporaryGoogleDocId, "application/pdf");
      blob.setName(file.getName().replace(/\.docx?$/i, "") + ".pdf");
      outputMimeType = "application/pdf";
      convertedFrom = extension.toUpperCase();
    } catch (conversionError) {
      throw new Error("تبدیل فایل Word به PDF ناموفق بود: " + String(conversionError && conversionError.message ? conversionError.message : conversionError));
    } finally {
      if (temporaryGoogleDocId) {
        try { Drive.Files.remove(temporaryGoogleDocId); } catch (cleanupError) { console.warn("پاک‌سازی سند موقت چاپ انجام نشد: " + cleanupError); }
      }
    }
  }

  const bytes = blob.getBytes();
  if (!bytes || !bytes.length) throw new Error("محتوای فایل پیوست خالی است.");
  if (bytes.length > MAX_DOCUMENT_BYTES) throw new Error("حجم فایل خروجی پس از تبدیل بیش از ۱۰ مگابایت است.");
  if (outputMimeType !== "application/pdf" && outputMimeType.indexOf("image/") !== 0) {
    throw new Error("فرمت این فایل برای درج تصویری در چاپ پشتیبانی نمی‌شود. فایل Word یا PDF یا تصویر انتخاب کنید.");
  }

  return {
    status: "success",
    document: {
      id: fileId,
      name: file.getName(),
      originalMimeType: file.getMimeType(),
      mimeType: outputMimeType,
      convertedFrom: convertedFrom,
      size: bytes.length,
      data: Utilities.base64Encode(bytes)
    }
  };
}

function getExtension_(fileName) {
  const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function validateFileBytes_(extension, bytes) {
  if (!bytes || !bytes.length) return false;
  const b = bytes.map(function(v) { return (v + 256) % 256; });
  const starts = function(values) { return values.every(function(value, i) { return b[i] === value; }); };
  if (extension === "pdf") return b.length >= 5 && starts([0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (extension === "jpg" || extension === "jpeg") return b.length >= 3 && starts([0xff, 0xd8, 0xff]);
  if (extension === "png") return b.length >= 8 && starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === "gif") return b.length >= 6 && String.fromCharCode.apply(null, b.slice(0, 6)).match(/^GIF8[79]a$/) !== null;
  if (extension === "webp") return b.length >= 12 && starts([0x52, 0x49, 0x46, 0x46]) && String.fromCharCode.apply(null, b.slice(8, 12)) === "WEBP";
  if (extension === "tif" || extension === "tiff") return b.length >= 4 && (starts([0x49, 0x49, 0x2a, 0x00]) || starts([0x4d, 0x4d, 0x00, 0x2a]));
  if (extension === "bmp") return b.length >= 2 && starts([0x42, 0x4d]);
  if (["doc", "xls", "ppt"].indexOf(extension) !== -1) return b.length >= 8 && starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (["docx", "xlsx", "pptx", "odt", "ods", "odp"].indexOf(extension) !== -1) return b.length >= 4 && starts([0x50, 0x4b, 0x03, 0x04]);
  if (["txt", "csv", "rtf"].indexOf(extension) !== -1) {
    const sample = b.slice(0, Math.min(4096, b.length));
    return sample.every(function(value) { return value === 9 || value === 10 || value === 13 || value >= 32 || value >= 128; });
  }
  return false;
}

function sha256Hex_(bytes) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
  return digest.map(function(value) { return (value < 0 ? value + 256 : value).toString(16).padStart(2, "0"); }).join("");
}

function uploadCaseDocument_(payload) {
  const folder = getCaseFolder_(payload, true);
  const fileName = safeDriveName_(payload.fileName, "document");
  const extension = getExtension_(fileName);
  if (ALLOWED_DOCUMENT_EXTENSIONS.indexOf(extension) === -1) throw new Error("پسوند این فایل پشتیبانی نمی‌شود.");
  const base64 = String(payload.fileData || "");
  if (!base64) throw new Error("محتوای فایل دریافت نشد.");
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length <= 0 || bytes.length > MAX_DOCUMENT_BYTES) throw new Error("حجم هر فایل باید بیشتر از صفر و حداکثر ۱۰ مگابایت باشد.");
  if (!validateFileBytes_(extension, bytes)) throw new Error("ساختار واقعی فایل با پسوند آن مطابقت ندارد یا فایل قابل‌خواندن نیست.");

  const docCode = String(payload.docCode || "OTHER").slice(0, 120);
  const docTitle = safeDriveName_(payload.docTitle, "سایر مدارک");
  const hash = sha256Hex_(bytes);
  const oldFiles = getAllCaseFiles_(folder);
  for (let i = 0; i < oldFiles.length; i++) {
    const existing = oldFiles[i];
    const existingMeta = getDocMeta_(existing);
    if (!existing.isTrashed() && existingMeta && String(existingMeta.docCode) === docCode && existingMeta.sha256 === hash) {
      return { status: "success", duplicate: true, document: fileToResponse_(existing, existingMeta), message: "این فایل قبلاً برای همین مدرک بارگذاری شده است." };
    }
  }

  const mimeType = String(payload.fileType || "application/octet-stream").slice(0, 120);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const docFolder = getOrCreateDocumentFolder_(folder, docCode, docTitle);
  const file = docFolder.createFile(blob);
  const meta = {
    schema: 1,
    caseId: String(payload.caseId),
    docCode: docCode,
    docTitle: docTitle,
    originalName: fileName,
    uploadedAt: Date.now(),
    version: 1,
    sha256: hash,
    replacedFileId: ""
  };
  try {
    setDocMeta_(file, meta);
    if (file.getSize() !== bytes.length) throw new Error("تطبیق حجم فایل پس از ذخیره ناموفق بود.");
  } catch (err) {
    file.setTrashed(true);
    throw err;
  }
  return { status: "success", duplicate: false, document: fileToResponse_(file, meta), message: "فایل با موفقیت در Google Drive ذخیره شد." };
}

function replaceCaseDocument_(payload) {
  const folder = getCaseFolder_(payload, false);
  if (!folder) throw new Error("پوشه متقاضی در Google Drive پیدا نشد.");
  const oldId = String(payload.oldFileId || "");
  if (!oldId) throw new Error("شناسه فایل قبلی برای جایگزینی ارسال نشده است.");
  const oldFile = DriveApp.getFileById(oldId);
  if (!isFileInsideFolder_(oldFile, folder) || oldFile.isTrashed()) throw new Error("فایل قبلی متعلق به این پرونده نیست یا قبلاً حذف شده است.");
  const oldMeta = getDocMeta_(oldFile);
  if (!oldMeta) throw new Error("فایل انتخاب‌شده قابل جایگزینی نیست؛ ابتدا آن را به بایگانی جدید منتقل کنید.");

  const uploadPayload = Object.assign({}, payload, { docCode: oldMeta.docCode, docTitle: oldMeta.docTitle });
  const uploaded = uploadCaseDocument_(uploadPayload);
  if (uploaded.duplicate && uploaded.document.id === oldId) {
    return { status: "success", document: uploaded.document, message: "فایل جدید با نسخه فعلی یکسان است؛ تغییری انجام نشد." };
  }
  try {
    const newFile = DriveApp.getFileById(uploaded.document.id);
    const newMeta = getDocMeta_(newFile) || {};
    newMeta.version = Number(oldMeta.version || 1) + 1;
    newMeta.replacedFileId = oldId;
    setDocMeta_(newFile, newMeta);
    oldFile.setTrashed(true);
    return { status: "success", document: fileToResponse_(newFile, newMeta), message: "نسخه جدید ذخیره و نسخه قبلی به سطل زباله منتقل شد." };
  } catch (err) {
    return { status: "error", code: "REPLACE_PARTIAL", message: "نسخه جدید ذخیره شد اما حذف نسخه قبلی انجام نشد. فایل قبلی حفظ شده است؛ فهرست را بازخوانی کنید.", newFile: uploaded.document };
  }
}

function deleteCaseDocument_(payload) {
  const folder = getCaseFolder_(payload, false);
  if (!folder) throw new Error("پوشه متقاضی پیدا نشد.");
  const fileId = String(payload.fileId || "");
  if (!fileId) throw new Error("شناسه فایل برای حذف ارسال نشده است.");
  const file = DriveApp.getFileById(fileId);
  if (!isFileInsideFolder_(file, folder) || file.isTrashed()) throw new Error("فایل متعلق به این پرونده نیست یا قبلاً حذف شده است.");
  file.setTrashed(true);
  if (!DriveApp.getFileById(fileId).isTrashed()) throw new Error("حذف فایل از Google Drive تأیید نشد.");
  return { status: "success", fileId: fileId, message: "فایل به سطل زباله Google Drive منتقل شد." };
}

function getLatestFileByName_(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  let latest = null;
  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed && file.isTrashed()) continue;
    if (!latest || file.getLastUpdated().getTime() > latest.getLastUpdated().getTime()) latest = file;
  }
  return latest;
}

function getLatestGlobalFileByName_(fileName) {
  const files = DriveApp.getFilesByName(fileName);
  let latest = null;
  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed && file.isTrashed()) continue;
    if (!latest || file.getLastUpdated().getTime() > latest.getLastUpdated().getTime()) latest = file;
  }
  return latest;
}

// نوشتن نسخه اصلی به روش فایل جدید: تا وقتی فایل جدید کامل و قابل بازخوانی نشده، نسخه قبلی دست‌نخورده می‌ماند.
// خواننده‌ها می‌توانند بدون قفل، آخرین فایل کامل را ببینند و هرگز فایل در حال setContent را نخوانند.
function writeVerifiedMasterSnapshot_(folder, serialized) {
  const expected = String(serialized == null ? "" : serialized);
  const nextFile = folder.createFile(MASTER_DB_FILE, expected, MimeType.PLAIN_TEXT);
  try {
    const actual = nextFile.getBlob().getDataAsString("UTF-8");
    if (actual !== expected) throw new Error("تطبیق محتوای نسخه جدید پایگاه داده پس از ایجاد ناموفق بود.");
  } catch (verifyError) {
    try { nextFile.setTrashed(true); } catch (cleanupError) {}
    throw verifyError;
  }

  // پس از تأیید فایل جدید، نسخه‌های قبلی به سطل زباله می‌روند؛ شکست پاک‌سازی، نسخه معتبر جدید را خراب نمی‌کند.
  const files = folder.getFilesByName(MASTER_DB_FILE);
  while (files.hasNext()) {
    const file = files.next();
    if (file.getId() === nextFile.getId() || (file.isTrashed && file.isTrashed())) continue;
    try { file.setTrashed(true); }
    catch (cleanupError) { console.warn("نسخه قدیمی پایگاه داده در سطل زباله قرار نگرفت:", cleanupError); }
  }
  return nextFile;
}

// محتوا ابتدا نوشته و عیناً بازخوانی می‌شود؛ فایل‌های تکراری فقط پس از تأیید نسخه اصلی به سطل زباله می‌روند.
function saveOrUpdateFile(folder, fileName, content) {
  const expected = String(content == null ? "" : content);
  const files = folder.getFilesByName(fileName);
  let primary = null;
  const duplicates = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed && file.isTrashed()) continue;
    if (!primary || file.getLastUpdated().getTime() > primary.getLastUpdated().getTime()) {
      if (primary) duplicates.push(primary);
      primary = file;
    } else {
      duplicates.push(file);
    }
  }

  if (primary) primary.setContent(expected);
  else primary = folder.createFile(fileName, expected, MimeType.PLAIN_TEXT);

  const actual = primary.getBlob().getDataAsString("UTF-8");
  if (actual !== expected) throw new Error("تأیید بازخوانی فایل «" + fileName + "» ناموفق بود؛ نسخه قبلی حفظ شد.");

  duplicates.forEach(function(file) {
    try { file.setTrashed(true); } catch (cleanupError) { console.warn("پاک‌سازی فایل تکراری انجام نشد: " + fileName + " / " + cleanupError); }
  });
  return primary;
}

function findMasterSyncRecord_(parsed) {
  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  let best = null;
  candidates.forEach(function(item) {
    if (!item || typeof item !== "object") return;
    const candidate = item.fullDatabase && item.fullDatabase.storage
      ? item.fullDatabase
      : item;
    if (!candidate.storage || typeof candidate.storage !== "object" || Array.isArray(candidate.storage)) return;
    if (!best || Number(candidate.updatedAt || 0) > Number(best.updatedAt || 0)) best = candidate;
  });
  return best;
}

// مبنای نسخه از فایل اصلی یا نسخه سازگار قدیمی خوانده می‌شود؛ JSON خراب یا دیتابیس فاقد snapshot معتبر، هرگز نسخه صفر فرض نمی‌شود.
function readMasterSyncState_(rootFolder) {
  const root = rootFolder || getOrCreateRootFolder();
  let file = getLatestFileByName_(root, MASTER_DB_FILE);
  let source = MASTER_DB_FILE;
  if (!file) {
    file = getLatestFileByName_(root, LEGACY_DB_FILE);
    source = LEGACY_DB_FILE;
  }
  if (!file) {
    file = getLatestGlobalFileByName_(LEGACY_DB_FILE);
    source = "Drive/" + LEGACY_DB_FILE;
  }
  if (!file) return { exists: false, source: "", updatedAt: 0, revision: 0, record: null };

  let parsed;
  try {
    parsed = JSON.parse(file.getBlob().getDataAsString("UTF-8"));
  } catch (parseError) {
    throw new Error("فایل «" + source + "» در Google Drive وجود دارد اما JSON آن خراب یا ناقص است؛ برای جلوگیری از بازنویسی اطلاعات، ذخیره متوقف شد.");
  }
  const record = findMasterSyncRecord_(parsed);
  if (!record) {
    throw new Error("فایل «" + source + "» نسخه کامل FULL_STORAGE_SYNC ندارد. ابتدا نسخه کامل پایگاه داده را بازیابی یا مهاجرت کنید؛ بازنویسی خودکار متوقف شد.");
  }
  return {
    exists: true,
    source: source,
    fileId: file.getId(),
    updatedAt: Number(record.updatedAt || 0),
    revision: Number(record.serverRevision || record.revision || 0),
    record: record
  };
}

function validateMasterSyncRecord_(syncObj) {
  if (!syncObj || typeof syncObj !== "object" || !syncObj.storage || typeof syncObj.storage !== "object" || Array.isArray(syncObj.storage)) {
    throw new Error("ساختار نسخه کامل پایگاه داده معتبر نیست.");
  }
  if (syncObj._type && syncObj._type !== "FULL_STORAGE_SYNC") {
    throw new Error("نوع نسخه ارسالی برای ذخیره پایگاه داده معتبر نیست.");
  }

  const storage = syncObj.storage;
  Object.keys(storage).forEach(function(key) {
    if (!/^(nezam636_|nezam_croquis_|nezam_gemini_model$)/.test(key) ||
        /api[_-]?key|password|passwd|token|secret|credential|authorization|auth/i.test(key)) {
      throw new Error("کلید غیرمجاز یا حساس در نسخه پایگاه داده شناسایی شد: " + key);
    }
    if (typeof storage[key] !== "string") throw new Error("مقدار کلید «" + key + "» باید متن ذخیره‌شده معتبر باشد.");
  });

  function requireArray(key, label) {
    if (typeof storage[key] !== "string") throw new Error("بخش «" + label + "» در نسخه ارسالی وجود ندارد.");
    let value;
    try { value = JSON.parse(storage[key]); }
    catch (err) { throw new Error("ساختار JSON بخش «" + label + "» خراب است."); }
    if (!Array.isArray(value)) throw new Error("بخش «" + label + "» باید فهرست باشد.");
  }
  requireArray("nezam636_unified_cases", "پرونده‌ها");
  requireArray("nezam636_letters", "نامه‌ها");

  if (typeof storage.nezam636_deletion_manifest_v1 !== "string") {
    throw new Error("فهرست حذف دائمی در نسخه ارسالی وجود ندارد.");
  }
  try {
    const manifest = JSON.parse(storage.nezam636_deletion_manifest_v1);
    if (!manifest || typeof manifest !== "object" ||
        !Array.isArray(manifest.cases) || !Array.isArray(manifest.letters)) {
      throw new Error("invalid deletion manifest");
    }
  } catch (manifestError) {
    throw new Error("ساختار فهرست حذف دائمی معتبر نیست.");
  }

  // قرارداد جدید فقط Google Drive است. فایل‌های پیوست با API مستقل در پوشه پرونده ذخیره می‌شوند؛
  // IndexedDB دیگر بخشی از نسخه مرکزی نیست. فیلد قدیمی را بی‌سروصدا حذف می‌کنیم تا
  // نسخه‌های قبلی کلاینت نیز بتوانند بدون بازگرداندن فایل‌های محلی با سرور کار کنند.
  const normalized = Object.assign({}, syncObj, { _type: "FULL_STORAGE_SYNC", storage: storage });
  delete normalized.indexedDBDocs;
  return normalized;
}

function writeMasterSyncRecord_(payload, syncObj, rootFolder) {
  if (!Object.prototype.hasOwnProperty.call(payload, "expectedUpdatedAt")) {
    return {
      status: "error", success: false, ok: false, apiVersion: 2,
      code: "SYNC_PRECONDITION_REQUIRED",
      message: "نسخه مبنای Google Drive ارسال نشده است؛ ابتدا اطلاعات را از Drive بازخوانی و سپس ذخیره کنید."
    };
  }
  const expectedUpdatedAt = Number(payload.expectedUpdatedAt);
  if (!Number.isFinite(expectedUpdatedAt) || expectedUpdatedAt < 0) {
    return {
      status: "error", success: false, ok: false, apiVersion: 2,
      code: "SYNC_PRECONDITION_INVALID",
      message: "شماره نسخه مبنای ارسالی معتبر نیست؛ بازخوانی مجدد از Drive لازم است."
    };
  }

  const current = readMasterSyncState_(rootFolder);
  if (expectedUpdatedAt !== current.updatedAt) {
    return {
      status: "error", success: false, ok: false, apiVersion: 2,
      code: "SYNC_CONFLICT",
      message: "نسخه Google Drive توسط دستگاه دیگری تغییر کرده است. برای جلوگیری از حذف اطلاعات، ذخیره انجام نشد؛ ابتدا نسخه جدید را بازخوانی و تعارض را بررسی کنید.",
      expectedUpdatedAt: expectedUpdatedAt,
      currentUpdatedAt: current.updatedAt,
      currentRevision: current.revision
    };
  }

  if (syncObj && syncObj.baseUpdatedAt != null && Number(syncObj.baseUpdatedAt) !== expectedUpdatedAt) {
    return {
      status: "error", success: false, ok: false, apiVersion: 2,
      code: "SYNC_BASE_MISMATCH",
      message: "نسخه مبنا در بدنه پشتیبان با نسخه مبنای درخواست همخوانی ندارد؛ ذخیره متوقف شد."
    };
  }

  const normalized = validateMasterSyncRecord_(syncObj);
  const clientTimestamp = Number(normalized.updatedAt || payload.updatedAt || 0);
  normalized.baseUpdatedAt = expectedUpdatedAt;
  normalized.updatedAt = Math.max(Date.now(), expectedUpdatedAt + 1, Number.isFinite(clientTimestamp) ? clientTimestamp : 0);
  normalized.serverRevision = current.revision + 1;
  normalized.serverCommittedAt = Date.now();

  const serialized = JSON.stringify([normalized]);
  const masterFile = writeVerifiedMasterSnapshot_(rootFolder, serialized);

  // db.json فقط نسخه سازگاری قدیمی است؛ خطای mirror نباید ثبت نسخه اصلی را بی‌اعتبار کند.
  let legacyMirrorStatus = "updated";
  try {
    saveOrUpdateFile(rootFolder, LEGACY_DB_FILE, serialized);
  } catch (mirrorError) {
    legacyMirrorStatus = "warning";
    console.error("Legacy DB mirror update failed; master DB remains authoritative:", mirrorError);
  }

  return {
    status: "success",
    success: true,
    apiVersion: 2,
    updatedAt: normalized.updatedAt,
    revision: normalized.serverRevision,
    masterFileId: masterFile.getId(),
    legacyMirrorStatus: legacyMirrorStatus
  };
}

// ۱. دریافت و ذخیره کامل اطلاعات سامانه، همراه با API مستقل مدیریت مدارک.
function doPost(e) {
  let payload;
  let action;
  try {
    if (!e || !e.postData || !e.postData.contents) return jsonError_("داده‌ای دریافت نشد.");
    payload = JSON.parse(e.postData.contents);
    action = String(payload.action || "");
  } catch (parseError) {
    return jsonError_("ساختار درخواست معتبر نیست: " + String(parseError && parseError.message ? parseError.message : parseError), "INVALID_REQUEST");
  }

  // درخواست کد ورود عملیات Cache و ایمیل است و به قفل سنگین Drive نیازی ندارد.
  if (action === "requestLoginCode") {
    try { return createJsonOutput(requestLoginCode_(payload)); }
    catch (err) { return jsonError_(err && err.message ? err.message : String(err)); }
  }

  // تأیید OTP باید در بخش کوتاه و مستقل قفل شود تا یک کد هم‌زمان دوبار مصرف نشود.
  if (action === "verifyLoginCode") {
    const otpLock = LockService.getScriptLock();
    if (!otpLock.tryLock(5000)) return jsonError_("در حال انجام عملیات دیگری هستیم؛ ورود را یک بار دیگر امتحان کنید.", "BUSY");
    try { return createJsonOutput(verifyLoginCode_(payload)); }
    catch (err) { return jsonError_(err && err.message ? err.message : String(err)); }
    finally { otpLock.releaseLock(); }
  }

  // درخواست سلامت، بازخوانی دیتابیس و مشاهده/دریافت فایل‌ها فقط خواندنی‌اند.
  // آن‌ها نباید پشت قفل عملیات نوشتن یا بارگذاری فایل منتظر بمانند.
  try {
    if (action === "sync" && payload.healthCheck === true) {
      requireDocumentAccess_(payload);
      return createJsonOutput({ status: "success", apiVersion: 2, message: "Nezam636 Drive API v2 ready" });
    }

    if (action === "readDatabase") {
      requireDocumentAccess_(payload);
      return createJsonOutput({ status: "success", apiVersion: 2, data: readDatabaseSnapshot_() });
    }

    if (action === "listCaseDocuments" || action === "getCaseDocumentContent") {
      requireDocumentAccess_(payload);
      const result = action === "listCaseDocuments"
        ? listCaseDocuments_(payload)
        : getCaseDocumentContent_(payload);
      result.apiVersion = 2;
      return createJsonOutput(result);
    }
  } catch (readError) {
    return jsonError_(readError && readError.message ? readError.message : String(readError));
  }

  // فقط نوشتن‌ها قفل سراسری می‌گیرند. مهلت قفل کوتاه‌تر از timeout مرورگر است.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) {
    return jsonError_("ذخیره‌سازی دیگری در حال اجراست؛ اطلاعات محلی حفظ شده است. چند ثانیه بعد دوباره تلاش کنید.", "BUSY");
  }

  try {
    // تمام عملیات تغییردهنده Drive فقط با نشست معتبر صادرشده پس از OTP پذیرفته می‌شوند.
    requireDocumentAccess_(payload);

    if (["uploadCaseDocument", "replaceCaseDocument", "deleteCaseDocument"].indexOf(action) !== -1) {
      let result;
      if (action === "uploadCaseDocument") result = uploadCaseDocument_(payload);
      else if (action === "replaceCaseDocument") result = replaceCaseDocument_(payload);
      else result = deleteCaseDocument_(payload);
      result.apiVersion = 2;
      return createJsonOutput(result);
    }

    const rootFolder = getOrCreateRootFolder();

    // الف) ذخیره نسخه کامل دیتابیس با کنترل نسخه اجباری و قفل سراسری ScriptLock.
    if (
      action === "sync" || payload.fullDatabase ||
      (payload.db && Array.isArray(payload.db)) ||
      payload.nationalCode === "SYSTEM_MASTER_DB"
    ) {
      const syncObj = payload.fullDatabase ||
        (Array.isArray(payload.db) && payload.db.length > 0 ? payload.db[0] : payload);
      if (syncObj && syncObj.storage && Object.keys(syncObj.storage).length <= 2 && !syncObj.storage["nezam636_unified_cases"]) {
        return createJsonOutput({ status: "skipped", success: false, ok: false, apiVersion: 2, message: "جلوگیری از بازنویسی دیتای خالی." });
      }
      const syncResult = writeMasterSyncRecord_(payload, syncObj, rootFolder);
      return createJsonOutput(syncResult);
    }

    // ب) ساخت/به‌روزرسانی پوشه اختصاصی متقاضی و پشتیبان سازگار با نسخه قبل.
    const safeName = safeDriveName_(payload.fullName, "متقاضی");
    const safeNid = safeDriveName_(payload.nationalCode, String(Date.now()));
    const folderTitle = safeName + "_" + safeNid;
    const caseId = String(payload.caseId || "").trim();
    const appFolder = caseId
      ? getCaseFolder_(Object.assign({}, payload, { caseId: caseId }), true)
      : (function() {
          const matches = rootFolder.getFoldersByName(folderTitle);
          return matches.hasNext() ? matches.next() : rootFolder.createFolder(folderTitle);
        })();

    const storedPayload = Object.assign({}, payload);
    delete storedPayload.accessKey;
    delete storedPayload.sessionToken;
    saveOrUpdateFile(appFolder, "مشخصات_کامل_پرونده.txt", payload.description || JSON.stringify(storedPayload, null, 2));
    saveOrUpdateFile(appFolder, "Applicant_Data.json", JSON.stringify(storedPayload, null, 2));

    // پیوست قدیمی تک‌فایلی همچنان پذیرفته می‌شود تا نسخه‌های قبلی اتوماسیون نشکنند.
    if (payload.fileData && payload.fileName) {
      const decoded = Utilities.base64Decode(payload.fileData);
      const blob = Utilities.newBlob(decoded, payload.fileType || "application/octet-stream", safeDriveName_(payload.fileName, "attachment"));
      const oldFiles = appFolder.getFilesByName(blob.getName());
      while (oldFiles.hasNext()) oldFiles.next().setTrashed(true);
      appFolder.createFile(blob);
    }
    return createJsonOutput({ status: "success", success: true, apiVersion: 2, message: "پوشه و اطلاعات متقاضی ذخیره شد." });
  } catch (err) {
    return jsonError_(err && err.message ? err.message : String(err));
  } finally {
    lock.releaseLock();
  }
}

// بازخوانی دیتابیس اصلی فقط از پوشه مرکزی انجام می‌شود.
// اسکن همه پوشه‌های متقاضی برای Applicant_Data در هر بار ورود غیرضروری و کند بود؛
// این نسخه‌های تکی پشتیبان، در کلاینت نیز عمداً با دیتابیس اصلی ادغام نمی‌شوند.
function readDatabaseSnapshot_() {
  const root = getOrCreateRootFolder();
  let dbFile = getLatestFileByName_(root, MASTER_DB_FILE) || getLatestFileByName_(root, LEGACY_DB_FILE);
  if (!dbFile) dbFile = getLatestGlobalFileByName_(LEGACY_DB_FILE);
  if (!dbFile) return [];

  const content = dbFile.getBlob().getDataAsString("UTF-8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error("فایل پایگاه داده «" + dbFile.getName() + "» در Google Drive خراب یا ناقص است؛ از گزارش نسخه خالی جلوگیری شد.");
  }
  const records = Array.isArray(parsed) ? parsed
    : (parsed && typeof parsed === "object" ? [parsed] : null);
  if (!records) throw new Error("ساختار فایل پایگاه داده در Google Drive معتبر نیست.");

  // در نسخه‌های قدیمی ممکن است فیلد پیوست‌های محلی وجود داشته باشد؛ آن را به کلاینت برنمی‌گردانیم.
  // فایل‌های واقعی پیوست فقط از API مستقل پوشه همان پرونده خوانده می‌شوند.
  return records.map(function(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) return record;
    const clean = Object.assign({}, record);
    delete clean.indexedDBDocs;
    if (clean.fullDatabase && typeof clean.fullDatabase === "object" && !Array.isArray(clean.fullDatabase)) {
      clean.fullDatabase = Object.assign({}, clean.fullDatabase);
      delete clean.fullDatabase.indexedDBDocs;
    }
    return clean;
  });
}

// از انتشار عمومی محتویات Drive از طریق GET بدون کلید جلوگیری می‌شود.
function doGet(e) {
  return jsonError_("بازخوانی مستقیم عمومی غیرفعال است؛ از نسخه احراز هویت‌شده اتوماسیون استفاده کنید.", "AUTH_REQUIRED");
}