import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('main JavaScript modules have valid syntax', () => {
  for (const file of ['nezam-core.js', 'nezam-customizer.js', 'nezam-ai-assistant.js']) {
    assert.doesNotThrow(() => new Function(read(file)), file);
  }
});

test('inline scripts in index.html have valid syntax', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
  let checked = 0;

  for (const [, attrs, source] of scripts) {
    if (/\\bsrc\\s*=/.test(attrs) || !source.trim()) continue;
    assert.doesNotThrow(() => new Function(source), 'inline script ' + checked);
    checked++;
  }
  assert.ok(checked >= 2, 'expected the embedded integration scripts to be checked');
});

test('all local script references in the main page exist', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/<script\\b[^>]*\\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]);

  for (const ref of refs) {
    const clean = ref.split('?')[0];
    if (clean.startsWith('./')) {
      assert.ok(fs.existsSync(path.join(root, clean.slice(2))), 'missing script: ' + clean);
    }
  }
});

test('literal HTML ids are unique', () => {
  const html = read('index.html');
  const ids = [...html.matchAll(/\\bid=["']([^"']+)["']/g)].map((m) => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(duplicates)], []);
});

test('Gemini model fallback preserves valid saved models and replaces the retired 2.0 model', () => {
  const ai = read('nezam-ai-assistant.js');
  const match = ai.match(/function getStoredGeminiModel\\(\\)\\s*\\{[\\s\\S]*?\\n\\}/);
  assert.ok(match, 'getStoredGeminiModel must exist');

  const getModel = new Function('localStorage', 'return (' + match[0] + ')')(
    { getItem: () => '' }
  );
  const readModel = (saved) => new Function('localStorage', 'return (' + match[0] + ')')(
    { getItem: () => saved }
  );

  assert.equal(getModel(), 'gemini-3.8-flash');
  assert.equal(readModel('gemini-2.0-flash'), 'gemini-3.8-flash');
  assert.equal(readModel('models/gemini-3.6-flash'), 'gemini-3.6-flash');
  assert.equal(readModel('gemini-2.5-flash'), 'gemini-2.5-flash');
});

test('OCR fallback does not invent an area or a location', () => {
  const server = read('server.ts');
  const fallbackStart = server.indexOf('const fallbackData = {');
  assert.notEqual(fallbackStart, -1);
  const fallbackEnd = server.indexOf('offlineFallback: true', fallbackStart);
  assert.notEqual(fallbackEnd, -1);
  const fallback = server.slice(fallbackStart, fallbackEnd);

  assert.match(fallback, /landArea:\\s*landMatch\\s*\\?/);
  assert.match(fallback, /location:\\s*''/);
  assert.doesNotMatch(fallback, /:\\s*'1000'/);
  assert.doesNotMatch(fallback, /فارس، شهرستان خفر، مرکزی/);
});
