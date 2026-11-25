/* Nezam 636 — Offline CAD toolbar parity with online Google Earth croquis tools */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var state = {
    mode: "",
    draft: [],
    pointer: null,
    dragPreview: null,
    gpsPoint: null,
    targetLayerId: null,
    pointReplace: false,
    initialized: false
  };

  function activeMap() {
    return typeof getActiveCroquisMap === "function" ? getActiveCroquisMap() : null;
  }
  function activeLayer() {
    return typeof getActiveCroquisLayer === "function" ? getActiveCroquisLayer() : null;
  }
  function layerById(map, id) {
    return map && Array.isArray(map.layers) ? map.layers.find(function (layer) {
      return layer && String(layer.id) === String(id);
    }) || null : null;
  }
  function status(message, isError) {
    var box = document.getElementById("crq-cad-offline-status");
    if (box) {
      box.textContent = message;
      box.style.color = isError ? "#b91c1c" : "#1d4ed8";
    }
    if (typeof croquisMapSetToolStatus === "function") croquisMapSetToolStatus(message, !!isError);
  }
  function render() {
    if (typeof window.renderCroquisVisualCanvas === "function") window.renderCroquisVisualCanvas();
    drawOverlay();
  }
  function commit(layer) {
    if (typeof croquisMapCommitOnlineLayer === "function") return croquisMapCommitOnlineLayer(layer);
    if (typeof saveAllDB === "function") saveAllDB();
    render();
    return true;
  }
  function zoneOf(map) {
    return map && map.utmZone ? map.utmZone : "39R";
  }
  function fa(value) {
    return typeof toFa === "function" ? toFa(String(value)) : String(value);
  }
  function readNumber(id, fallback) {
    var input = document.getElementById(id);
    var raw = input ? String(input.value == null ? "" : input.value).trim() : "";
    if (!raw) return fallback;
    return typeof localizedNumber === "function" ? localizedNumber(raw) : Number(raw);
  }
  function makePoint(x, y, index) {
    var map = activeMap();
    var elevation = readNumber("crq-cad-offline-elevation", 0);
    if (!Number.isFinite(elevation)) elevation = 0;
    var point = {
      x: Math.round(Number(x) * 100) / 100,
      y: Math.round(Number(y) * 100) / 100,
      elev: elevation,
      zone: zoneOf(map),
      label: "P" + (Number(index) + 1)
    };
    if (typeof ensurePointEnriched === "function") ensurePointEnriched(point, zoneOf(map), index);
    return point;
  }

  function svgNow() {
    var holder = document.getElementById("crq-cad-svg-container");
    return holder && holder.querySelector ? holder.querySelector('svg[id^="cad-view-"]') : null;
  }
  function svgMetrics(svg) {
    if (!svg) return null;
    var vb = svg.viewBox && svg.viewBox.baseVal;
    var width = vb && vb.width ? vb.width : Number(svg.getAttribute("data-cad-width")) || 760;
    var height = vb && vb.height ? vb.height : Number(svg.getAttribute("data-cad-height")) || 440;
    var rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height || !width || !height) return null;
    var scale = Math.min(rect.width / width, rect.height / height);
    return {
      width: width,
      height: height,
      rect: rect,
      scale: scale,
      offsetX: (rect.width - width * scale) / 2,
      offsetY: (rect.height - height * scale) / 2
    };
  }
  function screenToUtm(svg, clientX, clientY) {
    var metrics = svgMetrics(svg);
    if (!metrics) return null;
    var px = (clientX - metrics.rect.left - metrics.offsetX) / metrics.scale;
    var py = (clientY - metrics.rect.top - metrics.offsetY) / metrics.scale;
    var centerX = Number(svg.getAttribute("data-cad-center-x"));
    var centerY = Number(svg.getAttribute("data-cad-center-y"));
    var scale = Number(svg.getAttribute("data-cad-scale"));
    var panX = Number(svg.getAttribute("data-cad-pan-x") || 0);
    var panY = Number(svg.getAttribute("data-cad-pan-y") || 0);
    var width = Number(svg.getAttribute("data-cad-width")) || metrics.width;
    var height = Number(svg.getAttribute("data-cad-height")) || metrics.height;
    if (![centerX, centerY, scale, panX, panY, width, height].every(Number.isFinite) || scale <= 0) return null;
    return {
      x: centerX + (px - width / 2 - panX) / scale,
      y: centerY - (py - height / 2 - panY) / scale
    };
  }
  function utmToScreen(svg, point) {
    var centerX = Number(svg.getAttribute("data-cad-center-x"));
    var centerY = Number(svg.getAttribute("data-cad-center-y"));
    var scale = Number(svg.getAttribute("data-cad-scale"));
    var panX = Number(svg.getAttribute("data-cad-pan-x") || 0);
    var panY = Number(svg.getAttribute("data-cad-pan-y") || 0);
    var width = Number(svg.getAttribute("data-cad-width")) || 760;
    var height = Number(svg.getAttribute("data-cad-height")) || 440;
    return {
      x: width / 2 + (Number(point.x) - centerX) * scale + panX,
      y: height / 2 - (Number(point.y) - centerY) * scale + panY
    };
  }

  function svgElement(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    return node;
  }
  function drawOverlay() {
    var svg = svgNow();
    if (!svg) return;
    var old = svg.querySelector('[data-cad-offline-overlay="true"]');
    if (old) old.remove();
    var group = svgElement("g", { "data-cad-offline-overlay": "true", "pointer-events": "none" });
    if (state.draft.length) {
      var draftScreen = state.draft.map(function (p) { return utmToScreen(svg, p); });
      var draftText = draftScreen.map(function (p) { return p.x.toFixed(2) + "," + p.y.toFixed(2); }).join(" ");
      if (state.mode === "POLYGON" && draftScreen.length >= 3) {
        group.appendChild(svgElement("polygon", {
          points: draftText, fill: "#f59e0b", "fill-opacity": ".14",
          stroke: "#f59e0b", "stroke-width": 2.5, "stroke-dasharray": "7 5"
        }));
      } else if (draftScreen.length >= 2) {
        group.appendChild(svgElement("polyline", {
          points: draftText, fill: "none", stroke: "#f59e0b",
          "stroke-width": 2.5, "stroke-dasharray": "7 5"
        }));
      }
      draftScreen.forEach(function (p, index) {
        group.appendChild(svgElement("circle", {
          cx: p.x, cy: p.y, r: 5, fill: "#fbbf24", stroke: "#78350f", "stroke-width": 1.5
        }));
        var label = svgElement("text", {
          x: p.x + 7, y: p.y - 7, fill: "#fef3c7", "font-size": 10,
          "font-weight": 900, "paint-order": "stroke", stroke: "#0f172a", "stroke-width": 3
        });
        label.textContent = "P" + (index + 1);
        group.appendChild(label);
      });
    }
    if (state.dragPreview && Array.isArray(state.dragPreview.points)) {
      var previewScreen = state.dragPreview.points.map(function (p) { return utmToScreen(svg, p); });
      var previewText = previewScreen.map(function (p) { return p.x.toFixed(2) + "," + p.y.toFixed(2); }).join(" ");
      if (previewScreen.length >= 3) {
        group.appendChild(svgElement("polygon", {
          points: previewText, fill: "#f97316", "fill-opacity": ".09",
          stroke: "#fb923c", "stroke-width": 2.8, "stroke-dasharray": "5 4"
        }));
      } else if (previewScreen.length >= 2) {
        group.appendChild(svgElement("polyline", {
          points: previewText, fill: "none", stroke: "#fb923c",
          "stroke-width": 2.8, "stroke-dasharray": "5 4"
        }));
      }
      if (state.dragPreview.kind === "VERTEX" && state.dragPreview.index >= 0 && previewScreen[state.dragPreview.index]) {
        var changed = previewScreen[state.dragPreview.index];
        group.appendChild(svgElement("circle", { cx: changed.x, cy: changed.y, r: 8, fill: "#f97316", stroke: "#fff", "stroke-width": 2 }));
      }
    }
    if (state.gpsPoint) {
      var gps = utmToScreen(svg, state.gpsPoint);
      group.appendChild(svgElement("circle", { cx: gps.x, cy: gps.y, r: 10, fill: "#0ea5e9", "fill-opacity": ".2", stroke: "#38bdf8", "stroke-width": 2.5 }));
      group.appendChild(svgElement("circle", { cx: gps.x, cy: gps.y, r: 3.5, fill: "#0284c7", stroke: "#fff", "stroke-width": 1.5 }));
      var gpsLabel = svgElement("text", { x: gps.x + 12, y: gps.y - 10, fill: "#7dd3fc", "font-size": 10, "font-weight": 900, "paint-order": "stroke", stroke: "#0f172a", "stroke-width": 3 });
      gpsLabel.textContent = "GPS";
      group.appendChild(gpsLabel);
    }
    svg.appendChild(group);
  }

  function setModeButtons() {
    ["POINT", "LINE", "POLYGON"].forEach(function (mode) {
      var button = document.getElementById("crq-cad-offline-" + mode.toLowerCase());
      if (!button) return;
      var active = state.mode === mode;
      button.className = "btn btn-sm px-1 py-1 " + (active ? "btn-success fw-bold" : "btn-outline-secondary");
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var finish = document.getElementById("crq-cad-offline-finish");
    if (finish) finish.disabled = !state.mode || state.mode === "POINT" ||
      state.mode === "VERTEX_EDIT" || state.mode === "MOVE_POLYGON" || state.mode === "PICK_PLACEMENT";
    var edit = document.getElementById("crq-cad-offline-edit");
    if (edit) {
      edit.className = "btn btn-sm " + (state.mode === "VERTEX_EDIT" ? "btn-dark fw-bold" : "btn-outline-dark");
      edit.textContent = state.mode === "VERTEX_EDIT" ? "✥ ویرایش رأس‌ها: روشن" : "✥ ویرایش رأس‌ها";
    }
    var move = document.getElementById("crq-cad-offline-move");
    if (move) {
      move.className = "btn btn-sm " + (state.mode === "MOVE_POLYGON" ? "btn-warning fw-bold" : "btn-outline-warning");
      move.textContent = state.mode === "MOVE_POLYGON" ? "✥ جابه‌جایی کل چندضلعی: روشن" : "✥ جابه‌جایی کل چندضلعی";
    }
  }

  function buildButton(label, title, action, id) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm btn-outline-secondary px-1 py-1";
    button.style.cssText = "width:36px;height:34px;";
    button.textContent = label;
    button.title = title;
    if (id) button.id = id;
    button.addEventListener("click", action);
    return button;
  }
  function input(id, type, value, step) {
    var node = document.createElement("input");
    node.id = id;
    node.type = type || "number";
    node.className = "form-control form-control-sm";
    node.value = value == null ? "" : String(value);
    if (step) node.step = step;
    return node;
  }
  function label(text, htmlFor) {
    var node = document.createElement("label");
    node.className = "small fw-bold";
    node.textContent = text;
    if (htmlFor) node.htmlFor = htmlFor;
    return node;
  }
  function createUI() {
    var holder = document.getElementById("crq-cad-svg-container");
    if (!holder || document.getElementById("crq-cad-offline-toolbar")) return;
    var wrapper = document.createElement("div");
    wrapper.id = "crq-cad-offline-stage";
    wrapper.style.cssText = "position:relative;width:100%;height:430px;";
    holder.parentNode.insertBefore(wrapper, holder);
    wrapper.appendChild(holder);
    holder.style.width = "100%";
    holder.style.height = "100%";
    holder.style.touchAction = "none";

    var toolbar = document.createElement("div");
    toolbar.id = "crq-cad-offline-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "ابزارهای ترسیم نقشه آفلاین");
    toolbar.style.cssText = "position:absolute;top:10px;left:10px;z-index:1200;width:48px;padding:5px;direction:rtl;background:rgba(255,255,255,.97);border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 3px 14px rgba(15,23,42,.22);";
    var toolbarButtons = document.createElement("div");
    toolbarButtons.className = "d-flex flex-column gap-1";
    toolbarButtons.appendChild(buildButton("📍", "ثبت نقطه", function () { window.setCroquisCadOfflineDrawingMode("POINT"); }, "crq-cad-offline-point"));
    toolbarButtons.appendChild(buildButton("／", "رسم مسیر", function () { window.setCroquisCadOfflineDrawingMode("LINE"); }, "crq-cad-offline-line"));
    toolbarButtons.appendChild(buildButton("⬠", "رسم محدوده چندضلعی", function () { window.setCroquisCadOfflineDrawingMode("POLYGON"); }, "crq-cad-offline-polygon"));
    toolbarButtons.appendChild(buildButton("💾", "اتمام و ثبت ترسیم", function () { window.finishCroquisCadOfflineDrawing(); }, "crq-cad-offline-finish"));
    toolbarButtons.lastChild.className = "btn btn-sm btn-success px-1 py-1";
    toolbarButtons.lastChild.disabled = true;
    toolbarButtons.appendChild(buildButton("⋯", "ابزارهای تکمیلی", function () { window.toggleCroquisCadOfflineMoreTools(); }));
    toolbar.appendChild(toolbarButtons);
    wrapper.appendChild(toolbar);

    var more = document.createElement("div");
    more.id = "crq-cad-offline-more";
    more.style.cssText = "display:none;position:absolute;top:10px;left:64px;z-index:1200;width:min(330px,calc(100% - 78px));max-height:min(70vh,560px);overflow-y:auto;overscroll-behavior:contain;padding:10px;background:rgba(255,255,255,.97);border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 3px 14px rgba(15,23,42,.22);direction:rtl;color:#172033;";
    var closeRow = document.createElement("div");
    closeRow.className = "d-flex justify-content-between align-items-center mb-2";
    var title = document.createElement("strong");
    title.className = "small";
    title.textContent = "ابزارهای تکمیلی";
    closeRow.appendChild(title);
    var close = document.createElement("button");
    close.type = "button";
    close.className = "btn btn-sm btn-light py-0 px-1";
    close.textContent = "✕";
    close.addEventListener("click", function () { window.toggleCroquisCadOfflineMoreTools(false); });
    closeRow.appendChild(close);
    more.appendChild(closeRow);

    more.appendChild(label("ارتفاع رأس (متر)", "crq-cad-offline-elevation"));
    more.appendChild(input("crq-cad-offline-elevation", "number", 0, "any"));
    var actionGrid = document.createElement("div");
    actionGrid.className = "d-grid gap-1 mt-2";
    function addAction(text, action, cls) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-sm " + (cls || "btn-outline-secondary");
      b.textContent = text;
      b.addEventListener("click", action);
      actionGrid.appendChild(b);
    }
    addAction("↶ بازگشت آخرین رأس", function () { window.undoCroquisCadOfflineDrawingPoint(); }, "btn-outline-warning");
    addAction("لغو ترسیم", function () { window.cancelCroquisCadOfflineDrawing(); }, "btn-outline-secondary");
    var editButton = document.createElement("button");
    editButton.id = "crq-cad-offline-edit";
    editButton.type = "button";
    editButton.className = "btn btn-sm btn-outline-dark";
    editButton.textContent = "✥ ویرایش رأس‌ها";
    editButton.addEventListener("click", function () { window.toggleCroquisCadOfflineVertexEdit(); });
    actionGrid.appendChild(editButton);
    var moveButton = document.createElement("button");
    moveButton.id = "crq-cad-offline-move";
    moveButton.type = "button";
    moveButton.className = "btn btn-sm btn-outline-warning";
    moveButton.textContent = "✥ جابه‌جایی کل چندضلعی";
    moveButton.addEventListener("click", function () { window.toggleCroquisCadOfflinePolygonMove(); });
    actionGrid.appendChild(moveButton);
    actionGrid.appendChild(label("چرخش ساعت‌گرد/پادساعت‌گرد (درجه)", "crq-cad-offline-rotate"));
    var rotateRow = document.createElement("div");
    rotateRow.className = "input-group input-group-sm";
    rotateRow.appendChild(input("crq-cad-offline-rotate", "number", 15, "0.1"));
    var rotateButton = document.createElement("button");
    rotateButton.type = "button";
    rotateButton.className = "btn btn-outline-primary";
    rotateButton.textContent = "⟳ چرخاندن";
    rotateButton.addEventListener("click", function () { window.rotateCroquisCadActivePolygon(); });
    rotateRow.appendChild(rotateButton);
    actionGrid.appendChild(rotateRow);
    addAction("◎ موقعیت‌یابی GPS", function () { window.locateCroquisCadOfflineGPS(); }, "btn-outline-info");
    addAction("کپی مختصات UTM", function () { if (typeof window.copyActiveLayerUTM === "function") window.copyActiveLayerUTM(); }, "btn-outline-primary");
    addAction("خروجی GeoJSON", function () { if (typeof window.exportCroquisGeoJSON === "function") window.exportCroquisGeoJSON(); }, "btn-outline-success");
    addAction("پاک‌کردن لایه فعال", function () { if (typeof window.clearActiveMapLayerPoints === "function") window.clearActiveMapLayerPoints(); }, "btn-outline-danger");
    more.appendChild(actionGrid);

    var details = document.createElement("details");
    details.className = "mt-2 border-top pt-2";
    var summary = document.createElement("summary");
    summary.className = "small fw-bold text-primary";
    summary.textContent = "🏗️ جانمایی هندسی ابنیه و تأسیسات";
    details.appendChild(summary);
    var form = document.createElement("div");
    form.className = "pt-2";
    form.appendChild(label("نوع شکل", "crq-cad-shape-type"));
    var shapeType = document.createElement("select");
    shapeType.id = "crq-cad-shape-type";
    shapeType.className = "form-select form-select-sm mb-2";
    [["RECTANGLE","مستطیل"],["SQUARE","مربع"],["CIRCLE","دایره"],["CUSTOM","چندضلعی دلخواه"]].forEach(function (item) {
      var option = document.createElement("option");
      option.value = item[0]; option.textContent = item[1];
      shapeType.appendChild(option);
    });
    shapeType.addEventListener("change", function () { window.updateCroquisCadOfflineShapeFields(); });
    form.appendChild(shapeType);
    var coordRow = document.createElement("div");
    coordRow.className = "row g-1";
    [["X","crq-cad-shape-x","UTM X"],["Y","crq-cad-shape-y","UTM Y"]].forEach(function (item) {
      var col = document.createElement("div"); col.className = "col-6";
      col.appendChild(label(item[2],item[1]));
      col.appendChild(input(item[1],"number","","0.01"));
      coordRow.appendChild(col);
    });
    form.appendChild(coordRow);
    var pick = document.createElement("button");
    pick.type = "button"; pick.className = "btn btn-sm btn-outline-primary w-100 my-1";
    pick.textContent = "◎ انتخاب مرکز با کلیک روی بوم";
    pick.addEventListener("click", function () { window.pickCroquisCadOfflineShapeAnchor(); });
    form.appendChild(pick);

    function fieldBlock(id) {
      var block = document.createElement("div");
      block.id = id;
      block.className = "mt-1";
      return block;
    }
    function addFieldRow(parent, items) {
      var row = document.createElement("div"); row.className = "row g-1";
      items.forEach(function (item) {
        var col = document.createElement("div"); col.className = item.cols || "col-4";
        col.appendChild(label(item.label,item.id));
        col.appendChild(input(item.id,"number",item.value,item.step || "0.01"));
        row.appendChild(col);
      });
      parent.appendChild(row);
    }
    var rect = fieldBlock("crq-cad-shape-rectangle");
    addFieldRow(rect,[
      {label:"طول (متر)",id:"crq-cad-shape-length",value:20},
      {label:"عرض (متر)",id:"crq-cad-shape-width",value:10},
      {label:"آزیموت",id:"crq-cad-shape-azimuth",value:0,step:"0.1"}
    ]);
    form.appendChild(rect);
    var square = fieldBlock("crq-cad-shape-square"); square.style.display="none";
    addFieldRow(square,[
      {label:"طول ضلع",id:"crq-cad-shape-side",value:10,cols:"col-6"},
      {label:"آزیموت",id:"crq-cad-shape-square-azimuth",value:0,step:"0.1",cols:"col-6"}
    ]);
    form.appendChild(square);
    var circle = fieldBlock("crq-cad-shape-circle"); circle.style.display="none";
    addFieldRow(circle,[
      {label:"شعاع",id:"crq-cad-shape-radius",value:5,cols:"col-6"},
      {label:"تعداد رأس",id:"crq-cad-shape-segments",value:48,step:"1",cols:"col-6"}
    ]);
    form.appendChild(circle);
    var custom = fieldBlock("crq-cad-shape-custom"); custom.style.display="none";
    custom.appendChild(label("طول ضلع، آزیموت (هر ضلع یک سطر)","crq-cad-shape-sides"));
    var sides = document.createElement("textarea");
    sides.id = "crq-cad-shape-sides"; sides.rows=3; sides.dir="ltr";
    sides.className="form-control form-control-sm";
    sides.style.textAlign="left";
    sides.placeholder="20,90\n10,180\n20,270\n10,0";
    custom.appendChild(sides);
    form.appendChild(custom);

    var metadata = document.createElement("div"); metadata.className="row g-1 mt-1";
    [["ارتفاع Z","crq-cad-shape-elev","number","0"],["نام لایه","crq-cad-shape-name","text","ساختمان پیشنهادی"]].forEach(function (item) {
      var col=document.createElement("div"); col.className="col-6";
      col.appendChild(label(item[0],item[1]));
      var field=item[2]==="text"?document.createElement("input"):input(item[1],item[2],item[3],"0.1");
      if(item[2]==="text"){field.id=item[1];field.type="text";field.className="form-control form-control-sm";field.value=item[3];}
      col.appendChild(field); metadata.appendChild(col);
    });
    form.appendChild(metadata);
    var colorRow=document.createElement("div"); colorRow.className="row g-1 mt-1";
    var categoryCol=document.createElement("div"); categoryCol.className="col-8";
    categoryCol.appendChild(label("نوع عارضه","crq-cad-shape-category"));
    var category=document.createElement("select"); category.id="crq-cad-shape-category";category.className="form-select form-select-sm";
    [["FACILITY","ابنیه/تأسیسات"],["PROJECT_AREA","محل اجرای طرح"],["GREENHOUSE","گلخانه/سالن"]].forEach(function(item){var o=document.createElement("option");o.value=item[0];o.textContent=item[1];category.appendChild(o);});
    categoryCol.appendChild(category);
    var colorCol=document.createElement("div"); colorCol.className="col-4";
    colorCol.appendChild(label("رنگ","crq-cad-shape-color"));
    var color=input("crq-cad-shape-color","color","#b45309");
    color.className="form-control form-control-color form-control-sm w-100";
    colorCol.appendChild(color);
    colorRow.appendChild(categoryCol);colorRow.appendChild(colorCol);form.appendChild(colorRow);

    var createShape=document.createElement("button");
    createShape.type="button";createShape.className="btn btn-sm btn-primary w-100 mt-2";
    createShape.textContent="ساخت شکل و افزودن لایه مستقل";
    createShape.addEventListener("click",function(){window.createCroquisCadOfflineShape();});
    form.appendChild(createShape);
    details.appendChild(form);
    more.appendChild(details);
    wrapper.appendChild(more);

    var statusBox=document.createElement("div");
    statusBox.id="crq-cad-offline-status";
    statusBox.className="small fw-bold";
    statusBox.textContent="ابزارهای ترسیم آفلاین آماده‌اند.";
    statusBox.style.cssText="position:absolute;right:10px;bottom:10px;z-index:1100;max-width:min(360px,calc(100% - 78px));padding:6px 9px;background:rgba(255,255,255,.94);border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 2px 8px rgba(15,23,42,.14);pointer-events:none;";
    wrapper.appendChild(statusBox);
  }

  window.setCroquisCadOfflineDrawingMode = function (mode) {
    var map = activeMap(), layer = activeLayer();
    mode = String(mode || "").toUpperCase();
    if (!map || !layer) { status("ابتدا پرونده، نقشه و لایه موردنظر را انتخاب کنید.", true); return false; }
    if (typeof croquisOnlineDrawMode !== "undefined" && croquisOnlineDrawMode) {
      status("ابتدا ترسیم فعال در نمای آنلاین را تمام یا لغو کنید.", true); return false;
    }
    var replacePointLayer = false;
    if (mode === "POINT") {
      if (layer.points && layer.points.length && layer.geomType !== "POINT") {
        if (!confirm("لایه فعال از نوع دیگری است. با اولین کلیک، نقاط قبلی جایگزین می‌شوند. ادامه می‌دهید؟")) return false;
        replacePointLayer = true;
      }
    } else if (mode === "LINE" || mode === "POLYGON") {
      if (layer.points && layer.points.length &&
          !confirm("ترسیم جدید پس از ثبت، هندسه فعلی لایه فعال را جایگزین می‌کند. ادامه می‌دهید؟")) return false;
    } else return false;
    state.mode = mode;
    state.targetLayerId = layer.id;
    state.pointReplace = replacePointLayer;
    state.draft = [];
    state.pointer = null;
    state.dragPreview = null;
    setModeButtons();
    render();
    status(mode === "POINT" ? "ثبت نقطه فعال است؛ روی بوم آفلاین کلیک کنید." :
      (mode === "LINE" ? "رسم مسیر فعال است؛ رأس‌ها را کلیک کنید و سپس ثبت را بزنید." :
       "رسم محدوده فعال است؛ حداقل سه رأس انتخاب کنید و سپس ثبت را بزنید."));
    return true;
  };

  window.finishCroquisCadOfflineDrawing = function () {
    var mode = state.mode;
    if (mode === "POINT") {
      state.mode="";state.draft=[];setModeButtons();render();status("ثبت نقطه متوقف شد.");return true;
    }
    if (mode!=="LINE"&&mode!=="POLYGON") { status("ترسیم مسیر یا محدوده فعالی وجود ندارد.",true);return false; }
    var needed=mode==="POLYGON"?3:2;
    var points=state.draft.map(function(p,i){var copy=Object.assign({},p);copy.label="P"+(i+1);return copy;});
    if(points.length<needed){status("برای ثبت این عارضه حداقل "+needed+" رأس لازم است.",true);return false;}
    var unique={};points.forEach(function(p){unique[Number(p.x).toFixed(2)+"_"+Number(p.y).toFixed(2)]=true;});
    if(Object.keys(unique).length<needed){status("تعداد رأس‌های یکتا کافی نیست؛ نقاط تکراری را اصلاح کنید.",true);return false;}
    if(mode==="POLYGON"&&typeof isSimpleUtmPolygon==="function"&&!isSimpleUtmPolygon(points)){status("چندضلعی معتبر نیست یا اضلاع آن یکدیگر را قطع می‌کنند.",true);return false;}
    var layer=layerById(activeMap(),state.targetLayerId);
    if(!layer){status("لایه اولیه ترسیم پیدا نشد؛ ترسیم را لغو و دوباره شروع کنید.",true);return false;}
    var geom=typeof computeUtmGeometry==="function"?computeUtmGeometry(points,mode):{area:0,perim:0};
    if(mode==="POLYGON"&&(!Number.isFinite(geom.area)||geom.area<=0)){status("مساحت چندضلعی صفر یا نامعتبر است؛ ترتیب نقاط را بررسی کنید.",true);return false;}
    var oldPoints=layer.points,oldType=layer.geomType;
    layer.geomType=mode;layer.points=points;
    if(!commit(layer)){layer.points=oldPoints;layer.geomType=oldType;status("ذخیره لایه تأیید نشد؛ هندسه قبلی بازیابی شد.",true);render();return false;}
    state.mode="";state.targetLayerId=null;state.pointReplace=false;state.draft=[];state.dragPreview=null;setModeButtons();render();
    status("✅ "+(mode==="POLYGON"?"محدوده":"مسیر")+" با "+fa(points.length)+" رأس ذخیره شد؛ "+
      (mode==="POLYGON"?"مساحت: "+fa(Math.round(geom.area))+" مترمربع.":"طول: "+fa(geom.perim.toFixed(1))+" متر."));
    return true;
  };

  window.undoCroquisCadOfflineDrawingPoint = function () {
    if(state.draft.length){state.draft.pop();drawOverlay();status("آخرین رأس از ترسیم موقت حذف شد.");return;}
    if(state.mode==="POINT"){
      var layer=layerById(activeMap(),state.targetLayerId);
      if(layer&&layer.points.length){var old=layer.points.slice();layer.points.pop();if(!commit(layer))layer.points=old;else status("آخرین نقطه از لایه ترسیم حذف شد.");}
      return;
    }
    status("رأس موقتی برای بازگشت وجود ندارد.");
  };
  window.cancelCroquisCadOfflineDrawing = function () {
    state.mode="";state.targetLayerId=null;state.pointReplace=false;state.draft=[];state.pointer=null;state.dragPreview=null;setModeButtons();render();status("ترسیم موقت لغو شد؛ داده‌های قبلی لایه حفظ شدند.");
  };
  window.toggleCroquisCadOfflineMoreTools = function (force) {
    var panel=document.getElementById("crq-cad-offline-more");if(!panel)return;
    var open=force===true?true:(force===false?false:panel.style.display==="none");panel.style.display=open?"block":"none";
  };
  window.toggleCroquisCadOfflineVertexEdit = function () {
    if(state.mode==="VERTEX_EDIT"){state.mode="";state.targetLayerId=null;}
    else{
      if(state.mode)window.cancelCroquisCadOfflineDrawing();
      var layer=activeLayer();if(!layer||layer.geomType!=="POLYGON"){status("ابتدا یک لایه چندضلعی را انتخاب کنید.",true);return false;}
      state.mode="VERTEX_EDIT";state.targetLayerId=layer.id;status("ویرایش رأس‌ها فعال است؛ روی نزدیک‌ترین رأس بکشید.");
    }
    setModeButtons();return true;
  };
  window.toggleCroquisCadOfflinePolygonMove = function () {
    if(state.mode==="MOVE_POLYGON")state.mode="";
    else{
      if(state.mode)window.cancelCroquisCadOfflineDrawing();
      var layer=activeLayer();
      if(!layer||layer.geomType!=="POLYGON"||!Array.isArray(layer.points)||layer.points.length<3){status("برای جابه‌جایی، ابتدا یک لایه چندضلعی را انتخاب کنید.",true);return false;}
      state.mode="MOVE_POLYGON";state.targetLayerId=layer.id;status("حالت جابه‌جایی فعال است؛ داخل چندضلعی کلیک کنید و بکشید.");
    }
    setModeButtons();return true;
  };

  function pointInPolygon(point,polygon){
    var x=Number(point.x),y=Number(point.y),inside=false;
    for(var i=0,j=polygon.length-1;i<polygon.length;j=i++){
      var xi=Number(polygon[i].x),yi=Number(polygon[i].y),xj=Number(polygon[j].x),yj=Number(polygon[j].y);
      var dx=xi-xj,dy=yi-yj,l2=dx*dx+dy*dy;
      if(l2>0){var t=Math.max(0,Math.min(1,((x-xj)*dx+(y-yj)*dy)/l2));if(Math.hypot(x-(xj+t*dx),y-(yj+t*dy))<0.02)return true;}
      if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/((yj-yi)||0.0000001)+xi)inside=!inside;
    }return inside;
  }
  function closestVertex(svg,layer,clientX,clientY){
    var metrics=svgMetrics(svg);if(!metrics)return -1;
    var best=-1,bestDist=14;
    layer.points.forEach(function(point,index){
      var p=utmToScreen(svg,point);
      var cx=metrics.rect.left+metrics.offsetX+p.x*metrics.scale;
      var cy=metrics.rect.top+metrics.offsetY+p.y*metrics.scale;
      var d=Math.hypot(cx-clientX,cy-clientY);
      if(d<bestDist){bestDist=d;best=index;}
    });return best;
  }
  function onPointerDown(event){
    if(event.button!==0||!state.mode)return;
    var svg=event.target&&event.target.closest?event.target.closest('svg[id^="cad-view-"]'):null;
    if(!svg)return;
    event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    var map=activeMap(),layer=activeLayer(),utm=screenToUtm(svg,event.clientX,event.clientY);
    if(state.targetLayerId)layer=layerById(map,state.targetLayerId)||layer;
    if(!utm)return;
    if(["POINT","LINE","POLYGON","PICK_PLACEMENT"].indexOf(state.mode)>=0){
      if(state.mode==="PICK_PLACEMENT"){
        var x=document.getElementById("crq-cad-shape-x"),y=document.getElementById("crq-cad-shape-y");
        if(x)x.value=(Math.round(utm.x*100)/100).toFixed(2);if(y)y.value=(Math.round(utm.y*100)/100).toFixed(2);
        state.mode="";setModeButtons();status("مرکز شکل با مختصات UTM ثبت شد.");return;
      }
      if(state.mode==="POINT"){
        var targetLayer=layerById(map,state.targetLayerId)||layer;
        if(!targetLayer)return;
        var oldType=targetLayer.geomType,oldPoints=targetLayer.points.slice();
        targetLayer.geomType="POINT";
        if(state.pointReplace)targetLayer.points=[];
        var pt=makePoint(utm.x,utm.y,targetLayer.points.length);targetLayer.points.push(pt);
        if(!commit(targetLayer)){
          targetLayer.geomType=oldType;targetLayer.points=oldPoints;status("ذخیره نقطه تأیید نشد؛ لایه به حالت قبلی برگشت.",true);
        }else{
          state.pointReplace=false;
          status("نقطه "+pt.label+" در لایه انتخاب‌شده ذخیره شد؛ برای نقطه بعدی کلیک کنید.");
        }
      }else{
        state.draft.push(makePoint(utm.x,utm.y,state.draft.length));drawOverlay();
        status("رأس موقت "+fa(state.draft.length)+" ثبت شد؛ پس از اتمام، دکمه ذخیره را بزنید.");
      }return;
    }
    if(!map||!layer||layer.geomType!=="POLYGON"||!Array.isArray(layer.points)||layer.points.length<3){status("لایه فعال باید چندضلعی معتبر باشد.",true);return;}
    if(state.mode==="VERTEX_EDIT"){
      var idx=closestVertex(svg,layer,event.clientX,event.clientY);
      if(idx<0){status("روی یکی از رأس‌های لایه فعال کلیک کنید.",true);return;}
      state.pointer={kind:"VERTEX",pointerId:event.pointerId,layerId:layer.id,index:idx,startPoints:layer.points.map(function(p){return Object.assign({},p);})};
      if(event.currentTarget.setPointerCapture){try{event.currentTarget.setPointerCapture(event.pointerId);}catch(ignore){}}
      return;
    }
    if(state.mode==="MOVE_POLYGON"){
      if(!pointInPolygon(utm,layer.points)){status("برای جابه‌جایی، داخل چندضلعی لایه فعال کلیک کنید.",true);return;}
      state.pointer={kind:"MOVE",pointerId:event.pointerId,layerId:layer.id,startX:utm.x,startY:utm.y,startPoints:layer.points.map(function(p){return Object.assign({},p);})};
      if(event.currentTarget.setPointerCapture){try{event.currentTarget.setPointerCapture(event.pointerId);}catch(ignore){}}
    }
  }
  function onPointerMove(event){
    var drag=state.pointer;if(!drag||event.pointerId!==drag.pointerId)return;
    var svg=svgNow(),utm=screenToUtm(svg,event.clientX,event.clientY),map=activeMap(),layer=layerById(map,drag.layerId);
    if(!utm||!map||!layer)return;
    if(drag.kind==="VERTEX"){
      var pts=drag.startPoints.map(function(p){return Object.assign({},p);});
      pts[drag.index].x=Math.round(utm.x*100)/100;pts[drag.index].y=Math.round(utm.y*100)/100;
      if(typeof ensurePointEnriched==="function")ensurePointEnriched(pts[drag.index],zoneOf(map),drag.index);
      state.dragPreview={kind:"VERTEX",index:drag.index,points:pts};
    }else{
      var dx=utm.x-drag.startX,dy=utm.y-drag.startY;
      state.dragPreview={kind:"MOVE",points:drag.startPoints.map(function(p,index){
        var copy=Object.assign({},p);copy.x=Math.round((Number(p.x)+dx)*100)/100;copy.y=Math.round((Number(p.y)+dy)*100)/100;
        if(typeof ensurePointEnriched==="function")ensurePointEnriched(copy,zoneOf(map),index);return copy;
      })};
    }
    drawOverlay();event.preventDefault();
  }
  function onPointerUp(event){
    var drag=state.pointer;if(!drag||(event&&event.pointerId!==drag.pointerId))return;
    state.pointer=null;
    var preview=state.dragPreview;state.dragPreview=null;
    var map=activeMap(),layer=layerById(map,drag.layerId);
    if(!preview||!layer||!map){drawOverlay();return;}
    if(drag.kind==="MOVE"&&layer.category!=="MAIN_PARCEL"){
      var main=(map.layers||[]).find(function(candidate){return candidate&&candidate.category==="MAIN_PARCEL"&&candidate.geomType==="POLYGON"&&Array.isArray(candidate.points)&&candidate.points.length>=3;});
      if(main&&typeof window.isCroquisPlacementShapeInsideParcel==="function"&&!window.isCroquisPlacementShapeInsideParcel(preview.points,main.points)){
        status("جابه‌جایی باعث خروج چندضلعی از زمین اصلی می‌شود؛ تغییر ذخیره نشد.",true);drawOverlay();return;
      }
    }
    var old=layer.points;layer.points=preview.points;
    if(!commit(layer)){layer.points=old;status("ذخیره ویرایش انجام نشد؛ مختصات قبلی بازیابی شد.",true);}
    else status(drag.kind==="MOVE"?"جابه‌جایی کل چندضلعی ذخیره شد.":"مختصات رأس انتخاب‌شده ذخیره شد.");
    render();
  }

  window.rotateCroquisCadActivePolygon = function(){
    var degrees=readNumber("crq-cad-offline-rotate",0);
    if(typeof window.rotateCroquisActivePolygon!=="function"){status("ابزار چرخش چندضلعی بارگذاری نشده است.",true);return false;}
    var result=window.rotateCroquisActivePolygon(degrees);if(result)render();return result;
  };
  window.rotateCroquisCadActivePolygon = function(){
    var input=document.getElementById("crq-cad-offline-rotate");
    var degrees=input?(typeof localizedNumber==="function"?localizedNumber(input.value):Number(input.value)):0;
    if(typeof window.rotateCroquisActivePolygon!=="function"){status("ابزار چرخش چندضلعی بارگذاری نشده است.",true);return false;}
    var result=window.rotateCroquisActivePolygon(degrees);
    if(result)render();
    return result;
  };

  window.locateCroquisCadOfflineGPS = function(){
    if(!navigator.geolocation){status("مرورگر از GPS پشتیبانی نمی‌کند.",true);return;}
    navigator.geolocation.getCurrentPosition(function(position){
      var map=activeMap();if(!map||typeof latLngToUtmWGS84!=="function"){status("تبدیل GPS به UTM در دسترس نیست.",true);return;}
      var utm=latLngToUtmWGS84(position.coords.latitude,position.coords.longitude,parseInt(map.utmZone,10)||39);
      state.gpsPoint={x:utm.x,y:utm.y};
      var svg=svgNow();if(svg){
        var p=utmToScreen(svg,state.gpsPoint),w=Number(svg.getAttribute("data-cad-width"))||760,h=Number(svg.getAttribute("data-cad-height"))||440;
        var mapView=map.cadView||(map.cadView={});mapView.panX=(Number(mapView.panX)||0)+(w/2-p.x)*760/w;
        mapView.panY=(Number(mapView.panY)||0)+(h/2-p.y)*440/h;
        if(typeof saveAllDB==="function")saveAllDB();
      }
      render();status("موقعیت GPS روی بوم آفلاین نمایش داده شد؛ نشانگر به‌تنهایی به‌عنوان نقطه برداشت ذخیره نمی‌شود.");
    },function(error){status("دریافت موقعیت GPS انجام نشد: "+(error&&error.message||"دسترسی رد شد."),true);},
    {enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  };
  window.updateCroquisCadOfflineShapeFields = function(){
    var type=String((document.getElementById("crq-cad-shape-type")||{}).value||"RECTANGLE").toUpperCase();
    ["RECTANGLE","SQUARE","CIRCLE","CUSTOM"].forEach(function(key){
      var el=document.getElementById("crq-cad-shape-"+key.toLowerCase());if(el)el.style.display=type===key?"block":"none";
    });
  };
  window.pickCroquisCadOfflineShapeAnchor = function(){
    if(state.mode)window.cancelCroquisCadOfflineDrawing();
    state.mode="PICK_PLACEMENT";setModeButtons();status("روی بوم آفلاین کلیک کنید تا مرکز شکل یا رأس اول ثبت شود.");return true;
  };
  window.createCroquisCadOfflineShape = function(){
    var map=activeMap();if(!map){status("ابتدا نقشه کروکی را باز کنید.",true);return false;}
    if(typeof croquisOnlineDrawMode!=="undefined"&&croquisOnlineDrawMode){status("ابتدا ترسیم نمای آنلاین را تمام یا لغو کنید.",true);return false;}
    var main=(map.layers||[]).find(function(l){return l&&l.category==="MAIN_PARCEL"&&l.geomType==="POLYGON"&&Array.isArray(l.points)&&l.points.length>=3;});
    if(!main){status("ابتدا محدوده اصلی زمین را به‌صورت چندضلعی ثبت کنید.",true);return false;}
    var type=String((document.getElementById("crq-cad-shape-type")||{}).value||"RECTANGLE").toUpperCase();
    var opts={},x=readNumber("crq-cad-shape-x",NaN),y=readNumber("crq-cad-shape-y",NaN),z=readNumber("crq-cad-shape-elev",0);
    if(type==="RECTANGLE"){opts.length=readNumber("crq-cad-shape-length",NaN);opts.width=readNumber("crq-cad-shape-width",NaN);opts.azimuth=readNumber("crq-cad-shape-azimuth",0);}
    else if(type==="SQUARE"){opts.side=readNumber("crq-cad-shape-side",NaN);opts.azimuth=readNumber("crq-cad-shape-square-azimuth",0);}
    else if(type==="CIRCLE"){opts.radius=readNumber("crq-cad-shape-radius",NaN);opts.segments=readNumber("crq-cad-shape-segments",48);}
    else if(type==="CUSTOM"){
      var raw=String((document.getElementById("crq-cad-shape-sides")||{}).value||"");
      try{opts.sides=raw.split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean).map(function(line,index){
        var parts=line.split(/[,،;\s]+/).filter(Boolean);if(parts.length!==2)throw new Error("سطر "+(index+1)+" باید طول ضلع و آزیموت داشته باشد.");
        return {length:typeof localizedNumber==="function"?localizedNumber(parts[0]):Number(parts[0]),azimuth:typeof localizedNumber==="function"?localizedNumber(parts[1]):Number(parts[1])};
      });}catch(err){status(err.message,true);return false;}
    }
    if(typeof window.buildCroquisPlacementShapePoints!=="function"||typeof window.isCroquisPlacementShapeInsideParcel!=="function"){status("موتور هندسی جانمایی در دسترس نیست.",true);return false;}
    var built;try{built=window.buildCroquisPlacementShapePoints(type,x,y,opts,zoneOf(map),z);}catch(error){status(error&&error.message||"ورودی هندسی معتبر نیست.",true);return false;}
    if(!window.isCroquisPlacementShapeInsideParcel(built.points,main.points)){status("این سازه از محدوده زمین اصلی خارج می‌شود؛ محل یا ابعاد را اصلاح کنید.",true);return false;}
    var name=String((document.getElementById("crq-cad-shape-name")||{}).value||"").trim();
    if(!name)name=type==="CIRCLE"?"جانمایی دایره‌ای":(type==="SQUARE"?"جانمایی مربع":(type==="RECTANGLE"?"جانمایی مستطیل":"جانمایی چندضلعی"));
    var color=String((document.getElementById("crq-cad-shape-color")||{}).value||"#b45309");
    if(!/^#[0-9a-f]{6}$/i.test(color))color="#b45309";
    var category=String((document.getElementById("crq-cad-shape-category")||{}).value||"FACILITY");
    if(["FACILITY","PROJECT_AREA","GREENHOUSE"].indexOf(category)<0)category="FACILITY";
    var id="LYR-CAD-PLACE-"+Date.now();while((map.layers||[]).some(function(l){return l&&String(l.id)===id;}))id+="-1";
    built.points.forEach(function(point,index){if(typeof ensurePointEnriched==="function")ensurePointEnriched(point,zoneOf(map),index);});
    var layer={id:id,name:name,category:category,geomType:"POLYGON",color:color,fillColor:color,fillOpacity:.22,strokeWidth:2.5,visible:true,order:(map.layers||[]).length+1,desc:"جانمایی هندسی ایجادشده از نمای آفلاین؛ کنترل‌شده داخل محدوده زمین اصلی.",points:built.points};
    map.layers.push(layer);if(typeof activeCroquisLayerId!=="undefined")activeCroquisLayerId=id;
    if(typeof saveAllDB==="function")saveAllDB();
    if(typeof renderCroquisLayersList==="function")renderCroquisLayersList();
    if(typeof loadActiveLayerIntoEditor==="function")loadActiveLayerIntoEditor();
    render();status("سازه «"+name+"» به‌صورت لایه مستقل ثبت شد؛ مساحت "+fa(built.area.toFixed(2))+" مترمربع. زمین اصلی تغییر نکرد.");
    return true;
  };

  function initialize(){
    if(state.initialized)return;
    var holder=document.getElementById("crq-cad-svg-container");
    if(!holder||!holder.parentNode)return;
    state.initialized=true;
    var wrapper=document.createElement("div");
    wrapper.id="crq-cad-offline-stage";
    wrapper.style.cssText="position:relative;width:100%;height:430px;";
    holder.parentNode.insertBefore(wrapper,holder);wrapper.appendChild(holder);holder.style.width="100%";holder.style.height="100%";holder.style.touchAction="none";

    var toolbar=document.createElement("div");
    toolbar.id="crq-cad-offline-toolbar";
    toolbar.setAttribute("role","toolbar");toolbar.setAttribute("aria-label","ابزار ترسیم نقشه آفلاین");
    toolbar.style.cssText="position:absolute;top:10px;left:10px;z-index:1200;width:48px;padding:5px;direction:rtl;background:rgba(255,255,255,.97);border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 3px 14px rgba(15,23,42,.22);";
    var stack=document.createElement("div");stack.className="d-flex flex-column gap-1";
    function toolbarButton(id,labelText,titleText,action){
      var b=buildButton(labelText,titleText,action,id);stack.appendChild(b);return b;
    }
    toolbarButton("crq-cad-offline-point","📍","ثبت نقطه",function(){window.setCroquisCadOfflineDrawingMode("POINT");});
    toolbarButton("crq-cad-offline-line","／","رسم مسیر",function(){window.setCroquisCadOfflineDrawingMode("LINE");});
    toolbarButton("crq-cad-offline-polygon","⬠","رسم محدوده",function(){window.setCroquisCadOfflineDrawingMode("POLYGON");});
    var finish=toolbarButton("crq-cad-offline-finish","💾","اتمام و ثبت ترسیم",function(){window.finishCroquisCadOfflineDrawing();});
    finish.className="btn btn-sm btn-success px-1 py-1";finish.disabled=true;
    toolbarButton("crq-cad-offline-more","⋯","ابزارهای تکمیلی",function(){window.toggleCroquisCadOfflineMoreTools();});
    toolbar.appendChild(stack);wrapper.appendChild(toolbar);

    var more=document.createElement("div");more.id="crq-cad-offline-more";
    more.style.cssText="display:none;position:absolute;top:10px;left:64px;z-index:1200;width:min(330px,calc(100% - 78px));max-height:min(70vh,560px);overflow-y:auto;overscroll-behavior:contain;padding:10px;background:rgba(255,255,255,.97);border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 3px 14px rgba(15,23,42,.22);direction:rtl;color:#172033;";
    var head=document.createElement("div");head.className="d-flex justify-content-between align-items-center mb-2";
    var headTitle=document.createElement("strong");headTitle.className="small";headTitle.textContent="ابزارهای تکمیلی";head.appendChild(headTitle);
    var close=document.createElement("button");close.type="button";close.className="btn btn-sm btn-light py-0 px-1";close.textContent="✕";close.addEventListener("click",function(){window.toggleCroquisCadOfflineMoreTools(false);});head.appendChild(close);more.appendChild(head);
    more.appendChild(label("ارتفاع رأس (متر)","crq-cad-offline-elevation"));more.appendChild(input("crq-cad-offline-elevation","number",0,"any"));
    var actions=document.createElement("div");actions.className="d-grid gap-1 mt-2";
    function action(text,fn,cls){var b=document.createElement("button");b.type="button";b.className="btn btn-sm "+cls;b.textContent=text;b.addEventListener("click",fn);actions.appendChild(b);return b;}
    action("↶ بازگشت آخرین رأس",function(){window.undoCroquisCadOfflineDrawingPoint();},"btn-outline-warning");
    action("لغو ترسیم",function(){window.cancelCroquisCadOfflineDrawing();},"btn-outline-secondary");
    var edit=action("✥ ویرایش رأس‌ها",function(){window.toggleCroquisCadOfflineVertexEdit();},"btn-outline-dark");edit.id="crq-cad-offline-edit";
    var move=action("✥ جابه‌جایی کل چندضلعی",function(){window.toggleCroquisCadOfflinePolygonMove();},"btn-outline-warning");move.id="crq-cad-offline-move";
    actions.appendChild(label("چرخش ساعت‌گرد/پادساعت‌گرد (درجه)","crq-cad-offline-rotate"));
    var rotateRow=document.createElement("div");rotateRow.className="input-group input-group-sm";rotateRow.appendChild(input("crq-cad-offline-rotate","number",15,"0.1"));
    var rotateButton=document.createElement("button");rotateButton.type="button";rotateButton.className="btn btn-outline-primary";rotateButton.textContent="⟳ چرخاندن";rotateButton.addEventListener("click",function(){window.rotateCroquisCadActivePolygon();});rotateRow.appendChild(rotateButton);actions.appendChild(rotateRow);
    action("◎ موقعیت‌یابی GPS",function(){window.locateCroquisCadOfflineGPS();},"btn-outline-info");
    action("کپی مختصات UTM",function(){if(typeof window.copyActiveLayerUTM==="function")window.copyActiveLayerUTM();},"btn-outline-primary");
    action("خروجی GeoJSON",function(){if(typeof window.exportCroquisGeoJSON==="function")window.exportCroquisGeoJSON();},"btn-outline-success");
    action("پاک‌کردن لایه فعال",function(){if(typeof window.clearActiveMapLayerPoints==="function")window.clearActiveMapLayerPoints();},"btn-outline-danger");
    more.appendChild(actions);

    var details=document.createElement("details");details.className="mt-2 border-top pt-2";
    var summary=document.createElement("summary");summary.className="small fw-bold text-primary";summary.textContent="🏗️ جانمایی هندسی ابنیه و تأسیسات";details.appendChild(summary);
    var form=document.createElement("div");form.className="pt-2";
    form.appendChild(label("نوع شکل","crq-cad-shape-type"));
    var type=document.createElement("select");type.id="crq-cad-shape-type";type.className="form-select form-select-sm mb-2";
    [["RECTANGLE","مستطیل"],["SQUARE","مربع"],["CIRCLE","دایره"],["CUSTOM","چندضلعی دلخواه"]].forEach(function(item){var o=document.createElement("option");o.value=item[0];o.textContent=item[1];type.appendChild(o);});
    type.addEventListener("change",function(){window.updateCroquisCadOfflineShapeFields();});form.appendChild(type);
    var coords=document.createElement("div");coords.className="row g-1";
    [["UTM X","crq-cad-shape-x"],["UTM Y","crq-cad-shape-y"]].forEach(function(item){var col=document.createElement("div");col.className="col-6";col.appendChild(label(item[0],item[1]));col.appendChild(input(item[1],"number","","0.01"));coords.appendChild(col);});form.appendChild(coords);
    var pick=document.createElement("button");pick.type="button";pick.className="btn btn-sm btn-outline-primary w-100 my-1";pick.textContent="◎ انتخاب مرکز با کلیک روی بوم";pick.addEventListener("click",function(){window.pickCroquisCadOfflineShapeAnchor();});form.appendChild(pick);
    function block(id){var d=document.createElement("div");d.id=id;d.className="mt-1";return d;}
    function fields(parent,items){var row=document.createElement("div");row.className="row g-1";items.forEach(function(item){var col=document.createElement("div");col.className=item.cols||"col-4";col.appendChild(label(item.label,item.id));col.appendChild(input(item.id,"number",item.value,item.step||"0.01"));row.appendChild(col);});parent.appendChild(row);}
    var rect=block("crq-cad-shape-rectangle");fields(rect,[{label:"طول",id:"crq-cad-shape-length",value:20},{label:"عرض",id:"crq-cad-shape-width",value:10},{label:"آزیموت",id:"crq-cad-shape-azimuth",value:0,step:"0.1"}]);form.appendChild(rect);
    var square=block("crq-cad-shape-square");square.style.display="none";fields(square,[{label:"طول ضلع",id:"crq-cad-shape-side",value:10,cols:"col-6"},{label:"آزیموت",id:"crq-cad-shape-square-azimuth",value:0,step:"0.1",cols:"col-6"}]);form.appendChild(square);
    var circle=block("crq-cad-shape-circle");circle.style.display="none";fields(circle,[{label:"شعاع",id:"crq-cad-shape-radius",value:5,cols:"col-6"},{label:"تعداد رأس",id:"crq-cad-shape-segments",value:48,step:"1",cols:"col-6"}]);form.appendChild(circle);
    var custom=block("crq-cad-shape-custom");custom.style.display="none";custom.appendChild(label("طول ضلع، آزیموت (هر ضلع یک سطر)","crq-cad-shape-sides"));
    var textarea=document.createElement("textarea");textarea.id="crq-cad-shape-sides";textarea.rows=3;textarea.dir="ltr";textarea.className="form-control form-control-sm";textarea.style.textAlign="left";textarea.placeholder="20,90\n10,180\n20,270\n10,0";custom.appendChild(textarea);form.appendChild(custom);
    var meta=document.createElement("div");meta.className="row g-1 mt-1";
    var elevCol=document.createElement("div");elevCol.className="col-4";elevCol.appendChild(label("ارتفاع Z","crq-cad-shape-elev"));elevCol.appendChild(input("crq-cad-shape-elev","number",0,"0.1"));
    var nameCol=document.createElement("div");nameCol.className="col-8";nameCol.appendChild(label("نام لایه","crq-cad-shape-name"));var nm=document.createElement("input");nm.id="crq-cad-shape-name";nm.type="text";nm.className="form-control form-control-sm";nm.value="ساختمان پیشنهادی";nameCol.appendChild(nm);meta.appendChild(elevCol);meta.appendChild(nameCol);form.appendChild(meta);
    var meta2=document.createElement("div");meta2.className="row g-1 mt-1";
    var catCol=document.createElement("div");catCol.className="col-8";catCol.appendChild(label("نوع عارضه","crq-cad-shape-category"));
    var cat=document.createElement("select");cat.id="crq-cad-shape-category";cat.className="form-select form-select-sm";
    [["FACILITY","ابنیه/تأسیسات"],["PROJECT_AREA","محل اجرای طرح"],["GREENHOUSE","گلخانه/سالن"]].forEach(function(item){var o=document.createElement("option");o.value=item[0];o.textContent=item[1];cat.appendChild(o);});catCol.appendChild(cat);
    var colorCol=document.createElement("div");colorCol.className="col-4";colorCol.appendChild(label("رنگ","crq-cad-shape-color"));var color=input("crq-cad-shape-color","color","#b45309");color.className="form-control form-control-color form-control-sm w-100";colorCol.appendChild(color);
    meta2.appendChild(catCol);meta2.appendChild(colorCol);form.appendChild(meta2);
    var create=document.createElement("button");create.type="button";create.className="btn btn-sm btn-primary w-100 mt-2";create.textContent="ساخت شکل و افزودن لایه مستقل";create.addEventListener("click",function(){window.createCroquisCadOfflineShape();});form.appendChild(create);
    details.appendChild(form);more.appendChild(details);wrapper.appendChild(more);

    var statusBox=document.createElement("div");statusBox.id="crq-cad-offline-status";statusBox.className="small fw-bold";statusBox.textContent="ابزارهای ترسیم آفلاین آماده‌اند.";
    statusBox.style.cssText="position:absolute;right:10px;bottom:10px;z-index:1100;max-width:min(360px,calc(100% - 78px));padding:6px 9px;background:rgba(255,255,255,.94);border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 2px 8px rgba(15,23,42,.14);pointer-events:none;";
    wrapper.appendChild(statusBox);
  }

  function bindEvents(){
    var holder=document.getElementById("crq-cad-svg-container");if(!holder||holder.__croquisOfflineToolsBound)return;
    holder.__croquisOfflineToolsBound=true;
    holder.addEventListener("pointerdown",onPointerDown,true);
    document.addEventListener("pointermove",onPointerMove,true);
    document.addEventListener("pointerup",onPointerUp,true);
    document.addEventListener("pointercancel",onPointerUp,true);
  }
  function installRenderHook(){
    if(typeof window.renderCroquisVisualCanvas!=="function"||window.renderCroquisVisualCanvas.__offlineParityWrapped)return;
    var original=window.renderCroquisVisualCanvas;
    var wrapped=function(){var result=original.apply(this,arguments);drawOverlay();return result;};
    wrapped.__offlineParityWrapped=true;window.renderCroquisVisualCanvas=wrapped;
  }
  function initialize(){
    createUI();bindEvents();installRenderHook();setModeButtons();drawOverlay();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
  else initialize();
})();