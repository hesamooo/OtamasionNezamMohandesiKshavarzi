// Windows Script Host Guard: Prevents error if user double-clicks the .js file directly in Windows Explorer
if (typeof WScript !== 'undefined') {
  try {
    var sh = new ActiveXObject('WScript.Shell');
    sh.Run('index.html');
  } catch (e) {}
  WScript.Quit();
}

/* ==========================================================================
   NEZAM AI ASSISTANT MODULE v28.0 (MULTI-MODEL + PDF/KML/KMZ/GPX/CAD + LTR UTM)
   سامانه هوشمند و دستیار فنی مرکز خدمات کشاورزی ۶۳۶ خفر:
   ۱. استعلام زنده لیست مدل‌های فعال حساب کاربر از سرور گوگل (ModelService.ListModels)
   ۲. پشتیبانی کامل از کلیدهای نسل جدید (AQ.) و کلیدهای کلاسیک (AIza)
   ۳. خوانش هوشمند تصاویر، اسناد PDF و فایل‌های نقشه‌برداری (KML, KMZ, GPX, AutoCAD DXF/DWG)
   ۴. استخراج استاندارد مختصات UTM با فرمت چپ‌به‌راست: X,Y,Z,Zone (پیش‌فرض زون 39)
   ۵. خلبان خودکار تشکیل پرونده و سازگاری ۱۰۰٪ با GitHub Pages و حالت آفلاین
   ========================================================================== */

// فهرست اولیه مدل‌ها (به محض اتصال کلید، با لیست واقعی سرور گوگل به‌روزرسانی می‌شود)
var GEMINI_AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (پیشنهادی)' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (پایدار)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (سازگاری)' }
];

var aiOnlineStatus = {
  isOnline: false,
  model: getStoredGeminiModel(),
  searchGrounding: true,
  checked: false,
  userKeyActive: false,
};

var aiPendingImageBase64 = null;
var aiPendingImageMime = 'image/jpeg';
var aiPendingFileName = '';
var aiPendingFileExt = '';
var aiPendingParsedGisData = null;
var aiChatHistoryBuffer = [];

// تشخیص اجرا روی GitHub Pages یا فایل محلی (بدون سرور بک‌اند Node.js)
function isStaticHostEnvironment() {
  var host = (window.location && window.location.hostname) ? window.location.hostname.toLowerCase() : '';
  var proto = (window.location && window.location.protocol) ? window.location.protocol : '';
  return proto === 'file:' || host.indexOf('github.io') !== -1 || host.indexOf('pages.dev') !== -1 || host.indexOf('netlify.app') !== -1;
}

// تبدیل ارقام فارسی و عربی به انگلیسی (برای مختصات چپ‌به‌راست)
function toEnglishDigits(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
    .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
}

// مدیریت مدل انتخابی کاربر در حافظه محلی
function getStoredGeminiModel() {
  try {
    var saved = (localStorage.getItem('nezam_gemini_model') || '').trim().replace(/^models\//, '');
    // مدل‌های خاموش‌شده یا مقدار خالی به مدل پایدار جدید منتقل می‌شوند.
    if (!saved || saved === 'gemini-2.0-flash' || saved.indexOf('1.5-flash-8b') !== -1) {
      return 'gemini-3.8-flash';
    }
    return saved;
  } catch (e) {
    return 'gemini-3.8-flash';
  }
}

function setStoredGeminiModel(modelId) {
  try {
    if (modelId && modelId.trim()) {
      var cleanModel = modelId.trim().replace(/^models\//, '');
      localStorage.setItem('nezam_gemini_model', cleanModel);
      aiOnlineStatus.model = cleanModel;
      syncOcrUploadControlsUI();
    }
  } catch (e) {}
}

function getModelDisplayLabel(modelId) {
  var cleanId = (modelId || '').replace(/^models\//, '');
  for (var i = 0; i < GEMINI_AVAILABLE_MODELS.length; i++) {
    if (GEMINI_AVAILABLE_MODELS[i].id === cleanId) {
      return GEMINI_AVAILABLE_MODELS[i].label;
    }
  }
  return cleanId;
}

// تغییر مدل توسط کاربر از طریق منوی کشویی
window.changeGeminiModel = function (modelId) {
  var sel = document.getElementById('gemini-model-select');
  var chosen = modelId || (sel ? sel.value : 'gemini-3.8-flash');
  setStoredGeminiModel(chosen);
  updateAiBadgeStatus(aiOnlineStatus.isOnline);
  syncOcrUploadControlsUI();
  if (typeof showToastMsg === 'function') {
    showToastMsg('🤖 مدل هوش مصنوعی روی ' + chosen + ' تنظیم شد.');
  }
};

// ارتقای خودکار کادر آپلود فایل (افزودن فرمت‌های PDF, KML, KMZ, GPX, DXF, DWG) و چپ‌به‌راست کردن کادر UTM
function syncOcrUploadControlsUI() {
  var activeModel = aiOnlineStatus.model || getStoredGeminiModel();

  // ۱. تنظیم خاصیت accept روی کادر انتخاب فایل برای پذیرش کلیه فرمت‌های مهندسی و اسناد
  var fileInputs = document.querySelectorAll('input[type="file"]');
  for (var i = 0; i < fileInputs.length; i++) {
    var inp = fileInputs[i];
    var onchangeAttr = inp.getAttribute('onchange') || '';
    if (onchangeAttr.indexOf('aiHandleImageSelect') !== -1 || inp.id === 'ai-ocr-file-input') {
      var acceptedFormats = 'image/*,.pdf,.kml,.kmz,.gpx,.dxf,.dwg,.csv,.txt';
      if (inp.getAttribute('accept') !== acceptedFormats) {
        inp.setAttribute('accept', acceptedFormats);
      }
    }
  }

  // ۲. به‌روزرسانی متن دکمه خوانش سند با نام مدل انتخابی فعلی
  var buttons = document.querySelectorAll('button');
  for (var b = 0; b < buttons.length; b++) {
    var btn = buttons[b];
    var onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.indexOf('aiReadDocumentImagePro') !== -1 && btn.innerHTML.indexOf('⏳') === -1) {
      btn.innerHTML = '🔍 تحلیل و خوانش فایل / سند با ' + escapeHtml(activeModel);
    }
  }

  // ۳. تضمین نوشتار چپ‌به‌راست (LTR) برای کادر مختصات UTM در فرم پرونده
  var utmEl = document.getElementById('c-utm');
  if (utmEl) {
    utmEl.setAttribute('dir', 'ltr');
    utmEl.style.direction = 'ltr';
    utmEl.style.textAlign = 'left';
    utmEl.style.unicodeBidi = 'plaintext';
    utmEl.style.fontFamily = 'Consolas, Monaco, monospace';
    if (!utmEl.getAttribute('placeholder') || utmEl.getAttribute('placeholder').indexOf('Zone') === -1) {
      utmEl.setAttribute('placeholder', 'X,Y,Z,Zone (Example: 645120.50,3198450.20,1150,39)');
    }
  }
}

// ایجاد یا همگام‌سازی خودکار منوی انتخاب مدل در رابط کاربری
function ensureGeminiModelSelectorUI() {
  syncOcrUploadControlsUI();
  var existingSelect = document.getElementById('gemini-model-select');
  var currentModel = getStoredGeminiModel();

  if (existingSelect) {
    if (existingSelect.options.length === 0) {
      populateModelSelectOptions(existingSelect, GEMINI_AVAILABLE_MODELS, currentModel);
    } else {
      existingSelect.value = currentModel;
      if (!existingSelect.value && existingSelect.options.length > 0) {
        existingSelect.selectedIndex = 0;
      }
    }
    if (!existingSelect.onchange) {
      existingSelect.onchange = function () {
        window.changeGeminiModel(this.value);
      };
    }
    return;
  }

  var keyInput = document.getElementById('gemini-custom-api-key');
  var statusDesc = document.getElementById('ai-online-status-desc');
  var targetContainer = keyInput ? (keyInput.closest('.input-group') || keyInput.parentElement) : statusDesc;

  if (targetContainer && targetContainer.parentElement) {
    var wrapper = document.createElement('div');
    wrapper.id = 'gemini-model-selector-wrapper';
    wrapper.className = 'mt-2 mb-2 d-flex align-items-center gap-2 flex-wrap';

    var label = document.createElement('label');
    label.setAttribute('for', 'gemini-model-select');
    label.className = 'small fw-bold text-secondary mb-0';
    label.innerHTML = '🧠 انتخاب نسخه موتور Gemini:';

    var select = document.createElement('select');
    select.id = 'gemini-model-select';
    select.className = 'form-select form-select-sm w-auto flex-grow-1';
    select.style.maxWidth = '380px';

    populateModelSelectOptions(select, GEMINI_AVAILABLE_MODELS, currentModel);

    select.onchange = function () {
      window.changeGeminiModel(this.value);
    };

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    targetContainer.parentElement.insertBefore(wrapper, targetContainer.nextSibling);
  }
}

function populateModelSelectOptions(selectEl, modelsList, selectedId) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  var foundSelected = false;
  for (var i = 0; i < modelsList.length; i++) {
    var opt = document.createElement('option');
    opt.value = modelsList[i].id;
    opt.textContent = modelsList[i].label;
    if (modelsList[i].id === selectedId) {
      opt.selected = true;
      foundSelected = true;
    }
    selectEl.appendChild(opt);
  }
  if (!foundSelected && selectEl.options.length > 0) {
    selectEl.options[0].selected = true;
    setStoredGeminiModel(selectEl.options[0].value);
  }
}

/* ==========================================================================
   موتور تبدیل ژئودتیک WGS84 (Lat/Lon) به UTM و نرمال‌ساز چپ‌به‌راست (X,Y,Z,Zone)
   ========================================================================== */

// تبدیل دقیق مختصات جغرافیایی (عرض و طول جغرافیایی WGS84) به مختصات متریک UTM
function wgs84LatLonToUtm(latDeg, lonDeg, elevation, forceZone) {
  var lat = parseFloat(latDeg);
  var lon = parseFloat(lonDeg);
  var z = (elevation !== undefined && elevation !== null && !isNaN(parseFloat(elevation)))
    ? Math.round(parseFloat(elevation) * 100) / 100
    : 0;

  if (isNaN(lat) || isNaN(lon)) return null;

  // اگر اعداد ورودی از قبل در محدوده متریک UTM باشند، مستقیماً برگردان
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    var uX = lat < lon ? lat : lon;
    var uY = lat < lon ? lon : lat;
    return {
      x: Math.round(uX * 100) / 100,
      y: Math.round(uY * 100) / 100,
      z: z,
      zone: forceZone || 39
    };
  }

  var a = 6378137.0; // شعاع استوایی بیضوی WGS84
  var f = 1 / 298.257223563;
  var k0 = 0.9996;
  var e2 = 2 * f - f * f;
  var ep2 = e2 / (1 - e2);

  var zone = forceZone || (Math.floor((lon + 180) / 6) + 1);
  var lonOrigin = (zone - 1) * 6 - 180 + 3;

  var latRad = (lat * Math.PI) / 180.0;
  var lonRad = (lon * Math.PI) / 180.0;
  var lonOriginRad = (lonOrigin * Math.PI) / 180.0;

  var N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  var T = Math.tan(latRad) * Math.tan(latRad);
  var C = ep2 * Math.cos(latRad) * Math.cos(latRad);
  var A = Math.cos(latRad) * (lonRad - lonOriginRad);

  var M =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 * e2 * e2) / 1024) * Math.sin(2 * latRad) +
      ((15 * e2 * e2) / 256 + (45 * e2 * e2 * e2) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * latRad));

  var easting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A * A * A) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * Math.pow(A, 5)) / 120) +
    500000.0;

  var northing =
    k0 *
    (M +
      N *
        Math.tan(latRad) *
        ((A * A) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4)) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * Math.pow(A, 6)) / 720));

  if (lat < 0) {
    northing += 10000000.0;
  }

  return {
    x: Math.round(easting * 100) / 100,
    y: Math.round(northing * 100) / 100,
    z: z,
    zone: zone
  };
}

