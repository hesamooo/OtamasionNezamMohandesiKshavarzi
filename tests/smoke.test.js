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
