import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('TypeScript server and Vite configuration parse without syntax errors', () => {
  for (const file of ['server.ts', 'vite.config.ts']) {
    const source = read(file);
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.deepEqual(parsed.parseDiagnostics, [], file + ' contains TypeScript parse errors');
  }
});

test('package and TypeScript configuration are valid JSON', () => {
  assert.doesNotThrow(() => JSON.parse(read('package.json')));
  assert.doesNotThrow(() => JSON.parse(read('tsconfig.json')));
});

test('main JavaScript modules have valid syntax', () => {
  for (const file of ['nezam-core.js', 'nezam-customizer.js', 'nezam-ai-assistant.js', 'nezam-operations.js', 'nezam-agent-engine.js']) {
    assert.doesNotThrow(() => new Function(read(file)), file);
  }
});

test('inline scripts in index.html have valid syntax', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let checked = 0;

  for (const [, attrs, source] of scripts) {
    if (/\bsrc\s*=/.test(attrs) || !source.trim()) continue;
    assert.doesNotThrow(() => new Function(source), 'inline script ' + checked);
    checked++;
  }
  assert.ok(checked >= 2, 'expected the embedded integration scripts to be checked');
});

test('all local script references in the main page exist', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]);

  for (const ref of refs) {
    const clean = ref.split('?')[0];
    if (clean.startsWith('./')) {
      assert.ok(fs.existsSync(path.join(root, clean.slice(2))), 'missing script: ' + clean);
    }
  }
});

test('literal HTML ids are unique', () => {
  const html = read('index.html');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(duplicates)], []);
});

test('Gemini model fallback preserves valid saved models and replaces the retired 2.0 model', () => {
  const ai = read('nezam-ai-assistant.js');
  const match = ai.match(/function getStoredGeminiModel\(\)\s*\{[\s\S]*?\n\}/);
  assert.ok(match, 'getStoredGeminiModel must exist');

  const getterFactory = new Function('localStorage', 'return (' + match[0] + ')');
  const readModel = (saved) => getterFactory({ getItem: () => saved })();

  assert.equal(readModel(''), 'gemini-3.8-flash');
  assert.equal(readModel('gemini-2.0-flash'), 'gemini-3.8-flash');
  assert.equal(readModel('models/gemini-3.6-flash'), 'gemini-3.6-flash');
  assert.equal(readModel('gemini-2.5-flash'), 'gemini-2.5-flash');
});