// محاسبه مساحت چندضلعی از روی نقاط UTM (فرمول شولیس - مترمربع)
function calculateUtmPolygonAreaSqm(pointsList) {
  if (!pointsList || pointsList.length < 3) return 0;
  var area = 0;
  var n = pointsList.length;
  for (var i = 0; i < n; i++) {
    var j = (i + 1) % n;
    area += pointsList[i].x * pointsList[j].y;
    area -= pointsList[j].x * pointsList[i].y;
  }
  return Math.round(Math.abs(area) / 2.0);
}

// نرمال‌ساز مقاوم مختصات UTM و جغرافیایی (ورودی متن، JSON، آرایه و آبجکت)
function formatUtmCoordinatesLTR(rawInput, defaultZone) {
  var zoneDefault=parseInt(String(defaultZone||39).replace(/[^0-9]/g,''),10)||39;
  var output=[],seen={};
  function n(v){if(v===null||v===undefined||v==='')return NaN;var q=toEnglishDigits(String(v)).replace(/[٫]/g,'.').replace(/[−–—]/g,'-').trim();var z=Number(q);return isFinite(z)?z:NaN;}
  function pick(obj,keys){if(!obj||typeof obj!=='object')return undefined;var names=Object.keys(obj);for(var i=0;i<keys.length;i++)for(var j=0;j<names.length;j++)if(names[j].toLowerCase()===keys[i].toLowerCase()&&obj[names[j]]!==''&&obj[names[j]]!==null&&obj[names[j]]!==undefined)return obj[names[j]];return undefined;}
  function addUtm(x,y,elev,zone){
    x=n(x);y=n(y);if(isNaN(x)||isNaN(y))return false;
    if(x>=2000000&&x<=5000000&&y>=100000&&y<=900000){var sw=x;x=y;y=sw;}
    if(x<100000||x>900000||y<2000000||y>5000000)return false;
    var z=n(elev);if(isNaN(z)||z< -500||z>10000)z=0;
    var zn=parseInt(String(zone===undefined||zone===null||zone===''?zoneDefault:zone).replace(/[^0-9]/g,''),10);if(!zn||zn<1||zn>60)zn=zoneDefault;
    x=Math.round(x*100)/100;y=Math.round(y*100)/100;z=Math.round(z*100)/100;
    var key=x.toFixed(2)+'_'+y.toFixed(2);if(seen[key])return true;seen[key]=true;output.push(x+','+y+','+z+','+zn);return true;
  }
  function addGeo(lat,lon,elev,zone,allowGlobal){
    lat=n(lat);lon=n(lon);if(isNaN(lat)||isNaN(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return false;
    if(!allowGlobal){var local=(lat>=20&&lat<=42&&lon>=44&&lon<=64)||(lon>=20&&lon<=42&&lat>=44&&lat<=64);if(!local)return false;}
    if(lat>=44&&lat<=64&&lon>=20&&lon<=42){var sw=lat;lat=lon;lon=sw;}
    var forced=parseInt(String(zone||'').replace(/[^0-9]/g,''),10)||undefined;
    var converted=wgs84LatLonToUtm(lat,lon,elev,forced);
    return converted?addUtm(converted.x,converted.y,converted.z,converted.zone||zoneDefault):false;
  }
  function processTuple(arr){
    if(!arr||arr.length<2)return false;var x=n(arr[0]),y=n(arr[1]);if(isNaN(x)||isNaN(y))return false;
    if(addUtm(x,y,arr[2],arr[3]))return true;return addGeo(x,y,arr[2],arr[3],false);
  }
  function processObject(obj,depth){
    if(!obj||depth>7)return;
    if(Array.isArray(obj)){if(obj.length>=2&&typeof obj[0]!=='object')processTuple(obj);else for(var i=0;i<obj.length;i++)processObject(obj[i],depth+1);return;}
    if(typeof obj!=='object'){if(typeof obj==='string')processText(obj);return;}
    var x=pick(obj,['x','easting','utmEasting','utm_x','east','eastings']),y=pick(obj,['y','northing','utmNorthing','utm_y','north','northings']);
    var z=pick(obj,['z','elevation','altitude','height','elev']),zone=pick(obj,['zone','utmZone','utm_zone']);
    if(x!==undefined&&y!==undefined&&addUtm(x,y,z,zone))return;
    var lat=pick(obj,['latitude','lat']),lon=pick(obj,['longitude','lon','lng','long']);
    if(lat!==undefined&&lon!==undefined&&addGeo(lat,lon,z,zone,true))return;
    var keys=['utmCoordinates','utm_coordinates','utm','utmPoints','utm_points','utmCoords','utmVertices','geographicCoordinates','geographic_coordinates','geoCoordinates','latLon','latLng','coordinates','coordinateList','coordinateTable','points','vertices','boundaryPoints','parcelCoordinates','landCoordinates','locationCoordinates','geometry','coordinateData','extractedData','extraction','result','data','parcel','property','land','map','features'];
    for(var k=0;k<keys.length;k++){var nested=pick(obj,[keys[k]]);if(nested!==undefined)processObject(nested,depth+1);}
  }
  function processText(source){
    var clean=toEnglishDigits(String(source||'')).replace(/[\u200E\u200F\u202A-\u202E]/g,'').replace(/[٫]/g,'.').replace(/[−–—]/g,'-');
    // نقطه‌ویرگول جداکننده ستون است، نه مرز مستقل ردیف؛ برچسب‌های یک ردیف کنار هم می‌مانند.
    var rows=clean.split(/[\r\n]+/);
    for(var r=0;r<rows.length;r++){
      var line=rows[r].trim();if(!line)continue;
      var zm=line.match(/(?:zone|زون)\s*[:=]?\s*(\d{1,2})\s*[RrNnSs]?/i)||line.match(/\b(38|39|40|41)\s*[RrNn]\b/i);
      var rowZone=zm?parseInt(zm[1],10):zoneDefault;
      var em=line.match(/(?:elevation|altitude|height|elev|ارتفاع|\bz\b)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i);
      var rowElev=em?n(em[1]):0;
      var xm=line.match(/(?:easting|east|x|شرقی|مختصات\s*شرقی)\s*(?:\([^)]*\))?\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
      var ym=line.match(/(?:northing|north|y|شمالی|مختصات\s*شمالی)\s*(?:\([^)]*\))?\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
      if(xm&&ym&&addUtm(xm[1],ym[1],rowElev,rowZone))continue;
      var latm=line.match(/(?:latitude|\blat\b|عرض\s*جغرافیایی)\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
      var lonm=line.match(/(?:longitude|\blon\b|\blng\b|طول\s*جغرافیایی)\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
      if(latm&&lonm&&addGeo(latm[1],lonm[1],rowElev,rowZone,true))continue;
      var tokens=line.match(/-?\d+(?:\.\d+)?/g);if(!tokens||tokens.length<2)continue;
      for(var i=0;i<tokens.length-1;i++){
        var v1=n(tokens[i]),v2=n(tokens[i+1]);if(isNaN(v1)||isNaN(v2))continue;
        var v3=tokens[i+2]!==undefined?n(tokens[i+2]):NaN,v4=tokens[i+3]!==undefined?n(tokens[i+3]):NaN;
        var elev=rowElev,zone=rowZone;
        if(!isNaN(v3)){if(v3>=1&&v3<=60&&(isNaN(v4)||v4<1||v4>60))zone=v3;else if(v3>=-500&&v3<=10000){elev=v3;if(!isNaN(v4)&&v4>=1&&v4<=60)zone=v4;}}
        var ok=false;
        if((v1>=100000&&v1<=900000&&v2>=2000000&&v2<=5000000)||(v2>=100000&&v2<=900000&&v1>=2000000&&v1<=5000000))ok=addUtm(v1,v2,elev,zone);
        else if((v1>=20&&v1<=42&&v2>=44&&v2<=64)||(v2>=20&&v2<=42&&v1>=44&&v1<=64))ok=addGeo(v1,v2,elev,zone,false);
        if(ok)i++;
      }
    }
  }
  if(!rawInput)return '';
  if(typeof rawInput==='string'){
    var raw=rawInput.trim();
    if((raw.charAt(0)==='['&&raw.charAt(raw.length-1)===']')||(raw.charAt(0)==='{'&&raw.charAt(raw.length-1)==='}')){try{processObject(JSON.parse(raw),0);}catch(e){processText(rawInput);}}
    else processText(rawInput);
  }else processObject(rawInput,0);
  if(output.length>3){var first=output[0].split(','),last=output[output.length-1].split(',');if(first[0]===last[0]&&first[1]===last[1])output.pop();}
  return output.join('\n');
}

// ادغام خروجی‌های ساختاریافته Gemini با تمام متن‌های OCR و ورودی؛ هر منبع جداگانه بررسی می‌شود.
function normalizeAiCoordinateData(data,fallbackText){
  if(typeof data==='string'){try{data=JSON.parse(data);}catch(e){data={fullSummary:data};}}
  data=data&&typeof data==='object'?data:{};
  function get(obj,keys){if(!obj||typeof obj!=='object')return undefined;var names=Object.keys(obj);for(var i=0;i<keys.length;i++)for(var j=0;j<names.length;j++)if(names[j].toLowerCase()===keys[i].toLowerCase()&&obj[names[j]]!==''&&obj[names[j]]!==null&&obj[names[j]]!==undefined)return obj[names[j]];return undefined;}
  var utmKeys=['utmCoordinates','utm_coordinates','utm','utmPoints','utm_points','utmCoords','utmVertices','projectedCoordinates','projected_coordinates','eastingNorthing','easting_northing','coordinateTable','coordinateList'];
  var geoKeys=['geographicCoordinates','geographic_coordinates','geoCoordinates','geo_coordinates','latLon','latLng','gpsCoordinates','geographicPoints'];
  var genericKeys=['coordinates','points','vertices','boundaryPoints','parcelCoordinates','landCoordinates','locationCoordinates'];
  var output=[];
  function addCandidate(value){if(value===undefined||value===null||value==='')return;var found=formatUtmCoordinatesLTR(value,39);if(found)found.split('\n').forEach(function(line){if(line&&output.indexOf(line)===-1)output.push(line);});}
  addCandidate(data);
  utmKeys.forEach(function(key){addCandidate(get(data,[key]));});
  genericKeys.forEach(function(key){addCandidate(get(data,[key]));});
  geoKeys.forEach(function(key){addCandidate(get(data,[key]));});
  addCandidate(fallbackText);
  ['fullSummary','description','rawText','raw_text','text','extractedText','extracted_text','ocrText','ocr_text','coordinateText'].forEach(function(key){addCandidate(get(data,[key]));});
  var geoPayload;for(var g=0;g<geoKeys.length&&!geoPayload;g++)geoPayload=get(data,[geoKeys[g]]);
  var lat=get(data,['latitude','lat']),lon=get(data,['longitude','lon','lng','long']);
  var geoText='';
  if(typeof geoPayload==='string')geoText=toEnglishDigits(geoPayload).trim();
  else if(Array.isArray(geoPayload))geoText=geoPayload.map(function(pt){if(Array.isArray(pt))return pt.join(', ');if(pt&&typeof pt==='object'){var la=get(pt,['latitude','lat']),lo=get(pt,['longitude','lon','lng','long']);return la!==undefined&&lo!==undefined?String(la)+', '+String(lo):JSON.stringify(pt);}return String(pt);}).join('\n');
  else if(geoPayload&&typeof geoPayload==='object')geoText=JSON.stringify(geoPayload);
  else if(lat!==undefined&&lon!==undefined)geoText=String(lat)+', '+String(lon);
  return{utm:output.join('\n'),geographicText:geoText};
}

// نمایش وضعیت فایل غیرتصویری (PDF, KML, KMZ, GPX, CAD) در کادر پیش‌نمایش
function parseAiJsonResponse(responseText){
  var source=String(responseText||'').trim();
  var cleaned=source.replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/i,'').trim();
  try{return JSON.parse(cleaned);}catch(e){}
  var first=cleaned.indexOf('{'),last=cleaned.lastIndexOf('}');
  if(first>=0&&last>first){try{return JSON.parse(cleaned.slice(first,last+1));}catch(e2){}}
  return{fullSummary:source,rawText:source};
}

/* ==========================================================================
   موتورهای خوانش مستقیم فایل‌های نقشه‌برداری: KML, KMZ, GPX, AutoCAD DXF/DWG
   ========================================================================== */

// ۱. استخراج فایل KML از داخل آرشیو فشرده KMZ (بدون نیاز به کتابخانه خارجی)
async function extractKmlTextFromKmzBuffer(arrayBuffer) {
  var bytes = new Uint8Array(arrayBuffer);
  var view = new DataView(arrayBuffer);
  var offset = 0;

  while (offset + 30 < bytes.length) {
    var sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // Local File Header signature

    var compression = view.getUint16(offset + 8, true);
    var compressedSize = view.getUint32(offset + 18, true);
    var fileNameLen = view.getUint16(offset + 26, true);
    var extraLen = view.getUint16(offset + 28, true);

    var nameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLen);
    var fileName = new TextDecoder('utf-8').decode(nameBytes);
    var dataStart = offset + 30 + fileNameLen + extraLen;
    var compressedData = bytes.subarray(dataStart, dataStart + compressedSize);

    if (/\.kml$/i.test(fileName)) {
      if (compression === 0) {
        return new TextDecoder('utf-8').decode(compressedData);
      } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
        var ds = new DecompressionStream('deflate-raw');
        var writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();
        var decompressedResp = new Response(ds.readable);
        return await decompressedResp.text();
      }
    }
    offset = dataStart + compressedSize;
  }
  throw new Error('فایل KML معتبری در بسته KMZ یافت نشد.');
}

// ۲. تجزیه فایل KML (گوگل ارث) و تبدیل به نقاط X,Y,Z,Zone
function parseKmlContentToUtm(kmlText) {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(kmlText, 'text/xml');
  var points = [];
  var docName = '';
  var docDesc = '';

  var nameNodes = xmlDoc.getElementsByTagName('name');
  if (nameNodes.length > 0 && nameNodes[0].textContent) {
    docName = nameNodes[0].textContent.trim();
  }
  var descNodes = xmlDoc.getElementsByTagName('description');
  if (descNodes.length > 0 && descNodes[0].textContent) {
    docDesc = descNodes[0].textContent.trim();
  }

  var coordNodes = xmlDoc.getElementsByTagName('coordinates');
  for (var i = 0; i < coordNodes.length; i++) {
    var rawCoords = (coordNodes[i].textContent || '').trim();
    if (!rawCoords) continue;
    var tuples = rawCoords.split(/\s+/);
    for (var t = 0; t < tuples.length; t++) {
      var parts = tuples[t].split(',');
      if (parts.length >= 2) {
        var lon = parseFloat(parts[0]);
        var lat = parseFloat(parts[1]);
        var elev = parts.length >= 3 ? parseFloat(parts[2]) : 0;
        if (!isNaN(lat) && !isNaN(lon)) {
          var utm = wgs84LatLonToUtm(lat, lon, elev);
          if (utm) points.push(utm);
        }
      }
    }
  }

  var utmString = formatUtmCoordinatesLTR(points, 39);
  var areaSqm = calculateUtmPolygonAreaSqm(points);

  return {
    utmCoordinates: utmString,
    pointCount: utmString ? utmString.split('\n').length : 0,
    landArea: areaSqm > 0 ? String(areaSqm) : '',
    planTitle: docName,
    fullSummary: 'استخراج از فایل KML/KMZ گوگل ارث' + (docName ? ' (' + docName + ')' : '') + (docDesc ? ' - ' + docDesc : '')
  };
}

// ۳. تجزیه فایل GPX (دستگاه‌های GPS دستی گارمین و غیره) و تبدیل به X,Y,Z,Zone
function parseGpxContentToUtm(gpxText) {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(gpxText, 'text/xml');
  var points = [];
  var trackName = '';

  var nameEl = xmlDoc.getElementsByTagName('name')[0];
  if (nameEl && nameEl.textContent) trackName = nameEl.textContent.trim();

  var tagTypes = ['wpt', 'rtept', 'trkpt'];
  for (var tt = 0; tt < tagTypes.length; tt++) {
    var nodes = xmlDoc.getElementsByTagName(tagTypes[tt]);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var lat = parseFloat(node.getAttribute('lat'));
      var lon = parseFloat(node.getAttribute('lon'));
      var eleNode = node.getElementsByTagName('ele')[0];
      var elev = eleNode && eleNode.textContent ? parseFloat(eleNode.textContent) : 0;

      if (!isNaN(lat) && !isNaN(lon)) {
        var utm = wgs84LatLonToUtm(lat, lon, elev);
        if (utm) points.push(utm);
      }
    }
  }

  var utmString = formatUtmCoordinatesLTR(points, 39);
  var areaSqm = calculateUtmPolygonAreaSqm(points);

  return {
    utmCoordinates: utmString,
    pointCount: utmString ? utmString.split('\n').length : 0,
    landArea: areaSqm > 0 ? String(areaSqm) : '',
    planTitle: trackName,
    fullSummary: 'استخراج مستقیم از فایل GPX دستگاه GPS' + (trackName ? ' (' + trackName + ')' : '')
  };
}

