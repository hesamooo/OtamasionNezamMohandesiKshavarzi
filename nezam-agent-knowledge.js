/* ==========================================================================
   NEZAM636 AGENT KNOWLEDGE VAULT
   Local IndexedDB knowledge base + document ingestion + retrieval (RAG)
   Files stay in this browser. PDF/image extraction is opt-in per document.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__nezam636KnowledgeLoaded) return;
  window.__nezam636KnowledgeLoaded = true;

  var DB_NAME = 'Nezam636AgentKnowledge';
  var DB_VERSION = 1;
  var STORE = 'documents';
  var MAX_FILE_BYTES = 18 * 1024 * 1024;
  var MAX_TEXT_CHARS = 650000;
  var dbPromise = null;
  var uiOpen = false;

  function byId(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function toast(message, isError) {
    if (typeof window.showToastMsg === 'function') window.showToastMsg(message, Boolean(isError));
    else if (isError) alert(message);
  }
  function makeId() {
    return 'KN-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function extensionOf(name) {
    var match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }
  function normalizeText(value) {
    return String(value || '').toLowerCase()
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[۰-۹٠-٩]/g, function (d) {
        var p = '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
        if (p < 0) p = '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
        return String(p);
      });
  }
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('مرورگر از IndexedDB پشتیبانی نمی‌کند.'));
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('بازکردن مخزن دانش ناموفق بود.')); };
    });
    return dbPromise;
  }
  async function withStore(mode, callback) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, mode);
      var store = tx.objectStore(STORE);
      var result;
      try { result = callback(store); } catch (e) { reject(e); return; }
      tx.oncomplete = function () { resolve(result && result.result !== undefined ? result.result : result); };
      tx.onerror = function () { reject(tx.error || new Error('خطا در مخزن دانش.')); };
      tx.onabort = function () { reject(tx.error || new Error('عملیات مخزن دانش لغو شد.')); };
    });
  }
  async function getAllDocuments() {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).getAll();
      req.onsuccess = function () {
        var list = Array.isArray(req.result) ? req.result : [];
        list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        resolve(list);
      };
      req.onerror = function () { reject(req.error || new Error('خواندن اسناد ناموفق بود.')); };
    });
  }
  async function getDocument(id) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).get(id);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error || new Error('سند پیدا نشد.')); };
    });
  }
  async function putDocument(doc) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(doc);
      tx.oncomplete = function () { resolve(doc); };
      tx.onerror = function () { reject(tx.error || new Error('ذخیره سند ناموفق بود.')); };
    });
  }
  async function deleteDocument(id) {
    var db = await openDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { reject(tx.error || new Error('حذف سند ناموفق بود.')); };
    });
  }

  function htmlToText(source) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(String(source || ''), 'text/html');
    var scripts = doc.querySelectorAll('script,style,nav,footer,header');
    for (var i = 0; i < scripts.length; i++) scripts[i].remove();
    return (doc.body ? doc.body.textContent : doc.documentElement.textContent).replace(/\s+/g, ' ').trim();
  }
  function rtfToText(source) {
    return String(source || '')
      .replace(/\\'[0-9a-f]{2}/gi, function (m) { return String.fromCharCode(parseInt(m.slice(2), 16)); })
      .replace(/\\par[d]?/g, '\n').replace(/\\tab/g, '\t')
      .replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, '')
      .replace(/\\~/g, ' ').replace(/\\_/g, '-').trim();
  }
  function decodeXmlText(xml) {
    var doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('ساختار XML داخل DOCX قابل‌خواندن نیست.');
    var paragraphs = Array.from(doc.getElementsByTagName('w:p'));
    if (!paragraphs.length) return doc.documentElement.textContent || '';
    return paragraphs.map(function (p) {
      return Array.from(p.getElementsByTagName('w:t')).map(function (n) { return n.textContent || ''; }).join('');
    }).filter(Boolean).join('\n');
  }
  async function readDocx(file) {
    if (typeof DecompressionStream === 'undefined') throw new Error('این مرورگر بازکردن داخلی DOCX را پشتیبانی نمی‌کند؛ فایل را به PDF تبدیل کن.');
    var bytes = new Uint8Array(await file.arrayBuffer());
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('ساختار فایل DOCX معتبر نیست.');
    var entries = view.getUint16(eocd + 10, true);
    var offset = view.getUint32(eocd + 16, true);
    var extracted = [];
    for (var e = 0; e < entries; e++) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      var method = view.getUint16(offset + 10, true);
      var compressedSize = view.getUint32(offset + 20, true);
      var nameLength = view.getUint16(offset + 28, true);
      var extraLength = view.getUint16(offset + 30, true);
      var commentLength = view.getUint16(offset + 32, true);
      var localOffset = view.getUint32(offset + 42, true);
      var name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      if (/^word\/(document|header\d*|footer\d*)\.xml$/i.test(name)) {
        var localNameLen = view.getUint16(localOffset + 26, true);
        var localExtraLen = view.getUint16(localOffset + 28, true);
        var dataStart = localOffset + 30 + localNameLen + localExtraLen;
        var compressed = bytes.slice(dataStart, dataStart + compressedSize);
        var raw;
        if (method === 0) raw = compressed;
        else if (method === 8) {
          var stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
          raw = new Uint8Array(await new Response(stream).arrayBuffer());
        } else {
          raw = null;
        }
        if (raw) extracted.push({ name: name, text: decodeXmlText(new TextDecoder().decode(raw)) });
      }
      offset += 46 + nameLength + extraLength + commentLength;
    }
    if (!extracted.length) throw new Error('متن اصلی DOCX پیدا نشد یا روش فشرده‌سازی پشتیبانی نمی‌شود.');
    return extracted.map(function (x) { return '[' + x.name + ']\n' + x.text; }).join('\n\n');
  }

  function splitIntoChunks(text, chunkSize, overlap) {
    var clean = String(text || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
    var result = [];
    if (!clean) return result;
    var start = 0;
    while (start < clean.length && result.length < 1200) {
      var end = Math.min(clean.length, start + chunkSize);
      if (end < clean.length) {
        var cut = clean.lastIndexOf('\n', end);
        if (cut < start + chunkSize * 0.55) cut = clean.lastIndexOf(' ', end);
        if (cut > start + chunkSize * 0.55) end = cut;
      }
      var part = clean.slice(start, end).trim();
      if (part) result.push(part);
      if (end >= clean.length) break;
      start = Math.max(start + 1, end - overlap);
    }
    return result;
  }
  function estimateKeywords(text) {
    var words = normalizeText(text).match(/[\u0600-\u06ff]{3,}|[a-z]{4,}/g) || [];
    var stop = new Set(['برای','درباره','مورد','باید','باشد','است','این','آنها','نسبت','مربوط','قانون','ماده','تبصره','شده','شود','کرده','همچنین','میتواند','میباشد','هستند']);
    var counts = {};
    words.forEach(function (w) { if (!stop.has(w)) counts[w] = (counts[w] || 0) + 1; });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 25);
  }
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = String(reader.result || '');
        var comma = dataUrl.indexOf(',');
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = function () { reject(reader.error || new Error('خواندن فایل ناموفق بود.')); };
      reader.readAsDataURL(file);
    });
  }

  function textToBase64(text) {
    try { return btoa(unescape(encodeURIComponent(String(text || '')))); }
    catch (err) { throw new Error('تبدیل متن فارسی به قالب بارگذاری ابری ناموفق بود.'); }
  }
  async function uploadOriginalToDrive(doc, file) {
    if (typeof window.saveNezaam636KnowledgeFileToDrive !== 'function') {
      throw new Error('درگاه ذخیره مخزن دانش در Google Drive بارگذاری نشده است.');
    }
    var base64 = await fileToBase64(file);
    var meta = {
      kind: 'NEZAM636_KNOWLEDGE_ORIGINAL',
      documentId: doc.id,
      name: doc.name,
      category: doc.category,
      issuer: doc.issuer,
      effectiveDate: doc.effectiveDate,
      description: doc.description
    };
    var result = await window.saveNezaam636KnowledgeFileToDrive({
      fileName: doc.id + '__' + doc.name.replace(/[\\/:*?"<>|]/g, '_'),
      fileType: doc.mime || 'application/octet-stream',
      fileData: base64,
      description: JSON.stringify(meta)
    });
    doc.driveStatus = 'saved';
    doc.driveSavedAt = Date.now();
    doc.driveFileName = doc.id + '__' + doc.name;
    doc.driveUrl = result && (result.webViewLink || result.fileUrl || result.url || result.driveUrl) || '';
    doc.driveError = '';
    return doc;
  }
  async function uploadExtractedTextToDrive(doc) {
    if (typeof window.saveNezaam636KnowledgeFileToDrive !== 'function') {
      throw new Error('درگاه ذخیره مخزن دانش در Google Drive بارگذاری نشده است.');
    }
    if (!doc.text) return;
    var fileName = doc.id + '__متن_استخراج_شده.txt';
    var result = await window.saveNezaam636KnowledgeFileToDrive({
      fileName: fileName,
      fileType: 'text/plain',
      fileData: textToBase64(doc.text),
      description: JSON.stringify({
        kind: 'NEZAM636_KNOWLEDGE_TEXT',
        documentId: doc.id,
        sourceName: doc.name,
        category: doc.category,
        issuer: doc.issuer,
        effectiveDate: doc.effectiveDate,
        indexedAt: doc.indexedAt
      })
    });
    doc.driveTextStatus = 'saved';
    doc.driveTextSavedAt = Date.now();
    doc.driveTextUrl = result && (result.webViewLink || result.fileUrl || result.url || result.driveUrl) || '';
    return doc;
  }
  async function syncKnowledgeSnapshot(showAlert) {
    if (typeof window.syncAllDataToDrive !== 'function') {
      throw new Error('اتصال همگام‌سازی Google Drive در دسترس نیست.');
    }
    var result = await window.syncAllDataToDrive(Boolean(showAlert));
    if (result !== true) throw new Error('پشتیبان مخزن دانش در Google Drive تأیید نشد؛ فایل محلی باقی مانده است.');
    return true;
  }
  function getMime(file, ext) {
    if (file.type) return file.type;
    var map = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', bmp: 'image/bmp' };
    return map[ext] || 'application/octet-stream';
  }
  function splitAndPrepare(doc, fullText) {
    var safeText = String(fullText || '').slice(0, MAX_TEXT_CHARS);
    doc.text = safeText;
    doc.chunks = splitIntoChunks(safeText, 1800, 220);
    doc.keywords = estimateKeywords(safeText);
    doc.charCount = safeText.length;
    doc.status = safeText ? 'indexed' : 'empty';
    doc.indexedAt = Date.now();
  }

  async function ingestLocalFile(file, meta) {
    if (!file) throw new Error('فایلی انتخاب نشده است.');
    if (file.size <= 0) throw new Error('فایل خالی است.');
    if (file.size > MAX_FILE_BYTES) throw new Error('حداکثر حجم هر فایل در این نسخه ۱۸ مگابایت است. فایل بزرگ‌تر را فشرده یا به چند فایل تقسیم کن.');
    var ext = extensionOf(file.name);
    var allowed = ['pdf','jpg','jpeg','png','webp','bmp','txt','md','csv','html','htm','xml','json','rtf','docx','doc'];
    if (allowed.indexOf(ext) === -1) throw new Error('این پسوند در حال حاضر پشتیبانی نمی‌شود.');
    var doc = {
      id: makeId(),
      name: String(file.name || 'document').slice(0, 180),
      ext: ext,
      mime: getMime(file, ext),
      size: file.size,
      blob: file,
      category: String(meta.category || 'عمومی').slice(0, 80),
      issuer: String(meta.issuer || '').slice(0, 120),
      effectiveDate: String(meta.effectiveDate || '').slice(0, 32),
      description: String(meta.description || '').slice(0, 300),
      createdAt: Date.now(),
      status: 'stored',
      text: '',
      chunks: [],
      keywords: []
    };

    if (['txt','md','csv','html','htm','xml','json','rtf'].indexOf(ext) >= 0) {
      var raw = await file.text();
      if (ext === 'html' || ext === 'htm') raw = htmlToText(raw);
      else if (ext === 'rtf') raw = rtfToText(raw);
      splitAndPrepare(doc, raw);
      doc.status = 'indexed';
    } else if (ext === 'docx') {
      splitAndPrepare(doc, await readDocx(file));
      doc.status = 'indexed';
    } else if (ext === 'doc') {
      doc.status = 'unsupported';
      doc.error = 'قالب قدیمی DOC قابل استخراج مستقیم نیست؛ آن را در Word به DOCX یا PDF تبدیل و دوباره اضافه کن. فایل اصلی همچنان در مخزن نگهداری می‌شود.';
    } else {
      doc.status = 'needs-ai';
      doc.error = 'فایل در مخزن ذخیره شد. برای خواندن متن و جدول‌ها، روی «خواندن با Gemini» بزن.';
    }

    await putDocument(doc);
    renderList();
    try {
      await uploadOriginalToDrive(doc, file);
      if (doc.status === 'indexed' && doc.text) await uploadExtractedTextToDrive(doc);
      await putDocument(doc);
      await syncKnowledgeSnapshot(false);
      doc.cloudIndexStatus = 'saved';
      doc.cloudIndexError = '';
      await putDocument(doc);
    } catch (cloudError) {
      doc.driveStatus = doc.driveStatus || 'failed';
      doc.driveError = String(cloudError && cloudError.message ? cloudError.message : cloudError).slice(0, 500);
      doc.cloudIndexStatus = 'pending';
      doc.cloudIndexError = doc.driveError;
      await putDocument(doc);
    }
    renderList();
    return doc;
  }

  async function extractWithGemini(id) {
    var doc = await getDocument(id);
    if (!doc || !doc.blob) throw new Error('فایل در مخزن پیدا نشد.');
    if (!confirm('برای خواندن این سند، فایل «' + doc.name + '» به سرویس Google Gemini ارسال می‌شود. ادامه می‌دهی؟')) return false;
    if (typeof window.getStoredGeminiApiKey !== 'function' || !window.getStoredGeminiApiKey()) {
      throw new Error('ابتدا کلید Gemini را در بخش دستیار هوشمند تنظیم و اتصال را تست کن.');
    }
    if (typeof window.fetchDirectGeminiWithFallback !== 'function') throw new Error('موتور Gemini در دسترس نیست.');
    var ext = doc.ext;
    var mime = doc.mime;
    if (!/^application\/pdf$|^image\/(jpeg|png|webp|bmp)$/.test(mime)) {
      if (ext === 'pdf') mime = 'application/pdf';
      else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else if (ext === 'png') mime = 'image/png';
      else if (ext === 'webp') mime = 'image/webp';
      else if (ext === 'bmp') mime = 'image/bmp';
      else throw new Error('قالب این فایل برای استخراج چندرسانه‌ای Gemini پشتیبانی نمی‌شود.');
    }
    doc.status = 'processing';
    await putDocument(doc);
    renderList();

    var base64 = await fileToBase64(doc.blob);
    var prompt = [
      'تو مسئول ثبت دانش حقوقی و فنی یک دفتر خدمات کشاورزی در شهرستان خفر هستی.',
      'متن سند را با دقت بخوان. همه بندها، شماره مواد و تبصره‌ها، تاریخ ابلاغ، مرجع صادرکننده و جداولی را که قابل خواندن‌اند حفظ کن.',
      'هیچ ماده، عدد، تاریخ، نام مرجع یا حکم قانونی را حدس نزن. بخش ناخوانا را با [ناخوانا] علامت بزن.',
      'خروجی فقط متن ساختاریافته فارسی باشد؛ ابتدا عنوان/مرجع/تاریخ در صورت وجود، سپس متن با سرفصل‌ها و شماره صفحات/مواد، و در پایان خلاصه کوتاه و کلیدواژه‌ها.',
      'برای بازیابی بعدی، متن را تا حد امکان کامل استخراج کن؛ از خلاصه‌سازی شدید خودداری کن.',
      'نام فایل: ' + doc.name,
      'دسته ثبت‌شده: ' + doc.category,
      'مرجع واردشده: ' + (doc.issuer || 'مشخص نشده'),
      'تاریخ اثربخشی واردشده: ' + (doc.effectiveDate || 'مشخص نشده')
    ].join('\n');
    try {
      var key = window.getStoredGeminiApiKey();
      var model = typeof window.getStoredGeminiModel === 'function' ? window.getStoredGeminiModel() : '';
      var generated = await window.fetchDirectGeminiWithFallback(key, {
        contents: [{ parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 12000 }
      }, model);
      var parts = generated && generated.data && generated.data.candidates &&
        generated.data.candidates[0] && generated.data.candidates[0].content &&
        generated.data.candidates[0].content.parts || [];
      var output = parts.map(function (p) { return p && p.text ? p.text : ''; }).filter(Boolean).join('\n').trim();
      if (!output) throw new Error('Gemini متن قابل ذخیره‌ای برنگرداند.');
      splitAndPrepare(doc, output);
      doc.status = 'indexed';
      doc.extractionModel = generated.usedModel || model;
      doc.extractionNote = 'متن با مدل هوش مصنوعی استخراج شده و باید با سند اصلی تطبیق داده شود؛ به‌خصوص اعداد و مواد قانونی.';
      doc.error = '';
      await putDocument(doc);
      try {
        await uploadExtractedTextToDrive(doc);
        await putDocument(doc);
        await syncKnowledgeSnapshot(false);
        doc.cloudIndexStatus = 'saved';
        doc.cloudIndexError = '';
        await putDocument(doc);
      } catch (cloudError) {
        doc.cloudIndexStatus = 'pending';
        doc.cloudIndexError = String(cloudError && cloudError.message ? cloudError.message : cloudError).slice(0, 500);
        await putDocument(doc);
      }
      renderList();
      return true;
    } catch (err) {
      doc.status = 'needs-ai';
      doc.error = String(err && err.message ? err.message : err).slice(0, 500);
      await putDocument(doc);
      renderList();
      throw err;
    }
  }

  function tokenScore(query, text) {
    var q = normalizeText(query);
    var t = normalizeText(text);
    var words = q.match(/[\u0600-\u06ff]{2,}|[a-z0-9]{2,}/g) || [];
    var stop = new Set(['برای','چیست','چطور','چگونه','میشه','میشود','کنم','کنید','درباره','مورد','لطفا','لطفاً','میخواهم','میخوام','است','هست','این','آن','چه','کدام','ایا','آیا']);
    var score = 0;
    var seen = {};
    words.forEach(function (word) {
      if (stop.has(word) || seen[word]) return;
      seen[word] = true;
      if (t.indexOf(word) >= 0) score += Math.min(5, word.length * 0.25 + 1);
    });
    if (q && t.indexOf(q) >= 0) score += 8;
    return score;
  }
  async function search(query, limit) {
    var docs = await getAllDocuments();
    var hits = [];
    docs.forEach(function (doc) {
      if (!doc || doc.status !== 'indexed' || !Array.isArray(doc.chunks)) return;
      doc.chunks.forEach(function (chunk, index) {
        var score = tokenScore(query, (doc.name || '') + ' ' + (doc.category || '') + ' ' + (doc.issuer || '') + ' ' + chunk);
        if (score > 0) {
          hits.push({
            score: score,
            text: chunk,
            source: doc.name,
            category: doc.category,
            issuer: doc.issuer,
            effectiveDate: doc.effectiveDate,
            chunk: index + 1,
            id: doc.id
          });
        }
      });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, Math.max(1, Math.min(Number(limit) || 5, 12)));
  }
  async function buildContext(query, maxChars) {
    var hits = await search(query, 8);
    var max = Math.max(1000, Math.min(Number(maxChars) || 9000, 16000));
    var used = 0;
    var out = [];
    hits.forEach(function (hit) {
      if (used >= max) return;
      var text = hit.text.slice(0, Math.max(0, max - used));
      if (!text) return;
      var label = '[منبع: ' + hit.source + ' | دسته: ' + hit.category +
        (hit.issuer ? ' | مرجع: ' + hit.issuer : '') +
        (hit.effectiveDate ? ' | تاریخ: ' + hit.effectiveDate : '') +
        ' | بخش بازیابی: ' + hit.chunk + ']';
      out.push(label + '\n' + text);
      used += text.length + label.length;
    });
    return { context: out.join('\n\n---\n\n'), hits: hits.map(function (h) {
      return { source: h.source, category: h.category, issuer: h.issuer, effectiveDate: h.effectiveDate, chunk: h.chunk, score: h.score };
    }) };
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }
  function statusLabel(doc) {
    if (doc.status === 'indexed') return '<span class="kv-status ok">قابل جستجو</span>';
    if (doc.status === 'processing') return '<span class="kv-status wait">در حال خواندن</span>';
    if (doc.status === 'unsupported') return '<span class="kv-status bad">قالب نیازمند تبدیل</span>';
    return '<span class="kv-status wait">نیازمند استخراج</span>';
  }
  async function renderList() {
    var host = byId('nezam636-kv-list');
    var stats = byId('nezam636-kv-stats');
    if (!host) return;
    try {
      var docs = await getAllDocuments();
      var indexed = docs.filter(function (d) { return d.status === 'indexed'; }).length;
      if (stats) stats.textContent = docs.length + ' سند ذخیره‌شده · ' + indexed + ' سند قابل جستجو';
      if (!docs.length) {
        host.innerHTML = '<div class="kv-empty">هنوز سندی اضافه نکرده‌ای. PDF، عکس، Word یا متن قوانین را وارد کن.</div>';
        return;
      }
      host.innerHTML = docs.map(function (d) {
        var action = d.status === 'needs-ai'
          ? '<button type="button" data-kv-action="extract" data-kv-id="' + esc(d.id) + '">خواندن با Gemini</button>'
          : '';
        var cloudLabel = d.driveStatus === 'saved'
          ? '<span class="kv-status ok">اصل فایل در Google Drive ذخیره شد</span>'
          : '<span class="kv-status wait">ذخیره ابری تأیید نشده</span>';
        var retry = d.driveStatus !== 'saved' && d.blob
          ? '<button type="button" data-kv-action="retry" data-kv-id="' + esc(d.id) + '">ارسال مجدد به Drive</button>' : '';
        var download = d.blob
          ? '<button type="button" data-kv-action="download" data-kv-id="' + esc(d.id) + '">دانلود فایل</button>'
          : '<small>فایل اصلی در پوشه کتابخانه Google Drive نگهداری می‌شود.</small>';
        return '<article class="kv-doc"><div class="kv-doc-main"><b>' + esc(d.name) + '</b><small>' +
          esc(d.category || 'عمومی') + (d.issuer ? ' · ' + esc(d.issuer) : '') +
          (d.effectiveDate ? ' · ' + esc(d.effectiveDate) : '') +
          ' · ' + formatBytes(d.size || 0) + '</small><div>' + statusLabel(d) + ' ' + cloudLabel + '</div>' +
          (d.error ? '<p class="kv-error">' + esc(d.error) + '</p>' : '') +
          (d.driveError ? '<p class="kv-error">خطای Drive: ' + esc(d.driveError) + '</p>' : '') +
          (d.cloudIndexError ? '<p class="kv-error">پشتیبان دانش: ' + esc(d.cloudIndexError) + '</p>' : '') +
          (d.extractionNote ? '<p class="kv-note">' + esc(d.extractionNote) + '</p>' : '') +
          (d.status === 'indexed' ? '<small>متن استخراج‌شده: ' + esc(d.charCount || 0) + ' نویسه · قطعه: ' + esc((d.chunks || []).length) + '</small>' : '') +
          '</div><div class="kv-doc-actions">' + action + retry +
          '<button type="button" data-kv-action="read" data-kv-id="' + esc(d.id) + '">نمایش متن</button>' +
          download +
          '<button type="button" data-kv-action="delete" data-kv-id="' + esc(d.id) + '">حذف</button></div></article>';
      }).join('');
    } catch (err) {
      host.textContent = 'خطا در خواندن کتابخانه: ' + String(err && err.message ? err.message : err);
    }
  }

  function addStyles() {
    if (byId('nezam636-kv-style')) return;
    var style = document.createElement('style');
    style.id = 'nezam636-kv-style';
    style.textContent =
      '#nezam636-kv-panel{position:fixed;inset:4vh 4vw;z-index:13000;display:none;flex-direction:column;background:#fbfdfb;color:#20372a;border:1px solid #bfd2c3;border-radius:17px;box-shadow:0 18px 65px #122e1f55;direction:rtl;font:12px Tahoma,Arial;overflow:hidden}' +
      '#nezam636-kv-panel.is-open{display:flex}' +
      '#nezam636-kv-panel .kv-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px;background:linear-gradient(120deg,#153b2b,#286b45);color:white}' +
      '#nezam636-kv-panel .kv-head small{display:block;color:#d9e9dd;margin-top:4px}' +
      '#nezam636-kv-panel .kv-head button{background:#ffffff18;border:1px solid #ffffff55;color:white;border-radius:8px;padding:5px 10px;cursor:pointer}' +
      '#nezam636-kv-panel .kv-body{padding:13px;overflow:auto;flex:1}' +
      '#nezam636-kv-panel .kv-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:11px;border:1px solid #e0e9e1;border-radius:12px;background:#f5f9f5}' +
      '#nezam636-kv-panel label{display:block;font-weight:700;color:#526658;margin-bottom:4px}' +
      '#nezam636-kv-panel input,#nezam636-kv-panel select,#nezam636-kv-panel textarea{width:100%;min-width:0;border:1px solid #c9d8cc;border-radius:8px;padding:8px;background:white;font:12px Tahoma;direction:rtl}' +
      '#nezam636-kv-panel .kv-wide{grid-column:1/-1}' +
      '#nezam636-kv-panel .kv-primary{background:#286b45;color:#fff;border:0;border-radius:8px;padding:9px 15px;font:700 12px Tahoma;cursor:pointer}' +
      '#nezam636-kv-panel .kv-doc{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;border:1px solid #e1eae2;border-radius:11px;background:#fff;padding:10px;margin-top:8px}' +
      '#nezam636-kv-panel .kv-doc-main{min-width:0;overflow-wrap:anywhere}' +
      '#nezam636-kv-panel .kv-doc-main small{display:block;color:#6a7a6d;margin-top:4px;line-height:1.7}' +
      '#nezam636-kv-panel .kv-doc-actions{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;flex:0 0 auto}' +
      '#nezam636-kv-panel .kv-doc-actions button{border:1px solid #cadbce;background:#f8fbf8;color:#315c3e;border-radius:7px;padding:6px 8px;font:11px Tahoma;cursor:pointer}' +
      '#nezam636-kv-panel .kv-status{display:inline-block;font-size:10px;border-radius:20px;padding:2px 7px;margin-top:5px}' +
      '#nezam636-kv-panel .kv-status.ok{background:#e0f1e3;color:#21633b}#nezam636-kv-panel .kv-status.wait{background:#fff2d3;color:#795d21}#nezam636-kv-panel .kv-status.bad{background:#fbe5e2;color:#913b30}' +
      '#nezam636-kv-panel .kv-error{color:#a33b2e;font-size:11px;margin:5px 0}#nezam636-kv-panel .kv-note{color:#846324;font-size:11px;margin:5px 0}' +
      '#nezam636-kv-panel .kv-empty{padding:25px;text-align:center;color:#758378;background:#f7faf7;border:1px dashed #cdddcf;border-radius:10px;margin-top:10px}' +
      '#nezam636-kv-reader{white-space:pre-wrap;max-height:55vh;overflow:auto;background:#f6f8f5;border:1px solid #e0e9e1;padding:12px;border-radius:9px;margin-top:9px;line-height:1.9}' +
      '@media(max-width:750px){#nezam636-kv-panel{inset:1vh 2vw;border-radius:12px}#nezam636-kv-panel .kv-form{grid-template-columns:1fr 1fr}#nezam636-kv-panel .kv-doc{display:block}#nezam636-kv-panel .kv-doc-actions{justify-content:flex-start;margin-top:8px}}' +
      '@media(max-width:440px){#nezam636-kv-panel .kv-form{grid-template-columns:1fr}}' +
      '@media print{#nezam636-kv-panel{display:none!important}}';
    document.head.appendChild(style);
  }

  function buildUi() {
    if (byId('nezam636-kv-panel')) return;
    addStyles();
    var panel = document.createElement('section');
    panel.id = 'nezam636-kv-panel';
    panel.setAttribute('aria-label', 'مخزن دانش قوانین و دستورالعمل‌ها');
    panel.innerHTML =
      '<div class="kv-head"><div><b>📚 مخزن دانش دفتر ۶۳۶</b><small id="nezam636-kv-stats">در حال آماده‌سازی مخزن محلی...</small></div><button type="button" id="nezam636-kv-close">بستن ✕</button></div>' +
      '<div class="kv-body">' +
      '<div class="alert alert-info small">فایل اصلی پس از افزودن به پوشه اختصاصی «کتابخانه دانش مرکز ۶۳۶ خفر» در Google Drive ارسال می‌شود. متن و فهرست جستجو نیز در پشتیبان اصلی اتوماسیون ذخیره می‌شود تا روی دستگاه دیگر بازیابی شود. TXT/CSV/HTML و DOCX محلی خوانده می‌شوند؛ برای PDF و تصویر، خواندن با Gemini فقط پس از تأیید تو انجام می‌شود. فایل قدیمی DOC در Drive بایگانی می‌شود اما برای استخراج متن باید به DOCX یا PDF تبدیل شود.</div>' +
      '<div class="kv-form">' +
      '<div><label for="nezam636-kv-category">دسته سند</label><select id="nezam636-kv-category"><option>قوانین و مقررات</option><option>بخشنامه و دستورالعمل</option><option>ضوابط صدور مجوز</option><option>کشاورزی و فنی</option><option>نقشه و امور اراضی</option><option>مکاتبات و الگوها</option><option>عمومی</option></select></div>' +
      '<div><label for="nezam636-kv-issuer">مرجع صادرکننده</label><input id="nezam636-kv-issuer" placeholder="مثلاً وزارت جهاد کشاورزی"></div>' +
      '<div><label for="nezam636-kv-date">تاریخ / شماره ابلاغ</label><input id="nezam636-kv-date" placeholder="تاریخ یا شماره بخشنامه"></div>' +
      '<div><label for="nezam636-kv-description">یادداشت</label><input id="nezam636-kv-description" placeholder="توضیح کوتاه"></div>' +
      '<div class="kv-wide"><label for="nezam636-kv-file">افزودن فایل‌ها (PDF, DOCX, JPG, PNG, WebP, TXT, CSV, HTML, XML)</label><input type="file" id="nezam636-kv-file" multiple accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.bmp,.txt,.md,.csv,.html,.htm,.xml,.json,.rtf"></div>' +
      '<div class="kv-wide"><button type="button" class="kv-primary" id="nezam636-kv-add">افزودن به مخزن دانش</button> <small id="nezam636-kv-upload-status">حداکثر حجم هر فایل ۱۸ مگابایت است.</small></div>' +
      '<div class="kv-wide"><label for="nezam636-kv-note-title">افزودن متن یا یادداشت قانونی بدون فایل</label><input id="nezam636-kv-note-title" placeholder="عنوان یادداشت"><textarea id="nezam636-kv-note-text" rows="3" placeholder="متن ماده، بخشنامه یا نکته معتبر را اینجا وارد کن..."></textarea><button type="button" class="kv-primary" id="nezam636-kv-save-note">ذخیره یادداشت در مخزن</button></div>' +
      '</div>' +
      '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3"><b>اسناد موجود در کتابخانه</b><div><button type="button" class="kv-primary" id="nezam636-kv-export">خروجی پشتیبان مخزن</button><button type="button" class="kv-primary" id="nezam636-kv-import-btn" style="margin-right:5px">بازیابی پشتیبان</button><input type="file" id="nezam636-kv-import" accept=".json,application/json" hidden></div></div>' +
      '<div id="nezam636-kv-list"></div><pre id="nezam636-kv-reader" hidden></pre>' +
      '<small class="text-muted d-block mt-2">استخراج هوش مصنوعی ممکن است در اعداد، جدول‌ها یا متن اسکن‌شده خطا داشته باشد؛ متن هر سند را با نسخه اصلی تطبیق بده. بعد از افزودن سند، وضعیت ذخیره Drive و همگام‌سازی شاخص دانش را در فهرست کنترل کن. فایل‌های اصلی در Drive و متن قابل جستجو در پشتیبان اصلی اتوماسیون نگهداری می‌شود.</small>' +
      '</div>';
    document.body.appendChild(panel);

    byId('nezam636-kv-close').addEventListener('click', close);
    byId('nezam636-kv-add').addEventListener('click', async function () {
      var input = byId('nezam636-kv-file');
      var files = input && input.files ? Array.from(input.files) : [];
      if (!files.length) { toast('ابتدا یک یا چند فایل انتخاب کن.', true); return; }
      var meta = {
        category: byId('nezam636-kv-category').value,
        issuer: byId('nezam636-kv-issuer').value,
        effectiveDate: byId('nezam636-kv-date').value,
        description: byId('nezam636-kv-description').value
      };
      var status = byId('nezam636-kv-upload-status');
      var added = 0;
      for (var i = 0; i < files.length; i++) {
        try {
          if (status) status.textContent = 'در حال ذخیره ' + files[i].name + '...';
          await ingestLocalFile(files[i], meta);
          added++;
        } catch (err) {
          toast(files[i].name + ': ' + (err && err.message ? err.message : err), true);
        }
      }
      input.value = '';
      if (status) status.textContent = added + ' فایل به مخزن اضافه شد.';
      renderList();
      if (added) toast(added + ' سند در مخزن دانش ذخیره شد.');
    });
    byId('nezam636-kv-save-note').addEventListener('click', async function () {
      var title = byId('nezam636-kv-note-title').value.trim();
      var text = byId('nezam636-kv-note-text').value.trim();
      if (!title || !text) { toast('عنوان و متن یادداشت را وارد کن.', true); return; }
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var file = new File([blob], title.replace(/[\\/:*?"<>|]/g, '_') + '.txt', { type: 'text/plain' });
      try {
        await ingestLocalFile(file, {
          category: byId('nezam636-kv-category').value,
          issuer: byId('nezam636-kv-issuer').value,
          effectiveDate: byId('nezam636-kv-date').value,
          description: byId('nezam636-kv-description').value
        });
        byId('nezam636-kv-note-title').value = '';
        byId('nezam636-kv-note-text').value = '';
        toast('یادداشت به مخزن اضافه شد.');
      } catch (err) { toast(err.message || String(err), true); }
    });
    byId('nezam636-kv-list').addEventListener('click', handleListAction);
    byId('nezam636-kv-export').addEventListener('click', exportBackup);
    byId('nezam636-kv-import-btn').addEventListener('click', function () { byId('nezam636-kv-import').click(); });
    byId('nezam636-kv-import').addEventListener('change', function (e) { importBackup(e.target.files && e.target.files[0]); });
  }

  async function handleListAction(event) {
    var button = event.target.closest('button[data-kv-action]');
    if (!button) return;
    var id = button.getAttribute('data-kv-id');
    var action = button.getAttribute('data-kv-action');
    try {
      if (action === 'extract') {
        button.disabled = true;
        button.textContent = 'در حال خواندن...';
        await extractWithGemini(id);
        toast('متن سند استخراج و وارد فهرست جستجو شد.');
      } else if (action === 'retry') {
        var retryDoc = await getDocument(id);
        if (!retryDoc || !retryDoc.blob) throw new Error('فایل اصلی در این مرورگر موجود نیست؛ آن را از رایانه دوباره انتخاب کن.');
        await uploadOriginalToDrive(retryDoc, retryDoc.blob);
        if (retryDoc.status === 'indexed' && retryDoc.text) await uploadExtractedTextToDrive(retryDoc);
        await putDocument(retryDoc);
        await syncKnowledgeSnapshot(false);
        retryDoc.cloudIndexStatus = 'saved';
        await putDocument(retryDoc);
        toast('ذخیره سند و فهرست دانش در Google Drive تأیید شد.');
      } else if (action === 'delete') {
        if (!confirm('سند و متن استخراج‌شده آن از مخزن محلی حذف شود؟')) return;
        await deleteDocument(id);
        var reader = byId('nezam636-kv-reader');
        if (reader) reader.hidden = true;
        renderList();
        toast('سند از مخزن حذف شد.');
      } else if (action === 'read') {
        var doc = await getDocument(id);
        var readerBox = byId('nezam636-kv-reader');
        if (!readerBox) return;
        readerBox.textContent = doc && doc.text ? doc.text : (doc && doc.error ? doc.error : 'هنوز متنی برای این سند استخراج نشده است.');
        readerBox.hidden = false;
      } else if (action === 'download') {
        var item = await getDocument(id);
        if (!item || !item.blob) throw new Error('فایل اصلی در مخزن پیدا نشد.');
        var url = URL.createObjectURL(item.blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      }
    } catch (err) {
      toast('خطا: ' + (err && err.message ? err.message : err), true);
    } finally {
      renderList();
    }
  }

  async function exportBackup() {
    try {
      var docs = await getAllDocuments();
      var output = [];
      for (var i = 0; i < docs.length; i++) {
        var d = docs[i];
        var base64 = d.blob ? await fileToBase64(d.blob) : '';
        output.push({
          id: d.id, name: d.name, ext: d.ext, mime: d.mime, size: d.size,
          category: d.category, issuer: d.issuer, effectiveDate: d.effectiveDate,
          description: d.description, createdAt: d.createdAt, status: d.status,
          text: d.text || '', chunks: d.chunks || [], keywords: d.keywords || [],
          charCount: d.charCount || 0, error: d.error || '', extractionNote: d.extractionNote || '',
          blobBase64: base64
        });
      }
      var blob = new Blob([JSON.stringify({ schema: 'nezam636-knowledge-v1', exportedAt: new Date().toISOString(), documents: output })], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'nezam636-knowledge-backup-' + Date.now() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      toast('فایل پشتیبان مخزن دانش آماده شد.');
    } catch (err) { toast('تهیه پشتیبان ناموفق بود: ' + (err.message || err), true); }
  }

  async function importBackup(file) {
    if (!file) return;
    if (file.size > 180 * 1024 * 1024) { toast('حجم فایل پشتیبان بیش از ۱۸۰ مگابایت است.', true); return; }
    try {
      var data = JSON.parse(await file.text());
      if (!data || data.schema !== 'nezam636-knowledge-v1' || !Array.isArray(data.documents)) throw new Error('قالب پشتیبان مخزن معتبر نیست.');
      var count = 0;
      for (var i = 0; i < data.documents.length; i++) {
        var d = data.documents[i];
        if (!d || !d.id || !d.name) continue;
        var blob = null;
        if (d.blobBase64) {
          var binary = atob(d.blobBase64);
          var bytes = new Uint8Array(binary.length);
          for (var b = 0; b < binary.length; b++) bytes[b] = binary.charCodeAt(b);
          blob = new Blob([bytes], { type: d.mime || 'application/octet-stream' });
        }
        var restored = {
          id: String(d.id), name: String(d.name), ext: String(d.ext || ''),
          mime: String(d.mime || ''), size: Number(d.size || (blob ? blob.size : 0)),
          blob: blob, category: String(d.category || 'عمومی'), issuer: String(d.issuer || ''),
          effectiveDate: String(d.effectiveDate || ''), description: String(d.description || ''),
          createdAt: Number(d.createdAt || Date.now()), status: String(d.status || 'needs-ai'),
          text: String(d.text || '').slice(0, MAX_TEXT_CHARS),
          chunks: Array.isArray(d.chunks) ? d.chunks.slice(0, 1200) : [],
          keywords: Array.isArray(d.keywords) ? d.keywords.slice(0, 100) : [],
          charCount: Number(d.charCount || 0), error: String(d.error || ''),
          extractionNote: String(d.extractionNote || '')
        };
        await putDocument(restored);
        count++;
      }
      toast(count + ' سند از پشتیبان بازیابی شد.');
      renderList();
    } catch (err) {
      toast('بازیابی پشتیبان ناموفق بود: ' + (err.message || err), true);
    } finally {
      var input = byId('nezam636-kv-import');
      if (input) input.value = '';
    }
  }

  function open() {
    buildUi();
    uiOpen = true;
    byId('nezam636-kv-panel').classList.add('is-open');
    renderList();
  }
  function close() {
    uiOpen = false;
    var panel = byId('nezam636-kv-panel');
    if (panel) panel.classList.remove('is-open');
  }
  async function getStats() {
    var docs = await getAllDocuments();
    return {
      total: docs.length,
      indexed: docs.filter(function (d) { return d.status === 'indexed'; }).length,
      needsAi: docs.filter(function (d) { return d.status === 'needs-ai'; }).length,
      chars: docs.reduce(function (sum, d) { return sum + (d.charCount || 0); }, 0)
    };
  }
  async function readCaseFilesForExport() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) return resolve([]);
      var req = indexedDB.open('Nezam636_UnifiedFiles_DB', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('docs')) db.createObjectStore('docs', { keyPath: 'key' });
      };
      req.onsuccess = function () {
        var db = req.result;
        try {
          var tx = db.transaction(['docs'], 'readonly');
          var get = tx.objectStore('docs').getAll();
          get.onsuccess = function () {
            resolve((get.result || []).map(function (d) {
              return {
                key: d.key, caseId: d.caseId, docCode: d.docCode, docTitle: d.docTitle,
                fileName: d.fileName, uploadDate: d.uploadDate,
                dataUrl: typeof d.dataUrl === 'string' && d.dataUrl.length <= 2200000 ? d.dataUrl : '',
                cloudOmitted: Boolean(d.dataUrl && d.dataUrl.length > 2200000)
              };
            }));
          };
          get.onerror = function () { resolve([]); };
        } catch (e) { resolve([]); }
      };
      req.onerror = function () { resolve([]); };
    });
  }

  async function writeCaseFilesFromImport(list) {
    if (!Array.isArray(list) || !list.length || !window.indexedDB) return;
    await new Promise(function (resolve) {
      var req = indexedDB.open('Nezam636_UnifiedFiles_DB', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('docs')) db.createObjectStore('docs', { keyPath: 'key' });
      };
      req.onsuccess = function () {
        try {
          var tx = req.result.transaction(['docs'], 'readwrite');
          var store = tx.objectStore('docs');
          list.forEach(function (d) {
            if (!d || !d.key || !d.caseId || !d.dataUrl) return;
            store.put({
              key: String(d.key), caseId: String(d.caseId), docCode: String(d.docCode || ''),
              docTitle: String(d.docTitle || ''), fileName: String(d.fileName || 'document'),
              uploadDate: String(d.uploadDate || ''), dataUrl: String(d.dataUrl),
              rawBlob: null
            });
          });
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { resolve(); };
        } catch (e) { resolve(); }
      };
      req.onerror = function () { resolve(); };
    });
  }

  window.exportIndexedDBDocs = async function () {
    var knowledge = await getAllDocuments();
    var knowledgeExport = knowledge.map(function (d) {
      return {
        id: d.id, name: d.name, ext: d.ext, mime: d.mime, size: d.size,
        category: d.category, issuer: d.issuer, effectiveDate: d.effectiveDate,
        description: d.description, createdAt: d.createdAt, status: d.status,
        text: d.text || '', chunks: d.chunks || [], keywords: d.keywords || [],
        charCount: d.charCount || 0, error: d.error || '', extractionNote: d.extractionNote || '',
        indexedAt: d.indexedAt || 0, extractionModel: d.extractionModel || '',
        driveStatus: d.driveStatus || '', driveSavedAt: d.driveSavedAt || 0,
        driveFileName: d.driveFileName || '', driveUrl: d.driveUrl || '',
        driveTextStatus: d.driveTextStatus || '', driveTextUrl: d.driveTextUrl || '',
        cloudIndexStatus: d.cloudIndexStatus || '', driveError: d.driveError || '',
        cloudIndexError: d.cloudIndexError || ''
      };
    });
    var caseFiles = await readCaseFilesForExport();
    return [
      { _type: 'NEZAM636_KNOWLEDGE_V1', documents: knowledgeExport },
      { _type: 'NEZAM636_CASE_FILES_V1', documents: caseFiles }
    ];
  };

  window.importIndexedDBDocs = async function (records) {
    if (!Array.isArray(records)) return;
    for (var i = 0; i < records.length; i++) {
      var entry = records[i];
      if (!entry || !Array.isArray(entry.documents)) continue;
      if (entry._type === 'NEZAM636_KNOWLEDGE_V1') {
        for (var j = 0; j < entry.documents.length; j++) {
          var d = entry.documents[j];
          if (!d || !d.id || !d.name) continue;
          await putDocument({
            id: String(d.id), name: String(d.name), ext: String(d.ext || ''),
            mime: String(d.mime || ''), size: Number(d.size || 0), blob: null,
            category: String(d.category || 'عمومی'), issuer: String(d.issuer || ''),
            effectiveDate: String(d.effectiveDate || ''), description: String(d.description || ''),
            createdAt: Number(d.createdAt || Date.now()), status: String(d.status || 'needs-ai'),
            text: String(d.text || '').slice(0, MAX_TEXT_CHARS),
            chunks: Array.isArray(d.chunks) ? d.chunks.slice(0, 1200) : [],
            keywords: Array.isArray(d.keywords) ? d.keywords.slice(0, 100) : [],
            charCount: Number(d.charCount || 0), error: String(d.error || ''),
            extractionNote: String(d.extractionNote || ''), indexedAt: Number(d.indexedAt || 0),
            extractionModel: String(d.extractionModel || ''),
            driveStatus: String(d.driveStatus || ''), driveSavedAt: Number(d.driveSavedAt || 0),
            driveFileName: String(d.driveFileName || ''), driveUrl: String(d.driveUrl || ''),
            driveTextStatus: String(d.driveTextStatus || ''), driveTextUrl: String(d.driveTextUrl || ''),
            cloudIndexStatus: String(d.cloudIndexStatus || ''), driveError: String(d.driveError || ''),
            cloudIndexError: String(d.cloudIndexError || '')
          });
        }
      } else if (entry._type === 'NEZAM636_CASE_FILES_V1') {
        await writeCaseFilesFromImport(entry.documents);
      }
    }
    renderList();
  };

  window.Nezaam636Knowledge = {
    open: open,
    close: close,
    search: search,
    buildContext: buildContext,
    stats: getStats,
    list: getAllDocuments,
    version: '1.1.0'
  };
})();
