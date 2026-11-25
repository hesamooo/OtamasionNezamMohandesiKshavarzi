/* Nezam 636 — DXF UTM import/export (ASCII DXF, meter-based coordinates) */
(function () {
  "use strict";

  var MAX_FILE_BYTES = 20 * 1024 * 1024;
  var MAX_ENTITIES = 5000;
  var MAX_TOTAL_VERTICES = 150000;

  function activeMap() {
    return typeof getActiveCroquisMap === "function" ? getActiveCroquisMap() : null;
  }
  function activeCase() {
    return typeof getActiveCase === "function" ? getActiveCase() : null;
  }
  function numeric(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return NaN;
    var faDigits = "۰۱۲۳۴۵۶۷۸۹", arDigits = "٠١٢٣٤٥٦٧٨٩";
    raw = raw.replace(/[۰-۹]/g, function (ch) { return String(faDigits.indexOf(ch)); })
      .replace(/[٠-٩]/g, function (ch) { return String(arDigits.indexOf(ch)); })
      .replace(/[٫]/g, ".").replace(/[٬,]/g, "");
    var n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }
  function safeFilePart(value) {
    return String(value || "Croquis636").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_").slice(0, 60);
  }
  function dxfName(value, index) {
    // R12 layer names are kept short and plain ASCII for broad CAD compatibility.
    return "N636_" + String(index).padStart(3, "0");
  }
  function aciForColor(hex) {
    var map = {
      "#ff0000":1,"#ffff00":2,"#00ff00":3,"#00ffff":4,
      "#0000ff":5,"#ff00ff":6,"#ffffff":7,"#000000":7,
      "#808080":8,"#c0c0c0":9
    };
    var key = String(hex || "").toLowerCase();
    if (map[key]) return map[key];
    var m = /^#?([0-9a-f]{6})$/i.exec(key);
    if (!m) return 3;
    var rgb = [parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)];
    var palette = [
      {n:1,r:255,g:0,b:0},{n:2,r:255,g:255,b:0},{n:3,r:0,g:255,b:0},
      {n:4,r:0,g:255,b:255},{n:5,r:0,g:0,b:255},{n:6,r:255,g:0,b:255},
      {n:7,r:255,g:255,b:255}
    ];
    var best = palette[0], bestD = Infinity;
    palette.forEach(function (p) {
      var d = Math.pow(rgb[0]-p.r,2)+Math.pow(rgb[1]-p.g,2)+Math.pow(rgb[2]-p.b,2);
      if (d < bestD) { bestD=d; best=p; }
    });
    return best.n;
  }
  function pair(out, code, value) {
    out.push(String(code), String(value));
  }
  function dxfNum(value) {
    var n = numeric(value);
    if (!Number.isFinite(n)) throw new Error("مختصات نامعتبر در خروجی DXF وجود دارد.");
    return (Object.is(n, -0) ? 0 : n).toFixed(4);
  }

  function buildDXFDocument(map) {
    if (!map || !Array.isArray(map.layers)) throw new Error("نقشه فعال معتبر نیست.");
    var exportLayers = [], allPoints = [];
    map.layers.forEach(function (layer) {
      if (!layer || layer.visible === false || !Array.isArray(layer.points) || !layer.points.length) return;
      var points = layer.points.map(function (p, pointIndex) {
        if (!p) throw new Error("لایه «" + String(layer.name || "") + "» در رأس " + (pointIndex + 1) + " داده خالی دارد.");
        var x = numeric(p.x), y = numeric(p.y);
        var zValue = p.elev !== undefined && p.elev !== null && p.elev !== "" ? p.elev : p.z;
        var z = zValue === undefined || zValue === null || zValue === "" ? 0 : numeric(zValue);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          throw new Error("مختصات X/Y/Z در لایه «" + String(layer.name || "") + "»، رأس " + (pointIndex + 1) + " معتبر نیست؛ خروجی برای جلوگیری از فایل ناقص متوقف شد.");
        }
        return { x: x, y: y, z: z };
      });
      var geomType = String(layer.geomType || "").toUpperCase();
      if (geomType === "POLYGON" && points.length > 3) {
        var first = points[0], last = points[points.length - 1];
        if (Math.abs(first.x-last.x)<0.0001 && Math.abs(first.y-last.y)<0.0001 && Math.abs(first.z-last.z)<0.0001) points.pop();
      }
      if (geomType !== "POINT" && points.length === 1) geomType = "POINT";
      else if (geomType !== "POINT" && geomType !== "POLYGON") geomType = "LINE";
      exportLayers.push({
        name: dxfName(layer.name, exportLayers.length + 1),
        color: aciForColor(layer.color),
        geomType: geomType,
        points: points
      });
      allPoints = allPoints.concat(points);
    });
    if (!exportLayers.length || !allPoints.length) {
      throw new Error("هیچ نقطه معتبر در لایه‌های مرئی نقشه وجود ندارد. وضعیت نمایش لایه‌ها و مختصات X/Y را بررسی کنید.");
    }
    var minX = Math.min.apply(null, allPoints.map(function(p){return p.x;}));
    var minY = Math.min.apply(null, allPoints.map(function(p){return p.y;}));
    var minZ = Math.min.apply(null, allPoints.map(function(p){return p.z;}));
    var maxX = Math.max.apply(null, allPoints.map(function(p){return p.x;}));
    var maxY = Math.max.apply(null, allPoints.map(function(p){return p.y;}));
    var maxZ = Math.max.apply(null, allPoints.map(function(p){return p.z;}));
    var centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
    var spanX = Math.max(maxX-minX,1), spanY = Math.max(maxY-minY,1);
    var viewHeight = Math.max(spanY,spanX/1.55,1)*1.18;
    var margin = Math.max(viewHeight*0.08,1);
    var out=[], entityCount=0, vertexCount=0;

    function tableStart(name,count){
      pair(out,0,"TABLE");pair(out,2,name);pair(out,70,count);
    }
    function tableEnd(){pair(out,0,"ENDTAB");}
    function writeLtype(name,description){
      pair(out,0,"LTYPE");pair(out,2,name);pair(out,70,0);
      pair(out,3,description);pair(out,72,65);pair(out,73,0);pair(out,40,0.0);
    }
    function writeLayer(name,color){
      pair(out,0,"LAYER");pair(out,2,name);pair(out,70,0);pair(out,62,color);pair(out,6,"CONTINUOUS");
    }
    function writePoint(point,layerName){
      pair(out,0,"POINT");pair(out,8,layerName);
      pair(out,10,dxfNum(point.x));pair(out,20,dxfNum(point.y));pair(out,30,dxfNum(point.z));
      entityCount++;vertexCount++;
    }
    function write3DPolyline(layer){
      var closed=layer.geomType==="POLYGON"&&layer.points.length>=3;
      pair(out,0,"POLYLINE");pair(out,8,layer.name);pair(out,66,1);
      pair(out,70,closed?9:8);pair(out,10,0);pair(out,20,0);pair(out,30,0);
      layer.points.forEach(function(point){
        pair(out,0,"VERTEX");pair(out,8,layer.name);
        pair(out,10,dxfNum(point.x));pair(out,20,dxfNum(point.y));pair(out,30,dxfNum(point.z));
        pair(out,70,32);vertexCount++;
      });
      pair(out,0,"SEQEND");pair(out,8,layer.name);
      entityCount++;
    }

    // R12 is intentionally used: it is the simplest long-supported ASCII DXF format.
    // The active VPORT centers the drawing on its UTM extents instead of the world origin.
    pair(out,999,"NEZAM636_UTM_ZONE="+String(map.utmZone||"39R"));
    pair(out,999,"NEZAM636_COORDINATES=UTM_METERS");
    pair(out,999,"NEZAM636_LAYER_COUNT="+exportLayers.length);
    pair(out,999,"NEZAM636_ENTITY_COUNT="+exportLayers.reduce(function(sum,layer){
      return sum+(layer.geomType==="POINT"?layer.points.length:1);
    },0));
    pair(out,0,"SECTION");pair(out,2,"HEADER");
    pair(out,9,"$ACADVER");pair(out,1,"AC1009");
    pair(out,9,"$EXTMIN");pair(out,10,dxfNum(minX));pair(out,20,dxfNum(minY));pair(out,30,dxfNum(minZ));
    pair(out,9,"$EXTMAX");pair(out,10,dxfNum(maxX));pair(out,20,dxfNum(maxY));pair(out,30,dxfNum(maxZ));
    pair(out,9,"$LIMMIN");pair(out,10,dxfNum(minX-margin));pair(out,20,dxfNum(minY-margin));
    pair(out,9,"$LIMMAX");pair(out,10,dxfNum(maxX+margin));pair(out,20,dxfNum(maxY+margin));
    pair(out,9,"$VIEWCTR");pair(out,10,dxfNum(centerX));pair(out,20,dxfNum(centerY));
    pair(out,9,"$VIEWSIZE");pair(out,40,dxfNum(viewHeight));
    pair(out,9,"$PDMODE");pair(out,70,35);pair(out,9,"$PDSIZE");pair(out,40,-2.0);
    pair(out,0,"ENDSEC");

    pair(out,0,"SECTION");pair(out,2,"TABLES");
    tableStart("VPORT",1);
    pair(out,0,"VPORT");pair(out,2,"*ACTIVE");pair(out,70,0);
    pair(out,10,0.0);pair(out,20,0.0);pair(out,11,1.0);pair(out,21,1.0);
    pair(out,12,0.0);pair(out,22,0.0);
    pair(out,13,0.0);pair(out,23,0.0);
    pair(out,14,10.0);pair(out,24,10.0);pair(out,15,10.0);pair(out,25,10.0);
    pair(out,16,0.0);pair(out,26,0.0);pair(out,36,1.0);
    pair(out,17,dxfNum(centerX));pair(out,27,dxfNum(centerY));pair(out,37,0.0);
    pair(out,40,dxfNum(viewHeight));pair(out,41,1.55);
    pair(out,42,50.0);pair(out,43,0.0);pair(out,44,0.0);
    pair(out,50,0.0);pair(out,51,0.0);pair(out,71,0);pair(out,72,100);pair(out,74,3);
    tableEnd();

    tableStart("LTYPE",3);
    writeLtype("BYBLOCK","");
    writeLtype("BYLAYER","");
    writeLtype("CONTINUOUS","Solid line");
    tableEnd();

    tableStart("LAYER",exportLayers.length+1);
    writeLayer("0",7);
    exportLayers.forEach(function(layer){writeLayer(layer.name,layer.color);});
    tableEnd();
    pair(out,0,"ENDSEC");

    pair(out,0,"SECTION");pair(out,2,"BLOCKS");
    pair(out,0,"BLOCK");pair(out,8,"0");pair(out,2,"$MODEL_SPACE");pair(out,70,0);
    pair(out,10,0);pair(out,20,0);pair(out,30,0);pair(out,3,"$MODEL_SPACE");pair(out,1,"");
    pair(out,0,"ENDBLK");pair(out,8,"0");
    pair(out,0,"BLOCK");pair(out,8,"0");pair(out,2,"$PAPER_SPACE");pair(out,70,0);
    pair(out,10,0);pair(out,20,0);pair(out,30,0);pair(out,3,"$PAPER_SPACE");pair(out,1,"");
    pair(out,0,"ENDBLK");pair(out,8,"0");
    pair(out,0,"ENDSEC");

    pair(out,0,"SECTION");pair(out,2,"ENTITIES");
    exportLayers.forEach(function(layer){
      if(layer.geomType==="POINT"||layer.points.length===1){
        layer.points.forEach(function(point){writePoint(point,layer.name);});
      }else{
        write3DPolyline(layer);
      }
    });
    pair(out,0,"ENDSEC");pair(out,0,"EOF");
    if(!entityCount||!vertexCount)throw new Error("هیچ موجودیت قابل‌نمایش برای نوشتن در فایل DXF ساخته نشد.");
    return {
      text:out.join("\r\n")+"\r\n",
      entityCount:entityCount,layerCount:exportLayers.length,vertexCount:vertexCount,
      zone:String(map.utmZone||"39R"),
      extents:{minX:minX,minY:minY,minZ:minZ,maxX:maxX,maxY:maxY,maxZ:maxZ},
      view:{centerX:centerX,centerY:centerY,height:viewHeight}
    };
  }
  window.buildCroquisDXFText = function(map){return buildDXFDocument(map).text;};
  window.exportActiveCroquisToDXF = function() {
    var map=activeMap(), c=activeCase();
    if(!map){alert("ابتدا پرونده و نقشه کروکی را انتخاب کنید.");return false;}
    var documentData;
    try{documentData=buildDXFDocument(map);}catch(error){alert(error&&error.message?error.message:"ساخت فایل DXF ناموفق بود.");return false;}
    var blob=new Blob([documentData.text],{type:"application/dxf;charset=utf-8"});
    var url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url; a.download="Nezam636_"+safeFilePart(c&&c.name)+"_"+safeFilePart(map.title)+".dxf";
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(function(){URL.revokeObjectURL(url);},2000);
    if(typeof showToastMsg==="function")showToastMsg("خروجی DXF با مختصات UTM، واحد متر و "+documentData.entityCount+" عارضه آماده شد.");
    return true;
  };
  function parsePairs(text) {
    var lines = String(text || "").replace(/\r/g,"").split("\n");
    if (lines.length < 4) throw new Error("فایل انتخاب‌شده DXF متنی معتبر نیست.");
    var pairs = [];
    for (var i = 0; i + 1 < lines.length; i += 2) {
      var codeText = lines[i].trim();
      if (!/^-?\d+$/.test(codeText)) continue;
      pairs.push({code:parseInt(codeText,10),value:String(lines[i+1]).trim()});
    }
    if (!pairs.length) throw new Error("ساختار کد/مقدار DXF خوانده نشد؛ فایل ممکن است باینری یا خراب باشد.");
    return pairs;
  }
  function entityRecords(pairs) {
    var start = -1;
    for (var i = 0; i + 1 < pairs.length; i++) {
      if (pairs[i].code === 0 && pairs[i].value.toUpperCase() === "SECTION" &&
          pairs[i+1].code === 2 && pairs[i+1].value.toUpperCase() === "ENTITIES") {
        start = i + 2; break;
      }
    }
    if (start < 0) throw new Error("بخش ENTITIES در فایل DXF پیدا نشد.");
    var records = [], i = start;
    while (i < pairs.length && !(pairs[i].code === 0 && pairs[i].value.toUpperCase() === "ENDSEC")) {
      if (pairs[i].code !== 0) { i++; continue; }
      var type = pairs[i++].value.toUpperCase();
      var values = [];
      while (i < pairs.length && pairs[i].code !== 0) values.push(pairs[i++]);
      records.push({type:type,values:values});
    }
    return records;
  }
  function valueOf(values, code, fallback) {
    for (var i = 0; i < values.length; i++) if (values[i].code === code) return values[i].value;
    return fallback;
  }
  function coords(values, xCode, yCode, zCode, defaultZ) {
    var result = [], current = null, baseZ = numeric(valueOf(values,38,defaultZ || 0));
    if (!Number.isFinite(baseZ)) baseZ = 0;
    values.forEach(function (p) {
      if (p.code === xCode) {
        current = {x:numeric(p.value),y:NaN,z:baseZ};
        result.push(current);
      } else if (p.code === yCode && current && !Number.isFinite(current.y)) {
        current.y = numeric(p.value);
      } else if (p.code === zCode && current) {
        current.z = numeric(p.value);
      }
    });
    return result.filter(function (p) { return Number.isFinite(p.x) && Number.isFinite(p.y); });
  }
  function parseEntity(record, following) {
    var values = record.values;
    var layerName = valueOf(values,8,"0") || "0";
    if (record.type === "LWPOLYLINE") {
      var pts = coords(values,10,20,30,valueOf(values,38,0));
      var flags = parseInt(valueOf(values,70,"0"),10) || 0;
      return {consumed:0,feature:pts.length ? {layerName:layerName,points:pts,geomType:(flags&1)&&pts.length>=3?"POLYGON":"LINE"}:null};
    }
    if (record.type === "POLYLINE") {
      var flags3 = parseInt(valueOf(values,70,"0"),10) || 0;
      var vertices = [], used = 0;
      while (following[used] && following[used].type === "VERTEX") {
        var vertex = coords(following[used].values,10,20,30,0);
        if (vertex.length) vertices.push(vertex[0]);
        used++;
      }
      if (following[used] && following[used].type === "SEQEND") used++;
      return {consumed:used,feature:vertices.length ? {
        layerName:layerName,points:vertices,geomType:(flags3&1)&&vertices.length>=3?"POLYGON":"LINE"
      }:null};
    }
    if (record.type === "LINE") {
      var line = [
        {x:numeric(valueOf(values,10,NaN)),y:numeric(valueOf(values,20,NaN)),z:numeric(valueOf(values,30,0))},
        {x:numeric(valueOf(values,11,NaN)),y:numeric(valueOf(values,21,NaN)),z:numeric(valueOf(values,31,0))}
      ];
      if (line.every(function(p){return Number.isFinite(p.x)&&Number.isFinite(p.y);}))
        return {consumed:0,feature:{layerName:layerName,points:line,geomType:"LINE"}};
    }
    if (record.type === "POINT") {
      var point={x:numeric(valueOf(values,10,NaN)),y:numeric(valueOf(values,20,NaN)),z:numeric(valueOf(values,30,0))};
      if(Number.isFinite(point.x)&&Number.isFinite(point.y))
        return {consumed:0,feature:{layerName:layerName,points:[point],geomType:"POINT"}};
    }
    if(record.type==="ARC"){
      var arcX=numeric(valueOf(values,10,NaN)),arcY=numeric(valueOf(values,20,NaN)),arcZ=numeric(valueOf(values,30,0));
      var arcR=numeric(valueOf(values,40,NaN)),startA=numeric(valueOf(values,50,0)),endA=numeric(valueOf(values,51,360));
      if([arcX,arcY,arcR,startA,endA].every(Number.isFinite)&&arcR>0){
        var sweep=((endA-startA)%360+360)%360;if(sweep<0.001)sweep=360;
        var segments=Math.max(8,Math.min(180,Math.ceil(sweep/7.5))), arcPoints=[];
        for(var ai=0;ai<=segments;ai++){
          var angle=(startA+sweep*ai/segments)*Math.PI/180;
          arcPoints.push({x:arcX+arcR*Math.cos(angle),y:arcY+arcR*Math.sin(angle),z:arcZ});
        }
        return {consumed:0,feature:{layerName:layerName,points:arcPoints,geomType:"LINE",approximation:"ARC_POLYLINE"}};
      }
    }
    if (record.type === "CIRCLE") {
      var cx=numeric(valueOf(values,10,NaN)),cy=numeric(valueOf(values,20,NaN));
      var cz=numeric(valueOf(values,30,0)),radius=numeric(valueOf(values,40,NaN));
      if(Number.isFinite(cx)&&Number.isFinite(cy)&&Number.isFinite(radius)&&radius>0) {
        var ring=[];
        for(var a=0;a<48;a++){var theta=2*Math.PI*a/48;ring.push({x:cx+radius*Math.cos(theta),y:cy+radius*Math.sin(theta),z:cz});}
        return {consumed:0,feature:{layerName:layerName,points:ring,geomType:"POLYGON",approximation:"CIRCLE_48"}};
      }
    }
    return {consumed:0,feature:null};
  }
  function detectDxfUnitScale(pairs,text) {
    if(/NEZAM636_COORDINATES\s*=\s*UTM_METERS/i.test(String(text||"")))return 1;
    var insUnits=null;
    for(var i=0;i<pairs.length;i++){
      if(pairs[i].code===9&&String(pairs[i].value).toUpperCase()==="$INSUNITS"){
        for(var j=i+1;j<pairs.length&&pairs[j].code!==9&&pairs[j].code!==0;j++){
          if(pairs[j].code===70){insUnits=parseInt(pairs[j].value,10);break;}
        }
        break;
      }
    }
    var scales={1:0.0254,2:0.3048,3:1609.344,4:0.001,5:0.01,6:1,7:1000,10:0.9144,21:1200/3937,22:0.0254,23:0.9144,24:1609.347218694};
    return Object.prototype.hasOwnProperty.call(scales,insUnits)?scales[insUnits]:null;
  }
  function parseDXF(text) {
    var sourceText=String(text||"");
    if(sourceText.length>MAX_FILE_BYTES)throw new Error("حجم متن DXF بیش از ۲۰ مگابایت است.");
    var pairs=parsePairs(sourceText);
    var zoneMatch=sourceText.match(/NEZAM636_UTM_ZONE\s*=\s*([0-9]{1,2}[C-HJ-NP-X])/i);
    var unitScale=detectDxfUnitScale(pairs,sourceText);
    var records=entityRecords(pairs), features=[], unsupported=0, total=0;
    if(records.length>MAX_ENTITIES) throw new Error("تعداد عوارض فایل از سقف مجاز بیشتر است.");
    for(var i=0;i<records.length;i++){
      var r=records[i];
      if(r.type==="VERTEX"||r.type==="SEQEND") continue;
      var parsed=parseEntity(r,records.slice(i+1));
      if(parsed.consumed) i+=parsed.consumed;
      if(parsed.feature){
        total+=parsed.feature.points.length;
        if(total>MAX_TOTAL_VERTICES) throw new Error("تعداد نقاط فایل DXF از سقف مجاز بیشتر است.");
        features.push(parsed.feature);
      } else unsupported++;
    }
    if(!features.length) throw new Error("هیچ عارضه قابل‌واردکردن (POLYLINE، LINE، POINT یا CIRCLE) پیدا نشد.");
    return {features:features,unsupported:unsupported,zone:zoneMatch?zoneMatch[1].toUpperCase():null,unitScale:unitScale};
  }

  window.parseCroquisDXFText = parseDXF;

  window.importCroquisDXFFile = function (event) {
    var input=event && event.target ? event.target : document.getElementById("crq-dxf-file");
    var file=input && input.files ? input.files[0] : null;
    if(!file) return false;
    if(file.size>MAX_FILE_BYTES){alert("حجم فایل DXF بیش از ۲۰ مگابایت است.");input.value="";return false;}
    var map=activeMap();
    if(!map){alert("ابتدا پرونده و نقشه مقصد را انتخاب کنید.");input.value="";return false;}
    var unitInput=document.getElementById("crq-dxf-import-units");
    var chosenUnit=unitInput?String(unitInput.value||"AUTO"):"AUTO";
    var factor=chosenUnit==="AUTO"?null:numeric(chosenUnit);
    if(chosenUnit!=="AUTO"&&(!Number.isFinite(factor)||factor<=0)){alert("واحد مختصات DXF معتبر نیست.");input.value="";return false;}
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var parsed=parseDXF(e.target.result||"");
        var zone=String(map.utmZone||"39R").toUpperCase();
        if(factor===null)factor=parsed.unitScale;
        if(!Number.isFinite(factor)||factor<=0)throw new Error("واحد فایل از سرآیند DXF قابل تشخیص نیست. واحد را از فهرست کنار دکمه ورود به‌صورت دستی انتخاب کنید.");
        if(parsed.zone&&parsed.zone!==zone){
          if(!confirm("زون فایل («"+parsed.zone+"») با زون نقشه فعال («"+zone+"») متفاوت است. مختصات بدون تبدیل وارد شود؟")) return;
        }else if(!parsed.zone){
          if(!confirm("فایل DXF فاقد زون UTM است. مختصات با فرض زون "+zone+" و واحد انتخاب‌شده وارد می‌شود. ادامه می‌دهید؟")) return;
        }
        if(!Array.isArray(map.layers))map.layers=[];
        var palette=["#2563eb","#dc2626","#16a34a","#9333ea","#ea580c","#0891b2"];
        var imported=0;
        parsed.features.forEach(function(feature,index){
          var points=feature.points.map(function(p,i){
            var x=Math.round(p.x*factor*100)/100, y=Math.round(p.y*factor*100)/100;
            var point={x:x,y:y,z:Number.isFinite(p.z)?p.z:0,elev:Number.isFinite(p.z)?p.z:0,zone:zone,label:"D"+(i+1)};
            if(typeof ensurePointEnriched==="function") ensurePointEnriched(point,zone,i);
            return point;
          });
          var baseName=String(feature.layerName||"0");
          var duplicate=map.layers.filter(function(l){return l&&String(l.name||"").indexOf("DXF "+baseName)===0;}).length+1;
          var layer={
            id:"DXF-"+Date.now()+"-"+index+"-"+Math.random().toString(36).slice(2,7),
            name:"DXF "+baseName+(duplicate>1?" ("+duplicate+")":""),
            category:"DXF_IMPORTED",
            geomType:feature.geomType,
            color:palette[index%palette.length],
            fillColor:palette[index%palette.length],
            fillOpacity:0.14,
            strokeWidth:2,
            visible:true,
            order:map.layers.length+1,
            desc:feature.approximation==="CIRCLE_48"?"دایره DXF با ۴۸ رأس تقریبی وارد شده است.":(feature.approximation==="ARC_POLYLINE"?"قوس DXF به چندخطی با نقاط نمونه‌برداری‌شده تبدیل شده است.":"واردشده از فایل DXF؛ مختصات بر اساس واحد تشخیص‌داده‌شده/انتخاب‌شده تفسیر شده است."),
            points:points,
            sourceFormat:"DXF",
            sourceLayer:baseName
          };
          map.layers.push(layer); imported++;
        });
        if(imported){
          var activeId=map.layers[map.layers.length-1].id;
          if(typeof activeCroquisLayerId!=="undefined") activeCroquisLayerId=activeId;
          window.activeCroquisLayerId=activeId;
          if(typeof saveAllDB==="function") saveAllDB();
          if(typeof renderCroquisLayersList==="function") renderCroquisLayersList();
          if(typeof loadActiveLayerIntoEditor==="function") loadActiveLayerIntoEditor();
          if(typeof renderCroquisVisualCanvas==="function") renderCroquisVisualCanvas();
          if(typeof showToastMsg==="function") showToastMsg(imported+" عارضه DXF به‌صورت لایه‌های جدید وارد شد؛ "+parsed.unsupported+" عارضه پشتیبانی‌نشده رد شد.");
          else alert(imported+" عارضه DXF وارد شد.");
        }
      }catch(err){
        alert("ورود DXF انجام نشد: "+(err&&err.message?err.message:"خطای نامشخص"));
      }finally{if(input)input.value="";}
    };
    reader.onerror=function(){alert("خواندن فایل DXF ناموفق بود.");if(input)input.value="";};
    reader.readAsText(file);
    return true;
  };

  window.triggerCroquisDXFImport = function () {
    var input=document.getElementById("crq-dxf-file");
    if(input) input.click();
  };
  window.downloadCroquisDXF = function () {
    return window.exportActiveCroquisToDXF();
  };
})();