// ۴. تجزیه فایل اتوکد DXF و DWG و استخراج رئوس (X,Y,Z,39)
function parseAutoCadContentToUtm(rawTextOrBuffer, ext) {
  var points = [];
  var textContent = typeof rawTextOrBuffer === 'string'
    ? rawTextOrBuffer
    : new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(rawTextOrBuffer));

  if (ext === 'dxf' || textContent.indexOf('SECTION') !== -1 || textContent.indexOf('ENTITIES') !== -1) {
    var lines = textContent.split(/\r?\n/);
    var inEntities = textContent.indexOf('ENTITIES') === -1; // اگر سکشن‌بندی نداشت، کل فایل را بررسی کن
    var curX = null;
    var curY = null;
    var curZ = 0;
    var layerElevation = 0;

    for (var i = 0; i + 1 < lines.length; i += 2) {
      var code = parseInt(lines[i].trim(), 10);
      var val = lines[i + 1].trim();

      if (code === 2 && val === 'ENTITIES') {
        inEntities = true;
        continue;
      }
      if (code === 0 && val === 'ENDSEC' && inEntities) {
        break;
      }
      if (!inEntities) continue;

      if (code === 0) {
        layerElevation = 0;
      } else if (code === 38) {
        var elv = parseFloat(val);
        if (!isNaN(elv)) layerElevation = elv;
      } else if (code === 10) {
        curX = parseFloat(val);
      } else if (code === 20 && curX !== null) {
        curY = parseFloat(val);
        // بررسی اینکه آیا خط بعدی کد 30 (ارتفاع Z رأس) است یا خیر
        if (i + 3 < lines.length && parseInt(lines[i + 2].trim(), 10) === 30) {
          curZ = parseFloat(lines[i + 3].trim()) || layerElevation || 0;
          i += 2;
        } else {
          curZ = layerElevation || 0;
        }

        if (!isNaN(curX) && !isNaN(curY)) {
          // اگر مختصات در محدوده UTM یا Lat/Lon باشد
          var conv = wgs84LatLonToUtm(curY, curX, curZ, 39);
          if (conv && conv.x >= 100000 && conv.x <= 900000 && conv.y >= 2000000 && conv.y <= 5000000) {
            points.push(conv);
          }
        }
        curX = null;
        curY = null;
      }
    }
  }

  // اگر فایل DWG باینری بود یا در کدهای گروهی DXF نقاطی با فرمت متنی وجود داشت
  if (points.length === 0 && rawTextOrBuffer instanceof ArrayBuffer) {
    // اسکن باینری IEEE-754 (8-byte double) برای یافتن زوج‌های مختصات UTM زون 39 فارس/خفر
    var dv = new DataView(rawTextOrBuffer);
    for (var b = 0; b + 24 <= dv.byteLength; b += 1) {
      var bx = dv.getFloat64(b, true);
      var by = dv.getFloat64(b + 8, true);
      // محدوده UTM استان فارس و خفر: X بین 500,000 تا 800,000 و Y بین 3,000,000 تا 3,450,000
      if (
        bx >= 500000 && bx <= 800000 &&
        by >= 3000000 && by <= 3450000 &&
        Math.abs(bx - Math.round(bx * 10000) / 10000) < 0.01
      ) {
        var bz = dv.getFloat64(b + 16, true);
        var validZ = (!isNaN(bz) && bz >= 0 && bz <= 4500) ? Math.round(bz * 100) / 100 : 0;
        points.push({
          x: Math.round(bx * 100) / 100,
          y: Math.round(by * 100) / 100,
          z: validZ,
          zone: 39
        });
        b += 15;
        if (points.length >= 200) break;
      }
    }
  }

  var utmString = formatUtmCoordinatesLTR(points, 39);
  var areaSqm = calculateUtmPolygonAreaSqm(points);

  return {
    utmCoordinates: utmString,
    pointCount: utmString ? utmString.split('\n').length : 0,
    landArea: areaSqm > 0 ? String(areaSqm) : '',
    fullSummary: 'استخراج مهندسی از فایل نقشه اتوکد (' + ext.toUpperCase() + ')'
  };
}

// ترجمه دقیق خطاهای سرور گوگل به راهنمای فارسی
function translateGeminiErrorToPersian(errMsg, status) {
  var msg = String(errMsg || '');

  if (status === 403 || /User location is not supported|location is not supported|PERMISSION_DENIED/i.test(msg)) {
    return (
      'محدودیت جغرافیایی یا دسترسی گوگل: لطفاً سرویس <b>DNS شکن (Shecan)</b> یا تغییر آی‌پی خود را بررسی نمایید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Google Response: ' + escapeHtml(msg) + '</div>'
    );
  }

  if (status === 400 && /API_KEY_INVALID|key not valid/i.test(msg)) {
    return (
      'کلید وارد شده معتبر نیست. لطفاً مطمئن شوید کلید را به طور کامل و بدون فاصله کپی کرده‌اید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Google Response: ' + escapeHtml(msg) + '</div>'
    );
  }

  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) {
    return (
      'سهمیه این مدل موقتاً پر شده است. از فهرست مدل‌ها یک مدل فعال دیگر مانند <code>gemini-3.6-flash</code> یا <code>gemini-2.5-flash</code> را انتخاب کنید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Google Response: ' + escapeHtml(msg) + '</div>'
    );
  }

  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
    return (
      'عدم برقراری ارتباط شبکه با سرور گوگل. لطفاً اتصال اینترنت و DNS شکن/VPN خود را بررسی فرمایید.' +
      '<div class="mt-1 small text-muted" dir="ltr">Network Error: ' + escapeHtml(msg) + '</div>'
    );
  }

  return 'خطای دریافتی از سرور گوگل: <div class="mt-1 small" dir="ltr"><code>' + escapeHtml(msg) + '</code></div>';
}

