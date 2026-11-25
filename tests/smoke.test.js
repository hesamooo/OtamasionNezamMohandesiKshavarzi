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
  for (const file of ['nezam-core.js', 'nezam-customizer.js', 'nezam-croquis-enhancements.js', 'nezam-croquis-print-declaration.js', 'nezam-cad-view-tools.js', 'nezam-cad-file-io.js', 'nezam-ai-assistant.js', 'nezam-operations.js', 'nezam-agent-engine.js']) {
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
  assert.match(vault, /function getActionTimeout_\(action\)/);
  assert.match(vault, /readDatabase: 35000/);
  assert.match(vault, /getCaseDocumentContent: 60000/);
  assert.match(vault, /uploadCaseDocument: 90000/);
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

test('Drive sync protects offline edits and rejects stale cloud baselines', () => {
  const html = read('index.html');
  assert.ok(html.includes('this !== window.localStorage'));
  assert.ok(html.includes('__gdrive_local_change_ts'));
  assert.ok(html.includes('beforeWriteTs !== baselineTs'));
  assert.ok(html.includes('syncConflictDetected'));
  assert.ok(html.includes('hasPendingLocalChanges'));
});

test('Drive-only snapshots keep applicant records but never depend on browser IndexedDB', () => {
  const html = read('index.html');
  const core = read('nezam-core.js');
  const start = html.indexOf('async function collectCompleteSystemSnapshot()');
  const end = html.indexOf('function validateDriveWriteResponse', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const snapshot = html.slice(start, end);
  assert.ok(snapshot.includes("requireJsonArray('nezam636_unified_cases'"));
  assert.ok(snapshot.includes("requireJsonArray('nezam636_letters'"));
  assert.ok(snapshot.includes('return { storage: storageData }'));
  assert.equal(snapshot.includes('indexedDBDocs'), false);
  assert.equal(snapshot.includes('exportIndexedDBDocs'), false);
  assert.equal(html.includes('snapshot.indexedDBDocs'), false);
  assert.equal(html.includes('window.importIndexedDBDocs'), false);
  assert.equal(html.includes('window.exportIndexedDBDocs'), false);
  assert.equal(core.includes('openFilesDB('), false);
  assert.equal(core.includes('getUploadedDocsForCase('), false);
  assert.equal(core.includes('importIndexedDBDocs'), false);
  assert.equal(core.includes('exportIndexedDBDocs'), false);
  assert.ok(core.includes('NezamDriveDocuments.uploadFiles'));
  assert.ok(core.includes('NezamDriveDocuments.list'));
});

test('Apps Script accepts Drive-only snapshots and strips legacy IndexedDB payloads', () => {
  const code = read('apps-script/Code.gs');
  assert.doesNotThrow(() => new Function(code));
  const start = code.indexOf('function validateMasterSyncRecord_(syncObj) {');
  const end = code.indexOf('\nfunction writeMasterSyncRecord_', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const validate = new Function(code.slice(start, end) + '\nreturn validateMasterSyncRecord_;')();
  const storage = {
    nezam636_unified_cases: '[]',
    nezam636_letters: '[]',
    nezam636_deletion_manifest_v1: JSON.stringify({ version: 1, cases: [], letters: [] })
  };
  const driveOnly = validate({ _type: 'FULL_STORAGE_SYNC', storage });
  assert.equal(Object.prototype.hasOwnProperty.call(driveOnly, 'indexedDBDocs'), false);
  const legacy = validate({ _type: 'FULL_STORAGE_SYNC', storage, indexedDBDocs: [{ key: 'old-local' }] });
  assert.equal(Object.prototype.hasOwnProperty.call(legacy, 'indexedDBDocs'), false);
  assert.throws(() => validate({
    _type: 'FULL_STORAGE_SYNC',
    storage: { ...storage, nezam636_letters: '{}' }
  }));
  assert.ok(code.includes('delete clean.indexedDBDocs'));
  assert.ok(code.includes('delete clean.fullDatabase.indexedDBDocs'));
});

test('Drive save failures expose the backend error instead of a generic connection label', () => {
  const html = read('index.html');
  assert.ok(html.includes("setCloudStatus('⚠️ خطا: ' + driveErrorText.slice(0, 28)"));
  assert.ok(html.includes("statusButton.title = 'جزئیات خطای ذخیره‌سازی Google Drive: ' + driveErrorText"));
  assert.ok(html.includes('20261108-drive-only-r3'));
});

test('old Apps Script IndexedDB validation errors point to the required backend deployment', () => {
  const html = read('index.html');
  assert.ok(html.includes('نسخه Code.gs در Google Apps Script قدیمی است'));
  assert.ok(html.includes('با «New version» دوباره منتشر کنید'));
});


test('UTM conversion preserves centimetre precision for KML and map overlays', () => {
  const source = read('nezam-customizer.js');
  const start = source.indexOf('function latLngToUtmWGS84(');
  const end = source.indexOf('\n}', start) + 2;
  assert.ok(start >= 0 && end > 1, 'latLngToUtmWGS84 must exist');
  const convert = new Function(source.slice(start, end) + '\nreturn latLngToUtmWGS84;')();
  const actual = convert(28.93858203107952, 53.20444413167027, 39);

  // Reference WGS84 / UTM zone 39N projection for the first vertex of the
  // Khafr parcel. The old Math.round() implementation missed by up to 0.5 m.
  assert.ok(Math.abs(actual.x - 714867.905415) < 0.01, 'Easting must stay within 1 cm');
  assert.ok(Math.abs(actual.y - 3203181.780886) < 0.01, 'Northing must stay within 1 cm');
  assert.notEqual(actual.x, Math.round(actual.x), 'Easting must not be rounded to whole metres');
});

test('parcel containment treats a point on the boundary as inside', () => {
  const source = read('nezam-customizer.js');
  const segmentStart = source.indexOf('function isPointOnSegment2D(');
  const segmentEnd = source.indexOf('\n}', segmentStart) + 2;
  const polygonStart = source.indexOf('function isPointInPolygon2D(');
  const polygonEnd = source.indexOf('\n}', polygonStart) + 2;
  assert.ok(segmentStart >= 0 && segmentEnd > 1, 'isPointOnSegment2D must exist');
  assert.ok(polygonStart >= 0 && polygonEnd > 1, 'isPointInPolygon2D must exist');
  const isInside = new Function(
    source.slice(segmentStart, segmentEnd) + '\n' +
    source.slice(polygonStart, polygonEnd) + '\nreturn isPointInPolygon2D;'
  )();
  const parcel = [
    { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 20 }
  ];

  assert.equal(isInside({ x: 10, y: 0 }, parcel), true, 'boundary point should be included');
  assert.equal(isInside({ x: 10, y: 10 }, parcel), true, 'interior point should be included');
  assert.equal(isInside({ x: 20.1, y: 10 }, parcel), false, 'a point clearly outside must remain outside');
});



test('croquis placement shapes create correct rectangle, square and polygonal circle geometry', () => {
  const source = read('nezam-croquis-enhancements.js');
  const start = source.indexOf('  window.rotateUtmPolygon = function');
  const end = source.indexOf('  function placementPointInPolygon', start);
  assert.ok(start >= 0 && end > start);
  const helpers = source.slice(start, end);
  const code = [
    'function roundCm(value) { return Math.round(Number(value) * 100) / 100; }',
    'function isSimpleUtmPolygon(points) { return Array.isArray(points) && points.length >= 3; }',
    helpers,
    'return { rotate: window.rotateUtmPolygon, build: window.buildCroquisPlacementShapePoints };'
  ].join('\\n');
  const api = new Function('window', code)({});
  const rect = api.build('RECTANGLE', 500000, 3200000, { length: 20, width: 10, azimuth: 0 }, '39R', 0);
  assert.equal(rect.sideCount, 4);
  assert.ok(Math.abs(rect.area - 200) < 0.1);
  assert.ok(Math.abs(rect.perimeter - 60) < 0.1);
  const square = api.build('SQUARE', 500000, 3200000, { side: 12, azimuth: 45 }, '39R', 0);
  assert.ok(Math.abs(square.area - 144) < 0.25, "centimetre rounding may introduce a small area difference");
  const circle = api.build('CIRCLE', 500000, 3200000, { radius: 5, segments: 48 }, '39R', 0);
  assert.equal(circle.sideCount, 48);
  assert.ok(Math.abs(circle.area - Math.PI * 25) < 0.5);
});

test('croquis polygon rotation is clockwise around its geometric centroid and preserves side lengths', () => {
  const source = read('nezam-croquis-enhancements.js');
  const start = source.indexOf('  window.rotateUtmPolygon = function');
  const end = source.indexOf('  function placementStats', start);
  assert.ok(start >= 0 && end > start);
  const rotate = new Function(
    'window',
    'function roundCm(value) { return Math.round(Number(value) * 100) / 100; }\\n' +
    source.slice(start, end) + '\\nreturn window.rotateUtmPolygon;'
  )({});
  const original = [
    { x: 0, y: 0, label: 'P1' }, { x: 20, y: 0, label: 'P2' },
    { x: 20, y: 10, label: 'P3' }, { x: 0, y: 10, label: 'P4' }
  ];
  const rotated = rotate(original, 90);
  assert.equal(rotated.length, 4);
  assert.deepEqual(rotated.map(p => [p.x, p.y]), [[5,15],[5,-5],[15,-5],[15,15]]);
  for (let i=0;i<original.length;i++) {
    const j=(i+1)%original.length;
    assert.ok(Math.abs(Math.hypot(rotated[j].x-rotated[i].x,rotated[j].y-rotated[i].y) -
      Math.hypot(original[j].x-original[i].x,original[j].y-original[i].y)) < 0.02);
  }
  assert.equal(rotated[0].label,'P1');
});

test('croquis placement geometry is rejected when any edge leaves the main parcel', () => {
  const source = read('nezam-croquis-enhancements.js');
  const start = source.indexOf('  function placementPointInPolygon');
  const end = source.indexOf('  function croquisPlacementStatus', start);
  assert.ok(start >= 0 && end > start);
  const helpers = source.slice(start, end);
  const api = new Function('window', helpers + '\\nreturn window.isCroquisPlacementShapeInsideParcel;')({});
  const parcel = [{x:0,y:0},{x:30,y:0},{x:30,y:20},{x:0,y:20}];
  const inside = [{x:5,y:5},{x:15,y:5},{x:15,y:15},{x:5,y:15}];
  const outside = [{x:5,y:5},{x:35,y:5},{x:35,y:15},{x:5,y:15}];
  assert.equal(api(inside,parcel),true);
  assert.equal(api(outside,parcel),false);
});


test('croquis exact polygon generator closes and preserves user-entered side lengths', () => {
  const source = read('nezam-croquis-enhancements.js');
  const helperStart = source.indexOf('  function cross2(');
  const generatorStart = source.indexOf('  window.buildExactUtmPolygonFromSides = function');
  const generatorEnd = source.indexOf('\n  };', generatorStart) + 5;
  assert.ok(helperStart >= 0 && generatorStart > helperStart && generatorEnd > 5);
  const code = 'function roundCm(value) { return Math.round(Number(value) * 100) / 100; }\n' + source.slice(helperStart, generatorEnd);
  const build = new Function('window', code + '\nreturn window.buildExactUtmPolygonFromSides;')({});
  const result = build(500000, 3200000, [
    { length: 45, azimuth: 90 },
    { length: 24.444444444, azimuth: 180 },
    { length: 45, azimuth: 270 },
    { length: 24.444444444, azimuth: 0 }
  ], '39R', 0);
  assert.equal(result.sideCount, 4);
  assert.ok(Math.abs(result.area - 1100) < 0.1, 'rectangle area must be approximately 1100 m²');
  assert.ok(result.closureError <= 0.15, 'polygon must close within the documented 15 cm tolerance');
  const measured = result.points.map((point, index) => {
    const next = result.points[(index + 1) % result.points.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  assert.ok(Math.abs(measured[0] - 45) < 0.02);
  assert.ok(Math.abs(measured[1] - (1100 / 45)) < 0.02);
  assert.throws(() => build(500000, 3200000, [
    { length: 45, azimuth: 90 }, { length: 25, azimuth: 180 }, { length: 45, azimuth: 270 }
  ], '39R', 0), /پلیگون بسته نیست/);
});

test('moving a croquis polygon translates every UTM vertex without changing its shape', () => {
  const source = read('nezam-croquis-enhancements.js');
  const start = source.indexOf('  window.translateUtmPolygon = function');
  const end = source.indexOf('\n  };', start) + 5;
  assert.ok(start >= 0 && end > 5);
  const translateCode = 'function roundCm(value) { return Math.round(Number(value) * 100) / 100; }\n' + source.slice(start, end);
  const translate = new Function('window', translateCode + '\nreturn window.translateUtmPolygon;')({});
  const original = [
    { x: 100, y: 200, label: 'P1' },
    { x: 145, y: 200, label: 'P2' },
    { x: 145, y: 225, label: 'P3' },
    { x: 100, y: 225, label: 'P4' }
  ];
  const moved = translate(original, 12.34, -56.78);
  assert.equal(moved.length, 4);
  assert.equal(moved[0].x, 112.34);
  assert.equal(moved[0].y, 143.22);
  for (let i = 0; i < original.length; i++) {
    const next = (i + 1) % original.length;
    const before = Math.hypot(original[next].x - original[i].x, original[next].y - original[i].y);
    const after = Math.hypot(moved[next].x - moved[i].x, moved[next].y - moved[i].y);
    assert.ok(Math.abs(before - after) < 0.02, 'side length must remain unchanged after translation');
  }
  assert.equal(original[0].x, 100, 'original point objects must remain unchanged');
});

test('croquis clearance, move, and landscape print controls are wired without changing storage setup', () => {
  const html = read('index.html');
  const module = read('nezam-croquis-enhancements.js');
  assert.ok(html.includes('id="crq-clearances-list"'));
  assert.ok(html.includes('id="crq-clearance-distance"'));
  assert.ok(html.includes('id="crq-exact-poly-sides"'));
  assert.ok(html.includes('id="crq-map-move-polygon-btn"'));
  assert.ok(html.includes('nezam-croquis-enhancements.js?v=20261125-croquis-tools-r1'));
  assert.ok(module.includes('map.clearances'));
  assert.ok(module.includes('croquis-clearances-print'));
  assert.ok(module.includes('@page croquisMapLandscape { size: A4 landscape; margin: 0; }'));
  assert.ok(module.includes('window.translateUtmPolygon'));
  assert.ok(module.includes('window.toggleCroquisWholePolygonMove'));
  // The enhancement module does not redefine or migrate the office database keys.
  assert.ok(!module.includes('localStorage.setItem'));
  assert.ok(!module.includes('indexedDB'));
});


test('UTM polygon area uses local coordinates for stable high-value Easting and Northing', () => {
  const source = read('nezam-croquis-enhancements.js');
  const start = source.indexOf('  window.computeStableUtmPolygonGeometry = function');
  const end = source.indexOf('\n  };', start) + 5;
  assert.ok(start >= 0 && end > 5);
  const measure = new Function('window', source.slice(start, end) + '\nreturn window.computeStableUtmPolygonGeometry;')({});
  const x = 714868.12, y = 3203130.13, width = 1100 / 45;
  const geometry = measure([
    { x, y }, { x: x + 45, y }, { x: x + 45, y: y + width }, { x, y: y + width }
  ]);
  assert.ok(Math.abs(geometry.area - 1100) < 1e-7, 'area must remain accurate at real UTM coordinate magnitudes');
  assert.ok(Math.abs(geometry.perim - (90 + 2 * width)) < 1e-7);
});


test('CAD view offers readable focus controls, standard scales and declutter toggles', () => {
  const html = read('index.html');
  const source = read('nezam-cad-view-tools.js');
  assert.ok(html.includes('id="crq-cad-focus"'));
  assert.ok(html.includes('id="crq-cad-standard-scale"'));
  assert.ok(html.includes('id="crq-cad-zoom"'));
  assert.ok(html.includes('id="crq-cad-show-points"'));
  assert.ok(html.includes('id="crq-cad-show-sides"'));
  assert.ok(html.includes('id="crq-cad-show-layer-labels"'));
  assert.ok(source.includes('focusMode: "MAIN"'));
  assert.ok(source.includes('showPointLabels: false'));
  assert.ok(source.includes('showSideLengths: false'));
  assert.ok(source.includes('window.panCroquisCadView'));
  assert.ok(source.includes('window.resetCroquisCadView'));
});

test('standard CAD scale remains exact at 1:500, 1:1000 and 1:5000', () => {
  const source = read('nezam-cad-view-tools.js');
  const start = source.indexOf('  function getScaleForCanvas(');
  const end = source.indexOf('\n  }', start) + 4;
  const exportStart = source.indexOf('  window.calculateCroquisCadScale = function');
  const exportEnd = source.indexOf('\n  };', exportStart) + 5;
  assert.ok(start >= 0 && end > 4 && exportStart > end && exportEnd > 5);
  const code = 'var SCALE_OPTIONS = ["AUTO","500","1000","2000","2500","5000","10000","25000","50000"];\n' +
    source.slice(start, end) + '\n' + source.slice(exportStart, exportEnd);
  const calculate = new Function('window', code + '\nreturn window.calculateCroquisCadScale;')({});
  [500, 1000, 5000].forEach((denominator) => {
    const metrics = calculate(String(denominator), 100, 760, 440, false);
    assert.ok(Math.abs(metrics.effectiveDenominator - denominator) < 1e-8,
      'selected denominator must be preserved exactly');
  });
  const zoomed = calculate('1000', 200, 760, 440, false);
  assert.ok(Math.abs(zoomed.effectiveDenominator - 500) < 1e-8,
    '200% zoom must update the effective drawing ratio');
});



test('croquis first sheet includes per-map print stroke width, colored layer area key and applicant acknowledgement', () => {
  const html = read('index.html');
  const customizer = read('nezam-customizer.js');
  const cad = read('nezam-cad-view-tools.js');
  assert.ok(html.includes('nezam-customizer.js?v=20261125-print-selection-r2'));
  assert.ok(html.includes('nezam-cad-view-tools.js?v=20261125-cad-view-r5'));
  assert.ok(customizer.includes('window.setCroquisPrintLineWidth'));
  assert.ok(customizer.includes('id="crq-print-line-width"'));
  assert.ok(customizer.includes('croquis-sheet1-layer-legend'));
  assert.ok(customizer.includes('راهنمای رنگ لایه‌ها و مساحت'));
  assert.ok(customizer.includes('croquis-applicant-survey-declaration'));
  assert.ok(customizer.includes('امضاء و اثر انگشت متقاضی'));
  assert.ok(customizer.includes('مسئولیت‌های قانونی و حرفه‌ای اشخاص تهیه‌کننده'));
  assert.ok(cad.includes('printLineWidth: 2'));
  assert.ok(cad.includes('Number(view.printLineWidth)'));
});

test('prevailing wind direction uses meteorological from-direction and draws flow toward the opposite bearing', () => {
  const source = read('nezam-cad-view-tools.js');
  const start = source.indexOf('  var WIND_COMPASS_16 = [');
  const end = source.indexOf('  function selectedLayers', start);
  assert.ok(start >= 0 && end > start, 'wind direction helper must exist');
  const describe = new Function(
    'window',
    source.slice(start, end) + '\nreturn window.describeCroquisPrevailingWind;'
  )({});
  const northWest = describe(315);
  assert.equal(northWest.fromName, 'شمال‌غرب');
  assert.equal(northWest.toName, 'جنوب‌شرق');
  assert.ok(northWest.dx > 0 && northWest.dy > 0, 'north-west wind must point toward screen south-east');
  const north = describe(0);
  assert.equal(north.fromName, 'شمال');
  assert.equal(north.toName, 'جنوب');
  const east = describe(90);
  assert.equal(east.fromName, 'شرق');
  assert.equal(east.toName, 'غرب');
  const wrap = describe(359.9);
  assert.equal(wrap.fromName, 'شمال');
});

test('CAD map exposes prevailing wind controls and stores wind settings per map', () => {
  const html = read('index.html');
  const source = read('nezam-cad-view-tools.js');
  assert.ok(html.includes('id="crq-cad-wind-enabled"'));
  assert.ok(html.includes('id="crq-cad-wind-preset"'));
  assert.ok(html.includes('id="crq-cad-wind-degrees"'));
  assert.ok(html.includes("selectCroquisPrevailingWindPreset(this.value)"));
  assert.ok(source.includes('showPrevailingWind: false'));
  assert.ok(source.includes('prevailingWindFromDeg: 315'));
  assert.ok(source.includes('جهت باد غالب'));
  assert.ok(source.includes('window.describeCroquisPrevailingWind'));
  assert.ok(source.includes('prevailingWindHud'));
});


test('first croquis map sheet prints main-land and project UTM vertices in a dedicated side panel', () => {
  const source = read('nezam-croquis-enhancements.js');
  const start = source.indexOf('  function getUtmCoordinateLayers(map)');
  const end = source.indexOf('  function decorateCroquisPrintPage()', start);
  assert.ok(start >= 0 && end > start, 'UTM table builder functions must exist');
  const helpers = source.slice(start, end);
  const html = (value) => String(value == null ? '' : value);
  const ensurePointEnriched = (point) => point;
  const code = 'function html(v){return String(v == null ? "" : v);}' +
    'function ensurePointEnriched(p){return p;}' + helpers +
    '\nreturn {getUtmCoordinateLayers:getUtmCoordinateLayers,buildUtmPointsPrintMarkup:buildUtmPointsPrintMarkup};';
  const api = new Function(code)();
  const map = {
    utmZone: '39R',
    layers: [
      { id: 'main', name: 'زمین اصلی', category: 'MAIN_PARCEL', geomType: 'POLYGON', visible: true,
        points: [
          {label:'P1',x:714800.12,y:3203100.34,zone:'39R'},
          {label:'P2',x:714850.56,y:3203100.78,zone:'39R'},
          {label:'P3',x:714850.90,y:3203150.12,zone:'39R'}
        ] },
      { id: 'project', name: 'محل اجرای طرح', category: 'PROJECT_AREA', geomType: 'POLYGON', visible: true,
        points: [
          {label:'K1',x:714810.11,y:3203110.22,zone:'39R'},
          {label:'K2',x:714830.33,y:3203110.44,zone:'39R'},
          {label:'K3',x:714830.55,y:3203130.66,zone:'39R'}
        ] }
    ]
  };
  const markup = api.buildUtmPointsPrintMarkup(map);
  assert.ok(markup.includes('مختصات UTM نقاط'));
  assert.ok(markup.includes('زمین اصلی'));
  assert.ok(markup.includes('محل اجرای طرح'));
  assert.ok(markup.includes('714800.12'));
  assert.ok(markup.includes('3203130.66'));
  assert.ok(markup.includes('زون 39R'));
  assert.ok(source.includes('croquis-map-side-info'));
  assert.ok(source.includes('aria-label="مختصات UTM نقاط زمین اصلی و محل اجرای طرح"'));
});


test('croquis coordinate print appendix provides layer selection, continuation pages and applicant declaration', () => {
  const source = read('nezam-croquis-print-declaration.js');
  const html = read('index.html');
  assert.ok(html.includes('nezam-croquis-print-declaration.js?v=20261125-print-declaration-r2'));
  assert.ok(source.includes('croquis-coordinate-print-selection'));
  assert.ok(source.includes('setCroquisCoordinatePrintLayer'));
  assert.ok(source.includes('coordinateTable(page)'));
  assert.ok(source.includes('croquis-coordinate-continuation'));
  assert.ok(source.includes('اقرار و تعهد متقاضی درباره صحت اطلاعات'));
  assert.ok(source.includes('موجب اسقاط یا انتقال مسئولیت‌های قانونی و حرفه‌ای'));
  assert.ok(source.includes('امضاء و اثر انگشت متقاضی'));
});

test('applicant legal declaration replaces the unsupported expert coordinate certification', () => {
  const source = read('nezam-croquis-print-declaration.js');
  assert.ok(source.includes('گواهی فنی کارشناس'));
  assert.ok(source.includes('به‌تنهایی سند مالکیت یا حدنگار'));
  assert.ok(source.includes('جبران خسارات قابل انتساب'));
  assert.ok(source.includes('تقصیر، تخلف یا تکالیف آمره قانونی'));
});


test('applicant declaration targets only the certification note inside page-two content', () => {
  const source = read('nezam-croquis-print-declaration.js');
  assert.ok(source.includes('contentWrap.querySelectorAll(".l-txt div")'));
  assert.ok(!source.includes('Array.prototype.slice.call(contentWrap.children).find'));
  assert.ok(source.includes('The complete sheet content sits inside .l-txt'));
});


test('print layer selection filters the entire printed map and both summary tables', () => {
  const source = read('nezam-customizer.js');
  const start = source.indexOf('function getCroquisCoordinatePrintLayerIds(map)');
  const end = source.indexOf('\n/* چاپ رسمی کروکی', start);
  assert.ok(start >= 0 && end > start, 'print layer selection helpers must exist');
  const helpers = source.slice(start, end);
  const api = new Function('window', helpers + '\nreturn {getCroquisCoordinatePrintLayerIds,getCroquisPrintSelectedLayers};')({});
  const map = {layers:[
    {id:'main',name:'زمین اصلی',visible:true,points:[{x:1,y:1}]},
    {id:'project',name:'محل اجرای طرح',visible:true,points:[{x:2,y:2}]},
    {id:'road',name:'راه دسترسی',visible:true,points:[{x:3,y:3}]},
    {id:'hidden',name:'لایه مخفی',visible:false,points:[{x:4,y:4}]}
  ],printCoordinateLayerIds:['project']};
  assert.deepEqual(api.getCroquisCoordinatePrintLayerIds(map),['project']);
  assert.deepEqual(api.getCroquisPrintSelectedLayers(map).map(layer=>layer.id),['project']);
  const defaultMap={layers:map.layers.slice(0,3)};
  assert.deepEqual(api.getCroquisPrintSelectedLayers(defaultMap).map(layer=>layer.id),['main','project','road']);
  assert.ok(source.includes('buildPrintedCroquisMap(printMapSnapshot'));
  assert.ok(source.includes('for (var mi = 0; mi < selectedPrintLayers.length; mi++)'));
  assert.ok(source.includes('for (var i = 0; i < selectedPrintLayers.length; i++)'));
});

test('croquis coordinate box position supports four map corners', () => {
  const source=read('nezam-croquis-enhancements.js');
  const declaration=read('nezam-croquis-print-declaration.js');
  ['TOP_RIGHT','TOP_LEFT','BOTTOM_RIGHT','BOTTOM_LEFT'].forEach(position=>{
    assert.ok(source.includes("data-position='"+position+"'"));
  });
  assert.ok(source.includes('coordinateBox.setAttribute("data-position", boxPosition)'));
  assert.ok(declaration.includes('window.setCroquisCoordinateBoxPosition'));
  assert.ok(declaration.includes('جای کادر مختصات روی نقشه'));
});

test('DXF export and import module passes ASCII UTM round-trip for supported entities', () => {
  const source=read('nezam-cad-file-io.js');
  const apiWindow={};
  new Function('window',source)(apiWindow);
  assert.equal(typeof apiWindow.buildCroquisDXFText,'function');
  assert.equal(typeof apiWindow.parseCroquisDXFText,'function');
  const map={title:'نقشه آزمایشی',utmZone:'39R',layers:[
    {name:'زمین اصلی',color:'#ff0000',visible:true,geomType:'POLYGON',points:[
      {x:714800.12,y:3203100.34,elev:0},{x:714850.12,y:3203100.34,elev:0},
      {x:714850.12,y:3203150.34,elev:0},{x:714800.12,y:3203150.34,elev:0}]},
    {name:'راه',color:'#0000ff',visible:true,geomType:'LINE',points:[
      {x:714700,y:3203000,elev:2},{x:714900,y:3203200,elev:3}]},
    {name:'نقطه',color:'#00ff00',visible:true,geomType:'POINT',points:[{x:714777.5,y:3203333.25,elev:4}]},
    {name:'مخفی',color:'#888888',visible:false,geomType:'POINT',points:[{x:1,y:2,elev:0}]}
  ]};
  const text=apiWindow.buildCroquisDXFText(map);
  assert.ok(text.includes('NEZAM636_UTM_ZONE=39R'));
  assert.ok(text.includes('NEZAM636_COORDINATES=UTM_METERS'));
  assert.ok(text.includes('$INSUNITS'));
  assert.ok(text.includes('714800.1200'));
  const parsed=apiWindow.parseCroquisDXFText(text);
  assert.equal(parsed.zone,'39R');
  assert.equal(parsed.unitScale,1);
  assert.equal(parsed.features.length,3);
  assert.equal(parsed.features[0].geomType,'POLYGON');
  assert.equal(parsed.features[0].points.length,4);
  assert.equal(parsed.features[1].geomType,'LINE');
  assert.equal(parsed.features[2].geomType,'POINT');
});

test('DXF import detects common units and approximates ARC as an open line', () => {
  const apiWindow={};
  new Function('window',read('nezam-cad-file-io.js'))(apiWindow);
  const dxf=['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
    '0','SECTION','2','ENTITIES','0','ARC','8','ARC_LAYER','10','100','20','200',
    '30','0','40','10','50','0','51','90','0','ENDSEC','0','EOF'].join('\n');
  const parsed=apiWindow.parseCroquisDXFText(dxf);
  assert.equal(parsed.unitScale,0.001);
  assert.equal(parsed.features.length,1);
  assert.equal(parsed.features[0].geomType,'LINE');
  assert.equal(parsed.features[0].approximation,'ARC_POLYLINE');
  assert.ok(parsed.features[0].points.length>=8);
});

test('DXF controls are backed by a loaded module and automatic unit detection is offered', () => {
  const html=read('index.html');
  const source=read('nezam-cad-file-io.js');
  assert.ok(html.includes('onclick="downloadCroquisDXF()"'));
  assert.ok(html.includes('onclick="triggerCroquisDXFImport()"'));
  assert.ok(html.includes('onchange="importCroquisDXFFile(event)"'));
  assert.ok(html.includes('nezam-cad-file-io.js?v=20261125-cad-io-r2'));
  assert.ok(html.includes('<option value="AUTO" selected>واحد: تشخیص خودکار</option>'));
  assert.ok(source.includes('window.exportActiveCroquisToDXF'));
  assert.ok(source.includes('window.importCroquisDXFFile'));
  assert.ok(source.includes('window.buildCroquisDXFText'));
  assert.ok(source.includes('function detectDxfUnitScale'));
});
