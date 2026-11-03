/* Nezam636 applicant document vault: Google Drive is the source of truth for new uploads. */
(function () {
  'use strict';
  var DRIVE_API_URL = 'https://script.google.com/macros/s/AKfycbyd7lrIZfKVUm09OzBQewj8_XRWJfMpd8vCm6DV-tAUXEkA33LgqL10UKe8Yz17TwM2/exec';
  var ACCESS_KEY_STORAGE = '__nezam636_docs_access_key';
  var MAX_FILE_BYTES = 10 * 1024 * 1024;
  var ALLOWED = new Set(['pdf','jpg','jpeg','png','webp','gif','tif','tiff','bmp','doc','docx','xls','xlsx','ppt','pptx','txt','csv','rtf','odt','ods','odp']);

  function getAccessKey(forcePrompt) {
    var key = '';
    try { key = localStorage.getItem(ACCESS_KEY_STORAGE) || ''; } catch (e) {}
    if (forcePrompt || !key) {
      key = window.prompt('کلید دسترسی اختصاصی بایگانی Google Drive را وارد کنید:') || '';
      key = key.trim();
      if (!key) throw new Error('کلید دسترسی بایگانی وارد نشد.');
      try { localStorage.setItem(ACCESS_KEY_STORAGE, key); } catch (e) {}
    }
    return key;
  }

  async function request(payload, allowKeyRetry) {
    var key = getAccessKey(false);
    var response = await fetch(DRIVE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({}, payload, { accessKey: key })),
      redirect: 'follow'
    });
    var raw = await response.text();
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { throw new Error('پاسخ Google Apps Script قابل‌خواندن نیست؛ انتشار نسخه جدید Code.gs را بررسی کنید.'); }
    if (!response.ok) throw new Error('خطای ارتباط با Google Drive (' + response.status + ').');
    var documentActions = ['listCaseDocuments','uploadCaseDocument','replaceCaseDocument','deleteCaseDocument'];
    if (documentActions.indexOf(String(payload.action || '')) !== -1 && Number(data && data.apiVersion) !== 1) {
      throw new Error('Google Apps Script هنوز به نسخه جدید بایگانی مدارک ارتقا نیافته است. فایل Code.gs جدید را جایگزین و Web App را به‌روزرسانی کنید.');
    }
    if (!data || data.status !== 'success') {
      var message = data && data.message ? String(data.message) : 'عملیات در Google Drive تأیید نشد.';
      if (allowKeyRetry !== false && /کلید دسترسی/.test(message)) {
        try { localStorage.removeItem(ACCESS_KEY_STORAGE); } catch (e) {}
        getAccessKey(true);
        return request(payload, false);
      }
      throw new Error(message);
    }
    return data;
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('خواندن فایل «' + file.name + '» ناموفق بود.')); };
      reader.onload = function () {
        var value = String(reader.result || '');
        var comma = value.indexOf(',');
        if (comma < 0) return reject(new Error('ساختار فایل «' + file.name + '» معتبر نیست.'));
        resolve(value.slice(comma + 1));
      };
      reader.readAsDataURL(file);
    });
  }

  function extensionOf(name) {
    var match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }

  function validateFile(file) {
    if (!file || !file.name) throw new Error('یک فایل معتبر انتخاب کنید.');
    if (!ALLOWED.has(extensionOf(file.name))) throw new Error('فرمت فایل «' + file.name + '» پشتیبانی نمی‌شود.');
    if (!(file.size > 0) || file.size > MAX_FILE_BYTES) throw new Error('حجم فایل «' + file.name + '» باید بیشتر از صفر و حداکثر ۱۰ مگابایت باشد.');
  }

  function setProgress(done, total, currentName, statusText) {
    var wrap = document.getElementById('case-doc-upload-progress-wrap');
    var bar = document.getElementById('case-doc-upload-progress-bar');
    var label = document.getElementById('case-doc-upload-progress-label');
    var percent = total ? Math.round((done / total) * 100) : 0;
    if (wrap) wrap.hidden = false;
    if (bar) {
      bar.style.width = percent + '%';
      bar.setAttribute('aria-valuenow', String(percent));
      bar.textContent = percent + '%';
    }
    if (label) label.textContent = statusText || ((done + ' از ' + total + ' فایل') + (currentName ? ' — ' + currentName : ''));
  }

  async function uploadRawFile(fileInfo, context) {
    var payload = {
      action: context.replaceFileId ? 'replaceCaseDocument' : 'uploadCaseDocument',
      caseId: String(context.caseId),
      fullName: String(context.fullName || ''),
      nationalCode: String(context.nationalCode || ''),
      docCode: String(context.docCode || 'OTHER'),
      docTitle: String(context.docTitle || 'سایر مدارک'),
      fileName: String(fileInfo.fileName || fileInfo.file.name),
      fileType: String(fileInfo.fileType || fileInfo.file.type || 'application/octet-stream'),
      fileData: fileInfo.fileData,
      oldFileId: String(context.replaceFileId || '')
    };
    return request(payload, true);
  }

  async function uploadFiles(filesLike, context) {
    var files = Array.prototype.slice.call(filesLike || []);
    if (!files.length) throw new Error('فایلی برای بارگذاری انتخاب نشده است.');
    if (!context || !context.caseId) throw new Error('پرونده فعال مشخص نیست.');
    if (context.replaceFileId && files.length !== 1) throw new Error('برای جایگزینی، فقط یک فایل انتخاب کنید.');
    files.forEach(validateFile);
    var successes = [];
    var failures = [];
    var replaceId = context.replaceFileId || '';
    setProgress(0, files.length, '', 'آماده‌سازی بارگذاری...');
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      setProgress(i, files.length, file.name, 'در حال بارگذاری ' + file.name);
      try {
        var base64 = await fileToBase64(file);
        var result = await uploadRawFile({file:file,fileName:file.name,fileType:file.type,fileData:base64}, Object.assign({},context,{replaceFileId:replaceId}));
        if (result.document) successes.push(result.document);
        else throw new Error('سرور فایل ذخیره‌شده را برنگرداند.');
      } catch (error) {
        failures.push({fileName:file.name,message:error && error.message ? error.message : String(error)});
      }
      if (replaceId) replaceId = '';
      setProgress(i+1,files.length,file.name,(i+1)+' از '+files.length+' فایل پردازش شد');
    }
    setProgress(files.length,files.length,'',failures.length ? ('اتمام با '+failures.length+' خطا') : ('همه '+successes.length+' فایل با موفقیت در Drive ثبت شدند'));
    if (typeof window.renderActiveCaseDocsChecklist === 'function') window.renderActiveCaseDocsChecklist();
    if (successes.length && typeof window.logCaseAction === 'function') {
      var active = window.getActiveCase ? window.getActiveCase() : null;
      if (active) window.logCaseAction(active,'بارگذاری '+successes.length+' فایل مدرک در Google Drive');
    }
    return {successes:successes,failures:failures};
  }

  async function list(context) {
    if (!context || !context.caseId) throw new Error('شناسه پرونده برای دریافت فهرست مدارک موجود نیست.');
    return request({action:'listCaseDocuments',caseId:String(context.caseId),fullName:String(context.fullName||''),nationalCode:String(context.nationalCode||'')},true);
  }

  async function remove(fileId, context) {
    if (!fileId) throw new Error('شناسه فایل برای حذف مشخص نیست.');
    var result = await request({action:'deleteCaseDocument',caseId:String(context.caseId),fullName:String(context.fullName||''),nationalCode:String(context.nationalCode||''),fileId:String(fileId)},true);
    if (typeof window.renderActiveCaseDocsChecklist === 'function') window.renderActiveCaseDocsChecklist();
    if (typeof window.showToastMsg === 'function') window.showToastMsg('فایل از بایگانی Google Drive حذف شد.');
    return result;
  }

  function migrateLegacyDocs(context) {
    return new Promise(function (resolve,reject) {
      if (typeof window.getUploadedDocsForCase !== 'function') return reject(new Error('خواندن فایل‌های قدیمی مرورگر در دسترس نیست.'));
      window.getUploadedDocsForCase(context.caseId,async function(map) {
        var entries=Object.keys(map||{}).map(function(key){return map[key];}).filter(function(item){return item&&item.dataUrl;});
        if(!entries.length)return resolve({successes:[],failures:[]});
        var successes=[],failures=[];
        setProgress(0,entries.length,'','بررسی مدارک قدیمی این مرورگر...');
        for(var i=0;i<entries.length;i++){
          var item=entries[i];
          try{
            var dataUrl=String(item.dataUrl||'');
            var comma=dataUrl.indexOf(',');
            if(comma<0)throw new Error('محتوای فایل قدیمی معتبر نیست.');
            var base64=dataUrl.slice(comma+1);
            var size=Math.floor(base64.length*0.75);
            if(!size||size>MAX_FILE_BYTES)throw new Error('حجم فایل قدیمی بیش از ۱۰ مگابایت است؛ آن را جداگانه از فایل اصلی بارگذاری کنید.');
            var mime=dataUrl.slice(5,dataUrl.indexOf(';'))||'application/octet-stream';
            var result=await uploadRawFile({file:{name:item.fileName,type:mime},fileName:item.fileName,fileType:mime,fileData:base64},Object.assign({},context,{docCode:item.docCode,docTitle:item.docTitle}));
            successes.push(result.document);
          }catch(error){failures.push({fileName:item.fileName||'فایل قدیمی',message:error.message||String(error)});}
          setProgress(i+1,entries.length,item.fileName,(i+1)+' از '+entries.length+' فایل قدیمی منتقل شد');
        }
        if(typeof window.renderActiveCaseDocsChecklist==='function')window.renderActiveCaseDocsChecklist();
        resolve({successes:successes,failures:failures});
      });
    });
  }

  function getCaseContext() {
    var c=typeof window.getActiveCase==='function'?window.getActiveCase():null;
    if(!c)throw new Error('ابتدا یک متقاضی را انتخاب کنید.');
    return {caseId:String(c.id||''),fullName:String(c.name||''),nationalCode:String(c.nid||c.code||'')};
  }

  window.NezamDriveDocuments={
    list:list,uploadFiles:uploadFiles,remove:remove,migrateLegacyDocs:migrateLegacyDocs,
    getCaseContext:getCaseContext,clearAccessKey:function(){try{localStorage.removeItem(ACCESS_KEY_STORAGE);}catch(e){}},
    maxFileBytes:MAX_FILE_BYTES
  };
})();