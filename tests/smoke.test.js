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
  for (const file of ['nezam-core.js', 'nezam-customizer.js', 'nezam-ai-assistant.js']) {
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
  assert.ok(html.includes('nezam-customizer.js?v=20261102-print-engine-r10'));
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
  assert.match(html, /onclick="printCurrentLetterDraft\('A4'\)"/);
  assert.match(html, /onclick="printCurrentLetterDraft\('A5'\)"/);
  assert.match(html, /onclick="saveLetterToSecretariat\(false\)">ثبت در دبیرخانه/);
  assert.match(html, /فقط نامه‌های ثبت‌شده نمایش داده می‌شوند؛ چاپ و دانلود به‌تنهایی سابقه ایجاد نمی‌کند/);
});


test('standalone office correspondence is available without an applicant', () => {
  const customizer = read('nezam-customizer.js');
  const core = read('nezam-core.js');
  const html = read('index.html');

  assert.match(customizer, /window\.startIndependentOfficeLetter = function\(\)/);
  assert.match(customizer, /window\.__nezamOfficeLetterDraftMode === true/);
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
  assert.match(html, /nezam-core\.js\?v=20261102-parcel-r4/);
  assert.match(html, /nezam-customizer\.js\?v=20261102-print-engine-r10/);
});
