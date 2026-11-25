/* Nezam 636 — CAD/SVG view tools: focus, declutter, standard drawing scales and pan */
(function () {
  "use strict";

  var SCALE_OPTIONS = ["AUTO", "500", "1000", "2000", "2500", "5000", "10000", "25000", "50000"];
  var DEFAULTS = {
    focusMode: "MAIN",
    scaleDenominator: "AUTO",
    zoomPercent: 100,
    panX: 0,
    panY: 0,
    showPointLabels: false,
    showSideLengths: false,
    showLayerLabels: false,
    showPrevailingWind: false,
    prevailingWindFromDeg: 315
  };

  function activeMap() {
    return typeof getActiveCroquisMap === "function" ? getActiveCroquisMap() : null;
  }
  function activeLayerId() {
    return typeof activeCroquisLayerId !== "undefined" ? activeCroquisLayerId : "";
  }
  function safeText(value) {
    return typeof safeHtmlText === "function" ? safeHtmlText(String(value == null ? "" : value)) :
      String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
      });
  }
  function fa(value) {
    return typeof toFa === "function" ? toFa(String(value)) : String(value);
  }
  function viewOptions(map) {
    if (!map) return Object.assign({}, DEFAULTS);
    if (!map.cadView || typeof map.cadView !== "object") map.cadView = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      if (typeof map.cadView[key] === "undefined") map.cadView[key] = DEFAULTS[key];
    });
    if (SCALE_OPTIONS.indexOf(String(map.cadView.scaleDenominator)) === -1) map.cadView.scaleDenominator = "AUTO";
    if (["MAIN", "ACTIVE", "ALL"].indexOf(map.cadView.focusMode) === -1) map.cadView.focusMode = "MAIN";
    map.cadView.zoomPercent = Math.min(200, Math.max(50, Number(map.cadView.zoomPercent) || 100));
    map.cadView.panX = Math.max(-1000, Math.min(1000, Number(map.cadView.panX) || 0));
    map.cadView.panY = Math.max(-1000, Math.min(1000, Number(map.cadView.panY) || 0));
    var windDeg = Number(map.cadView.prevailingWindFromDeg);
    if (!Number.isFinite(windDeg)) windDeg = 315;
    map.cadView.prevailingWindFromDeg = ((windDeg % 360) + 360) % 360;
    map.cadView.showPrevailingWind = !!map.cadView.showPrevailingWind;
    return map.cadView;
  }

  var WIND_COMPASS_16 = [
    { deg: 0, name: "شمال" },
    { deg: 22.5, name: "شمال‌شمال‌شرق" },
    { deg: 45, name: "شمال‌شرق" },
    { deg: 67.5, name: "شرق‌شمال‌شرق" },
    { deg: 90, name: "شرق" },
    { deg: 112.5, name: "شرق‌جنوب‌شرق" },
    { deg: 135, name: "جنوب‌شرق" },
    { deg: 157.5, name: "جنوب‌جنوب‌شرق" },
    { deg: 180, name: "جنوب" },
    { deg: 202.5, name: "جنوب‌جنوب‌غرب" },
    { deg: 225, name: "جنوب‌غرب" },
    { deg: 247.5, name: "غرب‌جنوب‌غرب" },
    { deg: 270, name: "غرب" },
    { deg: 292.5, name: "غرب‌شمال‌غرب" },
    { deg: 315, name: "شمال‌غرب" },
    { deg: 337.5, name: "شمال‌شمال‌غرب" }
  ];

  window.describeCroquisPrevailingWind = function (directionFromDeg) {
    var fromDeg = Number(directionFromDeg);
    if (!Number.isFinite(fromDeg)) throw new Error("زاویه باد معتبر نیست.");
    fromDeg = ((fromDeg % 360) + 360) % 360;
    var sector = Math.round(fromDeg / 22.5) % 16;
    var fromName = WIND_COMPASS_16[sector].name;
    var toDeg = (fromDeg + 180) % 360;
    var toName = WIND_COMPASS_16[(sector + 8) % 16].name;
    var flowRadians = toDeg * Math.PI / 180;
    return {
      fromDeg: fromDeg,
      toDeg: toDeg,
      fromName: fromName,
      toName: toName,
      // SVG screen coordinates: x increases east, y increases south.
      dx: Math.sin(flowRadians),
      dy: -Math.cos(flowRadians)
    };
  };

  function selectedLayers(map, mode) {
    var visible = (map.layers || []).filter(function (layer) {
      return layer && layer.visible !== false && Array.isArray(layer.points) && layer.points.length;
    });
    if (mode === "ACTIVE") {
      var active = visible.find(function (layer) { return String(layer.id) === String(activeLayerId()); });
      if (active) return [active];
    }
    if (mode === "MAIN") {
      var main = visible.filter(function (layer) { return layer.category === "MAIN_PARCEL"; });
      if (main.length) return main;
    }
    return visible;
  }

  function niceDistance(target) {
    if (!Number.isFinite(target) || target <= 0) return 1;
    var power = Math.pow(10, Math.floor(Math.log10(target)));
    var fraction = target / power;
    var factor = fraction >= 7.5 ? 10 : (fraction >= 3.5 ? 5 : (fraction >= 1.5 ? 2 : 1));
    return factor * power;
  }

  function getScaleForCanvas(view, svgW, svgH, spanX, spanY, pad, forPrint) {
    var zoom = (Number(view.zoomPercent) || 100) / 100;
    var denominator = String(view.scaleDenominator || "AUTO");
    var scale;
    if (denominator === "AUTO") {
      scale = Math.min((svgW - 2 * pad) / Math.max(spanX, 20), (svgH - 2 * pad) / Math.max(spanY, 20));
    } else {
      var d = Number(denominator);
      // The drawable inner frame is the scale reference. Keep its physical
      // width fixed and derive height from the SVG aspect ratio so the chosen
      // standard scale is not silently distorted by vertical fitting.
      var physicalWidthMm = forPrint ? 270 : 250;
      var physicalHeightMm = physicalWidthMm * (svgH - 2 * pad) / (svgW - 2 * pad);
      scale = Math.min(
        (svgW - 2 * pad) / (physicalWidthMm * d / 1000),
        (svgH - 2 * pad) / (physicalHeightMm * d / 1000)
      );
    }
    scale *= zoom;
    return Math.max(0.000001, scale);
  }

  window.calculateCroquisCadScale = function (scaleDenominator, zoomPercent, svgW, svgH, forPrint) {
    var view = {
      scaleDenominator: SCALE_OPTIONS.indexOf(String(scaleDenominator)) !== -1 ? String(scaleDenominator) : "AUTO",
      zoomPercent: Math.min(200, Math.max(50, Number(zoomPercent) || 100))
    };
    var pad = 48;
    var spanX = 100, spanY = 100;
    var pixelsPerMeter = getScaleForCanvas(view, svgW || 760, svgH || 440, spanX, spanY, pad, !!forPrint);
    var physicalWidthMm = forPrint ? 270 : 250;
    var effectiveDenominator = 1000 * ((svgW || 760) - 2 * pad) / (pixelsPerMeter * physicalWidthMm);
    return {
      pixelsPerMeter: pixelsPerMeter,
      effectiveDenominator: effectiveDenominator
    };
  };

  function buildCadSvg(map, svgW, svgH, forPrint) {
    var view = viewOptions(map);
    var visible = (map.layers || []).filter(function (layer) {
      return layer && layer.visible !== false && Array.isArray(layer.points) && layer.points.length;
    });
    var focusLayers = selectedLayers(map, view.focusMode);
    var focusPoints = [];
    focusLayers.forEach(function (layer) {
      layer.points.forEach(function (point) {
        if (Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))) focusPoints.push(point);
      });
    });
    if (!focusPoints.length) {
      visible.forEach(function (layer) {
        layer.points.forEach(function (point) {
          if (Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))) focusPoints.push(point);
        });
      });
    }
    if (!focusPoints.length) {
      return '<div class="text-center py-5 text-muted fw-bold">نقطه‌ای برای نمایش در لایه‌های فعال وجود ندارد.</div>';
    }

    var minX = focusPoints[0].x, maxX = focusPoints[0].x;
    var minY = focusPoints[0].y, maxY = focusPoints[0].y;
    focusPoints.forEach(function (point) {
      minX = Math.min(minX, Number(point.x));
      maxX = Math.max(maxX, Number(point.x));
      minY = Math.min(minY, Number(point.y));
      maxY = Math.max(maxY, Number(point.y));
    });
    var spanX = Math.max(maxX - minX, 20);
    var spanY = Math.max(maxY - minY, 20);
    var centerX = (minX + maxX) / 2;
    var centerY = (minY + maxY) / 2;
    var pad = 48;
    var scale = getScaleForCanvas(view, svgW, svgH, spanX, spanY, pad, !!forPrint);
    var panX = Number(view.panX || 0) * svgW / 760;
    var panY = Number(view.panY || 0) * svgH / 440;

    function toScreen(point) {
      return {
        x: svgW / 2 + (Number(point.x) - centerX) * scale + panX,
        y: svgH / 2 - (Number(point.y) - centerY) * scale + panY
      };
    }

    var bg = forPrint ? "#ffffff" : "#0f172a";
    var grid = forPrint ? "#dbe2ea" : "#1e293b";
    var text = forPrint ? "#172033" : "#f8fafc";
    var svgId = "cad-view-" + (map.id || "map").replace(/[^a-zA-Z0-9_-]/g, "") + "-" + (forPrint ? "print" : "screen");
    var pointLabelLayerId = "";
    if (view.focusMode === "ACTIVE" && focusLayers[0]) pointLabelLayerId = focusLayers[0].id;
    else if (view.focusMode === "MAIN" && focusLayers[0]) pointLabelLayerId = focusLayers[0].id;
    else if (activeLayerId()) pointLabelLayerId = activeLayerId();
    var shapes = "";

    visible.forEach(function (layer) {
      var color = typeof safeHexColor === "function" ? safeHexColor(layer.color, "#15803d") : "#15803d";
      var opacity = Number(layer.fillOpacity);
      if (!Number.isFinite(opacity)) opacity = 0.16;
      opacity = Math.max(0.02, Math.min(0.55, opacity));
      var stroke = Math.max(1, Math.min(5, Number(layer.strokeWidth) || 2));
      var geom = typeof computeUtmGeometry === "function" ? computeUtmGeometry(layer.points, layer.geomType) : { area: 0 };
      var isLabelLayer = String(layer.id) === String(pointLabelLayerId);

      if (layer.geomType === "POLYGON" && layer.points.length >= 3) {
        var screen = layer.points.map(toScreen);
        var path = screen.map(function (p) { return p.x.toFixed(2) + "," + p.y.toFixed(2); }).join(" ");
        var cx = screen.reduce(function (sum, p) { return sum + p.x; }, 0) / screen.length;
        var cy = screen.reduce(function (sum, p) { return sum + p.y; }, 0) / screen.length;
        shapes += '<polygon points="' + path + '" fill="' + color + '" fill-opacity="' + opacity + '" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linejoin="round"/>';
        screen.forEach(function (p) {
          shapes += '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="3.3" fill="#ffffff" stroke="' + color + '" stroke-width="1.8"/>';
        });

        if (view.showLayerLabels && isLabelLayer) {
          var titleY = Math.max(16, cy);
          shapes += '<text x="' + cx.toFixed(1) + '" y="' + titleY.toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="900" fill="' + (forPrint ? color : "#fde047") + '" paint-order="stroke" stroke="' + bg + '" stroke-width="3">' +
            safeText(layer.name) + ' — ' + fa(Math.round(geom.area || 0)) + ' م²</text>';
        }

        if (view.showPointLabels && isLabelLayer) {
          screen.forEach(function (p, index) {
            var label = layer.points[index].label || ("P" + (index + 1));
            var angle = Math.atan2(p.y - cy, p.x - cx);
            var tx = p.x + Math.cos(angle) * 13;
            var ty = p.y + Math.sin(angle) * 13 + 3;
            shapes += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" font-size="10.5" font-weight="900" text-anchor="middle" fill="' + text + '" paint-order="stroke" stroke="' + bg + '" stroke-width="3">' + safeText(label) + '</text>';
          });
        }

        if (view.showSideLengths && isLabelLayer) {
          for (var i = 0; i < screen.length; i++) {
            var next = (i + 1) % screen.length;
            var a = screen[i], b = screen[next];
            var dx = b.x - a.x, dy = b.y - a.y;
            var edgePx = Math.hypot(dx, dy);
            if (edgePx < 34) continue;
            var nx = -dy / edgePx, ny = dx / edgePx;
            var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }
            var realLength = Math.hypot(Number(layer.points[next].x) - Number(layer.points[i].x), Number(layer.points[next].y) - Number(layer.points[i].y));
            var labelX = mx + nx * 13, labelY = my + ny * 13;
            shapes += '<text x="' + labelX.toFixed(1) + '" y="' + labelY.toFixed(1) + '" font-size="9.5" text-anchor="middle" font-weight="bold" fill="' + (forPrint ? "#1d4ed8" : "#93c5fd") + '" paint-order="stroke" stroke="' + bg + '" stroke-width="3">' + fa(realLength.toFixed(1)) + ' m</text>';
          }
        }
      } else if (layer.geomType === "LINE" && layer.points.length >= 2) {
        var linePts = layer.points.map(toScreen);
        var d = linePts.map(function (p) { return p.x.toFixed(2) + "," + p.y.toFixed(2); }).join(" ");
        shapes += '<polyline points="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round"/>';
        linePts.forEach(function (p) {
          shapes += '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="3" fill="' + color + '"/>';
        });
        if (view.showPointLabels && isLabelLayer) {
          linePts.forEach(function (p, index) {
            shapes += '<text x="' + (p.x + 7) + '" y="' + (p.y - 7) + '" font-size="9.5" fill="' + text + '" paint-order="stroke" stroke="' + bg + '" stroke-width="3">' + safeText(layer.points[index].label || ("P" + (index + 1))) + '</text>';
          });
        }
      } else {
        layer.points.forEach(function (point, index) {
          var p = toScreen(point);
          shapes += '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="5" fill="' + color + '" stroke="#ffffff" stroke-width="1.5"/>';
          if (view.showPointLabels && isLabelLayer) {
            shapes += '<text x="' + (p.x + 8) + '" y="' + (p.y - 7) + '" font-size="10" font-weight="bold" fill="' + text + '" paint-order="stroke" stroke="' + bg + '" stroke-width="3">' + safeText(point.label || layer.name || ("P" + (index + 1))) + '</text>';
          }
        });
      }
    });

    var effectiveDenominator = 1000 * (svgW - 2 * pad) / (scale * (forPrint ? 270 : 250));
    var barMeters = niceDistance(82 / scale);
    var barPixels = Math.min(150, barMeters * scale);
    var ratioText = "۱:" + fa(Math.round(effectiveDenominator));
    var hud =
      '<g transform="translate(30,34)">' +
        '<circle cx="0" cy="0" r="17" fill="' + bg + '" stroke="#f59e0b" stroke-width="2"/>' +
        '<path d="M0,-13 L-5,6 L0,2 L5,6 Z" fill="#ef4444"/>' +
        '<text x="0" y="-20" text-anchor="middle" font-size="10" font-weight="900" fill="' + text + '">N</text>' +
      '</g>' +
      '<g transform="translate(22,' + (svgH - 17) + ')">' +
        '<line x1="0" y1="0" x2="' + barPixels.toFixed(1) + '" y2="0" stroke="' + text + '" stroke-width="2.6"/>' +
        '<line x1="0" y1="-5" x2="0" y2="5" stroke="' + text + '" stroke-width="1.8"/>' +
        '<line x1="' + barPixels.toFixed(1) + '" y1="-5" x2="' + barPixels.toFixed(1) + '" y2="5" stroke="' + text + '" stroke-width="1.8"/>' +
        '<text x="' + (barPixels / 2).toFixed(1) + '" y="-7" text-anchor="middle" font-size="9.5" font-weight="bold" fill="' + text + '" paint-order="stroke" stroke="' + bg + '" stroke-width="2">۱:' + fa(Math.round(effectiveDenominator)) + ' | ' + fa(barMeters) + ' متر</text>' +
      '</g>';

    var prevailingWindHud = "";
    if (view.showPrevailingWind) {
      var wind = window.describeCroquisPrevailingWind(view.prevailingWindFromDeg);
      var windCx = 77, windCy = 59, windLen = 20;
      var tailX = windCx - wind.dx * windLen;
      var tailY = windCy - wind.dy * windLen;
      var tipX = windCx + wind.dx * windLen;
      var tipY = windCy + wind.dy * windLen;
      var perpX = -wind.dy, perpY = wind.dx;
      var headBaseX = tipX - wind.dx * 8;
      var headBaseY = tipY - wind.dy * 8;
      var arrowHead = tipX.toFixed(1) + "," + tipY.toFixed(1) + " " +
        (headBaseX + perpX * 4).toFixed(1) + "," + (headBaseY + perpY * 4).toFixed(1) + " " +
        (headBaseX - perpX * 4).toFixed(1) + "," + (headBaseY - perpY * 4).toFixed(1);
      prevailingWindHud =
        '<g transform="translate(' + (svgW - 166) + ',14)">' +
          '<rect x="0" y="0" width="152" height="104" rx="8" fill="' + bg + '" fill-opacity="' + (forPrint ? "0.96" : "0.90") + '" stroke="#0ea5e9" stroke-width="1.8"/>' +
          '<text x="76" y="15" text-anchor="middle" font-size="10" font-weight="900" fill="' + text + '">جهت باد غالب</text>' +
          '<text x="76" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="#0ea5e9">از: ' + wind.fromName + '</text>' +
          '<circle cx="' + windCx + '" cy="' + windCy + '" r="25" fill="none" stroke="' + grid + '" stroke-width="1"/>' +
          '<line x1="' + tailX.toFixed(1) + '" y1="' + tailY.toFixed(1) + '" x2="' + tipX.toFixed(1) + '" y2="' + tipY.toFixed(1) + '" stroke="#0ea5e9" stroke-width="3.5" stroke-linecap="round"/>' +
          '<polygon points="' + arrowHead + '" fill="#0ea5e9"/>' +
          '<text x="76" y="96" text-anchor="middle" font-size="9" font-weight="bold" fill="' + text + '">به: ' + wind.toName + ' | ' + fa(wind.fromDeg.toFixed(1)) + '°</text>' +
        '</g>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgW + ' ' + svgH + '" width="100%" height="' + (forPrint ? svgH + "px" : "100%") + '" style="'
      (forPrint ? 'display:block;width:100%;height:' + svgH + 'px;' : 'display:block;width:100%;height:100%;') +
      'background:' + bg + ';border-radius:8px;border:1px solid #cbd5e1;overflow:hidden;">' +
      '<defs><pattern id="' + svgId + '-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="' + grid + '" stroke-width="1"/></pattern><clipPath id="' + svgId + '-clip"><rect x="0" y="0" width="' + svgW + '" height="' + svgH + '"/></clipPath></defs>' +
      '<rect width="100%" height="100%" fill="url(#' + svgId + '-grid)"/><g clip-path="url(#' + svgId + '-clip)">' + shapes + hud + prevailingWindHud + '</g></svg>';
  }

  function refreshControls() {
    var map = activeMap();
    var holder = document.getElementById("crq-cad-view-tools");
    if (!map || !holder) return;
    var view = viewOptions(map);
    var focus = document.getElementById("crq-cad-focus");
    var scale = document.getElementById("crq-cad-standard-scale");
    var zoom = document.getElementById("crq-cad-zoom");
    var zoomText = document.getElementById("crq-cad-zoom-value");
    var pointLabels = document.getElementById("crq-cad-show-points");
    var sideLabels = document.getElementById("crq-cad-show-sides");
    var layerLabels = document.getElementById("crq-cad-show-layer-labels");
    var windEnabled = document.getElementById("crq-cad-wind-enabled");
    var windPreset = document.getElementById("crq-cad-wind-preset");
    var windDegrees = document.getElementById("crq-cad-wind-degrees");
    if (focus) focus.value = view.focusMode;
    if (scale) scale.value = String(view.scaleDenominator);
    if (zoom) zoom.value = String(view.zoomPercent);
    if (zoomText) zoomText.textContent = fa(view.zoomPercent) + "٪";
    if (pointLabels) pointLabels.checked = !!view.showPointLabels;
    if (sideLabels) sideLabels.checked = !!view.showSideLengths;
    if (layerLabels) layerLabels.checked = !!view.showLayerLabels;
    if (windEnabled) windEnabled.checked = !!view.showPrevailingWind;
    if (windDegrees) windDegrees.value = String(Number(view.prevailingWindFromDeg).toFixed(1).replace(/\.0$/, ""));
    if (windPreset) {
      var matchedPreset = WIND_COMPASS_16.find(function (item) { return Math.abs(item.deg - view.prevailingWindFromDeg) < 0.05; });
      windPreset.value = matchedPreset ? String(matchedPreset.deg) : "CUSTOM";
    }
  }

  function setViewValue(key, value) {
    var map = activeMap();
    if (!map) return;
    var view = viewOptions(map);
    if (key === "focusMode") {
      view.focusMode = ["MAIN", "ACTIVE", "ALL"].indexOf(value) !== -1 ? value : "MAIN";
    } else if (key === "scaleDenominator") {
      view.scaleDenominator = SCALE_OPTIONS.indexOf(String(value)) !== -1 ? String(value) : "AUTO";
      view.zoomPercent = 100;
    } else if (key === "zoomPercent") {
      view.zoomPercent = Math.max(50, Math.min(200, Number(value) || 100));
    } else if (["panX", "panY"].indexOf(key) !== -1) {
      view[key] = Math.max(-1000, Math.min(1000, Number(value) || 0));
    } else if (["showPointLabels", "showSideLengths", "showLayerLabels", "showPrevailingWind"].indexOf(key) !== -1) {
      view[key] = !!value;
    } else if (key === "prevailingWindFromDeg") {
      var wind = Number(value);
      if (!Number.isFinite(wind) || wind < 0 || wind >= 360) {
        alert("زاویه باد باید عددی بین صفر تا ۳۵۹٫۹ درجه باشد.");
        refreshControls();
        return;
      }
      view.prevailingWindFromDeg = Math.round(wind * 10) / 10;
    }
    if (typeof saveAllDB === "function") saveAllDB();
    if (typeof renderCroquisVisualCanvas === "function") renderCroquisVisualCanvas();
    refreshControls();
  }

  window.setCroquisCadViewOption = function (key, value) {
    setViewValue(key, value);
  };
  window.selectCroquisPrevailingWindPreset = function (value) {
    if (String(value) === "CUSTOM") return;
    setViewValue("prevailingWindFromDeg", value);
    refreshControls();
  };
  window.panCroquisCadView = function (direction) {
    var map = activeMap();
    if (!map) return;
    var view = viewOptions(map);
    var step = 35;
    if (direction === "left") view.panX -= step;
    else if (direction === "right") view.panX += step;
    else if (direction === "up") view.panY -= step;
    else if (direction === "down") view.panY += step;
    view.panX = Math.max(-1000, Math.min(1000, view.panX));
    view.panY = Math.max(-1000, Math.min(1000, view.panY));
    if (typeof saveAllDB === "function") saveAllDB();
    if (typeof renderCroquisVisualCanvas === "function") renderCroquisVisualCanvas();
    refreshControls();
  };
  window.resetCroquisCadView = function () {
    var map = activeMap();
    if (!map) return;
    map.cadView = Object.assign({}, DEFAULTS);
    if (typeof saveAllDB === "function") saveAllDB();
    if (typeof renderCroquisVisualCanvas === "function") renderCroquisVisualCanvas();
    refreshControls();
  };

  function installRenderer() {
    if (typeof window.buildMultiLayerSvgMarkup === "function" &&
        !window.buildMultiLayerSvgMarkup.__cadViewToolsWrapped) {
      var replacement = function (map, width, height, printMode) {
        return buildCadSvg(map, width || 760, height || 440, !!printMode);
      };
      replacement.__cadViewToolsWrapped = true;
      window.buildMultiLayerSvgMarkup = replacement;
    }
  }

  function installCanvasHook() {
    if (typeof window.renderCroquisVisualCanvas !== "function" ||
        window.renderCroquisVisualCanvas.__cadViewToolsWrapped) return;
    var original = window.renderCroquisVisualCanvas;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      refreshControls();
      return result;
    };
    wrapped.__cadViewToolsWrapped = true;
    window.renderCroquisVisualCanvas = wrapped;
  }

  function initialize() {
    installRenderer();
    installCanvasHook();
    refreshControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