// استعلام زنده لیست مدل‌های فعال حساب کاربر از سرور گوگل (ModelService.ListModels)
async function discoverAccountModelsFromGoogle(apiKey) {
  var cleanKey = (apiKey || '').trim();
  if (!cleanKey) return [];

  var endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=' + encodeURIComponent(cleanKey),
    'https://generativelanguage.googleapis.com/v1/models?pageSize=100&key=' + encodeURIComponent(cleanKey)
  ];

  for (var e = 0; e < endpoints.length; e++) {
    try {
      var resp = await fetch(endpoints[e], {
        method: 'GET',
        headers: { 'x-goog-api-key': cleanKey }
      });

      if (!resp.ok) {
        resp = await fetch(endpoints[e], { method: 'GET' });
      }

      if (resp.ok) {
        var data = await resp.json();
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          var discovered = [];
          for (var i = 0; i < data.models.length; i++) {
            var m = data.models[i];
            var methods = m.supportedGenerationMethods || [];
            var rawName = m.name || '';
            var shortId = rawName.replace(/^models\//, '');

            if (
              methods.indexOf('generateContent') !== -1 &&
              shortId.indexOf('embedding') === -1 &&
              shortId.indexOf('aqa') === -1 &&
              shortId.indexOf('imagen') === -1 &&
              shortId.indexOf('veo') === -1 &&
              shortId.indexOf('tts') === -1 &&
              shortId.indexOf('audio') === -1
            ) {
              var niceTitle = m.displayName ? (m.displayName + ' [' + shortId + ']') : shortId;
              discovered.push({
                id: shortId,
                label: niceTitle
              });
            }
          }

          if (discovered.length > 0) {
            discovered.sort(function (a, b) {
              function getScore(id) {
                if (id === 'gemini-3.8-flash') return 120;
                if (id.indexOf('gemini-3.8-flash') === 0) return 118;
                if (id === 'gemini-3.6-flash') return 112;
                if (id.indexOf('gemini-3.6-flash') === 0) return 110;
                if (id.indexOf('gemini-3') === 0) return 100;
                if (id === 'gemini-2.5-flash') return 88;
                if (id.indexOf('gemini-2.5-flash') === 0) return 86;
                if (id === 'gemini-2.5-pro') return 84;
                if (id.indexOf('gemini-2.5') === 0) return 80;
                if (id.indexOf('gemini-') === 0) return 50;
                return 10;
              }
              return getScore(b.id) - getScore(a.id);
            });

            GEMINI_AVAILABLE_MODELS = discovered;
            var selEl = document.getElementById('gemini-model-select');
            if (selEl) {
              populateModelSelectOptions(selEl, GEMINI_AVAILABLE_MODELS, getStoredGeminiModel());
            }
            return discovered;
          }
        }
      }
    } catch (err) {
      console.warn('ListModels attempt failed for ' + endpoints[e], err);
    }
  }
  return [];
}

