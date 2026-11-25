/* Nezam 636 — Croquis workflow enhancements (additive, no storage/config migration) */
(function () {
  "use strict";

  var wholeMoveEnabled = false;
  var wholeMoveState = null;
  var wholeMoveMapBound = false;

  function activeMap() {
    return typeof getActiveCroquisMap === "function" ? getActiveCroquisMap() : null;
  }
  function activeLayer() {
    return typeof getActiveCroquisLayer === "function" ? getActiveCroquisLayer() : null;
  }
  function html(value) {
    return typeof safeHtmlText === "function"
      ? safeHtmlText(String(value == null ? "" : value))
      : String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
          return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
        });
  }
  function localizedNumber(value) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return NaN;
    if (typeof toEn === "function") raw = toEn(raw);
    return Number(raw);
  }
  function roundCm(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  window.computeStableUtmPolygonGeometry = function (points) {
    if (!Array.isArray(points) || points.length < 3) return { area: 0, ha: 0, perim: 0, sides: [] };
    var originX = Number(points[0].x), originY = Number(points[0].y);
    if (!Number.isFinite(originX) || !Number.isFinite(originY)) return null;
    var twiceArea = 0, perimeter = 0, sides = [];
    for (var i = 0; i < points.length; i++) {
      var j = (i + 1) % points.length;
      var ax = Number(points[i].x), ay = Number(points[i].y);
      var bx = Number(points[j].x), by = Number(points[j].y);
      if (![ax, ay, bx, by].every(Number.isFinite)) return null;
      twiceArea += (ax - originX) * (by - originY) - (bx - originX) * (ay - originY);
      var length = Math.hypot(bx - ax, by - ay);
      perimeter += length;
      sides.push({ from: i + 1, to: j + 1, len: length });
    }
    var area = Math.abs(twiceArea) / 2;
    return { area: area, ha: area / 10000, perim: perimeter, sides: sides };
  };

  function installStableAreaCalculator() {
    var original = window.computeUtmGeometry;
    if (typeof original !== "function" || original.__stableUtmAreaWrapped) return;
    var wrapped = function (points, geomType) {
      if ((geomType || "POLYGON") === "POLYGON" && Array.isArray(points) && points.length >= 3) {
        var stable = window.computeStableUtmPolygonGeometry(points);
        if (stable) return stable;
      }
      return original.apply(this, arguments);
    };
    wrapped.__stableUtmAreaWrapped = true;
    window.computeUtmGeometry = wrapped;
  }

  function displayNumber(value, decimals) {
    var n = Number(value);
    if (!Number.isFinite(n)) return "—";
    var s = n.toFixed(decimals == null ? 1 : decimals);
    return typeof toFa === "function" ? toFa(s) : s;
  }
  function getMapClearances(map) {
    if (!map) return [];
    if (!Array.isArray(map.clearances)) map.clearances = [];
    return map.clearances;
  }

  /* ---------- 1) Adjacent-distance / clearance register ---------- */
  function clearanceTitle(item) {
    var type = String(item.kind || "عارضه مجاور");
    var name = String(item.name || "").trim();
    return type + (name ? " — " + name : "");
  }

  window.renderCroquisClearances = function () {
    var map = activeMap();
    var holder = document.getElementById("crq-clearances-list");
    if (!holder || !map) return;
    var list = getMapClearances(map);
    if (!list.length) {
      holder.innerHTML = '<div class="small text-muted py-2">هنوز فاصله‌ای ثبت نشده است. مواردی مانند روستا، رودخانه، خطوط گاز، جاده و واحدهای تولیدی مجاور را اضافه کنید.</div>';
      return;
    }
    holder.innerHTML = list.map(function (item) {
      var id = html(item.id || "");
      var direction = item.direction ? " | جهت: " + html(item.direction) : "";
      var note = item.note ? '<div class="small text-muted">' + html(item.note) + '</div>' : "";
      return '<div class="d-flex justify-content-between align-items-center gap-2 border rounded bg-white p-2 mb-1">' +
        '<div class="min-w-0"><b class="small">' + html(clearanceTitle(item)) + '</b>' +
        '<div class="small text-success fw-bold">' + displayNumber(item.distance, 1) + ' متر' + direction + '</div>' + note + '</div>' +
        '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 flex-shrink-0" title="حذف فاصله" onclick="removeCroquisClearance(\'' + id + '\')">حذف</button>' +
        '</div>';
    }).join("");
  };

  window.addCroquisClearance = function () {
    var map = activeMap();
    if (!map) {
      alert("ابتدا پرونده و نقشه کروکی را انتخاب کنید.");
      return false;
    }
    var kindEl = document.getElementById("crq-clearance-kind");
    var nameEl = document.getElementById("crq-clearance-name");
    var distanceEl = document.getElementById("crq-clearance-distance");
    var directionEl = document.getElementById("crq-clearance-direction");
    var noteEl = document.getElementById("crq-clearance-note");
    var kind = kindEl ? kindEl.value : "سایر عوارض";
    var name = nameEl ? nameEl.value.trim() : "";
    var distance = localizedNumber(distanceEl && distanceEl.value);
    var direction = directionEl ? directionEl.value : "";
    var note = noteEl ? noteEl.value.trim() : "";

    if (!Number.isFinite(distance) || distance < 0 || distance > 1000000) {
      alert("فاصله را به متر و به‌صورت عدد معتبر وارد کنید.");
      return false;
    }
    if (!name && kind === "سایر عوارض") {
      alert("برای عارضه سفارشی، نام عارضه را وارد کنید.");
      return false;
    }
    var list = getMapClearances(map);
    list.push({
      id: "CLR-" + Date.now() + "-" + (list.length + 1),
      kind: kind,
      name: name,
      distance: Math.round(distance * 100) / 100,
      direction: direction,
      note: note,
      createdAt: new Date().toISOString()
    });
    if (nameEl) nameEl.value = "";
    if (distanceEl) distanceEl.value = "";
    if (noteEl) noteEl.value = "";
    if (typeof saveAllDB === "function") saveAllDB();
    window.renderCroquisClearances();
    if (typeof showToastMsg === "function") showToastMsg("فاصله حریم در مشخصات همین نقشه ذخیره شد.");
    return true;
  };

  window.removeCroquisClearance = function (id) {
    var map = activeMap();
    if (!map) return;
    map.clearances = getMapClearances(map).filter(function (item) {
      return String(item.id) !== String(id);
    });
    if (typeof saveAllDB === "function") saveAllDB();
    window.renderCroquisClearances();
  };

  function buildClearancePrintMarkup(map) {
    var list = getMapClearances(map);
    if (!list.length) return "";
    var rows = list.map(function (item) {
      return '<div class="croquis-clearance-print-item"><b>' + html(clearanceTitle(item)) +
        '</b><span>' + displayNumber(item.distance, 1) + ' متر</span>' +
        (item.direction ? '<small>جهت: ' + html(item.direction) + '</small>' : "") +
        (item.note ? '<small>' + html(item.note) + '</small>' : "") +
        '</div>';
    }).join("");
    return '<section class="croquis-clearances-print" aria-label="فواصل و حرایم پیرامونی">' +
      '<div class="croquis-clearances-print-title">فواصل و حرایم پیرامونی اعلام‌شده</div>' +
      '<div class="croquis-clearances-print-grid">' + rows + '</div>' +
      '<div class="croquis-clearances-print-note">فواصل فوق بر اساس اطلاعات ثبت‌شده در پرونده درج شده‌اند و در صورت نیاز باید با برداشت و استعلام مرجع ذی‌صلاح تطبیق داده شوند.</div>' +
      '</section>';
  }

  function getUtmCoordinateLayers(map) {
    var visible = (map && Array.isArray(map.layers) ? map.layers : []).filter(function (layer) {
      return layer && layer.visible && Array.isArray(layer.points) && layer.points.length > 0;
    });
    var selectedIds = typeof getCroquisCoordinatePrintLayerIds === "function"
      ? getCroquisCoordinatePrintLayerIds(map).map(String)
      : visible.map(function (layer) { return String(layer.id || ""); });
    return visible.filter(function (layer) {
      return selectedIds.indexOf(String(layer.id || "")) !== -1;
    }).map(function (layer) {
      var title = layer.category === "MAIN_PARCEL" ? "زمین اصلی" :
        (layer.category === "PROJECT_AREA" ? "محل اجرای طرح" : (layer.name || "لایه انتخاب‌شده"));
      return { title: title, layers: [layer] };
    });
  }

  function buildUtmPointsPrintMarkup(map) {
    var groups = getUtmCoordinateLayers(map);
    if (!groups.length) return "";
    var total = 0;
    groups.forEach(function (group) {
      group.layers.forEach(function (layer) { total += layer.points.length; });
    });
    var limit = 12;
    var left = limit;
    var body = "";
    groups.forEach(function (group) {
      if (left <= 0) return;
      var pointsHtml = "";
      group.layers.forEach(function (layer) {
        layer.points.forEach(function (point, index) {
          if (left <= 0) return;
          var zone = (map && map.utmZone) || "39R";
          if (typeof ensurePointEnriched === "function") {
            point = ensurePointEnriched(point, zone, index) || point;
          }
          var x = Number(point.x), y = Number(point.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return;
          var label = point.label || ("P" + (index + 1));
          pointsHtml += '<div class="croquis-utm-coordinate-point"><b>' + html(label) +
            '</b><span class="croquis-utm-coordinate-values" dir="ltr">X: ' + x.toFixed(2) +
            ' | Y: ' + y.toFixed(2) + '</span></div>';
          left--;
        });
      });
      if (pointsHtml) {
        body += '<div class="croquis-utm-coordinate-group"><div class="croquis-utm-coordinate-group-title">' +
          html(group.title) + '</div>' + pointsHtml + '</div>';
      }
    });
    var omitted = Math.max(0, total - limit);
    return '<section class="croquis-utm-points-print" aria-label="مختصات UTM لایه‌های انتخاب‌شده">' +
      '<div class="croquis-utm-points-title">مختصات UTM لایه‌های انتخاب‌شده</div>' + body +
      (omitted ? '<div class="croquis-utm-overlay-more">+' + omitted + ' نقطه دیگر؛ ادامه کامل در شیت دوم</div>' : '') +
      '</section>';
  }
  function decorateCroquisPrintPage() {
    var stage = document.getElementById("a4-preview-stage");
    if (!stage) return;
    var pages = stage.querySelectorAll(".a4-page");
    if (!pages.length) return;
    var page = pages[0];
    page.classList.add("croquis-map-landscape");
    page.setAttribute("data-page-kind", "croquis-map-landscape");
    page.setAttribute("data-paper-size", "A4");

    var map = activeMap();
    var holder = page.querySelector("#printed-croquis-map-holder");
    if (holder) {
      var layout = page.querySelector(".croquis-map-clearance-layout");
      if (!layout) {
        layout = document.createElement("div");
        layout.className = "croquis-map-clearance-layout";
        holder.parentNode.insertBefore(layout, holder);
        layout.appendChild(holder);
      }
      var sideInfo = layout.querySelector(".croquis-map-side-info");
      if (!sideInfo) {
        sideInfo = document.createElement("aside");
        sideInfo.className = "croquis-map-side-info";
        sideInfo.setAttribute("aria-label", "اطلاعات تکمیلی نقشه");
        layout.appendChild(sideInfo);
      }
      sideInfo.innerHTML = buildClearancePrintMarkup(map);
      holder.style.position = "relative";
      var coordinateBox = holder.querySelector(".croquis-utm-floating-box");
      if (!coordinateBox) {
        coordinateBox = document.createElement("div");
        coordinateBox.className = "croquis-utm-floating-box";
        coordinateBox.setAttribute("aria-label", "کادر مختصات UTM لایه‌های انتخاب‌شده");
        holder.appendChild(coordinateBox);
      }
      coordinateBox.innerHTML = buildUtmPointsPrintMarkup(map);
      coordinateBox.style.display = coordinateBox.innerHTML ? "block" : "none";
    }
    ensureLandscapeStyles();
  }

  /* ---------- 2) Exact polygon from side lengths + azimuths ---------- */
  function cross2(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }
  function between(v, a, b, tolerance) {
    var t = tolerance || 0;
    return v >= Math.min(a, b) - t && v <= Math.max(a, b) + t;
  }
  function segmentsTouchOrCross(a, b, c, d) {
    var eps = 1e-8;
    var abC = cross2(a, b, c), abD = cross2(a, b, d);
    var cdA = cross2(c, d, a), cdB = cross2(c, d, b);
    if (((abC > eps && abD < -eps) || (abC < -eps && abD > eps)) &&
        ((cdA > eps && cdB < -eps) || (cdA < -eps && cdB > eps))) return true;
    if (Math.abs(abC) <= eps && between(c.x, a.x, b.x, eps) && between(c.y, a.y, b.y, eps)) return true;
    if (Math.abs(abD) <= eps && between(d.x, a.x, b.x, eps) && between(d.y, a.y, b.y, eps)) return true;
    if (Math.abs(cdA) <= eps && between(a.x, c.x, d.x, eps) && between(a.y, c.y, d.y, eps)) return true;
    if (Math.abs(cdB) <= eps && between(b.x, c.x, d.x, eps) && between(b.y, c.y, d.y, eps)) return true;
    return false;
  }
  function isSimpleUtmPolygon(points) {
    var n = points.length;
    for (var i = 0; i < n; i++) {
      var i2 = (i + 1) % n;
      for (var j = i + 1; j < n; j++) {
        var j2 = (j + 1) % n;
        if (i === j || i2 === j || j2 === i) continue;
        if (segmentsTouchOrCross(points[i], points[i2], points[j], points[j2])) return false;
      }
    }
    return true;
  }

  window.buildExactUtmPolygonFromSides = function (startX, startY, sides, zone, elevation) {
    var sx = Number(startX), sy = Number(startY);
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) throw new Error("مختصات شروع X و Y معتبر نیست.");
    if (!Array.isArray(sides) || sides.length < 3 || sides.length > 100) {
      throw new Error("برای چندضلعی بین ۳ تا ۱۰۰ ضلع وارد کنید.");
    }
    var current = { x: sx, y: sy };
    var points = [];
    var perimeter = 0;
    for (var i = 0; i < sides.length; i++) {
      var length = Number(sides[i] && sides[i].length);
      var azimuth = Number(sides[i] && sides[i].azimuth);
      if (!Number.isFinite(length) || length <= 0 || length > 100000) {
        throw new Error("طول ضلع " + (i + 1) + " باید عددی بزرگ‌تر از صفر و حداکثر ۱۰۰ کیلومتر باشد.");
      }
      if (!Number.isFinite(azimuth)) throw new Error("آزیموت ضلع " + (i + 1) + " معتبر نیست.");
      azimuth = ((azimuth % 360) + 360) % 360;
      // Keep sub-centimetre values here: side-length input may include millimetres.
      points.push({
        x: Math.round(current.x * 10000) / 10000,
        y: Math.round(current.y * 10000) / 10000,
        elev: Number.isFinite(Number(elevation)) ? Number(elevation) : 0,
        zone: zone || "39R",
        label: "P" + (i + 1)
      });
      var radians = azimuth * Math.PI / 180;
      current = {
        x: current.x + length * Math.sin(radians),
        y: current.y + length * Math.cos(radians)
      };
      perimeter += length;
    }
    var closureError = Math.hypot(current.x - sx, current.y - sy);
    if (closureError > 0.15) {
      throw new Error("پلیگون بسته نیست؛ خطای بست " + closureError.toFixed(2) + " متر است. آزیموت یا طول ضلع آخر را اصلاح کنید (حد مجاز ۰٫۱۵ متر).");
    }
    if (!isSimpleUtmPolygon(points)) throw new Error("اضلاع چندضلعی همدیگر را قطع می‌کنند؛ ترتیب اضلاع یا آزیموت‌ها را اصلاح کنید.");
    // Use a local origin for the shoelace calculation to avoid cancellation
    // when UTM coordinates are large (e.g. X≈700,000 and Y≈3,200,000).
    var twiceArea = 0;
    var originX = points[0].x, originY = points[0].y;
    for (var p = 0; p < points.length; p++) {
      var q = (p + 1) % points.length;
      var px = points[p].x - originX, py = points[p].y - originY;
      var qx = points[q].x - originX, qy = points[q].y - originY;
      twiceArea += px * qy - qx * py;
    }
    var area = Math.abs(twiceArea) / 2;
    if (!Number.isFinite(area) || area < 0.01) throw new Error("مساحت چندضلعی صفر یا نامعتبر است.");
    return {
      points: points,
      area: area,
      perimeter: perimeter,
      closureError: closureError,
      sideCount: points.length
    };
  };

  window.createExactPolygonInActiveLayer = function () {
    var map = activeMap();
    var layer = activeLayer();
    if (!map || !layer) {
      alert("ابتدا یک نقشه و لایه فعال انتخاب کنید.");
      return false;
    }
    if (layer.category === "MAIN_PARCEL") {
      alert("برای حفظ مرز زمین اصلی، این ابزار روی لایه زمین اصلی اجرا نمی‌شود. ابتدا لایه محل اجرای طرح یا یک لایه جدید انتخاب کنید.");
      return false;
    }
    var startX = localizedNumber(document.getElementById("crq-poly-start-x") && document.getElementById("crq-poly-start-x").value);
    var startY = localizedNumber(document.getElementById("crq-poly-start-y") && document.getElementById("crq-poly-start-y").value);
    var raw = (document.getElementById("crq-exact-poly-sides") || {}).value || "";
    var lines = raw.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    var sides = [];
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split(/[,،;\s]+/).filter(Boolean);
      if (parts.length !== 2) {
        alert("سطر " + (i + 1) + " باید به شکل «طول ضلع، آزیموت» باشد؛ مانند 45,90.");
        return false;
      }
      sides.push({
        length: localizedNumber(parts[0]),
        azimuth: localizedNumber(parts[1])
      });
    }
    var zone = (map.utmZone || "39R");
    var elev = localizedNumber((document.getElementById("crq-poly-elevation") || {}).value || "0");
    var result;
    try {
      result = window.buildExactUtmPolygonFromSides(startX, startY, sides, zone, elev);
    } catch (error) {
      var msg = error && error.message ? error.message : "ورودی چندضلعی معتبر نیست.";
      var status = document.getElementById("crq-exact-poly-status");
      if (status) status.textContent = "❌ " + msg;
      alert(msg);
      return false;
    }
    if (Array.isArray(layer.points) && layer.points.length &&
        !confirm("لایه فعال دارای رأس است. هندسه فعلی با چندضلعی دقیق جدید جایگزین شود؟")) return false;

    layer.geomType = "POLYGON";
    layer.points = result.points;
    var typeEditor = document.getElementById("edit-lyr-type");
    if (typeEditor) typeEditor.value = "POLYGON";
    if (typeof ensurePointEnriched === "function") {
      layer.points.forEach(function (point, index) {
        ensurePointEnriched(point, zone, index);
      });
    }
    if (typeof saveActiveLayerStyleAndMeta === "function") saveActiveLayerStyleAndMeta();
    else if (typeof saveAllDB === "function") saveAllDB();

    var statusBox = document.getElementById("crq-exact-poly-status");
    if (statusBox) statusBox.textContent =
      "✅ چندضلعی ثبت شد | " + result.sideCount + " ضلع | مساحت " +
      displayNumber(result.area, 2) + " مترمربع | محیط " +
      displayNumber(result.perimeter, 2) + " متر | خطای بست " +
      displayNumber(result.closureError, 3) + " متر";
    if (typeof showToastMsg === "function") showToastMsg("چندضلعی با طول ضلع‌ها و آزیموت‌های واردشده ساخته و در لایه فعال ذخیره شد.");
    return true;
  };

  window.translateUtmPolygon = function (points, deltaX, deltaY) {
    if (!Array.isArray(points)) return [];
    return points.map(function (point) {
      var copy = Object.assign({}, point);
      copy.x = roundCm(Number(point.x) + Number(deltaX));
      copy.y = roundCm(Number(point.y) + Number(deltaY));
      return copy;
    });
  };

  /* ---------- 3) Move the selected polygon as a rigid UTM object ---------- */
  function findRenderedPolygonForLayer(layer, map) {
    if (!window.L || !window.leafletLayerGroupObj || !layer || !Array.isArray(layer.points)) return null;
    var candidates = window.leafletLayerGroupObj.getLayers ? window.leafletLayerGroupObj.getLayers() : [];
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      if (!(candidate instanceof window.L.Polygon) || typeof candidate.getLatLngs !== "function") continue;
      var latlngs = candidate.getLatLngs();
      if (Array.isArray(latlngs[0])) latlngs = latlngs[0];
      if (!Array.isArray(latlngs) || latlngs.length !== layer.points.length) continue;
      var same = true;
      for (var j = 0; j < latlngs.length; j++) {
        var point = layer.points[j];
        if (!Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) {
          if (typeof ensurePointEnriched === "function") ensurePointEnriched(point, map.utmZone || "39R", j);
        }
        if (Math.abs(Number(latlngs[j].lat) - Number(point.lat)) > 0.00002 ||
            Math.abs(Number(latlngs[j].lng) - Number(point.lng)) > 0.00002) {
          same = false;
          break;
        }
      }
      if (same) return candidate;
    }
    return null;
  }

  function stopLeafletEvent(event) {
    if (window.L && window.L.DomEvent && event && event.originalEvent) {
      window.L.DomEvent.stop(event.originalEvent);
    }
  }

  function wholeMoveMouseDown(event) {
    if (!wholeMoveEnabled || wholeMoveState || !event || !event.latlng) return;
    if (typeof croquisOnlineDrawMode !== "undefined" && croquisOnlineDrawMode) return;
    var map = activeMap();
    var layer = activeLayer();
    if (!map || !layer || layer.geomType !== "POLYGON" || !Array.isArray(layer.points) || layer.points.length < 3) {
      if (typeof croquisMapSetToolStatus === "function") croquisMapSetToolStatus("لایه فعال باید یک چندضلعی با حداقل سه رأس باشد.", true);
      return;
    }
    if (typeof croquisMapVertexEditEnabled !== "undefined" && croquisMapVertexEditEnabled) {
      if (typeof croquisMapSetToolStatus === "function") croquisMapSetToolStatus("ابتدا ویرایش رأس‌های جداگانه را خاموش کنید؛ سپس جابه‌جایی کل چندضلعی را انجام دهید.", true);
      return;
    }
    var zoneNum = parseInt(map.utmZone, 10) || 39;
    var clicked = latLngToUtmWGS84(event.latlng.lat, event.latlng.lng, zoneNum);
    if (typeof isPointInPolygon2D === "function" && !isPointInPolygon2D(clicked, layer.points)) return;
    var polygon = findRenderedPolygonForLayer(layer, map);
    if (!polygon) {
      if (typeof croquisMapSetToolStatus === "function") croquisMapSetToolStatus("چندضلعی لایه فعال روی نقشه پیدا نشد؛ نقشه را یک‌بار بازخوانی کنید.", true);
      return;
    }
    wholeMoveState = {
      layerId: layer.id,
      startX: clicked.x,
      startY: clicked.y,
      originalPoints: layer.points.map(function (point) { return Object.assign({}, point); }),
      polygon: polygon,
      deltaX: 0,
      deltaY: 0,
      center: window.leafletMapObj.getCenter(),
      zoom: window.leafletMapObj.getZoom()
    };
    stopLeafletEvent(event);
    if (typeof croquisMapSetToolStatus === "function") croquisMapSetToolStatus("در حال جابه‌جایی کل چندضلعی؛ ماوس را رها کنید تا مختصات UTM همه رأس‌ها به‌روزرسانی و ذخیره شود.");
  }

  function wholeMoveMouseMove(event) {
    if (!wholeMoveEnabled || !wholeMoveState || !event || !event.latlng) return;
    var map = activeMap();
    if (!map) return;
    var zoneNum = parseInt(map.utmZone, 10) || 39;
    var current = latLngToUtmWGS84(event.latlng.lat, event.latlng.lng, zoneNum);
    var dx = current.x - wholeMoveState.startX;
    var dy = current.y - wholeMoveState.startY;
    wholeMoveState.deltaX = dx;
    wholeMoveState.deltaY = dy;
    var moved = window.translateUtmPolygon(wholeMoveState.originalPoints, dx, dy);
    var latlngs = moved.map(function (point) {
      var geo = utmToLatLngWGS84(point.x, point.y, zoneNum, map.hemisphere !== "S");
      return [geo.lat, geo.lng];
    });
    wholeMoveState.polygon.setLatLngs(latlngs);
    if (typeof wholeMoveState.polygon.redraw === "function") wholeMoveState.polygon.redraw();
    stopLeafletEvent(event);
  }

  function wholeMoveMouseUp(event) {
    if (!wholeMoveState) return;
    var state = wholeMoveState;
    wholeMoveState = null;
    var map = activeMap();
    var layer = activeLayer();
    if (!map || !layer || String(layer.id) !== String(state.layerId)) {
      if (state.polygon && typeof state.polygon.setLatLngs === "function") {
        state.polygon.setLatLngs(state.originalPoints.map(function (point) {
          var geo = utmToLatLngWGS84(point.x, point.y, parseInt(map && map.utmZone, 10) || 39, true);
          return [geo.lat, geo.lng];
        }));
      }
      return;
    }
    var dx = Number(state.deltaX) || 0;
    var dy = Number(state.deltaY) || 0;
    if (Math.hypot(dx, dy) < 0.01) {
      if (typeof croquisMapSetToolStatus === "function") croquisMapSetToolStatus("جابه‌جایی انجام نشد؛ چندضلعی به محل اولیه بازگشت.");
      if (window.leafletMapObj) renderCroquisLeafletMap({ preserveView: true, center: state.center, zoom: state.zoom });
      return;
    }
    layer.points = window.translateUtmPolygon(state.originalPoints, dx, dy);
    layer.points.forEach(function (point, index) {
      if (typeof ensurePointEnriched === "function") ensurePointEnriched(point, map.utmZone || "39R", index);
    });
    if (typeof saveActiveLayerStyleAndMeta === "function") saveActiveLayerStyleAndMeta();
    else if (typeof saveAllDB === "function") saveAllDB();
    if (typeof renderCroquisLeafletMap === "function") {
      renderCroquisLeafletMap({ preserveView: true, center: state.center, zoom: state.zoom });
    }
    if (typeof croquisMapSetToolStatus === "function") {
      croquisMapSetToolStatus("✅ چندضلعی جابه‌جا شد؛ مختصات UTM هر " + layer.points.length + " رأس به‌روزرسانی و ذخیره شد. جابه‌جایی بعدی را می‌توانید انجام دهید.");
    }
    stopLeafletEvent(event);
  }

  function bindWholeMoveHandlers() {
    var map = window.leafletMapObj;
    if (!map || map.__nezamWholePolygonMoveBound || typeof map.on !== "function") return;
    map.on("mousedown", wholeMoveMouseDown);
    map.on("mousemove", wholeMoveMouseMove);
    map.on("mouseup", wholeMoveMouseUp);
    map.__nezamWholePolygonMoveBound = true;
    if (wholeMoveEnabled && map.dragging) map.dragging.disable();
  }

  window.toggleCroquisWholePolygonMove = function (force) {
    var layer = activeLayer();
    if (!layer || layer.geomType !== "POLYGON" || !Array.isArray(layer.points) || layer.points.length < 3) {
      alert("ابتدا لایه یک چندضلعی را انتخاب کنید.");
      return false;
    }
    if (typeof croquisOnlineDrawMode !== "undefined" && croquisOnlineDrawMode) {
      alert("ابتدا ترسیم جاری را تمام یا لغو کنید.");
      return false;
    }
    if (typeof croquisViewMode !== "undefined" && croquisViewMode !== "MAP" &&
        typeof switchCroquisViewMode === "function") {
      switchCroquisViewMode("MAP");
    }
    wholeMoveEnabled = typeof force === "boolean" ? force : !wholeMoveEnabled;
    bindWholeMoveHandlers();
    if (window.leafletMapObj && window.leafletMapObj.dragging) {
      if (wholeMoveEnabled) window.leafletMapObj.dragging.disable();
      else window.leafletMapObj.dragging.enable();
    }
    var button = document.getElementById("crq-map-move-polygon-btn");
    if (button) {
      button.className = "btn btn-sm " + (wholeMoveEnabled ? "btn-warning fw-bold" : "btn-outline-warning");
      button.textContent = wholeMoveEnabled ? "✥ جابه‌جایی کل چندضلعی: روشن" : "✥ جابه‌جایی کل چندضلعی";
      button.setAttribute("aria-pressed", wholeMoveEnabled ? "true" : "false");
    }
    if (typeof croquisMapSetToolStatus === "function") {
      croquisMapSetToolStatus(wholeMoveEnabled
        ? "حالت جابه‌جایی فعال است: داخل چندضلعیِ لایه انتخاب‌شده کلیک کنید و بکشید؛ با رها کردن ماوس، تمام نقاط UTM ذخیره می‌شوند."
        : "حالت جابه‌جایی کل چندضلعی خاموش شد؛ حرکت عادی نقشه فعال است.");
    }
    return true;
  };

  /* ---------- 4) A4 landscape map sheet, with tables kept on page two ---------- */
  function landscapeCss() {
    return [
      "@page croquisMapLandscape { size: A4 landscape; margin: 0; }",
      ".a4-page.croquis-map-landscape { page: croquisMapLandscape; width:297mm !important; min-width:297mm !important; max-width:297mm !important; height:210mm !important; min-height:210mm !important; max-height:210mm !important; margin:0 auto 8mm !important; }",
      ".a4-page.croquis-map-landscape .lh-top { padding:2mm 5mm !important; min-height:19mm !important; }",
      ".a4-page.croquis-map-landscape .lh-body { padding:2mm 5mm !important; min-height:0 !important; overflow:hidden !important; }",
      ".a4-page.croquis-map-landscape .lh-content-wrap { overflow:visible !important; }",
      ".a4-page.croquis-map-landscape .sign-area { display:none !important; }",
      ".a4-page.croquis-map-landscape .lh-foot { padding:1.5mm 5mm !important; font-size:7pt !important; }",
      ".a4-page.croquis-map-landscape .croquis-map-clearance-layout { display:flex !important; flex-direction:row !important; align-items:stretch !important; gap:2mm !important; width:100% !important; direction:ltr !important; }",
      ".a4-page.croquis-map-landscape #printed-croquis-map-holder { flex:1 1 auto !important; min-width:0 !important; margin:0 !important; }",
      ".a4-page.croquis-map-landscape .printed-croquis-satellite-box { border-width:1px !important; border-radius:3px !important; }",
      ".a4-page.croquis-map-landscape .printed-croquis-satellite-box > svg { width:100% !important; max-width:100% !important; max-height:145mm !important; height:auto !important; }",
      ".a4-page.croquis-map-landscape .croquis-map-side-info { flex:0 0 56mm !important; max-width:56mm !important; min-width:56mm !important; display:flex !important; flex-direction:column !important; align-items:stretch !important; gap:1.5mm !important; direction:rtl !important; min-height:0 !important; max-height:100% !important; overflow:hidden !important; }",
      ".a4-page.croquis-map-landscape .croquis-clearances-print { flex:0 0 auto !important; width:100% !important; max-width:100% !important; min-width:0 !important; margin:0 !important; padding:1.2mm !important; direction:rtl !important; overflow:hidden !important; }",
      ".a4-page.croquis-map-landscape .croquis-clearances-print-title { font-size:7.6pt !important; margin-bottom:.7mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-clearances-print-grid { display:flex !important; flex-direction:column !important; align-items:stretch !important; gap:.45mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-clearance-print-item { display:block !important; padding:.45mm .8mm !important; font-size:6.3pt !important; line-height:1.25 !important; }",
      ".a4-page.croquis-map-landscape .croquis-clearance-print-item span { display:block !important; }",
      ".a4-page.croquis-map-landscape .croquis-clearances-print-note { font-size:5.4pt !important; line-height:1.2 !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-points-print { flex:1 1 auto !important; min-height:0 !important; width:100% !important; border:1px solid #64748b !important; border-radius:3px !important; background:#f8fafc !important; padding:1.1mm !important; direction:rtl !important; overflow:hidden !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-points-title { font-size:7.8pt !important; font-weight:900 !important; color:#14532d !important; margin-bottom:.7mm !important; text-align:right !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-group { margin-bottom:.8mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-group-title { font-size:6.8pt !important; font-weight:900 !important; color:#1e3a8a !important; border-bottom:1px solid #cbd5e1 !important; padding-bottom:.3mm !important; margin-bottom:.4mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-layer-name { font-size:5.8pt !important; font-weight:700 !important; margin:.3mm 0 !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-point { display:grid !important; grid-template-columns:7mm minmax(0,1fr) !important; align-items:center !important; column-gap:.7mm !important; padding:.25mm .4mm !important; border-bottom:1px dotted #d4dce6 !important; font-size:5.7pt !important; line-height:1.15 !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-point > b { grid-row:1 / span 2 !important; color:#0f5132 !important; font-size:5.8pt !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-values { display:flex !important; justify-content:space-between !important; gap:.7mm !important; white-space:nowrap !important; font-family:monospace !important; font-size:5.6pt !important; color:#172033 !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-coordinate-point > small { grid-column:2 !important; font-size:4.9pt !important; color:#64748b !important; line-height:1 !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box { position:absolute !important; z-index:40 !important; top:3mm !important; right:3mm !important; width:66mm !important; max-width:66mm !important; max-height:82mm !important; overflow:hidden !important; box-shadow:0 1mm 3mm rgba(0,0,0,.22) !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-points-print { display:block !important; width:100% !important; max-width:100% !important; margin:0 !important; border:1px solid #475569 !important; border-radius:3px !important; background:rgba(255,255,255,.97) !important; padding:1.4mm !important; direction:rtl !important; overflow:hidden !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-points-title { font-size:8pt !important; font-weight:900 !important; margin-bottom:.8mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-coordinate-group { margin-bottom:.5mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-coordinate-group-title { font-size:6.5pt !important; margin-bottom:.3mm !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-coordinate-point { display:grid !important; grid-template-columns:9mm minmax(0,1fr) !important; padding:.25mm .4mm !important; font-size:5.8pt !important; line-height:1.15 !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-coordinate-values { display:block !important; white-space:nowrap !important; font-size:5.7pt !important; }",
      ".a4-page.croquis-map-landscape .croquis-utm-floating-box .croquis-utm-overlay-more { display:block !important; margin-top:.5mm !important; padding-top:.5mm !important; border-top:1px dotted #64748b !important; font-size:6pt !important; font-weight:900 !important; color:#1e40af !important; }",
      ".croquis-clearances-print { border:1px solid #64748b; border-radius:3px; background:#f8fafc; padding:1.5mm 2mm; margin:2mm 0; direction:rtl; page-break-inside:avoid; break-inside:avoid; }",
      ".croquis-clearances-print-title { font-weight:900; font-size:8.5pt; color:#14532d; margin-bottom:1mm; }",
      ".croquis-clearances-print-grid { display:flex; flex-wrap:wrap; gap:1mm 2mm; }",
      ".croquis-clearance-print-item { display:flex; flex-wrap:wrap; align-items:center; gap:1mm 2mm; padding:.7mm 1.5mm; border:1px solid #cbd5e1; border-radius:3px; background:#fff; font-size:7.8pt; }",
      ".croquis-clearance-print-item span { font-weight:900; color:#166534; }",
      ".croquis-clearance-print-item small { color:#475569; }",
      ".croquis-clearances-print-note { margin-top:.8mm; color:#475569; font-size:6.7pt; }",
      "@media screen { .a4-page.croquis-map-landscape { margin-left:auto !important; margin-right:auto !important; } }",
      "@media print {",
      "html, body { width:auto !important; min-width:0 !important; max-width:none !important; }",
      "#pane-print, .a4-stage-bg, #a4-preview-stage { width:auto !important; min-width:0 !important; max-width:none !important; overflow:visible !important; }",
      "#a4-preview-stage .a4-page.croquis-map-landscape, .a4-page.croquis-map-landscape, .a4-page.croquis-map-landscape.paper-a5 { page:croquisMapLandscape !important; width:297mm !important; min-width:297mm !important; max-width:297mm !important; height:210mm !important; min-height:210mm !important; max-height:210mm !important; margin:0 !important; page-break-after:always !important; break-after:page !important; }",
      ".a4-page.croquis-map-landscape .lh-body { overflow:hidden !important; }",
      "}"
    ].join("\n");
  }

  function ensureLandscapeStyles() {
    var css = landscapeCss();
    var style = document.getElementById("nezam-croquis-enhancement-styles");
    if (!style) {
      style = document.createElement("style");
      style.id = "nezam-croquis-enhancement-styles";
      document.head.appendChild(style);
    }
    style.textContent = css;
    var dynamic = document.getElementById("dynamic-print-page-style");
    if (dynamic && dynamic.textContent.indexOf("@page croquisMapLandscape") === -1) {
      dynamic.textContent += "\n" + css;
    }
  }

  function installPrintHooks() {
    if (typeof window.buildPaperExportCss === "function" && !window.buildPaperExportCss.__croquisLandscapeWrapped) {
      var originalBuildCss = window.buildPaperExportCss;
      var wrappedBuildCss = function () {
        return originalBuildCss.apply(this, arguments) + "\n" + landscapeCss();
      };
      wrappedBuildCss.__croquisLandscapeWrapped = true;
      window.buildPaperExportCss = wrappedBuildCss;
    }
    if (typeof window.applyDynamicPrintPageSizeCSS === "function" && !window.applyDynamicPrintPageSizeCSS.__croquisLandscapeWrapped) {
      var originalApplyCss = window.applyDynamicPrintPageSizeCSS;
      var wrappedApplyCss = function () {
        var result = originalApplyCss.apply(this, arguments);
        ensureLandscapeStyles();
        return result;
      };
      wrappedApplyCss.__croquisLandscapeWrapped = true;
      window.applyDynamicPrintPageSizeCSS = wrappedApplyCss;
    }
    if (typeof window.printUtmSketchSheet === "function" && !window.printUtmSketchSheet.__croquisLandscapeWrapped) {
      var originalPrint = window.printUtmSketchSheet;
      var wrappedPrint = function () {
        var result = originalPrint.apply(this, arguments);
        // Do not accidentally rotate a prior letter/form if printing was cancelled
        // or an active applicant has not yet been selected.
        if (typeof currentPreviewMode !== "undefined" && currentPreviewMode === "CROQUIS") {
          decorateCroquisPrintPage();
        }
        return result;
      };
      wrappedPrint.__croquisLandscapeWrapped = true;
      window.printUtmSketchSheet = wrappedPrint;
    }
  }

  function installWorkspaceHook() {
    if (typeof window.initCroquisWorkspaceForActiveCase !== "function" ||
        window.initCroquisWorkspaceForActiveCase.__croquisClearanceWrapped) return;
    var originalInit = window.initCroquisWorkspaceForActiveCase;
    var wrappedInit = function () {
      var result = originalInit.apply(this, arguments);
      window.renderCroquisClearances();
      return result;
    };
    wrappedInit.__croquisClearanceWrapped = true;
    window.initCroquisWorkspaceForActiveCase = wrappedInit;
  }

  function installLeafletRenderHook() {
    if (typeof window.renderCroquisLeafletMap !== "function" ||
        window.renderCroquisLeafletMap.__croquisWholeMoveWrapped) return;
    var originalRender = window.renderCroquisLeafletMap;
    var wrappedRender = function () {
      var result = originalRender.apply(this, arguments);
      bindWholeMoveHandlers();
      return result;
    };
    wrappedRender.__croquisWholeMoveWrapped = true;
    window.renderCroquisLeafletMap = wrappedRender;
  }

  function initialize() {
    installWorkspaceHook();
    installPrintHooks();
    installLeafletRenderHook();
    installStableAreaCalculator();
    ensureLandscapeStyles();
    window.renderCroquisClearances();
    bindWholeMoveHandlers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