test('database writes continue independently and report localStorage failures', () => {
  const core = read('nezam-core.js');
  const start = core.indexOf('function saveAllDB() {');
  const end = core.indexOf('\n}\n', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const source = core.slice(start, end + 2);
  const build = new Function(
    'localStorage', 'casesDB', 'lettersDB', 'tasksDB', 'DOC_CHECKLISTS',
    'ACT_SPECS', 'activeCaseId', 'window', 'showToastMsg', 'refreshAllViews', 'console',
    source + '\nreturn saveAllDB;'
  );

  const makeEnvironment = (failKey) => {
    const store = {};
    const warnings = [];
    let refreshCount = 0;
    const save = build({
      setItem(key, value) {
        if (key === failKey) throw new Error('quota exceeded');
        store[key] = value;
      }
    }, [{ id: 'case-1' }], [{ id: 'letter-1' }], [], {}, {}, 'case-1',
    { __nezam636LastStorageWarningAt: 0 },
    (...args) => warnings.push(args),
    () => { refreshCount++; },
    { error() {} });
    return { save, store, warnings, getRefreshCount: () => refreshCount };
  };

  const success = makeEnvironment('');
  assert.equal(success.save(), true);
  assert.equal(Object.keys(success.store).length, 6);
  assert.equal(success.warnings.length, 0);
  assert.equal(success.getRefreshCount(), 1);

  const partial = makeEnvironment('nezam636_letters');
  assert.equal(partial.save(), false);
  assert.equal(Object.keys(partial.store).length, 5);
  assert.equal(partial.warnings.length, 1);
  assert.equal(partial.getRefreshCount(), 1);
});


test('server model timeout timers are always cleared after each attempt', () => {
  const server = read('server.ts');
  const start = server.indexOf('async function runGeminiGenerateWithFallback');
  const end = server.indexOf('\nfunction extractResponseText', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const source = server.slice(start, end);
  assert.match(source, /let timeoutHandle: ReturnType<typeof setTimeout>/);
  assert.match(source, /finally\s*\{\s*if\s*\(timeoutHandle\)\s*clearTimeout\(timeoutHandle\)/);
});

test('interface navigation and dashboard use the compact responsive layout', () => {
  const html = read('index.html');
  const navButtons = [...html.matchAll(/<button\b[^>]*id="nav-btn-[^"]+"[^>]*>([\s\S]*?)<\/button>/gi)];
  assert.equal(navButtons.length, 8);
  const labels = navButtons.map((m) => m[1].replace(/<[^>]*>/g, '').trim());
  assert.ok(labels.includes('📊 پیشخوان'));
  assert.ok(labels.includes('📁 پرونده‌ها'));
  assert.ok(labels.includes('🗺️ کروکی UTM'));
  assert.ok(labels.includes('🤖 دستیار هوشمند'));

  const styleMatch = html.match(/<style id="nezam-clean-layout-2026">([\s\S]*?)<\/style>/);
  assert.ok(styleMatch, 'clean responsive layout stylesheet must exist');
  const css = styleMatch[1];
  assert.match(css, /width:194px!important/);
  assert.match(css, /@media\(max-width:991px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /workflow-law-strip>div:last-child\{display:none!important\}/);
  assert.match(css, /cmd-tile:nth-child\(1\),\.cmd-tile:nth-child\(5\)\{display:none!important\}/);
});

test('standalone Windows export keeps script order and matches the BAT filename', () => {
  const core = read('nezam-core.js');
  const bat = read('Run_Windows_Offline.bat');
  const start = core.indexOf('window.downloadStandaloneWindowsHTML = async function() {');
  const end = core.indexOf('\nfunction initAppCore()', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const builder = core.slice(start, end);
  assert.match(builder, /oldScript\.parentNode\.replaceChild/);
  assert.match(builder, /bundledCount !== bundledNames\.length/);
  assert.match(builder, /Nezam636_Windows_Offline\.html/);
  assert.match(bat, /Nezam636_Windows_Offline\.html/);
  assert.match(builder, /activeCaseId:\s*typeof activeCaseId/);
  assert.match(builder, /snap\.activeCaseId/);
});

test('page does not request font files that are absent from the repository', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /public\/fonts\/Vazirmatn|\/fonts\/Vazirmatn/);
  assert.match(html, /font-family:\s*Tahoma/);
});

test('local offline extraction does not fabricate a default location or land area', () => {
  const ai = read('nezam-ai-assistant.js');
  const start = ai.indexOf('function localOfflineExtractFields(rawText) {');
  const end = ai.indexOf('\n// نمایش وضعیت فایل غیرتصویری', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const fnSource = ai.slice(start, end);
  const extract = new Function(
    'toEnglishDigits',
    'formatUtmCoordinatesLTR',
    fnSource + '\nreturn localOfflineExtractFields;'
  )(
    (value) => String(value).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))),
    () => ''
  );

  const unrelated = extract('این متن هیچ اطلاعاتی درباره فعالیت و مساحت ندارد.');
  assert.equal(unrelated.land, '');
  assert.equal(unrelated.loc, '');
  assert.equal(unrelated.mainGroup, '');
  assert.equal(unrelated.actType, '');

  const sheep = extract('موضوع طرح: پرواربندی بره');
  assert.equal(sheep.mainGroup, 'LIVESTOCK_POULTRY_FISHERIES');
  assert.equal(sheep.actType, 'lamb');

  const mushroom = extract('موضوع طرح: پرورش قارچ دکمه‌ای');
  assert.equal(mushroom.mainGroup, 'GREENHOUSE_MUSHROOM');
  assert.equal(mushroom.actType, 'mushroom_button');

  const measured = extract('مساحت زمین: ۲۴۵۰ مترمربع');
  assert.equal(measured.land, '2450');
});

test('ambiguous OCR activity does not force a default activity into a case', () => {
  const ai = read('nezam-ai-assistant.js');
  const apply = ai.slice(ai.indexOf('function applyOcrDataToCase'), ai.indexOf('function aiExtractFromRawText'));
  const offline = ai.slice(ai.indexOf('function aiExtractFromRawText'), ai.indexOf('function aiRunFullAutopilotPipeline'));
  assert.match(apply, /if\(d\.mainGroup&&d\.actType&&document\.getElementById\('c-main-group'\)\)/);
  assert.match(offline, /if\(data\.mainGroup&&data\.actType&&document\.getElementById\('c-main-group'\)\)/);
});

test('OCR fallback does not invent an area or a location', () => {
  const server = read('server.ts');
  const fallbackStart = server.indexOf('const fallbackData = {');
  assert.notEqual(fallbackStart, -1);
  const fallbackEnd = server.indexOf('offlineFallback: true', fallbackStart);
  assert.notEqual(fallbackEnd, -1);
  const fallback = server.slice(fallbackStart, fallbackEnd);

  assert.match(fallback, /landArea:\s*landMatch\s*\?/);
  assert.match(fallback, /location:\s*''/);
  assert.doesNotMatch(fallback, /:\s*'1000'/);
  assert.doesNotMatch(fallback, /فارس، شهرستان خفر، مرکزی/);
});


test('form and secretariat print engine keeps paper geometry, binder padding, and appendix state consistent', () => {
  const customizer = read('nezam-customizer.js');
  const html = read('index.html');

  assert.ok(customizer.includes('@page { size: '));
  assert.ok(customizer.includes('#a4-preview-stage .a4-page { box-sizing: border-box !important; width: '));
  assert.ok(customizer.includes('main { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }'));
  assert.ok(customizer.includes("data-page-kind='binder-label'"));
  assert.ok(customizer.includes('data-page-kind="binder-label"'));
  assert.ok(customizer.includes('genericOverflow = page.scrollHeight > page.clientHeight'));
  assert.ok(customizer.includes('utmAttachmentHtml: includeUtm ? appendixHtml : ""'));
  assert.ok(customizer.includes('letterPageIndex === 0 ? "letter" : "letter-appendix"'));
  assert.ok(html.includes('main {\n        width: 100% !important;\n        max-width: none !important;\n        margin: 0 !important;\n        padding: 0 !important;'));
  assert.ok(html.includes('.a4-page[data-page-kind="binder-label"] {\n        padding: 15mm !important;'));
  assert.ok(html.includes('nezam-customizer.js?v=20261103-secretariat-r17'));
});


test('letter printing and exports do not silently register archive entries', () => {
  const customizer = read('nezam-customizer.js');
  const html = read('index.html');

  const extractFunction = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker);
    assert.notEqual(start, -1, 'missing function: ' + startMarker);
    const end = source.indexOf(endMarker, start);
    assert.notEqual(end, -1, 'missing function end: ' + startMarker);
    return source.slice(start, end);
  };

  const print = extractFunction(customizer, 'window.doPrintPaperSheet = function() {', '\nwindow.addEventListener("beforeprint"');
  const htmlExport = extractFunction(customizer, 'window.downloadPaperSheetFile = function(forcedSize) {', '\nfunction activatePaneForArchivedLetter');
  const wordExport = extractFunction(customizer, 'function exportStageToWordDoc() {', '\nfunction initBrandingAndTemplatesUI');

  assert.doesNotMatch(print, /savePaperEditsToSecretariat/);
  assert.doesNotMatch(htmlExport, /savePaperEditsToSecretariat/);
  assert.doesNotMatch(wordExport, /savePaperEditsToSecretariat/);
  assert.match(customizer, /window\.printCurrentLetterDraft = function\(forcedPaperSize\)/);
  assert.match(html, /onclick="previewCurrentLetterDraft\(\)">پیش‌نمایش و ادامه به چاپ/);
  assert.doesNotMatch(html, /onclick="printCurrentLetterDraft/);
  assert.match(html, /onclick="saveLetterToSecretariat\(false\)">ثبت در دبیرخانه/);
  assert.match(html, /فقط نامه‌های ثبت‌شده نمایش داده می‌شوند؛ چاپ و دانلود به‌تنهایی سابقه ایجاد نمی‌کند/);
});


test('standalone office correspondence is available without an applicant', () => {
  const customizer = read('nezam-customizer.js');
  const core = read('nezam-core.js');
  const html = read('index.html');

  assert.match(customizer, /window\.startIndependentOfficeLetter = function\(\)/);
  assert.match(customizer, /window\.__nezamOfficeLetterDraftMode === true/);
  assert.match(customizer, /function getNextSecretariatNumber\(\)[\s\S]*lettersDB/);
  assert.match(customizer, /if \(!c && !officeMode\) return null/);
  assert.match(customizer, /caseId: officeMode \? "" : c\.id/);
  assert.match(customizer, /officeLetter: officeMode/);
  assert.match(customizer, /var c = officeMode \? null : getActiveCase\(\)/);
  assert.match(customizer, /if \(c\) \{\s*logCaseAction\(c,/);
  assert.match(customizer, /var officeLetter = base\.officeLetter === true/);
  assert.match(customizer, /var caseObj = officeLetter \? null/);
  assert.match(customizer, /var isOfficeLetter = letter\.officeLetter === true/);

  const switcher = core.slice(core.indexOf('function switchMainPane'), core.indexOf('\nfunction switchCaseSubTab'));
  const guardedPaneMap = switcher.slice(switcher.indexOf('var guardedPanes'), switcher.indexOf('var independentOfficeLetterFlow'));
  assert.doesNotMatch(guardedPaneMap, /"pane-letters"\s*:/);
  assert.match(switcher, /paneId === "pane-print" && independentOfficeLetterFlow/);
  assert.match(core, /l\.officeLetter === true[\s\S]*نامه اداری مستقل دفتر/);
  assert.match(core, /مکاتبات مستقل دفتر را می‌توان از مسیر «نامه اداری مستقل دفتر»/);

  assert.match(html, /id="btn-letter-case-mode"[^>]*onclick="startCaseLinkedLetter\(\)"/);
  assert.match(html, /id="btn-letter-office-mode"[^>]*onclick="startIndependentOfficeLetter\(\)"/);
  assert.match(html, /<th>گیرنده \/ ارتباط با پرونده<\/th>/);
  assert.match(html, /nezam-core\.js\?v=20261106-storage-sync-r10/);
  assert.match(html, /nezam-customizer\.js\?v=20261103-print-engine-r13/);
});


test('deleted records are tombstoned and stale Drive folder backups are never auto-merged', () => {
  const html = read('index.html');
  const core = read('nezam-core.js');
  const restoreStart = html.indexOf('async function loadFromDriveOnStartup');
  const restoreEnd = html.indexOf('// ۳. اعمال فوری اطلاعات بازخوانی‌شده', restoreStart);
  assert.notEqual(restoreStart, -1);
  assert.notEqual(restoreEnd, -1);
  const restore = html.slice(restoreStart, restoreEnd);

  assert.match(core, /function recordNezamDeletions/);
  assert.match(core, /function filterNezamRecordsByDeletionManifest/);
  assert.match(core, /recordNezamDeletions\(\[c\], lettersToDelete\)/);
  assert.match(core, /recordNezamDeletions\(\[\], \[deletedLetterRecord\]\)/);
  assert.match(restore, /mergeNezamDeletionManifests\(localDeletionManifest, cloudDeletionManifest\)/);
  assert.match(restore, /filterNezamRecordsByDeletionManifest/);
  assert.match(restore, /Legacy applicant-folder backups were detected and intentionally not merged/);
  assert.doesNotMatch(restore, /currentCases\.unshift\(rc\)|currentLetters\.unshift\(rl\)/);
});

test('deletion manifest filters restored records and persists case and letter tombstones', () => {
  const core = read('nezam-core.js');
  const start = core.indexOf('var NEZAM_DELETION_MANIFEST_KEY');
  const end = core.indexOf('/* بارگذاری و مهاجرت یک‌باره', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const helperSource = core.slice(start, end);
  const data = {};
  const localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); }
  };
  const api = new Function('localStorage', 'window', 'console', 'casesDB', 'lettersDB',
    helperSource + '\nreturn { recordNezamDeletions, readNezamDeletionManifest, filterNezamRecordsByDeletionManifest };'
  )(localStorage, {}, { error() {} }, [], []);

  assert.equal(api.recordNezamDeletions(
    [{ id: 'case-deleted', nid: '123', name: 'متقاضی حذف‌شده' }],
    [{ id: 'letter-deleted', number: '1405010101', recipient: 'اداره' }]
  ), true);
  const manifest = api.readNezamDeletionManifest();
  const filtered = api.filterNezamRecordsByDeletionManifest(
    [{ id: 'case-deleted', nid: '123' }, { id: 'case-live', nid: '456' }],
    [{ id: 'letter-deleted', number: '1405010101' }, { id: 'letter-live', number: '1405010102' }],
    manifest
  );

  assert.deepEqual(filtered.cases.map((x) => x.id), ['case-live']);
  assert.deepEqual(filtered.letters.map((x) => x.id), ['letter-live']);
  assert.ok(data.nezam636_deletion_manifest_v1, 'deletion manifest must be saved in browser storage');
});

test('Drive sync only reports success after a matching snapshot is read back', () => {
  const html = read('index.html');
  assert.match(html, /async function verifyDriveSnapshot\(snapshot, expectedTs\)/);
  assert.match(html, /await verifyDriveSnapshot\(snapshot, ts\)/);
  assert.match(html, /گوگل پاسخ اولیه را پذیرفت، اما نسخه جدید/);
  assert.match(html, /پاسخ گوگل صریحاً موفقیت ذخیره را تأیید نکرد/);
});

test('canonical browser storage no longer falls back to stale v6 keys after migration', () => {
  const core = read('nezam-core.js');
  const reloadStart = core.indexOf('window.reloadAllStateFromLocalStorage = function()');
  const reloadEnd = core.indexOf('\n};', reloadStart);
  assert.notEqual(reloadStart, -1);
  assert.notEqual(reloadEnd, -1);
  const reload = core.slice(reloadStart, reloadEnd);
  assert.match(reload, /localStorage\.getItem\("nezam636_unified_cases"\)/);
  assert.doesNotMatch(reload, /localStorage\.getItem\("nezam636_cases_v6"\)/);
  assert.match(reload, /if \(Array\.isArray\(loadedCases\)\) casesDB = loadedCases/);
});

test('Drive sync queues a second snapshot when a write arrives during an active sync', () => {
  const html = read('index.html');
  const start = html.indexOf('async function syncAllDataToDrive');
  const end = html.indexOf('// ۴. ساخت پوشه اختصاصی متقاضی فعال', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const sync = html.slice(start, end);

  assert.ok(sync.includes('syncRequestedWhileBusy = true'), 'a busy sync must queue the newer change');
  assert.ok(sync.includes('if (syncRequestedWhileBusy && isInitialLoadDone && !isRestoring)'), 'queued changes must run after the active request finishes');
  assert.ok(sync.includes('setTimeout(() => syncAllDataToDrive(false), 350)'), 'the queued snapshot must be sent after the previous request');
});


test('deletions are immediately synced and cannot race with initial Drive restore', () => {
  const core = read('nezam-core.js');
  const html = read('index.html');
  const deleteStart = core.indexOf('function deleteActiveCase()');
  const deleteEnd = core.indexOf('\n}', deleteStart);
  const deleteFn = core.slice(deleteStart, deleteEnd);
  assert.ok(deleteFn.includes('window.__nezamDriveReady === false'));
  assert.ok(deleteFn.includes('window.syncDeletionToDrive()'));
  assert.ok(html.includes('window.syncDeletionToDrive = function()'));
  assert.ok(html.includes('if (!isInitialLoadDone || isRestoring) return Promise.resolve(false)'));
  assert.ok(html.includes('window.__nezamDriveReady = true'));
});
test('offline deletion markers are pushed to Drive after the next successful cloud read', () => {
  const html = read('index.html');
  const start = html.indexOf('async function loadFromDriveOnStartup');
  const end = html.indexOf('// ۶. اتصال هوشمند', start);
  const restore = html.slice(start, end);
  assert.ok(restore.includes('hasLocalOnlyDeletion'));
  assert.ok(restore.includes('if (syncAfterRestore && cloudReadSucceeded)'));
  assert.ok(restore.includes('setTimeout(() => syncAllDataToDrive(false), 300)'));
});
test('manual browser backup restore merges permanent deletion markers', () => {
  const ops = read('nezam-operations.js');
  const start = ops.indexOf('async function applyBackupPayload');
  const end = ops.indexOf('\n  async function restoreProtectedBackup', start);
  const apply = ops.slice(start, end);
  assert.ok(apply.includes('mergeNezamDeletionManifests(localDeletionManifest, backupDeletionManifest)'));
  assert.ok(apply.includes('filterNezamRecordsByDeletionManifest'));
  assert.ok(apply.includes('persistNezamDeletionManifest(mergedDeletionManifest)'));
});

test('print pipeline isolates the printable document and waits for map image tiles', () => {
  const customizer = read('nezam-customizer.js');
  assert.ok(customizer.includes('function waitForPrintAssets(root, timeoutMs)'));
  assert.ok(customizer.includes('root.querySelectorAll("svg image")'));
  assert.ok(customizer.includes('function buildIsolatedPrintDocument(stage, paperSize, title)'));
  assert.ok(customizer.includes('window.open("", "_blank")'));
  assert.ok(customizer.includes('waitForPrintAssets(printWindow.document, 12000)'));
  assert.ok(customizer.includes('.printed-croquis-satellite-box>svg{display:block!important;width:100%!important;'));
  assert.ok(customizer.includes("@media print{.no-print,[data-no-print='true']{display:none!important;}"));
  assert.ok(customizer.includes('if (fitResult.overflowCount && !window.confirm'));
  assert.ok(!customizer.includes('crossorigin="anonymous"'));
  assert.ok(!customizer.includes('currentPreviewMode !== "CROQUIS" && (fitResult.pendingCount || fitResult.overflowCount)'));

  const cssStart = customizer.indexOf('function buildPaperExportCss(');
  const cssEnd = customizer.indexOf('\nfunction safePaperFileBase', cssStart);
  assert.ok(cssStart >= 0 && cssEnd > cssStart, 'shared paper CSS builder must exist');
  const buildCss = new Function(customizer.slice(cssStart, cssEnd) + '\nreturn buildPaperExportCss;')();
  const a4Css = buildCss('A4', false);
  const a5Css = buildCss('A5', false);
  assert.ok(a4Css.includes('@page{size:210mm 297mm;margin:0;}'));
  assert.ok(a5Css.includes('@page{size:148mm 210mm;margin:0;}'));
  assert.ok(a4Css.includes(".a4-page,.a4-page.paper-a5{width:210mm!important"));
  assert.ok(a5Css.includes(".a4-page,.a4-page.paper-a5{width:148mm!important"));
  assert.ok(a4Css.includes(".no-print,[data-no-print='true']{display:none!important;}"));
});



test('navigation and printing have one clear control path', () => {
  const html = read('index.html');
  const customizer = read('nezam-customizer.js');
  const core = read('nezam-core.js');
  const operations = read('nezam-operations.js');

  assert.doesNotMatch(html, /var SUB_TABS_MAP\s*=|function renderSubBar\s*\(/);
  assert.doesNotMatch(html, /id\s*=\s*'nezam-top-subbar'/);
  assert.match(html, /id="sub-docs"/);
  assert.ok(html.includes('id="btn-sub-matrix"'));
  assert.ok(html.includes('id="btn-sub-docs"'));
  assert.ok(html.includes('display: block !important;'));
  assert.ok(!html.includes('display: none !important;\n  }\n\n  /* ۴. تضمین نمایش ۱۰۰٪ تایل‌های نقشه Leaflet */'));
  assert.equal((html.match(/id="print-paper-size-select"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="l-paper-size"|id="btn-paper-a4"|id="btn-paper-a5"|id="btn-preview-letter-draft"/);
  assert.doesNotMatch(customizer, /l-paper-size|btn-paper-a4|btn-paper-a5|btn-preview-letter-draft/);
  assert.match(core, /data-letter-action='preview'/);
  assert.doesNotMatch(core, /data-letter-action='a4'|data-letter-action='a5'/);
  assert.equal((customizer.match(/waitForPrintAssets\(printWindow\.document, 12000\)/g) || []).length, 1);
  assert.equal((customizer.match(/waitForPrintAssets\(stage, 12000\)/g) || []).length, 1);
  assert.match(customizer, /askToContinueWithMissingAssets/);
  assert.match(customizer, /afterprint\", releasePrintLock/);
  assert.match(html, /mapEnhancementRetry = setInterval/);
  assert.match(html, /<script defer src="\.\/nezam-agent-engine\.js/);
  assert.doesNotMatch(operations, /پرونده‌های ثبت‌شده|نامه‌های ثبت‌شده:/);
  assert.match(operations, /پیگیری‌های عقب‌افتاده/);
  assert.match(operations, /استعلام‌های غیرقطعی/);
});
test('Google Drive applicant document vault supports protected multi-file storage', () => {
  const html = read('index.html');
  const core = read('nezam-core.js');
  const vault = read('nezam-drive-documents.js');

  assert.match(html, /nezam-drive-documents\.js\?v=/);
  assert.match(html, /id="case-doc-bulk-files"[^>]*multiple/);
  assert.match(html, /id="case-doc-bulk-upload"/);
  assert.match(html, /id="case-doc-migrate-legacy"/);
  assert.match(core, /window\.NezamDriveDocuments\.uploadFiles/);
  assert.match(core, /data-doc-action="replace"/);
  assert.match(core, /data-doc-action="remove-file"/);

  assert.match(vault, /MAX_FILE_BYTES = 10 \* 1024 \* 1024/);
  assert.match(vault, /for \(var i = 0; i < files\.length; i\+\+\)/);
  assert.match(vault, /action: context\.replaceFileId \? 'replaceCaseDocument' : 'uploadCaseDocument'/);
  assert.match(vault, /action:'listCaseDocuments'/);
  assert.match(vault, /action:'deleteCaseDocument'/);
  assert.match(vault, /__nezam636_docs_access_key/);
  assert.match(vault, /'readDatabase','listCaseDocuments'/);
  assert.match(vault, /retryFailed:retryFailed/);
  assert.match(vault, /healthCheck: true/);
  assert.match(html, /await window\.NezamDriveDocuments\.ensureReady\(\)/);
  assert.match(html, /id="case-doc-retry-failed"/);
  assert.match(html, /id="case-doc-upload-errors"/);
  assert.match(html, /accessKey: window\.NezamDriveDocuments\.getAccessKey\(\)/);
  assert.doesNotMatch(vault, /NEZAM636_DOCS_ACCESS_KEY\s*=\s*['"][^'"]+['"]/);
});



test('applicant section displays a complete Google Drive file inventory and metadata', () => {
  const html = read('index.html');
  const core = read('nezam-core.js');
  assert.match(html, /id="case-docs-file-library"/);
  assert.match(html, /id="case-docs-library-summary"/);
  assert.match(html, /id="case-docs-library-tbody"/);
  assert.match(html, /id="case-docs-refresh-library"/);
  assert.match(core, /var allFiles = \(cloudFiles \|\| \[\]\)\.slice\(\)/);
  assert.match(core, /file\.mimeType/);
  assert.match(core, /file\.uploadedAt/);
  assert.match(core, /file\.webViewLink/);
  assert.match(core, /file\.downloadUrl/);
  assert.match(core, /data-library-action="delete"/);
  assert.match(core, /data-library-action="replace"/);
  assert.match(core, /دریافت فهرست فایل‌ها ناموفق بود/);
});


test('local IndexedDB failures cannot indefinitely block Google Drive document listing', () => {
  const core = read('nezam-core.js');
  const vault = read('nezam-drive-documents.js');
  assert.match(core, /setTimeout\(function\(\) \{ finish\(null\); \}, 4500\)/);
  assert.match(core, /Local document lookup timed out; continuing with Google Drive inventory/);
  assert.match(core, /var driveListPromise = window\.NezamDriveDocuments/);
  assert.match(core, /نمایش کتابخانه ابری مستقل از IndexedDB/);
  assert.match(core, /setTimeout\(function\(\) \{\s*if \(completed\) return;\s*completed = true;/);
  assert.match(vault, /function withTimeout\(promise, timeoutMs, message\)/);
  assert.match(vault, /15000, 'پاسخ Google Apps Script برای بررسی اتصال در ۱۵ ثانیه دریافت نشد/);
  assert.match(vault, /18000,\s*'پاسخ Google Apps Script در ۱۸ ثانیه دریافت نشد/);
});


test('secretariat variable injection resolves in preview using the letter snapshot and linked case', () => {
  const customizer = read('nezam-customizer.js');
  assert.match(customizer, /function resolveOfficeLetterVariables\(bodyHtml, letter, linkedCase\)/);
  assert.match(customizer, /pick\(\["appName", "name"\], \["name"\], \["نام متقاضی", "نام"\]\)/);
  assert.match(customizer, /"نام": "name"/);
  assert.match(customizer, /"پلاکثبتی": "landParcel"/);
  assert.match(customizer, /window\.__nezam636UnresolvedLetterVars = bodyResolution\.unresolved\.slice\(\)/);
  assert.match(customizer, /bodyResolution\.html/);
  assert.match(customizer, /isDraft \? getActiveCase\(\) : null/);
  assert.match(customizer, /چاپ تا تکمیل متغیرها مجاز نیست/);
});

test('secretariat output is blocked while letter variables remain unresolved', () => {
  const customizer = read('nezam-customizer.js');
  assert.match(customizer, /function ensureLetterVariablesResolvedForOutput\(\)/);
  assert.match(customizer, /if \(!ensureLetterVariablesResolvedForOutput\(\)\) return false;/);
  assert.match(customizer, /چاپ\/خروجی متوقف شد/);
});

test('rich letter editor preserves selection and caret during token insertion', () => {
  const customizer = read('nezam-customizer.js');
  assert.match(customizer, /var letterEditorSavedRange=null/);
  assert.match(customizer, /function restoreLetterEditorSelection\(editor\)/);
  assert.match(customizer, /function insertTextAtLetterSelection\(text\)/);
  assert.match(customizer, /function insertHtmlAtLetterSelection\(html\)/);
  assert.match(customizer, /editor\.dataset\.letterKeyboardBound/);
  assert.match(customizer, /editor\.addEventListener\("paste"/);
  assert.match(customizer, /insertHtmlAtLetterSelection\(pastedHtml\)/);
  const syncStart = customizer.indexOf('function syncRichEditorToTextarea()');
  const syncEnd = customizer.indexOf('window.syncRichEditorToTextarea', syncStart);
  assert.notEqual(syncStart, -1);
  assert.notEqual(syncEnd, -1);
  const liveSync = customizer.slice(syncStart, syncEnd);
  assert.doesNotMatch(liveSync, /editor\.innerHTML\s*=/);
  assert.match(liveSync, /editor\.innerText \|\| editor\.textContent/);
});

test('secretariat variable tokens survive sanitization and resolve from standard and custom case fields', () => {
  const customizer = read('nezam-customizer.js');
  const html = read('index.html');

  assert.match(customizer, /setAttribute\("data-nezam-variable", rawKey\)/);
  assert.match(customizer, /clean\.setAttribute\("data-nezam-variable", variableKey\)/);
  assert.match(customizer, /querySelectorAll\("span\[data-nezam-variable\]"\)/);
  assert.match(customizer, /addCustomFields\(record\.customFields\)/);
  assert.match(customizer, /addCustomFields\(caseData\.customFields\)/);
  assert.match(customizer, /caseCode: officeMode \? "" : \(c\.code \|\| ""\)/);
  assert.match(customizer, /customFields: officeMode \? \[\] : \(Array\.isArray\(c\.customFields\)/);
  assert.match(customizer, /pick\(\["landParcel", "parcel"\], \["landParcel", "parcel"\], \["پلاک ثبتی", "پلاک"\]\)/);
  assert.match(customizer, /pick\(\["water", "waterSource"\], \["water", "waterSource"\], \["منبع آب", "آب"\]\)/);
  assert.match(html, /onmousedown="rememberLetterEditorSelection\(\)"/);
  assert.match(html, /\.rich-editor-paper \[data-nezam-variable\]/);
});

test('secretariat variable syntax supports old plain-text tags and double-brace tags', () => {
  const customizer = read('nezam-customizer.js');
  assert.ok(customizer.includes('String(tag || "").match(/^\\{([^{}]+)\\}$/)'));
  assert.ok(customizer.includes('textNode.nodeValue.replace(/\\{\\{([^{}]+)\\}\\}|\\{([^{}]+)\\}/g'));
  assert.ok(customizer.includes('replace(/[\\s\\u200c\\u200f\\u0640]/g, "")'));
});


test('secretariat save from preview blocks unresolved variables before writing the archive record', () => {
  const customizer = read('nezam-customizer.js');
  const start = customizer.indexOf('window.savePaperEditsToSecretariat = function(options)');
  assert.notEqual(start, -1);
  const savePath = customizer.slice(start, start + 3000);
  assert.match(savePath, /if \(!ensureLetterVariablesResolvedForOutput\(\)\) return false;/);
});


test('secretariat archive search normalizes digits, Arabic letters and HTML body content', () => {
  const core = read('nezam-core.js');
  assert.match(core, /function normalizeSecretariatSearchText\(value\)/);
  assert.match(core, /return toEn\(text\)/);
  assert.match(core, /replace\(\/\[يى\]\/g, "ی"\)/);
  assert.match(core, /l\.landParcel, l\.loc, l\.body/);
  assert.match(core, /نامه مستقل دفتر/);
});

test('common full applicant-name variable alias resolves consistently', () => {
  const customizer = read('nezam-customizer.js');
  assert.match(customizer, /"نامونامخانوادگی": "name"/);
});