// ارسال درخواست به یک مدل مشخص در هر دو نسخه v1beta و v1
async function callGeminiModelEndpoint(apiKey, modelName, payload) {
  var cleanKey = (apiKey || '').trim();
  var cleanModel = (modelName || 'gemini-3.8-flash').replace(/^models\//, '');

  var apiVersions = ['v1beta', 'v1'];
  var lastStatus = 0;
  var lastErrMsg = '';

  for (var v = 0; v < apiVersions.length; v++) {
    var ver = apiVersions[v];
    var baseUrl =
      'https://generativelanguage.googleapis.com/' +
      ver +
      '/models/' +
      encodeURIComponent(cleanModel) +
      ':generateContent';

    var requestPayload = payload;
    if (ver === 'v1' && payload && (payload.systemInstruction || (payload.generationConfig && payload.generationConfig.responseMimeType))) {
      requestPayload = JSON.parse(JSON.stringify(payload));
      if (requestPayload.systemInstruction) {
        var sysText = requestPayload.systemInstruction.parts?.[0]?.text || '';
        if (sysText && requestPayload.contents && requestPayload.contents.length > 0) {
          requestPayload.contents[0].parts.unshift({ text: sysText + '\n\n' });
        }
        delete requestPayload.systemInstruction;
      }
      if (requestPayload.generationConfig && requestPayload.generationConfig.responseMimeType) {
        delete requestPayload.generationConfig.responseMimeType;
      }
    }

    try {
      var resp = await fetch(baseUrl + '?key=' + encodeURIComponent(cleanKey), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify(requestPayload),
      });

      if (resp.ok) {
        return { ok: true, data: await resp.json(), status: 200, usedVersion: ver };
      }

      var errData = await resp.json().catch(function () { return {}; });
      var rawMsg = (errData && errData.error && errData.error.message) ? errData.error.message : ('HTTP ' + resp.status);
      lastStatus = resp.status;
      lastErrMsg = rawMsg;

      if (resp.status !== 404 && !/not found/i.test(rawMsg)) {
        return { ok: false, status: resp.status, errorMessage: rawMsg };
      }
    } catch (netErr) {
      try {
        var respSimple = await fetch(baseUrl + '?key=' + encodeURIComponent(cleanKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        if (respSimple.ok) {
          return { ok: true, data: await respSimple.json(), status: 200, usedVersion: ver };
        }
        var errDataS = await respSimple.json().catch(function () { return {}; });
        lastStatus = respSimple.status;
        lastErrMsg = (errDataS && errDataS.error && errDataS.error.message) ? errDataS.error.message : ('HTTP ' + respSimple.status);
      } catch (innerErr) {
        lastStatus = 0;
        lastErrMsg = innerErr.message || String(innerErr);
      }
    }
  }

  return { ok: false, status: lastStatus, errorMessage: lastErrMsg };
}

// ارسال هوشمند درخواست به گوگل با Fallback خودکار
async function fetchDirectGeminiWithFallback(apiKey, payload, preferredModel) {
  if (GEMINI_AVAILABLE_MODELS.length <= 3) {
    await discoverAccountModelsFromGoogle(apiKey);
  }

  var primaryModel = (preferredModel || getStoredGeminiModel() || 'gemini-3.8-flash').replace(/^models\//, '');
  var candidateModels = [primaryModel];

  for (var i = 0; i < GEMINI_AVAILABLE_MODELS.length; i++) {
    var mId = GEMINI_AVAILABLE_MODELS[i].id;
    if (candidateModels.indexOf(mId) === -1) {
      candidateModels.push(mId);
    }
  }

  var primaryError = null;

  for (var idx = 0; idx < candidateModels.length; idx++) {
    var modelToTry = candidateModels[idx];
    var res = await callGeminiModelEndpoint(apiKey, modelToTry, payload);

    if (res.ok) {
      return {
        ok: true,
        data: res.data,
        usedModel: modelToTry,
      };
    }

    if (idx === 0) {
      primaryError = new Error(translateGeminiErrorToPersian(res.errorMessage, res.status));
    }

    if (
      (res.status === 400 && /API_KEY_INVALID|key not valid/i.test(res.errorMessage)) ||
      (res.status === 403 && /location is not supported/i.test(res.errorMessage))
    ) {
      break;
    }
  }

  throw primaryError || new Error('هیچ‌یک از مدل‌های Gemini پاسخگو نبودند.');
}

// مدیریت کلید اختصاصی کاربر در حافظه محلی
function getStoredGeminiApiKey() {
  try {
    return (localStorage.getItem('nezam_gemini_api_key') || '').trim();
  } catch (e) {
    return '';
  }
}

function setStoredGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem('nezam_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('nezam_gemini_api_key');
    }
  } catch (e) {}
}

window.toggleGeminiKeyVisibility = function () {
  var inp = document.getElementById('gemini-custom-api-key');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

window.saveCustomGeminiKey = async function () {
  var inp = document.getElementById('gemini-custom-api-key');
  if (!inp) return;
  var key = inp.value.trim();
  if (!key) {
    alert('لطفاً ابتدا کلید اختصاصی Gemini API خود را در کادر وارد نمایید.');
    return;
  }
  setStoredGeminiApiKey(key);
  if (typeof showToastMsg === 'function') {
    showToastMsg('⏳ در حال استعلام مدل‌های فعال حساب شما از سرور گوگل...');
  }
  await testCustomGeminiKey();
};

window.clearCustomGeminiKey = function () {
  if (!confirm('آیا از حذف کلید ذخیره‌شده Gemini API اطمینان دارید؟')) return;
  setStoredGeminiApiKey('');
  var inp = document.getElementById('gemini-custom-api-key');
  if (inp) inp.value = '';
  var fb = document.getElementById('gemini-key-feedback');
  if (fb) fb.style.display = 'none';
  checkAiServerStatus();
  if (typeof showToastMsg === 'function') {
    showToastMsg('کلید Gemini پاک شد.');
  }
};

window.testCustomGeminiKey = async function () {
  ensureGeminiModelSelectorUI();
  var key = getStoredGeminiApiKey();
  var inp = document.getElementById('gemini-custom-api-key');
  if (inp && inp.value.trim()) {
    key = inp.value.trim();
  }

  var fb = document.getElementById('gemini-key-feedback');
  var pill = document.getElementById('gemini-key-status-pill');

  if (!key) {
    if (fb) {
      fb.className = 'small mt-2 alert alert-warning py-1 px-2';
      fb.style.display = 'block';
      fb.innerHTML = '⚠️ هنوز کلیدی وارد نشده است. لطفاً کلید دریافتی از Google AI Studio را درج نمایید.';
    }
    return false;
  }

  if (fb) {
    fb.className = 'small mt-2 alert alert-info py-1 px-2';
    fb.style.display = 'block';
    fb.innerHTML = '⏳ در حال فراخوانی <code>ModelService.ListModels</code> و دریافت لیست مدل‌های مجاز کلید شما...';
  }

  var directErrorMsg = '';

  try {
    var discoveredList = await discoverAccountModelsFromGoogle(key);

    var selEl = document.getElementById('gemini-model-select');
    var selectedModel = (selEl && selEl.value) ? selEl.value : getStoredGeminiModel();

    if (fb) {
      fb.innerHTML = '⏳ در حال تست ارسال پیام با مدل <code>' + escapeHtml(selectedModel) + '</code>...';
    }

    var testResult = await fetchDirectGeminiWithFallback(
      key,
      {
        contents: [{ parts: [{ text: 'سلام' }] }],
        generationConfig: { maxOutputTokens: 5 },
      },
      selectedModel
    );

    if (testResult && testResult.ok) {
      setStoredGeminiApiKey(key);
      var activeModel = testResult.usedModel || selectedModel;
      setStoredGeminiModel(activeModel);
      if (selEl) selEl.value = activeModel;

      var countText = discoveredList.length > 0 ? (' و ' + discoveredList.length + ' مدل رسمی در منو بارگذاری شد') : '';

      if (fb) {
        fb.className = 'small mt-2 alert alert-success py-2 px-3 fw-bold';
        fb.style.display = 'block';
        fb.innerHTML =
          '✅ اتصال به Google Gemini API با موفقیت برقرار شد! (مدل فعال: <code>' +
          escapeHtml(activeModel) +
          '</code>' +
          countText +
          ').';
      }
      if (pill) {
        pill.className = 'badge bg-success p-2';
        pill.innerHTML = '🟢 متصل (' + escapeHtml(activeModel) + ')';
      }
      aiOnlineStatus.isOnline = true;
      aiOnlineStatus.userKeyActive = true;
      aiOnlineStatus.model = activeModel;
      updateAiBadgeStatus(true);
      syncOcrUploadControlsUI();
      return true;
    }
  } catch (directErr) {
    directErrorMsg = directErr.message || String(directErr);
    console.warn('Direct Google API test error:', directErr);
  }

  if (fb) {
    fb.className = 'small mt-2 alert alert-danger py-2 px-3';
    fb.style.display = 'block';
    fb.innerHTML = '❌ <b>عدم برقراری ارتباط با Gemini API:</b><br>' + (directErrorMsg || 'ارتباط با سرور گوگل برقرار نشد.');
  }
  if (pill) {
    pill.className = 'badge bg-danger p-2';
    pill.innerHTML = '🔴 خطا در اتصال کلید';
  }
  aiOnlineStatus.isOnline = false;
  updateAiBadgeStatus(false);
  return false;
};

window.addEventListener('DOMContentLoaded', function () {
  ensureGeminiModelSelectorUI();
  checkAiServerStatus();
});

// بررسی مداوم برای اطمینان از وجود منوی انتخاب مدل و تنظیم فرمت‌های آپلود در تب‌های پویا
setInterval(function () {
  if (!document.getElementById('gemini-model-select')) {
    ensureGeminiModelSelectorUI();
  }
  syncOcrUploadControlsUI();
}, 2000);

// بررسی خودکار در دسترس بودن سرور آنلاین و کلید جمینای
async function checkAiServerStatus() {
  ensureGeminiModelSelectorUI();
  var userKey = getStoredGeminiApiKey();
  var currentModel = getStoredGeminiModel();
  aiOnlineStatus.model = currentModel;

  var inp = document.getElementById('gemini-custom-api-key');
  if (inp && userKey && !inp.value) {
    inp.value = userKey;
  }

  var pill = document.getElementById('gemini-key-status-pill');

  if (userKey) {
    aiOnlineStatus.isOnline = true;
    aiOnlineStatus.userKeyActive = true;
    if (pill) {
      pill.className = 'badge bg-success p-2';
      pill.innerHTML = '🟢 کلید اختصاصی فعال است (' + escapeHtml(currentModel) + ')';
    }
    updateAiBadgeStatus(true);
    discoverAccountModelsFromGoogle(userKey).then(function (models) {
      if (models && models.length > 0) {
        updateAiBadgeStatus(true);
      }
    });
    return;
  }

  if (isStaticHostEnvironment()) {
    aiOnlineStatus.isOnline = false;
    if (pill) {
      pill.className = 'badge bg-warning text-dark p-2';
      pill.innerHTML = '🟡 کلید تنظیم نشده';
    }
    updateAiBadgeStatus(false);
    return;
  }

  try {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 3000);

    var headers = { 'x-gemini-model': currentModel };
    if (userKey) headers['x-gemini-api-key'] = userKey;

    var res = await fetch('/api/ai/status', {
      signal: controller.signal,
      headers: headers,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      var data = await res.json();
      aiOnlineStatus.isOnline = Boolean(data.online && (data.hasApiKey || data.hasServerKey));
      aiOnlineStatus.model = getStoredGeminiModel() || data.model || 'gemini-3.8-flash';
      aiOnlineStatus.searchGrounding = Boolean(data.searchGrounding);
      aiOnlineStatus.checked = true;

      var selEl = document.getElementById('gemini-model-select');
      if (selEl) selEl.value = aiOnlineStatus.model;

      if (pill) {
        if (userKey) {
          pill.className = 'badge bg-success p-2';
          pill.innerHTML = '🟢 کلید اختصاصی متصل است (' + escapeHtml(aiOnlineStatus.model) + ')';
        } else if (data.hasServerKey) {
          pill.className = 'badge bg-primary p-2';
          pill.innerHTML = '🌐 متصل از طریق سرور مرکز (' + escapeHtml(aiOnlineStatus.model) + ')';
        } else {
          pill.className = 'badge bg-warning text-dark p-2';
          pill.innerHTML = '🟡 کلید تنظیم نشده (آماده درج)';
        }
      }
      updateAiBadgeStatus(aiOnlineStatus.isOnline);
    } else {
      aiOnlineStatus.isOnline = false;
      updateAiBadgeStatus(false);
    }
  } catch (e) {
    aiOnlineStatus.isOnline = false;
    updateAiBadgeStatus(false);
  }
}

function updateAiBadgeStatus(online) {
  var badge = document.getElementById('ai-connection-badge');
  var statusDesc = document.getElementById('ai-online-status-desc');
  var modeTag = document.getElementById('ai-chat-mode-tag');

  var hasCustomKey = Boolean(getStoredGeminiApiKey());
  var activeModel = aiOnlineStatus.model || getStoredGeminiModel();

  if (badge) {
    if (online) {
      badge.className = 'badge bg-success px-3 py-2 shadow-sm';
      badge.innerHTML = hasCustomKey
        ? '🟢 هوش مصنوعی آنلاین متصل (' + escapeHtml(activeModel) + ')'
        : '🌐 هوش مصنوعی آنلاین متصل (سرور مرکز ۶۳۶ - ' + escapeHtml(activeModel) + ')';
    } else {
      badge.className = 'badge bg-warning text-dark px-3 py-2 shadow-sm';
      badge.innerHTML = '🟡 موتور هوشمند آفلاین فعال (آماده بدون نیاز به اینترنت)';
    }
  }

  if (statusDesc) {
    if (online) {
      statusDesc.className = 'alert alert-success small mb-3 border-success';
      statusDesc.innerHTML =
        '✨ <b>هوش مصنوعی پیشرفته آنلاین متصل است:</b> مدل <code>' +
        escapeHtml(getModelDisplayLabel(activeModel)) +
        '</code> ' +
        (hasCustomKey ? 'با <b>کلید اختصاصی شما</b> ' : 'از طریق سرور مرکز ۶۳۶ ') +
        'فعال است. پشتیبانی کامل از خوانش تصویر، <b>PDF، KML/KMZ، GPX و اتوکد (DXF/DWG)</b> با استخراج چپ‌به‌راست مختصات <code>X,Y,Z,Zone</code>.';
    } else {
      statusDesc.className = 'alert alert-info small mb-3';
      statusDesc.innerHTML =
        '💡 <b>موتور هوشمند محلی (آفلاین):</b> استخراج نقاط از فایل‌های KML، KMZ، GPX، DXF و متن به صورت ۱۰۰٪ آفلاین با فرمت چپ‌به‌راست <code>X,Y,Z,39</code> فعال است. برای تحلیل تصویری و PDF، کلید Gemini API را وارد نمایید.';
    }
  }

  if (modeTag) {
    modeTag.className = online ? 'badge bg-success' : 'badge bg-secondary';
    modeTag.innerText = online
      ? (hasCustomKey ? 'آنلاین (' + activeModel + ')' : 'آنلاین (سرور مرکز)')
      : 'پاسخگوی آفلاین';
  }
}

// پایگاه دانش قوانین محلی مرکز ۶۳۶ (پشتیبان آفلاین)
var AI_KNOWLEDGE_BASE = [
  {
    keywords: ['گلخانه', 'صیفی', 'سبزی', 'سازه', 'اسپانیایی'],
    answer:
      'احداث گلخانه سبزی و صیفی در شهرستان خفر:\n• حداقل زمین مورد نیاز: ۳۰۰۰ متر مربع (سازه مفید حداقل ۱۰۰۰ متر مربع)\n• استعلام‌های الزامی: امور آب (تأمین ۵۰۰۰ لیتر آب در شبانه‌روز در هکتار)، شرکت گاز یا نفت، جهاد کشاورزی و محیط زیست.',
  },
  {
    keywords: ['قارچ', 'کمپوست'],
    answer:
      'پرورش قارچ خوراکی دکمه‌ای:\n• حداقل ظرفیت مجاز صدور پروانه: ۵۰ تن در سال\n• نیاز آبی: ۵۰۰ لیتر در شبانه‌روز\n• مدارک مورد نیاز: سند مالکیت یا اجاره‌نامه رسمی، کروکی UTM عرصه، آزمایش آب و تأییدیه نظام مهندسی.',
  },
  {
    keywords: ['گوسفند', 'بره', 'پرواری', 'داشتی'],
    answer:
      'دامپروری گوسفند و بره در خفر:\n• حداقل ظرفیت پرواربندی: ۱۰۰ رأس | حداقل مساحت زمین: ۱۲۰۰ متر مربع\n• گوسفند داشتی: حداقل ۵۰ رأس | زمین مورد نیاز: ۱۰۰۰ متر مربع\n• فواصل قانونی: رعایت حداقل حریم ۵۰۰ متری از مرز روستا و مراکز مسکونی طبق دستورالعمل نظام دامپروری.',
  },
  {
    keywords: ['گاو', 'شیری', 'گوساله'],
    answer:
      'گاوداری شیری و پرواری:\n• حداقل ظرفیت گوساله پرواری: ۵۰ رأس\n• حداقل ظرفیت گاو شیری: ۲۰ رأس مولد\n• الزامات: رعایت حریم راه، تأمین آب شرب استاندارد، حریم زیست‌محیطی و اخذ استعلام دامپزشکی.',
  },
  {
    keywords: ['مرغ', 'مرغداری', 'طیور', 'گوشتی', 'تخمگذار'],
    answer:
      'مرغداری گوشتی و تخم‌گذار:\n• حداقل ظرفیت گوشتی: ۲۰,۰۰۰ قطعه در دوره\n• حداقل مساحت عرصه: ۵۰۰۰ متر مربع\n• فواصل بهداشتی: حداقل ۱۰۰۰ متر از مرغداری‌های هم‌نوع و ۲۰۰۰ متر از کانون‌های جمعیتی و مزارع مرغ مادر.',
  },
  {
    keywords: ['داروخانه', 'گیاهپزشکی', 'سموم', 'کلینیک'],
    answer:
      'تأسیس داروخانه و کلینیک گیاهپزشکی در خفر:\n• شرایط متقاضی: کارشناس یا کارشناس ارشد گیاهپزشکی عضو سازمان نظام مهندسی با رتبه معتبر\n• چک‌لیست: فرم ۱۸ بندی بازرسی، سند یا اجاره‌نامه با کاربری تجاری/خدماتی، تهویه استاندارد، کپسول آتش‌نشانی و انبار ایمن سموم.',
  },
  {
    keywords: ['کروکی', 'utm', 'جی پی اس', 'ابعاد', 'زون'],
    answer:
      'ضوابط کروکی UTM مرکز ۶۳۶ خفر:\n• زون غالب شهرستان خفر: Zone 39R در نیمکره شمالی (بیضوی WGS84)\n• فرمت استاندارد نقاط: X,Y,Z,Zone (مثال چپ‌به‌راست: 645120,3198450,1150,39)\n• شیت چاپی کروکی به صورت خودکار در ۲ برگ تفکیک می‌شود.',
  },
];

// موتور آفلاین استخراج اطلاعات با عبارات باقاعده (همراه با فرمت X,Y,Z,Zone چپ‌به‌راست)
function localOfflineExtractFields(rawText) {
  var source = String(rawText || '');
  var clean = toEnglishDigits(source);
  var result = {
    name: '',
    nid: '',
    mobile: '',
    loc: '',
    land: '',
    count: '',
    mainGroup: '',
    actType: '',
    utm: '',
  };

  var nidMatch = clean.match(/(?:کد\s*ملی|ملی|شناسه)[:\s]*(\d{10,11})/) || clean.match(/\b(\d{10})\b/);
  if (nidMatch) result.nid = nidMatch[1];

  var phoneMatch = clean.match(/(09\d{9})/);
  if (phoneMatch) result.mobile = phoneMatch[1];

  var nameMatch = source.match(/(?:متقاضی|نام\s*و\s*نام\s*خانوادگی|نام|آقای|خانم|شرکت)[:\s]*([^\n،,\d]{3,35})/);
  if (nameMatch) result.name = nameMatch[1].trim();

  // فقط مساحتی که صریحاً در متن سند آمده است ثبت می‌شود.
  var landMatch = clean.match(/(?:مساحت|عرصه|متراژ|زمین)[:\s]*([0-9.,]+)/);
  if (landMatch) result.land = landMatch[1].replace(/,/g, '');

  var isLivestock = /دام|گوسفند|بره|بز|گاو|گوساله|شتر|طیور|مرغ|بوقلمون|شیلات|ماهی/i.test(source);
  var isClinic = /کلینیک|داروخانه|گیاهپزشکی|سموم/i.test(source);
  var isMushroom = /قارچ/i.test(source);
  var isGreenhouse = /گلخانه/i.test(source);

  if (isLivestock) {
    result.mainGroup = 'LIVESTOCK_POULTRY_FISHERIES';
    if (/گوسفند.*پرتولید|پرتولید.*گوسفند/i.test(source)) result.actType = 'sheep_high';
    else if (/بره.*پرواربندی|پرواربندی.*بره/i.test(source)) result.actType = 'lamb';
    else if (/بز.*(?:مولد|شیری)|(?:مولد|شیری).*بز/i.test(source)) result.actType = 'goat';
    else if (/گاو.*شیری|گاوداری.*شیری/i.test(source)) result.actType = 'cow';
    else if (/گوساله.*پرواربندی|پرواربندی.*گوساله/i.test(source)) result.actType = 'calf';
    else if (/شتر/i.test(source)) result.actType = 'camel';
    else if (/مرغ.*گوشتی|گوشتی.*مرغ/i.test(source)) result.actType = 'poultry_broiler';
    else if (/بوقلمون|شترمرغ|طیور.*خاص/i.test(source)) result.actType = 'poultry_turkey';
    else if (/قزل.?آلا|سردابی/i.test(source)) result.actType = 'fish_trout';
    else if (/گرمابی/i.test(source)) result.actType = 'fish_warm';
  } else if (isClinic) {
    result.mainGroup = 'CLINIC_PHARMACY';
    if (/شرکت.*(?:دفع آفات|ضدعفونی)|(?:دفع آفات|ضدعفونی).*شرکت/i.test(source)) {
      result.actType = 'pest_control_co';
    } else if (/داروخانه/i.test(source)) {
      result.actType = 'pharmacy';
    } else if (/کلینیک|گیاهپزشکی/i.test(source)) {
      result.actType = 'clinic_plant';
    }
  } else if (isMushroom || isGreenhouse) {
    result.mainGroup = 'GREENHOUSE_MUSHROOM';
    if (/قارچ.*صدفی|صدفی.*قارچ/i.test(source)) result.actType = 'mushroom_oyster';
    else if (isMushroom) result.actType = 'mushroom_button';
    else if (/گلخانه.*(?:گیاهان دارویی|دارویی)|(?:گیاهان دارویی|دارویی).*گلخانه/i.test(source)) result.actType = 'greenhouse_medicinal';
    else if (/گلخانه.*(?:گل|زینتی)|(?:گلخانه|گیاهان زینتی).*(?:گل|زینتی)/i.test(source)) result.actType = 'greenhouse_flower';
    else if (/گلخانه.*(?:سبزی|صیفی)|(?:سبزی|صیفی).*گلخانه/i.test(source)) result.actType = 'greenhouse_veg';
  }

  // زون فقط برای استخراج مختصات خفر به عنوان پیش‌فرض فنی استفاده می‌شود؛
  // هیچ مساحت، موقعیت یا نوع فعالیتی بدون قرینه به متقاضی تحمیل نمی‌شود.
  var formattedUtm = formatUtmCoordinatesLTR(clean, 39);
  if (formattedUtm) result.utm = formattedUtm;

  return result;
}

// نمایش وضعیت فایل غیرتصویری (PDF, KML, KMZ, GPX, CAD) در کادر پیش‌نمایش
function showNonImageFilePreviewBanner(fileName, ext, extraInfo) {
  var previewBox = document.getElementById('ai-ocr-preview-box');
  var previewImg = document.getElementById('ai-ocr-preview-img');
  if (!previewBox) return;

  previewBox.style.display = 'block';
  if (previewImg) {
    previewImg.style.display = 'none';
  }

  var badgeEl = document.getElementById('ai-file-info-banner');
  if (!badgeEl) {
    badgeEl = document.createElement('div');
    badgeEl.id = 'ai-file-info-banner';
    badgeEl.className = 'alert alert-primary small mb-0 text-center py-2 px-3';
    previewBox.appendChild(badgeEl);
  }
  badgeEl.style.display = 'block';
  badgeEl.innerHTML =
    '📂 <b>فایل بارگذاری شد:</b> <code dir="ltr">' +
    escapeHtml(fileName) +
    '</code> (' +
    escapeHtml(ext.toUpperCase()) +
    ')' +
    (extraInfo ? '<div class="mt-1 text-success fw-bold">' + extraInfo + '</div>' : '');
}

// خوانش فایل آپلود شده (تصویر، PDF، KML، KMZ، GPX، اتوکد DXF/DWG، CSV/TXT)
async function aiHandleImageSelect(input) {
  var file = input.files && input.files[0];
  if (!file) return;

  aiPendingFileName = file.name || 'document';
  var extMatch = aiPendingFileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  aiPendingFileExt = extMatch ? extMatch[1] : '';
  aiPendingParsedGisData = null;

  var previewBox = document.getElementById('ai-ocr-preview-box');
  var previewImg = document.getElementById('ai-ocr-preview-img');
  var bannerEl = document.getElementById('ai-file-info-banner');
  if (bannerEl) bannerEl.style.display = 'none';

  // ۱. فایل‌های نقشه‌برداری KML و GPX و متنی
  if (aiPendingFileExt === 'kml' || aiPendingFileExt === 'gpx' || aiPendingFileExt === 'csv' || aiPendingFileExt === 'txt') {
    var textReader = new FileReader();
    textReader.onload = function (e) {
      var rawContent = e.target.result || '';
      try {
        if (aiPendingFileExt === 'kml') {
          aiPendingParsedGisData = parseKmlContentToUtm(rawContent);
        } else if (aiPendingFileExt === 'gpx') {
          aiPendingParsedGisData = parseGpxContentToUtm(rawContent);
        } else {
          var utmStr = formatUtmCoordinatesLTR(rawContent, 39);
          aiPendingParsedGisData = {
            utmCoordinates: utmStr,
            pointCount: utmStr ? utmStr.split('\n').length : 0,
            fullSummary: 'استخراج از فایل متنی مختصات (' + aiPendingFileName + ')'
          };
        }

        aiPendingImageBase64 = 'GIS_PARSED_READY';
        var countMsg = aiPendingParsedGisData.pointCount > 0
          ? '✅ تعداد ' + aiPendingParsedGisData.pointCount + ' نقطه UTM با فرمت چپ‌به‌راست (X,Y,Z,39) آماده درج است.'
          : 'فایل آماده تحلیل است.';
        showNonImageFilePreviewBanner(aiPendingFileName, aiPendingFileExt, countMsg);

        // درج فوری در کادرها برای راحتی کاربر
        applyOcrDataToCase(aiPendingParsedGisData, document.getElementById('ai-raw-text-input'));
        if (typeof showToastMsg === 'function') {
          showToastMsg('✅ مختصات فایل ' + aiPendingFileExt.toUpperCase() + ' با فرمت (X,Y,Z,39) استخراج شد.');
        }
      } catch (err) {
        console.error('GIS Parse Error:', err);
      }
    };
    textReader.readAsText(file, 'UTF-8');
    return;
  }

  // ۲. فایل‌های فشرده گوگل ارث (KMZ)
  if (aiPendingFileExt === 'kmz') {
    var kmzReader = new FileReader();
    kmzReader.onload = async function (e) {
      try {
        var kmlText = await extractKmlTextFromKmzBuffer(e.target.result);
        aiPendingParsedGisData = parseKmlContentToUtm(kmlText);
        aiPendingImageBase64 = 'GIS_PARSED_READY';

        var countMsg = aiPendingParsedGisData.pointCount > 0
          ? '✅ تعداد ' + aiPendingParsedGisData.pointCount + ' نقطه UTM از بسته KMZ با فرمت (X,Y,Z,39) استخراج شد.'
          : 'بسته KMZ بازگشایی شد.';
        showNonImageFilePreviewBanner(aiPendingFileName, 'KMZ', countMsg);

        applyOcrDataToCase(aiPendingParsedGisData, document.getElementById('ai-raw-text-input'));
        if (typeof showToastMsg === 'function') {
          showToastMsg('✅ فایل KMZ بازگشایی و نقاط UTM (X,Y,Z,39) استخراج شد.');
        }
      } catch (kmzErr) {
        alert('خطا در بازگشایی فایل KMZ: ' + (kmzErr.message || kmzErr));
      }
    };
    kmzReader.readAsArrayBuffer(file);
    return;
  }

  // ۳. فایل‌های نقشه اتوکد (DXF / DWG)
  if (aiPendingFileExt === 'dxf' || aiPendingFileExt === 'dwg') {
    var cadReader = new FileReader();
    cadReader.onload = function (e) {
      try {
        aiPendingParsedGisData = parseAutoCadContentToUtm(e.target.result, aiPendingFileExt);
        aiPendingImageBase64 = 'GIS_PARSED_READY';

        var cadMsg = aiPendingParsedGisData.pointCount > 0
          ? '✅ تعداد ' + aiPendingParsedGisData.pointCount + ' رأس UTM از نقشه اتوکد با فرمت (X,Y,Z,39) استخراج شد.'
          : (aiPendingFileExt === 'dwg'
            ? '⚠️ فایل DWG باینری است؛ در صورت عدم استخراج همه نقاط، فایل را با فرمت DXF یا PDF ذخیره نمایید.'
            : 'فایل نقشه اتوکد بارگذاری شد.');
        showNonImageFilePreviewBanner(aiPendingFileName, aiPendingFileExt, cadMsg);

        if (aiPendingParsedGisData.pointCount > 0) {
          applyOcrDataToCase(aiPendingParsedGisData, document.getElementById('ai-raw-text-input'));
          if (typeof showToastMsg === 'function') {
            showToastMsg('✅ مختصات نقشه اتوکد با فرمت (X,Y,Z,39) استخراج شد.');
          }
        }
      } catch (cadErr) {
        console.error('CAD Parse Error:', cadErr);
      }
    };
    cadReader.readAsArrayBuffer(file);
    return;
  }

  // ۴. فایل‌های PDF و تصاویر (JPG, PNG, WEBP)
  aiPendingImageMime = file.type || (aiPendingFileExt === 'pdf' ? 'application/pdf' : 'image/jpeg');
  var reader = new FileReader();
  reader.onload = function (e) {
    aiPendingImageBase64 = e.target.result;
    if (aiPendingFileExt === 'pdf' || aiPendingImageMime === 'application/pdf') {
      aiPendingImageMime = 'application/pdf';
      showNonImageFilePreviewBanner(
        aiPendingFileName,
        'PDF',
        '📄 سند PDF آماده تحلیل و استخراج نقاط UTM (X,Y,Z,39) با هوش مصنوعی Gemini است.'
      );
    } else if (previewBox && previewImg) {
      previewImg.src = aiPendingImageBase64;
      previewImg.style.display = 'inline-block';
      previewBox.style.display = 'block';
    }
    if (typeof showToastMsg === 'function') {
      showToastMsg('📸 فایل بارگذاری شد. آماده تحلیل با هوش مصنوعی.');
    }
  };
  reader.readAsDataURL(file);
}

// خوانش و تحلیل هوشمند سند/نقشه با Gemini (تصویر، PDF، KML/KMZ، GPX، اتوکد)
async function aiReadDocumentImagePro() {
  var rawTextEl = document.getElementById('ai-raw-text-input');

  // اگر فایل نقشه‌برداری (KML, KMZ, GPX, DXF/DWG) قبلاً پردازش شده باشد
  if (aiPendingImageBase64 === 'GIS_PARSED_READY' && aiPendingParsedGisData) {
    var gisApplied = applyOcrDataToCase(aiPendingParsedGisData, rawTextEl);
    if (typeof showToastMsg === 'function') {
      showToastMsg(gisApplied.pointCount ? '✅ ' + gisApplied.pointCount + ' نقطه در جدول UTM پرونده درج شد.' : '⚠️ فایل پردازش شد اما نقطه قابل‌قبولی برای جدول شناسایی نشد.');
    }
    return;
  }

  if (!aiPendingImageBase64) {
    alert('لطفاً ابتدا یک فایل (تصویر، PDF، KML، KMZ، GPX یا نقشه اتوکد DXF) انتخاب نمایید.');
    return;
  }

  var userKey = getStoredGeminiApiKey();
  var selectedModel = getStoredGeminiModel();
  var btn = typeof event !== 'undefined' && event ? event.target : null;
  var originalBtnText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '⏳ در حال خوانش با ' + selectedModel + '...';

  if (typeof showToastMsg === 'function') {
    showToastMsg('⏳ در حال خوانش فایل و استخراج مختصات UTM (X,Y,Z,39) با مدل ' + selectedModel + '...');
  }

  if (userKey) {
    try {
      var cleanBase64 =
        aiPendingImageBase64.indexOf(',') !== -1
          ? aiPendingImageBase64.split(',')[1]
          : aiPendingImageBase64;

      var prompt =
        'شما کارشناس رسمی نقشه‌برداری و تشکیل پرونده مرکز خدمات کشاورزی ۶۳۶ خفر هستید. از تصویر یا سند، اطلاعات را به صورت JSON معتبر استخراج کن.\n' +
        'کلیدها: applicantName, nationalId, phoneNumber, planTitle, mainGroup, actType, landArea, capacity, location, utmCoordinates, geographicCoordinates, latitude, longitude, fullSummary.\n' +
        'قواعد قطعی مختصات:\n' +
        '۱) تمام ردیف‌های جدول مختصات و تمام رأس‌های قابل مشاهده را به ترتیب سند استخراج کن؛ هیچ نقطه‌ای را حذف یا جابه‌جا نکن.\n' +
        '۲) مختصات UTM را در utmCoordinates به شکل رشته متنی، هر نقطه یک خط، قالب X,Y,Z,Zone، ارقام انگلیسی و جداکننده کاما برگردان. X=Easting و Y=Northing است.\n' +
        '۳) مختصات جغرافیایی را نیز در geographicCoordinates با قالب Latitude,Longitude,Altitude، هر نقطه یک خط برگردان و نقطه اول را در latitude و longitude هم قرار بده.\n' +
        '۴) اگر سند فقط مختصات جغرافیایی دارد، آن‌ها را حفظ کن و مختصات UTM معادل را نیز در utmCoordinates تبدیل کن؛ زون خفر معمولاً 39 است.\n' +
        '۵) اگر هر دو نوع مختصات درج شده‌اند، هر دو را عیناً استخراج کن. اگر مختصات وجود ندارد رشته خالی بده و هرگز مختصات را حدس نزن.\n' +
        '۶) شماره ردیف، کد ملی، شماره نامه، تاریخ، ارتفاع و شماره زون را با X/Y یا Latitude/Longitude اشتباه نگیر.\n' +
        'نمونه UTM: 702150.25,3208450.50,1285,39\n' +
        'نمونه جغرافیایی: 28.971200,53.204500,1285\n' +
        'برای چند نقطه، هر نقطه را در خط جداگانه بنویس.';
      var directOcrResult = await fetchDirectGeminiWithFallback(
        userKey,
        {
          contents: [
            {
              parts: [
                { inlineData: { mimeType: aiPendingImageMime, data: cleanBase64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        },
        selectedModel
      );

      if (directOcrResult && directOcrResult.ok) {
        var dResult = directOcrResult.data;
        var responseParts = (dResult.candidates && dResult.candidates[0] &&
          dResult.candidates[0].content && Array.isArray(dResult.candidates[0].content.parts))
          ? dResult.candidates[0].content.parts : [];
        var rawJson = responseParts.map(function (part) {
          return part && typeof part.text === 'string' ? part.text : '';
        }).filter(Boolean).join('\n');
        var parsed = parseAiJsonResponse(rawJson);
        aiOnlineStatus.model = directOcrResult.usedModel || selectedModel;
        var ocrApplied = applyOcrDataToCase(parsed, rawTextEl);
        updateAiBadgeStatus(true);
        if (typeof showToastMsg === 'function') {
          showToastMsg(ocrApplied.pointCount ? '✅ ' + ocrApplied.pointCount + ' نقطه از سند با ' + aiOnlineStatus.model + ' در جدول UTM درج شد.' : '⚠️ سند خوانده شد اما مختصات قابل‌قبول در جدول درج نشد.');
        }
        if (btn) btn.innerHTML = originalBtnText;
        syncOcrUploadControlsUI();
        return;
      }
    } catch (dirOcrErr) {
      console.warn('Direct Google OCR failed:', dirOcrErr);
    }
  }

  if (!isStaticHostEnvironment()) {
    try {
      var headers = {
        'Content-Type': 'application/json',
        'x-gemini-model': selectedModel,
      };
      if (userKey) headers['x-gemini-api-key'] = userKey;

      var res = await fetch('/api/ai/ocr-extract', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          imageBase64: aiPendingImageBase64,
          mimeType: aiPendingImageMime,
          rawText: rawTextEl ? rawTextEl.value : '',
          apiKey: userKey,
          model: selectedModel,
        }),
      });

      if (res.ok) {
        var result = await res.json();
        if (result && result.success && result.data) {
          var serverApplied = applyOcrDataToCase(result.data, rawTextEl);
          updateAiBadgeStatus(!result.offlineFallback);
          if (typeof showToastMsg === 'function') {
            var pointSummary = serverApplied.pointCount
              ? serverApplied.pointCount + ' نقطه در جدول UTM درج شد.'
              : 'مختصات قابل‌قبولی در جدول UTM درج نشد.';
            showToastMsg(result.offlineFallback
              ? '⚠️ استخراج ابری انجام نشد؛ اطلاعات از متن موجود استخراج شده و باید دستی بازبینی شود. ' + pointSummary
              : (serverApplied.pointCount ? '✅ ' + pointSummary : '⚠️ سند خوانده شد اما ' + pointSummary));
          }
          if (btn) btn.innerHTML = originalBtnText;
          syncOcrUploadControlsUI();
          return;
        }
      }
    } catch (srvErr) {
      console.warn('Server OCR endpoint failed:', srvErr);
    }
  }

  var hasManualText = Boolean(rawTextEl && rawTextEl.value && rawTextEl.value.trim());
  if (!hasManualText) {
    if (typeof showToastMsg === 'function') {
      showToastMsg('⚠️ سرویس خوانش آنلاین در دسترس نیست. برای استخراج آفلاین، متن سند را در کادر متن وارد کنید.');
    }
    if (btn) btn.innerHTML = originalBtnText;
    syncOcrUploadControlsUI();
    return;
  }
  if (typeof showToastMsg === 'function') {
    showToastMsg('⚠️ ارتباط آنلاین برقرار نشد؛ فقط متن واردشده به‌صورت محلی بررسی می‌شود.');
  }
  aiExtractFromRawText();
  if (btn) btn.innerHTML = originalBtnText;
  syncOcrUploadControlsUI();
}

// درج نقاط در فرم و جدول پرونده؛ نمایش متری UTM همیشه پیش از جایگذاری فعال می‌شود.
function setUtmFieldValueAndSync(field,value){
  if(!field||!value)return 0;
  var rows=String(value).replace(/[\u200E\u200F\u202A-\u202E]/g,'').split(/\r?\n/).map(function(v){return v.trim();}).filter(Boolean);
  if(!rows.length)return 0;
  if(typeof window.setCoordInputMode==='function')window.setCoordInputMode('UTM');
  field.setAttribute('dir','ltr');field.style.direction='ltr';field.style.textAlign='left';field.style.fontFamily='Consolas, Monaco, monospace';
  field.value=rows.join('\n');
  try{var ev=typeof Event==='function'?new Event('input',{bubbles:true}):document.createEvent('Event');if(typeof Event!=='function')ev.initEvent('input',true,true);field.dispatchEvent(ev);}
  catch(error){if(typeof window.syncCaseTextareaToPointsTable==='function')window.syncCaseTextareaToPointsTable();}
  if(typeof window.syncCaseTextareaToPointsTable==='function')window.syncCaseTextareaToPointsTable();
  if(typeof window.renderCaseSegmentedPointsTable==='function')window.renderCaseSegmentedPointsTable();
  var first=rows[0].split(','),zone=first.length>=4?parseInt(String(first[3]).replace(/[^0-9]/g,''),10):39;
  var select=document.getElementById('case-pt-zone'),zoneValue=zone+'R';
  if(select&&zone>=1&&zone<=60&&Array.prototype.some.call(select.options,function(o){return o.value===zoneValue;}))select.value=zoneValue;
  return rows.length;
}

// تابع کمکی درج مشخصات استخراج‌شده در پرونده (با تضمین فرمت چپ‌به‌راست X,Y,Z,39 برای نقاط UTM)
function applyOcrDataToCase(d,rawTextEl){
  var coordinates=normalizeAiCoordinateData(d,rawTextEl?rawTextEl.value:'');
  if(rawTextEl){
    var shown=coordinates.utm?coordinates.utm.split('\n').map(function(line){return '\u200E'+line;}).join('\n'):'-';
    rawTextEl.value='=== استخراج هوشمند ('+(aiOnlineStatus.model||getStoredGeminiModel())+') ===\n'+
      '👤 متقاضی: '+(d.applicantName||'-')+'\n'+'🆔 کدملی: '+(d.nationalId||'-')+'\n'+
      '📱 تلفن: '+(d.phoneNumber||'-')+'\n'+'📋 موضوع طرح: '+(d.planTitle||'-')+'\n'+
      '📐 مساحت: '+(d.landArea||'-')+' مترمربع\n'+'📍 موقعیت: '+(d.location||'-')+'\n'+
      (coordinates.geographicText?'🌐 مختصات جغرافیایی (Latitude,Longitude):\n'+coordinates.geographicText+'\n':'')+
      '🗺️ نقاط UTM (X,Y,Z,Zone):\n'+shown+'\n'+(d.fullSummary?'\n📝 توضیحات:\n'+d.fullSummary:'');
  }
  if(d.applicantName&&document.getElementById('c-name'))document.getElementById('c-name').value=d.applicantName;
  if(d.nationalId&&document.getElementById('c-nid'))document.getElementById('c-nid').value=typeof toFa==='function'?toFa(d.nationalId):d.nationalId;
  if(d.phoneNumber&&document.getElementById('c-mobile'))document.getElementById('c-mobile').value=typeof toFa==='function'?toFa(d.phoneNumber):d.phoneNumber;
  if(d.location&&document.getElementById('c-loc'))document.getElementById('c-loc').value=d.location;
  // گروه و نوع فعالیت فقط وقتی با هم و با کلید معتبر تشخیص داده شده‌اند تغییر می‌کنند.
  if(d.mainGroup&&d.actType&&document.getElementById('c-main-group')){
    document.getElementById('c-main-group').value=d.mainGroup;
    if(typeof onMainGroupChangedInForm==='function')onMainGroupChangedInForm();
    var recognizedAct=document.getElementById('c-act-type');
    if(recognizedAct)recognizedAct.value=d.actType;
    if(typeof recalcCaseSpecsFromHeadcount==='function')recalcCaseSpecsFromHeadcount();
  }
  if(d.landArea&&document.getElementById('c-land'))document.getElementById('c-land').value=typeof toFa==='function'?toFa(d.landArea):d.landArea;
  var field=document.getElementById('c-utm'),pointCount=field&&coordinates.utm?setUtmFieldValueAndSync(field,coordinates.utm):0;
  return{pointCount:pointCount,utm:coordinates.utm,geographicText:coordinates.geographicText};
}

// استخراج فیلدها از متن خام و ثبت در فرم متقاضی (با فرمت چپ‌به‌راست X,Y,Z,39)
function aiExtractFromRawText(){
  var raw=(document.getElementById('ai-raw-text-input')||{}).value||'';
  if(!raw.trim()){alert('لطفاً ابتدا متن سند یا ردیف‌های مختصات را وارد کنید.');return{pointCount:0};}
  var data=localOfflineExtractFields(raw);
  if(data.name&&document.getElementById('c-name'))document.getElementById('c-name').value=data.name;
  if(data.nid&&document.getElementById('c-nid'))document.getElementById('c-nid').value=typeof toFa==='function'?toFa(data.nid):data.nid;
  if(data.mobile&&document.getElementById('c-mobile'))document.getElementById('c-mobile').value=typeof toFa==='function'?toFa(data.mobile):data.mobile;
  if(data.loc&&document.getElementById('c-loc'))document.getElementById('c-loc').value=data.loc;
  // از انتخاب خودکار فعالیت اول فهرست در زمان تشخیص مبهم جلوگیری می‌شود.
  if(data.mainGroup&&data.actType&&document.getElementById('c-main-group')){
    document.getElementById('c-main-group').value=data.mainGroup;
    if(typeof onMainGroupChangedInForm==='function')onMainGroupChangedInForm();
    var recognizedAct=document.getElementById('c-act-type');
    if(recognizedAct)recognizedAct.value=data.actType;
    if(typeof recalcCaseSpecsFromHeadcount==='function')recalcCaseSpecsFromHeadcount();
  }
  if(data.land&&document.getElementById('c-land'))document.getElementById('c-land').value=typeof toFa==='function'?toFa(data.land):data.land;
  if(typeof switchMainPane==='function')switchMainPane('pane-cases');
  if(typeof switchCaseSubTab==='function')switchCaseSubTab('sub-info');
  var field=document.getElementById('c-utm'),pointCount=field&&data.utm?setUtmFieldValueAndSync(field,data.utm):0;
  if(typeof showToastMsg==='function'){
    if(pointCount)showToastMsg('✅ '+pointCount+' نقطه شناسایی و در جدول UTM پرونده درج شد.');
    else showToastMsg('⚠️ مشخصات استخراج شد، اما نقطه UTM معتبری شناسایی نشد؛ متن مختصات و قالب آن را بررسی کنید.');
  }
  return{pointCount:pointCount,utm:data.utm||''};
}

function aiRunFullAutopilotPipeline() {
  aiExtractFromRawText();
  setTimeout(function () {
    if (typeof window.syncCaseTextareaToPointsTable === 'function') {
      window.syncCaseTextareaToPointsTable();
    }
    if (typeof saveActiveCaseChanges === 'function') {
      saveActiveCaseChanges(true);
    }
  }, 350);
}

// چت‌بات آنلاین با پشتیبانی از کلیدهای AQ. و AIza و تمامی مدل‌های Gemini
async function aiSendChatMessage() {
  var input = document.getElementById('ai-chat-input');
  var history = document.getElementById('ai-chat-history');
  if (!input || !history) return;
  var q = input.value.trim();
  if (!q) return;

  // ارسال خلاصه پرونده به Gemini فقط با رضایت صریح کاربر از طریق چک‌باکس.
  var promptForModel = q;
  try {
    var contextToggle = document.getElementById('ai-case-context-toggle');
    if (contextToggle && contextToggle.checked && typeof window.buildNezam636AIContext === 'function') {
      var caseContext = window.buildNezam636AIContext();
      if (caseContext) {
        promptForModel += '\\n\\n--- خلاصه پرونده فعال مرکز ۶۳۶ (فقط برای همین درخواست) ---\\n' +
          caseContext + '\\n--- پایان خلاصه پرونده ---';
      }
    }
  } catch (contextError) {
    console.warn('Nezam636 AI context could not be prepared:', contextError);
  }

  var userDiv = document.createElement('div');
  userDiv.className = 'p-2 mb-2 rounded bg-primary text-white text-end shadow-sm';
  userDiv.innerHTML = '<b>شما:</b> ' + escapeHtml(q);
  history.appendChild(userDiv);
  input.value = '';
  history.scrollTop = history.scrollHeight;

  var userKey = getStoredGeminiApiKey();
  var selectedModel = getStoredGeminiModel();

  var botLoadingDiv = document.createElement('div');
  botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-secondary small';
  botLoadingDiv.innerHTML = '🤖 <i>در حال ارتباط و دریافت پاسخ از مدل <code>' + escapeHtml(selectedModel) + '</code>...</i>';
  history.appendChild(botLoadingDiv);
  history.scrollTop = history.scrollHeight;

  if (userKey) {
    try {
      var directContents = [];
      if (Array.isArray(aiChatHistoryBuffer)) {
        for (var hi = 0; hi < aiChatHistoryBuffer.length; hi++) {
          var hItem = aiChatHistoryBuffer[hi];
          directContents.push({
            role: hItem.role === 'user' ? 'user' : 'model',
            parts: [{ text: hItem.text || '' }],
          });
        }
      }
      directContents.push({
        role: 'user',
        parts: [{ text: promptForModel }],
      });

      var directChatResult = await fetchDirectGeminiWithFallback(
        userKey,
        {
          contents: directContents,
          systemInstruction: {
            parts: [
              {
                text: 'شما مشاور و کارشناس رسمی نظام مهندسی کشاورزی ۶۳۶ شهرستان خفر استان فارس هستید. پاسخ دقیق و فارسی بدهید. درباره قوانین و ضوابط جاری از جستجوی وب و منابع معتبر استفاده کنید؛ اگر منبع معتبر در دسترس نیست، عدم قطعیت را روشن اعلام کنید و حدنصاب، فاصله یا الزام قانونی را حدس نزنید.',
              },
            ],
          },
          tools: [{ googleSearch: {} }],
        },
        selectedModel
      );

      if (directChatResult && directChatResult.ok) {
        var directData = directChatResult.data;
        var activeChatModel = directChatResult.usedModel || selectedModel;
        var candidate = directData.candidates && directData.candidates[0];
        var candidateParts = candidate && candidate.content && Array.isArray(candidate.content.parts)
          ? candidate.content.parts : [];
        var candidateText = candidateParts.map(function (part) {
          return part && typeof part.text === 'string' ? part.text : '';
        }).filter(Boolean).join('\n');
        var directGroundingChunks = candidate && candidate.groundingMetadata &&
          Array.isArray(candidate.groundingMetadata.groundingChunks)
          ? candidate.groundingMetadata.groundingChunks : [];
        var directSourcesHtml = '';
        if (directGroundingChunks.length) {
          var directSourceLinks = directGroundingChunks.map(function (chunk) {
            if (!chunk || !chunk.web || !chunk.web.uri) return '';
            var title = chunk.web.title || chunk.web.uri;
            return '<a href="' + escapeHtml(chunk.web.uri) +
              '" target="_blank" rel="noopener noreferrer" class="badge bg-light text-primary border me-1 my-1">' +
              '🔗 ' + escapeHtml(title) + '</a>';
          }).filter(Boolean);
          if (directSourceLinks.length) {
            directSourcesHtml = '<div class="mt-2 pt-2 border-top small text-muted"><b>منابع جستجوی وب:</b> ' +
              directSourceLinks.join(' ') + '</div>';
          }
        }

        if (candidateText) {
          aiOnlineStatus.model = activeChatModel;
          setStoredGeminiModel(activeChatModel);
          var selEl = document.getElementById('gemini-model-select');
          if (selEl) selEl.value = activeChatModel;

          aiChatHistoryBuffer.push({ role: 'user', text: q });
          aiChatHistoryBuffer.push({ role: 'model', text: candidateText });
          var directFmtText = formatMarkdownToHtml(candidateText);

          botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-dark shadow-sm';
          botLoadingDiv.innerHTML =
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<b class="text-success">🤖 کارشناس هوشمند مرکز ۶۳۶ (' + escapeHtml(activeChatModel) + '):</b>' +
            '<span class="badge ' + (directGroundingChunks.length ? 'bg-success-subtle text-success' : 'bg-light text-secondary') +
            ' border" style="font-size:10px;">' + (directGroundingChunks.length ? '🔎 جستجوی وب و منبع' : 'پاسخ بدون منبع برخط') + '</span>' +
            '</div>' +
            directFmtText +
            directSourcesHtml;

          history.scrollTop = history.scrollHeight;
          updateAiBadgeStatus(true);
          return;
        }
      }
    } catch (dirErr) {
      console.warn('Direct Google Gemini API chat failed:', dirErr);
    }
  }

  if (!isStaticHostEnvironment()) {
    try {
      var headers = {
        'Content-Type': 'application/json',
        'x-gemini-model': selectedModel,
      };
      if (userKey) headers['x-gemini-api-key'] = userKey;

      var res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: promptForModel,
          history: aiChatHistoryBuffer,
          apiKey: userKey,
          model: selectedModel,
          useSearch: true,
        }),
      });

      if (res.ok) {
        var data = await res.json();
        if (data && data.text) {
          aiChatHistoryBuffer.push({ role: 'user', text: q });
          aiChatHistoryBuffer.push({ role: 'model', text: data.text });

          var formattedText = formatMarkdownToHtml(data.text);
          var modelUsed = data.model || selectedModel;

          var sourcesHtml = '';
          if (data.groundingChunks && data.groundingChunks.length > 0) {
            var links = [];
            for (var i = 0; i < data.groundingChunks.length; i++) {
              var chunk = data.groundingChunks[i];
              if (chunk && chunk.web && chunk.web.uri) {
                var title = chunk.web.title || chunk.web.uri;
                links.push(
                  '<a href="' +
                    escapeHtml(chunk.web.uri) +
                    '" target="_blank" rel="noopener noreferrer" class="badge bg-light text-primary text-truncate border me-1 my-1 d-inline-block" style="max-width:240px;" title="' +
                    escapeHtml(title) +
                    '">🔗 ' +
                    escapeHtml(title) +
                    '</a>'
                );
              }
            }
            if (links.length > 0) {
              sourcesHtml =
                '<div class="mt-2 pt-2 border-top small text-muted">' +
                '<div class="fw-bold mb-1">🔍 منابع مستند و جستجوی برخط ضوابط:</div>' +
                links.join(' ') +
                '</div>';
            }
          }

          botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-dark shadow-sm';
          botLoadingDiv.innerHTML =
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<b class="text-success">🤖 کارشناس هوشمند مرکز ۶۳۶ (' + escapeHtml(modelUsed) + '):</b>' +
            '<span class="badge ' + (data.groundingChunks && data.groundingChunks.length ? 'bg-success-subtle text-success' : (data.fallback ? 'bg-warning-subtle text-warning' : 'bg-light text-secondary')) +
            ' border" style="font-size:10px;">' +
            (data.groundingChunks && data.groundingChunks.length ? '🔎 منابع جستجوی وب' : (data.fallback ? 'پاسخ پشتیبان محلی' : 'بدون منبع برخط')) +
            '</span>' +
            '</div>' +
            formattedText +
            sourcesHtml;

          history.scrollTop = history.scrollHeight;
          updateAiBadgeStatus(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Server chat endpoint failed:', err);
    }
  }

  var respText = '';
  var qLower = q.toLowerCase();
  for (var kIdx = 0; kIdx < AI_KNOWLEDGE_BASE.length; kIdx++) {
    var item = AI_KNOWLEDGE_BASE[kIdx];
    for (var k = 0; k < item.keywords.length; k++) {
      if (qLower.indexOf(item.keywords[k]) !== -1) {
        respText = item.answer;
        break;
      }
    }
    if (respText) break;
  }

  if (!respText) {
    respText =
      'در مرکز خدمات کشاورزی ۶۳۶ خفر، پرونده‌ها در ۳ گروه اصلی (۱. گلخانه و قارچ، ۲. دام و طیور و شیلات، ۳. کلینیک و داروخانه گیاهپزشکی) رسیدگی می‌شوند. برای پاسخ دقیق، کلیدواژه طرح خود (مثل گوسفند، گلخانه، قارچ یا داروخانه) را قید بفرمایید یا اتصال اینترنت و کلید Gemini را بررسی کنید.';
  }

  botLoadingDiv.className = 'p-2 mb-2 rounded bg-white border text-dark shadow-sm';
  botLoadingDiv.innerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-1">' +
    '<b class="text-secondary">🤖 مشاور فنی مرکز ۶۳۶ (موتور آفلاین):</b>' +
    '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle" style="font-size:10px;">🟡 حالت آفلاین</span>' +
    '</div>' +
    respText.replace(/\n/g, '');

  history.scrollTop = history.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdownToHtml(md) {
  if (!md) return '';
  var html = escapeHtml(md);
  html = html.replace(/^### (.*$)/gim, '<h6 class="fw-bold text-success mt-2 mb-1">$1</h6>');
  html = html.replace(/^## (.*$)/gim, '<h5 class="fw-bold text-primary mt-2 mb-1">$1</h6>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>');
  html = html.replace(/^\s*[-*•]\s+(.*$)/gim, '<li class="me-3">$1</li>');
  html = html.replace(/\n/g, '');
  return html;
}
