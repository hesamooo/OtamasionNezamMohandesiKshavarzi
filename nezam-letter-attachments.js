/* Nezam636 letter attachments: fetch protected Drive files, choose PDF pages, and print real content. */
(function () {
  'use strict';
  var draft = [];
  var pickerDocs = [];
  var pickerContext = null;
  var preparedPages = new Map();
  var pdfJsPromise = null;
  var pendingPreparation = new Map();

  function safe(value) {
    return typeof window.escapeHtmlCore === 'function'
      ? window.escapeHtmlCore(value)
      : String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
  }
  function extensionOf(name) {
    var m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }
  function context(caseObj) {
    var office = window.__nezamOfficeLetterDraftMode === true;
    var c = caseObj || (office ? null : (typeof window.getActiveCase === 'function' ? window.getActiveCase() : null));
    if (!office && !c) throw new Error('برای انتخاب پیوست، ابتدا متقاضی نامه را انتخاب کنید.');
    return office
      ? { caseId: '__OFFICE_LETTER_ATTACHMENTS__', fullName: 'مکاتبات مستقل دفتر', nationalCode: 'NEZAM636_OFFICE', docCode: 'LETTER_ATTACHMENT', docTitle: 'پیوست نامه' }
      : { caseId: String(c.id), fullName: String(c.name || 'متقاضی'), nationalCode: String(c.nid || c.code || ''), docCode: 'LETTER_ATTACHMENT', docTitle: 'پیوست نامه' };
  }
  function contextForItem(item, fallbackCase) {
    var id = String(item && item.caseId || '');
    if (id === '__OFFICE_LETTER_ATTACHMENTS__' || id === '__NEZAM636_OFFICE_LETTER_ATTACHMENTS__') {
      return { caseId: id, fullName: 'مکاتبات مستقل دفتر', nationalCode: 'NEZAM636_OFFICE' };
    }
    var c = fallbackCase || null;
    if ((!c || (id && String(c.id) !== id)) && Array.isArray(window.casesDB)) {
      c = window.casesDB.find(function (x) { return x && String(x.id) === id; }) || null;
    }
    if ((!c || (id && String(c.id) !== id)) && typeof window.getActiveCase === 'function') {
      var active = window.getActiveCase();
      if (active && (!id || String(active.id) === id)) c = active;
    }
    if (c) return { caseId: String(c.id), fullName: String(c.name || 'متقاضی'), nationalCode: String(c.nid || c.code || '') };
    if (id) return { caseId: id, fullName: String(item.fullName || item.appName || 'متقاضی'), nationalCode: String(item.nationalCode || item.appNid || '') };
    throw new Error('پرونده مربوط به فایل پیوست پیدا نشد؛ پرونده متقاضی را باز کنید و دوباره پیش‌نمایش بگیرید.');
  }
  function normalize(doc, ctx) {
    var id = String(doc && (doc.id || doc.fileId) || '');
    if (!id) return null;
    return {
      id: id, fileId: id,
      name: String(doc.name || doc.fileName || 'فایل پیوست'),
      mimeType: String(doc.mimeType || 'application/octet-stream'),
      size: Number(doc.size || 0), updatedAt: Number(doc.updatedAt || 0),
      webViewLink: String(doc.webViewLink || ''), downloadUrl: String(doc.downloadUrl || ''),
      caseId: String(doc.caseId || (ctx && ctx.caseId) || ''),
      source: 'google-drive', docCode: String(doc.docCode || 'LETTER_ATTACHMENT'),
      pageSelection: String(doc.pageSelection || 'all')
    };
  }
  function pageDescription(item) {
    var ext = extensionOf(item.name);
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      return item.pageSelection && item.pageSelection !== 'all' ? 'صفحات: ' + item.pageSelection : 'تمام صفحات';
    }
    return 'یک صفحه کامل';
  }
  function render() {
    var holder = document.getElementById('letter-attachments-list');
    if (!holder) return;
    if (!draft.length) {
      holder.innerHTML = '<div class="small text-muted">هنوز پیوستی برای این نامه انتخاب نشده است.</div>';
      return;
    }
    var rows = draft.map(function (item, index) {
      var size = item.size ? (item.size < 1048576 ? Math.ceil(item.size / 1024) + ' KB' : (item.size / 1048576).toFixed(2) + ' MB') : '—';
      var ext = extensionOf(item.name);
      var canSelectPages = ['pdf', 'doc', 'docx'].indexOf(ext) !== -1;
      var pageCell = canSelectPages
        ? '<button type="button" class="btn btn-sm btn-outline-primary" data-config-letter-pages="' + index + '">' + safe(pageDescription(item)) + ' · تنظیم</button>'
        : '<span class="small text-muted">یک صفحه</span>';
      var url = /^https:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(item.webViewLink || '') ? item.webViewLink : '';
      var name = url ? '<a href="' + safe(url) + '" target="_blank" rel="noopener noreferrer">' + safe(item.name) + '</a>' : safe(item.name);
      return '<tr><td>' + safe(index + 1) + '</td><td>' + name + '</td><td>' + safe(size) + '</td><td>' + pageCell + '</td><td><button type="button" class="btn btn-sm btn-outline-danger" data-remove-letter-attachment="' + index + '">حذف از نامه</button></td></tr>';
    }).join('');
    holder.innerHTML = '<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>ردیف</th><th>نام فایل</th><th>حجم</th><th>صفحات قابل چاپ</th><th>عملیات</th></tr></thead><tbody>' + rows + '</tbody></table></div><div class="small text-muted mt-2">محتوای واقعی پیوست‌ها در زمان پیش‌نمایش دریافت و به صفحات چاپ همین نامه اضافه می‌شود.</div>';
    if (holder.dataset.attachmentActionsBound !== '1') {
      holder.dataset.attachmentActionsBound = '1';
      holder.addEventListener('click', function (event) {
        var removeButton = event.target.closest('button[data-remove-letter-attachment]');
        if (removeButton) {
          var removeIndex = Number(removeButton.getAttribute('data-remove-letter-attachment'));
          if (!Number.isInteger(removeIndex) || removeIndex < 0 || removeIndex >= draft.length) return;
          draft.splice(removeIndex, 1);
          render();
          window.letterDraftDirty = true;
          return;
        }
        var pageButton = event.target.closest('button[data-config-letter-pages]');
        if (pageButton) configurePages(Number(pageButton.getAttribute('data-config-letter-pages')));
      });
    }
  }
  function addDocs(items, ctx) {
    var added = 0;
    (Array.isArray(items) ? items : []).forEach(function (doc) {
      var item = normalize(doc, ctx);
      if (!item || draft.some(function (old) { return old.id === item.id; })) return;
      draft.push(item); added++;
    });
    render();
    window.letterDraftDirty = true;
    return added;
  }
  async function uploadLocal(input) {
    try {
      var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
      if (!files.length) return;
      if (!window.NezamDriveDocuments) throw new Error('ماژول اتصال Google Drive بارگذاری نشده است.');
      await window.NezamDriveDocuments.ensureReady();
      var ctx = context();
      var result = await window.NezamDriveDocuments.uploadFiles(files, ctx);
      var count = addDocs(result.successes || [], ctx);
      if (result.failures && result.failures.length) {
        var details = result.failures.map(function (x) { return x.fileName + ': ' + x.message; }).join('\n');
        window.alert('برخی پیوست‌ها بارگذاری نشدند:\n' + details);
      } else if (typeof window.showToastMsg === 'function') {
        window.showToastMsg(count + ' فایل به پیوست‌های نامه اضافه شد.');
      }
    } catch (error) {
      if (typeof window.showToastMsg === 'function') window.showToastMsg(error.message || String(error), true);
      else window.alert(error.message || String(error));
    } finally { if (input) input.value = ''; }
  }
  function closePicker() {
    var modal = document.getElementById('letter-attachment-picker-modal');
    if (modal) modal.remove();
  }
  function confirmPicker() {
    var modal = document.getElementById('letter-attachment-picker-modal');
    if (!modal) return;
    var selected = modal.querySelectorAll('input[data-letter-doc-index]:checked');
    var chosen = [];
    Array.prototype.forEach.call(selected, function (input) {
      var doc = pickerDocs[Number(input.getAttribute('data-letter-doc-index'))];
      if (doc) chosen.push(doc);
    });
    var count = addDocs(chosen, pickerContext);
    closePicker();
    if (typeof window.showToastMsg === 'function') window.showToastMsg(count + ' پیوست به نامه اضافه شد؛ محتوای اصلی هنگام چاپ درج می‌شود.');
  }
  async function openPicker() {
    try {
      if (!window.NezamDriveDocuments) throw new Error('ماژول اتصال Google Drive بارگذاری نشده است.');
      await window.NezamDriveDocuments.ensureReady();
      pickerContext = context();
      var response = await window.NezamDriveDocuments.list(pickerContext);
      pickerDocs = Array.isArray(response.documents) ? response.documents : [];
      if (!pickerDocs.length) {
        if (typeof window.showToastMsg === 'function') window.showToastMsg('در پوشه Google Drive این پرونده فایلی برای پیوست پیدا نشد.', true);
        return;
      }
      var rows = pickerDocs.map(function (doc, index) {
        var id = String(doc.id || doc.fileId || '');
        var checked = draft.some(function (item) { return item.id === id; }) ? ' checked' : '';
        var size = Number(doc.size || 0);
        var sizeText = size ? (size < 1048576 ? Math.ceil(size / 1024) + ' KB' : (size / 1048576).toFixed(2) + ' MB') : '—';
        return '<label class="d-flex align-items-center gap-2 p-2 border-bottom" style="cursor:pointer;">' +
          '<input type="checkbox" data-letter-doc-index="' + index + '"' + checked + '>' +
          '<span class="flex-grow-1"><b>' + safe(doc.name || doc.fileName || 'فایل') + '</b><small class="d-block text-muted">' +
          safe(doc.docTitle || 'مدرک') + ' | ' + safe(sizeText) + '</small></span></label>';
      }).join('');
      var modal = document.createElement('div');
      modal.id = 'letter-attachment-picker-modal';
      modal.className = 'guard-modal-overlay';
      modal.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(12,31,21,.62);';
      modal.innerHTML = '<div class="guard-modal-card" style="width:min(760px,96vw);max-height:88vh;overflow:auto;background:#fff;padding:18px;border-radius:16px;">' +
        '<div class="d-flex justify-content-between align-items-center mb-2"><strong>انتخاب پیوست از بایگانی Google Drive</strong><button type="button" class="btn btn-sm btn-outline-secondary" data-letter-picker-close>بستن</button></div>' +
        '<p class="small text-muted">فایل‌های انتخاب‌شده هنگام پیش‌نمایش به‌صورت واقعی خوانده و در چاپ درج می‌شوند؛ فایل اصلی در بایگانی باقی می‌ماند.</p>' +
        '<div style="max-height:58vh;overflow:auto;border:1px solid #e2e8f0;border-radius:10px;">' + rows + '</div>' +
        '<div class="d-flex justify-content-end gap-2 mt-3"><button type="button" class="btn btn-light" data-letter-picker-close>انصراف</button><button type="button" class="btn btn-success" data-letter-picker-confirm>افزودن پیوست‌های انتخاب‌شده</button></div></div>';
      modal.addEventListener('click', function (event) {
        if (event.target === modal || event.target.closest('[data-letter-picker-close]')) closePicker();
        if (event.target.closest('[data-letter-picker-confirm]')) confirmPicker();
      });
      document.body.appendChild(modal);
    } catch (error) {
      if (typeof window.showToastMsg === 'function') window.showToastMsg(error.message || String(error), true);
      else window.alert(error.message || String(error));
    }
  }

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = function () {
        if (!window.pdfjsLib) return reject(new Error('کتابخانه نمایش PDF بارگذاری نشد. اتصال اینترنت را بررسی کنید.'));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = function () { reject(new Error('بارگذاری ابزار خواندن PDF ناموفق بود.')); };
      document.head.appendChild(script);
    }).catch(function (error) { pdfJsPromise = null; throw error; });
    return pdfJsPromise;
  }
  function base64ToBytes(base64) {
    var binary = atob(String(base64 || ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  function normalizeDigits(value) {
    return String(value || '')
      .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  }
  function parsePageSelection(value, maxPages) {
    if (!value || String(value).trim().toLowerCase() === 'all' || String(value).trim() === 'همه') {
      return Array.from({ length: maxPages }, function (_, i) { return i + 1; });
    }
    var input = normalizeDigits(value).replace(/[؛،]/g, ',').replace(/[–—]/g, '-');
    var pieces = input.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!pieces.length) throw new Error('شماره صفحات را وارد کنید؛ نمونه: ۱،۳،۵-۷');
    var result = [];
    pieces.forEach(function (piece) {
      var match = piece.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('قالب شماره صفحات معتبر نیست؛ نمونه: ۱،۳،۵-۷');
      var from = Number(match[1]);
      var to = match[2] ? Number(match[2]) : from;
      if (from < 1 || to < from || to > maxPages) throw new Error('شماره صفحه باید بین ۱ تا ' + maxPages + ' باشد.');
      for (var page = from; page <= to; page++) if (result.indexOf(page) === -1) result.push(page);
    });
    return result.sort(function (a, b) { return a - b; });
  }
  async function getPdfInfo(item, caseObj) {
    var ctx = contextForItem(item, caseObj);
    var data = await window.NezamDriveDocuments.getFileContent(item.id, ctx);
    if (String(data.mimeType || '') !== 'application/pdf') throw new Error('این فایل PDF قابل خواندن نیست.');
    var pdfjs = await loadPdfJs();
    var pdf = await pdfjs.getDocument({ data: base64ToBytes(data.data) }).promise;
    return { data: data, pdf: pdf, pageCount: pdf.numPages };
  }
  function showPageConfig(index, pageCount) {
    var item = draft[index];
    if (!item) return;
    var modal = document.createElement('div');
    modal.id = 'letter-page-config-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.68);font-family:Tahoma,Arial,sans-serif;';
    var allChecked = !item.pageSelection || item.pageSelection === 'all';
    modal.innerHTML = '<div dir="rtl" style="width:min(500px,96vw);background:#fff;border-radius:14px;padding:20px;box-shadow:0 18px 55px rgba(0,0,0,.28);color:#1e293b;">' +
      '<h3 style="font-size:17px;margin:0 0 8px;">انتخاب صفحات پیوست</h3>' +
      '<p style="font-size:13px;color:#64748b;line-height:1.8;">فایل «' + safe(item.name) + '» دارای ' + safe(pageCount) + ' صفحه است. صفحات انتخاب‌شده به انتهای نامه اضافه می‌شوند.</p>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:10px 0;"><input type="radio" name="letter-page-mode" value="all"' + (allChecked ? ' checked' : '') + '> تمام صفحات (' + safe(pageCount) + ' صفحه)</label>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:10px 0;"><input type="radio" name="letter-page-mode" value="custom"' + (!allChecked ? ' checked' : '') + '> فقط صفحات انتخابی</label>' +
      '<input id="letter-page-ranges" type="text" value="' + safe(allChecked ? '' : item.pageSelection) + '" placeholder="مثلاً ۱،۳،۵-۷" style="width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:11px;direction:ltr;text-align:left;"' + (allChecked ? ' disabled' : '') + '>' +
      '<div id="letter-page-config-error" style="color:#b91c1c;font-size:12px;min-height:20px;margin-top:6px;"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;"><button type="button" data-page-cancel style="border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:9px 14px;">انصراف</button><button type="button" data-page-save style="border:0;background:#1b6b4b;color:#fff;border-radius:8px;padding:9px 16px;font-weight:bold;">ثبت انتخاب صفحات</button></div></div>';
    modal.querySelectorAll('input[name="letter-page-mode"]').forEach(function (radio) {
      radio.addEventListener('change', function () { modal.querySelector('#letter-page-ranges').disabled = radio.value !== 'custom' || !radio.checked; });
    });
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('[data-page-cancel]')) { modal.remove(); return; }
      if (event.target.closest('[data-page-save]')) {
        var mode = modal.querySelector('input[name="letter-page-mode"]:checked').value;
        var ranges = modal.querySelector('#letter-page-ranges').value;
        try {
          var selected = mode === 'all' ? 'all' : ranges.trim();
          if (mode === 'custom') parsePageSelection(selected, pageCount);
          item.pageSelection = selected;
          preparedPages.delete(cacheKey(item));
          modal.remove();
          render();
          window.letterDraftDirty = true;
        } catch (error) {
          modal.querySelector('#letter-page-config-error').textContent = error.message || String(error);
        }
      }
    });
    document.body.appendChild(modal);
  }
  async function configurePages(index) {
    var item = draft[index];
    if (!item) return;
    try {
      if (!window.NezamDriveDocuments || typeof window.NezamDriveDocuments.getFileContent !== 'function') {
        throw new Error('برای دریافت محتوای فایل، نسخه جدید Code.gs باید نصب و منتشر شود.');
      }
      if (typeof window.showToastMsg === 'function') window.showToastMsg('در حال خواندن تعداد صفحات فایل...');
      var info = await getPdfInfo(item, null);
      showPageConfig(index, info.pageCount);
      if (info.pdf && info.pdf.destroy) await info.pdf.destroy();
    } catch (error) {
      if (typeof window.showToastMsg === 'function') window.showToastMsg(error.message || String(error), true);
      else window.alert(error.message || String(error));
    }
  }
  function cacheKey(item) {
    return [String(item.id || item.fileId || ''), String(item.updatedAt || item.size || ''), String(item.pageSelection || 'all')].join('|');
  }
  function getPreparedPages(items) {
    var list = [];
    for (var i = 0; i < items.length; i++) {
      var pages = preparedPages.get(cacheKey(items[i]));
      if (!pages) return null;
      list = list.concat(pages);
    }
    return list;
  }
  async function prepareOne(item, fallbackCase) {
    var key = cacheKey(item);
    if (preparedPages.has(key)) return preparedPages.get(key);
    if (pendingPreparation.has(key)) return pendingPreparation.get(key);
    var task = (async function () {
      if (!window.NezamDriveDocuments || typeof window.NezamDriveDocuments.getFileContent !== 'function') {
        throw new Error('برای چاپ محتوای پیوست، فایل Code.gs نسخه ۲.۲ را نصب و Web App را منتشر کنید.');
      }
      var ctx = contextForItem(item, fallbackCase);
      var data = await window.NezamDriveDocuments.getFileContent(item.id || item.fileId, ctx);
      var mime = String(data.mimeType || '');
      var pages = [];
      if (mime === 'application/pdf') {
        var pdfjs = await loadPdfJs();
        var pdf = await pdfjs.getDocument({ data: base64ToBytes(data.data) }).promise;
        var selectedPages = parsePageSelection(item.pageSelection || 'all', pdf.numPages);
        for (var j = 0; j < selectedPages.length; j++) {
          var pageNumber = selectedPages[j];
          var page = await pdf.getPage(pageNumber);
          var viewport = page.getViewport({ scale: 2.0 });
          var canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          var ctx2d = canvas.getContext('2d', { alpha: false });
          await page.render({ canvasContext: ctx2d, viewport: viewport }).promise;
          pages.push({ dataUrl: canvas.toDataURL('image/png'), name: data.name || item.name, pageNumber: pageNumber, pageCount: pdf.numPages, mimeType: 'image/png' });
          canvas.width = 0; canvas.height = 0;
        }
        if (pdf.destroy) await pdf.destroy();
      } else if (mime.indexOf('image/') === 0) {
        if (/image\/tiff?/i.test(mime)) throw new Error('مرورگر تصویر TIFF را مستقیم چاپ نمی‌کند؛ ابتدا آن را به JPG یا PDF تبدیل کنید.');
        pages.push({ dataUrl: 'data:' + mime + ';base64,' + data.data, name: data.name || item.name, pageNumber: 1, pageCount: 1, mimeType: mime });
      } else {
        throw new Error('فرمت فایل «' + (data.name || item.name) + '» برای درج در چاپ پشتیبانی نمی‌شود. PDF، DOC، DOCX یا تصویر انتخاب کنید.');
      }
      preparedPages.set(key, pages);
      return pages;
    })();
    pendingPreparation.set(key, task);
    try { return await task; }
    finally { pendingPreparation.delete(key); }
  }
  async function prepareForPreview(items, caseObj) {
    var list = Array.isArray(items) ? items : [];
    var total = 0;
    for (var i = 0; i < list.length; i++) {
      if (typeof window.showToastMsg === 'function') window.showToastMsg('در حال آماده‌سازی پیوست ' + (i + 1) + ' از ' + list.length + ' برای چاپ...');
      var pages = await prepareOne(list[i], caseObj);
      total += pages.length;
    }
    return { pageCount: total, pages: getPreparedPages(list) || [] };
  }

  window.handleLetterAttachmentUpload = uploadLocal;
  window.openLetterAttachmentPicker = openPicker;
  window.NezamLetterAttachments = {
    getDraft: function () { return draft.map(function (item) { return Object.assign({}, item); }); },
    setDraft: function (items) { draft = (Array.isArray(items) ? items : []).map(function (item) { return Object.assign({ pageSelection: 'all' }, item); }); render(); },
    clear: function () { draft = []; render(); },
    render: render,
    prepareForPreview: prepareForPreview,
    getPreparedPages: getPreparedPages,
    invalidatePrepared: function (items) { (items || []).forEach(function (item) { preparedPages.delete(cacheKey(item)); }); }
  };
  render();
})();