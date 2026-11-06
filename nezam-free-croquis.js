/* Independent UTM mapping workspace for Nezam636 */
(function () {
  "use strict";
  var KEY = "nezam636_free_croquis_maps_v1";
  var originalGetMap = window.getActiveCroquisMap;
  var originalInit = window.initCroquisWorkspaceForActiveCase;
  var originalCreate = window.createNewCroquisMapForCase;
  var originalDelete = window.deleteCurrentCroquisMap;
  var originalSample = window.loadSample10HectareGreenhouseMap;
  var originalPrint = window.printUtmSketchSheet;
  var originalSave = window.saveAllDB;
  var originalSwitch = window.switchMainPane;
  var maps = [];
  var caseMapId = "";

  function readMaps() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || "[]");
      maps = Array.isArray(value) ? value.filter(function (m) { return m && m.id && Array.isArray(m.layers); }) : [];
    } catch (e) { maps = []; console.warn("Free map archive read failed", e); }
    return maps;
  }
  function saveMaps() {
    try { localStorage.setItem(KEY, JSON.stringify(maps)); return true; }
    catch (e) {
      if (typeof showToastMsg === "function") showToastMsg("ذخیره نقشه آزاد ناموفق بود؛ فضای ذخیره‌سازی مرورگر را بررسی کنید.", true);
      console.error("Free map archive write failed", e); return false;
    }
  }
  function makeMap(title) {
    var id = "FREE-MAP-" + Date.now();
    return {
      id: id, title: title || ("نقشه آزاد " + (maps.length + 1)),
      date: typeof todayShamsi === "function" ? todayShamsi() : new Date().toLocaleDateString("fa-IR"),
      utmZone: "39R", hemisphere: "N", notes: "", independent: true,
      layers: [{
        id: "FREE-LYR-" + Date.now(), name: "محدوده اصلی زمین", category: "MAIN_PARCEL",
        geomType: "POLYGON", color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.18,
        strokeWidth: 3, visible: true, order: 1, desc: "محدوده ترسیم‌شده در نقشه‌برداری آزاد", points: []
      }]
    };
  }
  function xml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c];
    });
  }
  function modeUI() {
    var free = window.__nezamCroquisFreeMode === true;
    var cb = document.getElementById("btn-crq-mode-case"), fb = document.getElementById("btn-crq-mode-free");
    if (cb) cb.className = "btn btn-sm " + (!free ? "btn-success" : "btn-outline-success");
    if (fb) fb.className = "btn btn-sm " + (free ? "btn-primary" : "btn-outline-primary");
    var label = document.querySelector('label[for="crq-map-select"]');
    if (label) label.textContent = free ? "انتخاب نقشه مستقل ذخیره‌شده:" : "انتخاب نقشه کروکی از داخل پرونده متقاضی فعال:";
    var create = document.querySelector('#pane-croquis button[onclick="createNewCroquisMapForCase()"]');
    if (create) create.textContent = free ? "＋ نقشه آزاد جدید" : "＋ نقشه جدید برای پرونده";
    var badge = document.getElementById("crq-workspace-mode-badge");
    if (badge) badge.textContent = free ? "نقشه‌برداری مستقل؛ بدون اتصال به پرونده" : "کروکی متصل به پرونده فعال";
  }

  window.__nezamCroquisFreeMode = false;
  readMaps();

  window.setCroquisWorkspaceMode = function (mode) {
    if (mode === "CASE") {
      if (typeof getActiveCase !== "function" || !getActiveCase()) {
        if (typeof requireActiveCase === "function") requireActiveCase("ورود به کروکی متصل به پرونده", function () {
          window.__nezamCroquisFreeMode = false;
          if (caseMapId) activeCroquisMapId = caseMapId;
          activeCroquisLayerId = ""; modeUI(); window.initCroquisWorkspaceForActiveCase();
        });
        return;
      }
      window.__nezamCroquisFreeMode = false;
      if (caseMapId) activeCroquisMapId = caseMapId;
      activeCroquisLayerId = ""; modeUI(); window.initCroquisWorkspaceForActiveCase(); return;
    }
    if (window.__nezamCroquisFreeMode !== true && typeof getActiveCase === "function" && getActiveCase()) caseMapId = activeCroquisMapId || "";
    window.__nezamCroquisFreeMode = true;
    readMaps();
    if (!maps.length) {
      var first = makeMap("نقشه آزاد ۱"); maps.unshift(first);
      activeCroquisMapId = first.id; activeCroquisLayerId = first.layers[0].id; saveMaps();
    } else if (!maps.some(function (m) { return m.id === activeCroquisMapId; })) {
      activeCroquisMapId = maps[0].id; activeCroquisLayerId = "";
    }
    modeUI(); window.initCroquisWorkspaceForActiveCase();
  };

  window.openCroquisWorkspace = function () {
    if (typeof getActiveCase !== "function" || !getActiveCase()) window.setCroquisWorkspaceMode("FREE");
    else if (window.__nezamCroquisFreeMode !== true) window.setCroquisWorkspaceMode("CASE");
    if (typeof originalSwitch === "function") originalSwitch("pane-croquis");
  };

  window.getActiveCroquisMap = function () {
    if (window.__nezamCroquisFreeMode === true) {
      for (var i = 0; i < maps.length; i++) if (maps[i].id === activeCroquisMapId) return maps[i];
      if (maps.length) { activeCroquisMapId = maps[0].id; return maps[0]; }
      return null;
    }
    return originalGetMap ? originalGetMap() : null;
  };

  window.initCroquisWorkspaceForActiveCase = function () {
    if (window.__nezamCroquisFreeMode !== true) { modeUI(); if (originalInit) return originalInit(); return; }
    readMaps();
    var m = window.getActiveCroquisMap(), sel = document.getElementById("crq-map-select");
    if (sel) {
      sel.innerHTML = maps.map(function (item) {
        return '<option value="' + xml(item.id) + '"' + (m && item.id === m.id ? " selected" : "") + ">" +
          xml(item.title || "نقشه بدون عنوان") + " (" + xml(item.date || "") + ")</option>";
      }).join("");
      sel.disabled = !maps.length;
    }
    modeUI();
    if (!m) {
      var holder = document.getElementById("crq-layers-list-holder"), canvas = document.getElementById("crq-cad-svg-container");
      var legend = document.getElementById("crq-legend-box");
      if (holder) holder.innerHTML = '<div class="alert alert-info">هنوز نقشه مستقلی ذخیره نشده است.</div>';
      if (canvas) canvas.innerHTML = ""; if (legend) legend.innerHTML = ""; return;
    }
    var zone = document.getElementById("crq-zone-select"), notes = document.getElementById("crq-map-notes");
    if (zone) zone.value = /^(38R|39R|40R|41R)$/.test(m.utmZone || "") ? m.utmZone : "39R";
    if (notes) notes.value = m.notes || "";
    renderCroquisLayersList(); loadActiveLayerIntoEditor(); renderCroquisVisualCanvas();
  };

  window.selectCroquisMapById = function (id) { activeCroquisMapId = id || ""; activeCroquisLayerId = ""; window.initCroquisWorkspaceForActiveCase(); };

  window.createNewCroquisMapForCase = function () {
    if (window.__nezamCroquisFreeMode !== true) { if (originalCreate) return originalCreate(); return; }
    var title = prompt("عنوان نقشه مستقل را وارد نمایید:", "نقشه آزاد " + (maps.length + 1));
    if (!title || !title.trim()) return;
    var m = makeMap(title.trim()); maps.unshift(m); activeCroquisMapId = m.id; activeCroquisLayerId = m.layers[0].id;
    saveMaps(); window.initCroquisWorkspaceForActiveCase();
    if (typeof showToastMsg === "function") showToastMsg("نقشه مستقل در آرشیو جداگانه ذخیره شد.");
  };

  window.deleteCurrentCroquisMap = function () {
    if (window.__nezamCroquisFreeMode !== true) { if (originalDelete) return originalDelete(); return; }
    var m = window.getActiveCroquisMap(); if (!m) return;
    if (!confirm("نقشه مستقل «" + (m.title || "") + "» و تمام لایه‌های آن حذف شود؟")) return;
    maps = maps.filter(function (item) { return item.id !== m.id; });
    activeCroquisMapId = maps.length ? maps[0].id : ""; activeCroquisLayerId = "";
    saveMaps(); window.initCroquisWorkspaceForActiveCase();
  };

  window.loadSample10HectareGreenhouseMap = function () {
    if (window.__nezamCroquisFreeMode !== true) { if (originalSample) return originalSample(); return; }
    if (typeof DEFAULT_UNIFIED_CASES === "undefined" || !DEFAULT_UNIFIED_CASES[0] || !DEFAULT_UNIFIED_CASES[0].croquisMaps || !DEFAULT_UNIFIED_CASES[0].croquisMaps[0]) return;
    var sample = JSON.parse(JSON.stringify(DEFAULT_UNIFIED_CASES[0].croquisMaps[0]));
    sample.id = "FREE-SAMPLE-" + Date.now(); sample.title = "الگوی نمونه زمین ۱۰ هکتاری و طرح گلخانه";
    sample.date = typeof todayShamsi === "function" ? todayShamsi() : sample.date; sample.independent = true;
    maps.unshift(sample); activeCroquisMapId = sample.id; activeCroquisLayerId = sample.layers[0] ? sample.layers[0].id : "";
    saveMaps(); window.initCroquisWorkspaceForActiveCase();
  };

  window.editCurrentCroquisMapMeta = function () {
    var m = window.getActiveCroquisMap(); if (!m) return;
    var title = prompt("عنوان نقشه:", m.title || ""); if (title && title.trim()) m.title = title.trim();
    var notes = document.getElementById("crq-map-notes"), zone = document.getElementById("crq-zone-select");
    if (notes) m.notes = notes.value.trim(); if (zone) m.utmZone = zone.value;
    if (window.__nezamCroquisFreeMode === true) saveMaps(); else if (originalSave) originalSave();
    window.initCroquisWorkspaceForActiveCase();
  };

  window.saveAllDB = function () {
    var result = originalSave ? originalSave.apply(this, arguments) : true;
    if (window.__nezamCroquisFreeMode === true) saveMaps();
    return result;
  };

  window.exportActiveCroquisKml = function () {
    var m = window.getActiveCroquisMap();
    if (!m) { if (typeof showToastMsg === "function") showToastMsg("ابتدا یک نقشه انتخاب کنید.", true); return; }
    var marks = [];
    (m.layers || []).forEach(function (layer) {
      if (!layer || !Array.isArray(layer.points) || !layer.points.length) return;
      var coords = layer.points.map(function (pt, i) {
        if (typeof ensurePointEnriched === "function") ensurePointEnriched(pt, m.utmZone || "39R", i);
        var lng = Number(pt.lng), lat = Number(pt.lat), alt = Number(pt.elev || 0);
        return isFinite(lng) && isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90 ? lng + "," + lat + "," + alt : "";
      }).filter(Boolean);
      var geometry = "";
      if (layer.geomType === "POLYGON" && coords.length >= 3) {
        if (coords[0] !== coords[coords.length - 1]) coords.push(coords[0]);
        geometry = "<Polygon><outerBoundaryIs><LinearRing><coordinates>" + coords.join(" ") + "</coordinates></LinearRing></outerBoundaryIs></Polygon>";
      } else if (layer.geomType === "LINE" && coords.length >= 2) {
        geometry = "<LineString><coordinates>" + coords.join(" ") + "</coordinates></LineString>";
      } else geometry = coords.map(function (c) { return "<Point><coordinates>" + c + "</coordinates></Point>"; }).join("");
      if (geometry) marks.push("<Placemark><name>" + xml(layer.name) + "</name>" + geometry + "</Placemark>");
    });
    if (!marks.length) { if (typeof showToastMsg === "function") showToastMsg("برای خروجی KML حداقل یک نقطه معتبر لازم است.", true); return; }
    var kml = '<?xml version="1.0" encoding="UTF-8"?>' + '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' +
      xml(m.title) + "</name>" + marks.join("") + "</Document></kml>";
    var blob = new Blob([kml], {type:"application/vnd.google-earth.kml+xml;charset=utf-8"}), url = URL.createObjectURL(blob);
    var link = document.createElement("a"); link.href = url; link.download = (m.title || "utm-map").replace(/[\\/:*?"<>|]+/g, "_") + ".kml";
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  window.printUtmSketchSheet = function () {
    if (window.__nezamCroquisFreeMode !== true) { if (originalPrint) return originalPrint.apply(this, arguments); return; }
    var m = window.getActiveCroquisMap();
    if (!m) { if (typeof showToastMsg === "function") showToastMsg("ابتدا یک نقشه مستقل ایجاد یا انتخاب کنید.", true); return; }
    var previousId = activeCaseId, tempId = "__NEZAM636_FREE_MAP_PRINT__";
    var temp = {id:tempId,name:"نقشه‌برداری مستقل",nid:"—",code:"بدون پرونده",project:m.title || "نقشه مستقل",cap:"—",land:"",landParcel:"",water:"",loc:"موقعیت مستقل؛ بدون اتصال به پرونده",utm:"",customFields:[],croquisMaps:[]};
    var inserted = false;
    try {
      if (typeof casesDB !== "undefined" && Array.isArray(casesDB)) { casesDB.push(temp); inserted = true; }
      activeCaseId = tempId;
      return originalPrint ? originalPrint.apply(this, arguments) : undefined;
    } finally {
      activeCaseId = previousId;
      if (inserted) { var ix = casesDB.indexOf(temp); if (ix >= 0) casesDB.splice(ix, 1); }
    }
  };

  function bindMeta() {
    var notes = document.getElementById("crq-map-notes"), zone = document.getElementById("crq-zone-select");
    if (notes) notes.onchange = function () { var m = window.getActiveCroquisMap(); if (!m) return; m.notes = notes.value.trim(); if (window.__nezamCroquisFreeMode) saveMaps(); else if (originalSave) originalSave(); };
    if (zone) zone.onchange = function () { var m = window.getActiveCroquisMap(); if (!m) return; m.utmZone = zone.value; if (window.__nezamCroquisFreeMode) saveMaps(); else if (originalSave) originalSave(); renderCroquisLayersList(); renderCroquisVisualCanvas(); };
  }
  document.addEventListener("DOMContentLoaded", bindMeta); bindMeta();

  if (typeof originalSwitch === "function") {
    window.switchMainPane = function (paneId) {
      if (paneId === "pane-croquis" && (typeof getActiveCase !== "function" || !getActiveCase())) window.__nezamCroquisFreeMode = true;
      return originalSwitch.apply(this, arguments);
    };
  }
  modeUI();
})();