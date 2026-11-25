/* Nezam 636 — Selectable coordinate appendix and applicant declaration */
(function () {
  "use strict";

  function getMap() {
    return typeof getActiveCroquisMap === "function" ? getActiveCroquisMap() : null;
  }
  function esc(value) {
    var text = String(value == null ? "" : value);
    return typeof safeHtmlText === "function" ? safeHtmlText(text) :
      text.replace(/[&<>"']/g, function (c) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
      });
  }
  function visibleLayers(map) {
    return (map && Array.isArray(map.layers) ? map.layers : []).filter(function (layer) {
      return layer && layer.visible && Array.isArray(layer.points) && layer.points.length > 0;
    });
  }
  function selectedIds(map) {
    var layers = visibleLayers(map);
    if (typeof getCroquisCoordinatePrintLayerIds === "function") {
      return getCroquisCoordinatePrintLayerIds(map);
    }
    var ids = layers.map(function (layer) { return String(layer.id || ""); }).filter(Boolean);
    if (!Array.isArray(map.printCoordinateLayerIds)) map.printCoordinateLayerIds = ids.slice();
    map.printCoordinateLayerIds = map.printCoordinateLayerIds.map(String).filter(function (id) {
      return ids.indexOf(id) !== -1;
    });
    return map.printCoordinateLayerIds;
  }

  function renderSelectionPanel(stage, map) {
    var toolbar = stage.querySelector(".no-print");
    if (!toolbar || toolbar.querySelector("#croquis-coordinate-print-selection")) return;
    var layers = visibleLayers(map);
    var chosen = selectedIds(map);
    var panel = document.createElement("section");
    panel.id = "croquis-coordinate-print-selection";
    panel.className = "no-print mt-2 pt-2 border-top";
    panel.style.cssText = "direction:rtl;font-size:8.2pt;";
    var title = document.createElement("div");
    title.className = "d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1";
    var heading = document.createElement("b");
    heading.className = "text-primary";
    heading.textContent = "📍 انتخاب لایه‌ها برای خروجی چاپی نقشه";
    title.appendChild(heading);
    var allLabel = document.createElement("label");
    allLabel.className = "small d-inline-flex align-items-center gap-1 mb-0";
    var all = document.createElement("input");
    all.type = "checkbox";
    all.className = "form-check-input m-0";
    all.checked = layers.length > 0 && layers.every(function (layer) {
      return chosen.indexOf(String(layer.id)) !== -1;
    });
    all.addEventListener("change", function () {
      if (typeof window.setAllCroquisCoordinatePrintLayers === "function") {
        window.setAllCroquisCoordinatePrintLayers(all.checked);
      }
    });
    allLabel.appendChild(all);
    allLabel.appendChild(document.createTextNode("انتخاب همه لایه‌ها"));
    title.appendChild(allLabel);
    panel.appendChild(title);

    var note = document.createElement("div");
    note.className = "small text-muted mb-1";
    note.textContent = "فقط لایه‌های تیک‌خورده در نقشه صفحه اول، راهنمای لایه‌ها، جدول تفکیک و جدول مختصات چاپ می‌شوند. لایه‌های انتخاب‌نشده از خروجی حذف می‌شوند؛ نقاط زیاد به برگه‌های ادامه منتقل خواهند شد.";
    panel.appendChild(note);

    var positionRow = document.createElement("div");
    positionRow.className = "d-flex flex-wrap align-items-center gap-2 mb-2";
    var positionLabel = document.createElement("label");
    positionLabel.className = "small fw-bold";
    positionLabel.textContent = "جای کادر مختصات روی نقشه:";
    var positionSelect = document.createElement("select");
    positionSelect.className = "form-select form-select-sm";
    positionSelect.style.width = "auto";
    positionSelect.style.minWidth = "150px";
    positionSelect.setAttribute("aria-label", "جای کادر مختصات روی نقشه چاپی");
    [["TOP_RIGHT","بالا سمت راست"],["TOP_LEFT","بالا سمت چپ"],["BOTTOM_RIGHT","پایین سمت راست"],["BOTTOM_LEFT","پایین سمت چپ"]].forEach(function(item) {
      var option = document.createElement("option");
      option.value = item[0]; option.textContent = item[1]; positionSelect.appendChild(option);
    });
    positionSelect.value = ["TOP_RIGHT","TOP_LEFT","BOTTOM_RIGHT","BOTTOM_LEFT"].indexOf(map.printCoordinateBoxPosition) !== -1
      ? map.printCoordinateBoxPosition : "TOP_RIGHT";
    positionSelect.addEventListener("change", function() {
      if (typeof window.setCroquisCoordinateBoxPosition === "function") window.setCroquisCoordinateBoxPosition(positionSelect.value);
    });
    positionRow.appendChild(positionLabel); positionRow.appendChild(positionSelect); panel.appendChild(positionRow);

    var options = document.createElement("div");
    options.className = "d-flex flex-wrap gap-1";
    layers.forEach(function (layer) {
      var label = document.createElement("label");
      label.className = "d-inline-flex align-items-center gap-1 border rounded px-2 py-1 bg-white small mb-1";
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input m-0";
      checkbox.value = String(layer.id || "");
      checkbox.checked = chosen.indexOf(String(layer.id)) !== -1;
      checkbox.addEventListener("change", function () {
        if (typeof window.setCroquisCoordinatePrintLayer === "function") {
          window.setCroquisCoordinatePrintLayer(checkbox.value, checkbox.checked);
        }
      });
      var swatch = document.createElement("span");
      swatch.style.cssText = "display:inline-block;width:8px;height:8px;border-radius:2px;background:" +
        (typeof safeHexColor === "function" ? safeHexColor(layer.color, "#15803d") : "#15803d") + ";";
      var name = document.createElement("span");
      name.textContent = layer.name || "لایه بدون نام";
      var count = document.createElement("span");
      count.className = "text-muted";
      count.textContent = "(" + (typeof toFa === "function" ? toFa(layer.points.length) : layer.points.length) + " نقطه)";
      label.appendChild(checkbox);
      label.appendChild(swatch);
      label.appendChild(name);
      label.appendChild(count);
      options.appendChild(label);
    });
    if (!layers.length) options.textContent = "لایه مرئی دارای نقاطی برای چاپ وجود ندارد.";
    panel.appendChild(options);
    toolbar.appendChild(panel);
  }

  window.setCroquisCoordinateBoxPosition = function(position) {
    var map = getMap();
    var allowed = ["TOP_RIGHT","TOP_LEFT","BOTTOM_RIGHT","BOTTOM_LEFT"];
    if (!map || allowed.indexOf(String(position)) === -1) return false;
    map.printCoordinateBoxPosition = String(position);
    if (typeof saveAllDB === "function") saveAllDB();
    if (typeof currentPreviewMode !== "undefined" && currentPreviewMode === "CROQUIS" &&
        typeof window.printUtmSketchSheet === "function") window.printUtmSketchSheet();
    return true;
  };

  function legalDeclaration() {
    var c = typeof getActiveCase === "function" ? getActiveCase() : null;
    var name = c && c.name ? c.name : "................................";
    var nid = c && c.nid ? c.nid : "................";
    var pageA5 = !!document.querySelector("#a4-preview-stage .a4-page.paper-a5");
    var font = pageA5 ? "6.7pt" : "7.8pt";
    var titleFont = pageA5 ? "7.6pt" : "8.8pt";
    return '<section class="croquis-applicant-legal" style="font-size:' + font + ';background:#fffaf0;border:1.2px solid #a16207;border-radius:4px;padding:2mm 2.5mm;line-height:1.48;text-align:justify;direction:rtl;">' +
      '<b style="display:block;text-align:center;color:#7c2d12;font-size:' + titleFont + ';margin-bottom:1mm;">اقرار و تعهد متقاضی درباره صحت اطلاعات و مسئولیت ارائه آن</b>' +
      'اینجانب متقاضی/ارائه‌دهنده اطلاعات، اقرار و تعهد می‌نمایم کلیه اسناد، مدارک، مشخصات هویتی و ثبتی، پلاک، نشانی، حدود و موقعیت اعلامی زمین، مختصات UTM، مساحت، ابعاد، فواصل و اطلاعات مربوط به عوارض و حرایم پیرامونی که برای تهیه این نقشه ارائه یا تأیید کرده‌ام، صحیح، کامل، معتبر و مربوط به موضوع درخواست بوده و هیچ واقعیت مؤثر یا حق اشخاص ثالث را کتمان نکرده‌ام. مسئولیت احراز اصالت و صحت مدارک و اطلاعات ارائه‌شده، اعلام صحیح محدوده مورد درخواست، اخذ رضایت‌ها و مجوزهای لازم و پاسخگویی نسبت به ادعاها، اعتراض‌ها، تعارض‌ها و خساراتی که ناشی از اطلاعات یا مدارک نادرست، ناقص، خلاف واقع یا کتمان‌شده از سوی اینجانب باشد، بر عهده اینجانب است و متعهد به جبران خسارات قابل انتساب به آن در حدود قوانین لازم‌الاجرا می‌باشم.' +
      '<br>این نقشه و جداول پیوست، صرفاً خروجی فنی مبتنی بر داده‌ها و مدارک ارائه‌شده/ثبت‌شده برای جانمایی و بررسی درخواست است و به‌تنهایی سند مالکیت یا حدنگار، دلیل قطعی مالکیت یا تصرف، تحدید حدود ثبتی، تعیین حقوق ارتفاقی، گواهی عدم تعارض، تأیید نهایی حریم‌ها یا مجوز ساخت و بهره‌برداری محسوب نمی‌شود. تطبیق نهایی حدود و مختصات با سوابق ثبتی، حقوق اشخاص ثالث، برداشت میدانی و استعلام از مراجع ذی‌صلاح حسب مورد بر عهده متقاضی است.' +
      '<br>این اقرار و تعهد ناظر بر مسئولیت ناشی از اطلاعات و مدارک ارائه‌شده از سوی متقاضی است و موجب اسقاط یا انتقال مسئولیت‌های قانونی و حرفه‌ای اشخاص تهیه‌کننده در حدود تقصیر، تخلف یا تکالیف آمره قانونی آنان نخواهد بود.' +
      '<div style="display:flex;justify-content:space-between;gap:4mm;margin-top:1.5mm;padding-top:1mm;border-top:1px dotted #a16207;font-weight:800;">' +
        '<span>نام متقاضی: ' + esc(name) + '</span><span>کد ملی: ' + esc(nid) + '</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;gap:4mm;margin-top:2mm;font-weight:800;">' +
        '<span>امضاء و اثر انگشت متقاضی: ........................................</span><span>تاریخ: ........................</span>' +
      '</div></section>';
  }

  function coordinateTable(page) {
    var tables = Array.prototype.slice.call(page.querySelectorAll("table.utm-table-print"));
    for (var i = 0; i < tables.length; i++) {
      var header = tables[i].querySelector("thead");
      var text = header ? header.textContent : "";
      if (text.indexOf("کد نقطه") !== -1 && text.indexOf("X") !== -1) return tables[i];
    }
    return null;
  }

  function paginateCoordinates(page, map) {
    var table = coordinateTable(page);
    if (!table) return;
    var chosenIds = selectedIds(map);
    var allRows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
    var rows = allRows.filter(function (row) {
      var layerId = row.getAttribute("data-layer-id");
      return layerId !== null && chosenIds.indexOf(String(layerId)) !== -1;
    });

    var isA5 = page.classList.contains("paper-a5");
    var firstLimit = isA5 ? 6 : 12;
    var laterLimit = isA5 ? 10 : 18;
    var tbody = table.querySelector("tbody");
    tbody.innerHTML = rows.slice(0, firstLimit).map(function (row) { return row.outerHTML; }).join("");

    var legalHtml = legalDeclaration();
    var contentWrap = page.querySelector(".lh-content-wrap");
    if (contentWrap) {
      // The complete sheet content sits inside .l-txt. Replace only the
      // small certification notice inside it, never the outer content wrapper.
      var certificate = contentWrap.querySelector(".croquis-expert-certificate");
      if (certificate) {
        var holder = document.createElement("div");
        holder.innerHTML = legalHtml;
        certificate.replaceWith(holder.firstElementChild);
      } else if (!contentWrap.querySelector(".croquis-applicant-legal")) {
        var coordinateTableElement = coordinateTable(page);
        if (coordinateTableElement) coordinateTableElement.insertAdjacentHTML("afterend", legalHtml);
      }
    }

    var empty = page.querySelector(".croquis-coordinate-empty-note");
    if (empty) empty.remove();
    if (!rows.length) {
      empty = document.createElement("div");
      empty.className = "croquis-coordinate-empty-note";
      empty.style.cssText = "border:1px dashed #94a3b8;padding:3mm;text-align:center;color:#64748b;font-size:8pt;margin-top:2mm;";
      empty.textContent = "هیچ لایه‌ای برای درج مختصات انتخاب نشده است.";
      table.parentNode.insertBefore(empty, table);
      table.style.display = "none";
    } else {
      table.style.display = "";
    }

    var remainder = rows.slice(firstLimit);
    if (!remainder.length) return;
    var stage = document.getElementById("a4-preview-stage");
    var headerHtml = table.querySelector("thead").outerHTML;
    for (var offset = 0, pageIndex = 0; offset < remainder.length; offset += laterLimit, pageIndex++) {
      var chunk = remainder.slice(offset, offset + laterLimit);
      var clone = page.cloneNode(true);
      clone.setAttribute("data-page-kind", "croquis-coordinate-continuation");
      clone.classList.remove("croquis-map-landscape");
      var clonedContent = clone.querySelector(".lh-content-wrap");
      if (clonedContent) {
        clonedContent.innerHTML =
          '<div style="text-align:center;font-weight:900;font-size:10pt;margin-bottom:2mm;color:#14532d;">ادامه جدول مختصات UTM / جغرافیایی</div>' +
          '<div style="font-size:8pt;font-weight:bold;color:#1e3a8a;margin-bottom:1mm;">ادامه نقاط لایه‌های انتخاب‌شده:</div>' +
          '<table class="utm-table-print" style="width:100%;font-size:' + (isA5 ? "6.6pt" : "7.8pt") + ';">' +
            headerHtml + '<tbody>' + chunk.map(function (row) { return row.outerHTML; }).join("") + '</tbody></table>' +
          '<div style="font-size:7pt;color:#475569;margin-top:2mm;">این برگه ادامه جدول مختصات شیت دوم است و همراه با شیت‌های اصلی پرونده اعتبار دارد.</div>';
      }
      var badge = clone.querySelector(".lh-c .badge");
      if (badge) badge.textContent = "ادامه مختصات — برگه " + (pageIndex + 3);
      var attach = clone.querySelector(".paper-meta-attach");
      if (attach) attach.textContent = "ادامه جدول مختصات";
      var number = clone.querySelector(".paper-meta-num");
      if (number) number.textContent = (number.textContent || "") + "/" + (pageIndex + 3);
      var signature = clone.querySelector(".sign-area");
      if (signature) signature.style.display = "none";
      stage.appendChild(clone);
    }
  }

  function decorate() {
    var stage = document.getElementById("a4-preview-stage");
    var map = getMap();
    if (!stage || !map) return;
    var pages = stage.querySelectorAll(".a4-page");
    if (pages.length < 2) return;
    // The core sheet builder already omits page-one notes. Keep the .l-txt
    // wrapper intact because it contains the map and layer legend.
    paginateCoordinates(pages[1], map);
  }

  function install() {
    if (typeof window.printUtmSketchSheet !== "function" ||
        window.printUtmSketchSheet.__coordinatePrintWrapped) return;
    var original = window.printUtmSketchSheet;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      if (typeof currentPreviewMode !== "undefined" && currentPreviewMode === "CROQUIS") decorate();
      return result;
    };
    wrapped.__coordinatePrintWrapped = true;
    window.printUtmSketchSheet = wrapped;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
