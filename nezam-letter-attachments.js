/* Nezam636 multi-attachment manager for letters. Source documents remain in their applicant Drive folder. */
(function () {
  'use strict';
  var draft = [];
  var pickerDocs = [];
  var pickerContext = null;

  function safe(value) {
    return typeof window.escapeHtmlCore === 'function'
      ? window.escapeHtmlCore(value)
      : String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
  }

  function context() {
    var office = window.__nezamOfficeLetterDraftMode === true;
    var c = office ? null : (typeof window.getActiveCase === 'function' ? window.getActiveCase() : null);
    if (!office && !c) throw new Error('برای انتخاب پیوست، ابتدا متقاضی نامه را انتخاب کنید.');
    return office
      ? { caseId: '__OFFICE_LETTER_ATTACHMENTS__', fullName: 'مکاتبات مستقل دفتر', nationalCode: 'NEZAM636_OFFICE', docCode: 'LETTER_ATTACHMENT', docTitle: 'پیوست نامه' }
      : { caseId: String(c.id), fullName: String(c.name || 'متقاضی'), nationalCode: String(c.nid || c.code || ''), docCode: 'LETTER_ATTACHMENT', docTitle: 'پیوست نامه' };
  }

  function normalize(doc, ctx) {
    var id = String(doc && (doc.id || doc.fileId) || '');
    if (!id) return null;
    return {
      id: id,
      fileId: id,
      name: String(doc.name || doc.fileName || 'فایل پیوست'),
      mimeType: String(doc.mimeType || 'application/octet-stream'),
      size: Number(doc.size || 0),
      webViewLink: String(doc.webViewLink || ''),
      downloadUrl: String(doc.downloadUrl || ''),
      caseId: String(doc.caseId || (ctx && ctx.caseId) || ''),
      source: 'google-drive',
      docCode: String(doc.docCode || 'LETTER_ATTACHMENT')
    };
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
      var url = /^https:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(item.webViewLink || '') ? item.webViewLink : '';
      var name = url
        ? '<a href="' + safe(url) + '" target="_blank" rel="noopener noreferrer">' + safe(item.name) + '</a>'
        : safe(item.name);
      return '<tr><td>' + safe(index + 1) + '</td><td>' + name + '</td><td>' + safe(size) + '</td><td>Google Drive</td><td><button type="button" class="btn btn-sm btn-outline-danger" data-remove-letter-attachment="' + index + '">حذف از نامه</button></td></tr>';
    }).join('');
    holder.innerHTML = '<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>ردیف</th><th>نام فایل</th><th>حجم</th><th>منبع</th><th>عملیات</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    if (holder.dataset.attachmentActionsBound !== '1') {
      holder.dataset.attachmentActionsBound = '1';
      holder.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-remove-letter-attachment]');
        if (!button) return;
        var index = Number(button.getAttribute('data-remove-letter-attachment'));
        if (!Number.isInteger(index) || index < 0 || index >= draft.length) return;
        draft.splice(index, 1);
        render();
        window.__nezam636LetterDraftDirty = true;
      });
    }
  }

  function addDocs(items, ctx) {
    var added = 0;
    (Array.isArray(items) ? items : []).forEach(function (doc) {
      var item = normalize(doc, ctx);
      if (!item || draft.some(function (old) { return old.id === item.id; })) return;
      draft.push(item);
      added++;
    });
    render();
    window.__nezam636LetterDraftDirty = true;
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
    } finally {
      if (input) input.value = '';
    }
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
    if (typeof window.showToastMsg === 'function') {
      window.showToastMsg(count + ' پیوست به نامه اضافه شد؛ فایل اصلی در بایگانی Drive باقی ماند.');
    }
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
        '<p class="small text-muted">انتخاب فایل فقط ارجاع به سند اصلی ایجاد می‌کند؛ فایل جابه‌جا یا حذف نمی‌شود.</p>' +
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

  window.handleLetterAttachmentUpload = uploadLocal;
  window.openLetterAttachmentPicker = openPicker;
  window.NezamLetterAttachments = {
    getDraft: function () { return draft.map(function (item) { return Object.assign({}, item); }); },
    setDraft: function (items) {
      draft = (Array.isArray(items) ? items : []).map(function (item) { return Object.assign({}, item); });
      render();
    },
    clear: function () { draft = []; render(); },
    render: render
  };
  render();
})();