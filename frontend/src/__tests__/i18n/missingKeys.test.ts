import fs from 'fs';
import path from 'path';

type JsonObject = Record<string, string>;

const SRC_DIR = path.join(process.cwd(), 'src');
const EN_DIR = path.join(process.cwd(), 'public', 'locales', 'en');
const AR_DIR = path.join(process.cwd(), 'public', 'locales', 'ar');

function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip tests and mocks directories
      if (/__tests__|tests|__mocks__/u.test(full)) continue;
      results.push(...listFilesRecursive(full));
    } else if (/\.(ts|tsx|js|jsx)$/u.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function collectLocaleKeys(dir: string): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const ns = path.basename(file, '.json');
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as JsonObject;
    map[ns] = new Set(Object.keys(json));
  }
  return map;
}

function parseNamespacesInFile(content: string): string[] {
  const namespaces = new Set<string>();
  // useTranslation('ns') and useLazyTranslation('ns')
  const regexSingle = /use(?:Lazy)?Translation\(\s*['"]([a-zA-Z0-9_-]+)['"]/gu;
  let m: RegExpExecArray | null;
  while ((m = regexSingle.exec(content))) namespaces.add(m[1]);

  // useLazyTranslation([ 'ns1', 'ns2' ])
  const regexArray = /useLazyTranslation\(\s*\[([\s\S]*?)\]/gu;
  while ((m = regexArray.exec(content))) {
    const arr = m[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter((s) => s);
    for (const ns of arr) namespaces.add(ns);
  }
  return Array.from(namespaces);
}

function collectUsedKeys(): Array<{ ns: string; key: string; file: string }> {
  const used: Array<{ ns: string; key: string; file: string }> = [];
  const files = listFilesRecursive(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const declaredNamespaces = parseNamespacesInFile(content);

    // Pattern 1: explicit namespace usage t('ns:key')
    const explicit = /\b[t|T]\(\s*['"]([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)['"]/gu;
    let m1: RegExpExecArray | null;
    while ((m1 = explicit.exec(content))) {
      used.push({ ns: m1[1], key: m1[2], file });
    }

    // Pattern 2: simple key t('key') when a single namespace is declared in the file
    if (declaredNamespaces.length === 1) {
      const ns = declaredNamespaces[0];
      const simple = /\b[t|T]\(\s*['"]([a-zA-Z0-9_-]+)['"]/gu;
      let m2: RegExpExecArray | null;
      while ((m2 = simple.exec(content))) {
        const key = m2[1];
        if (key.includes(':')) continue; // already captured by explicit pattern
        used.push({ ns, key, file });
      }
    }
  }
  return used;
}

const shouldRun = process.env.CHECK_MISSING_KEYS === 'true';

(shouldRun ? describe : describe.skip)('i18n missing keys', () => {
  it('ensures all used translation keys exist in en and ar locales', () => {
    const enKeys = collectLocaleKeys(EN_DIR);
    const arKeys = collectLocaleKeys(AR_DIR);
    const used = collectUsedKeys();

    const missing: Array<{ ns: string; key: string; file: string; lang: string }> = [];

    for (const { ns, key, file } of used) {
      const enSet = enKeys[ns];
      const arSet = arKeys[ns];
      if (!enSet || !enSet.has(key)) missing.push({ ns, key, file, lang: 'en' });
      if (!arSet || !arSet.has(key)) missing.push({ ns, key, file, lang: 'ar' });
    }

    if (missing.length) {
      const report = missing
        .map((m) => `${m.lang}/${m.ns}.json missing "${m.key}" (referenced in ${path.relative(process.cwd(), m.file)})`)
        .join('\n');
      throw new Error(`Missing translation keys detected:\n${report}`);
    }
  });
});


