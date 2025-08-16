import fs from 'fs';
import path from 'path';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const EN_LOCALES_DIR = path.join(process.cwd(), 'public', 'locales', 'en');
const AR_LOCALES_DIR = path.join(process.cwd(), 'public', 'locales', 'ar');

function readJson(filePath: string): JsonObject {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as JsonObject;
}

function listNamespaceFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

function collectNonFlatKeys(obj: JsonObject, prefix = ''): string[] {
  const violations: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Allow metadata comment blocks like "@minPrice": { description: "..." }
      if (!key.startsWith('@')) {
        violations.push(fullKey);
      }
    }
  }
  return violations;
}

// (removed unused helper)

function containsArabicNumerals(str: string): boolean {
  // Arabic-Indic digits: \u0660-\u0669
  return /[\u0660-\u0669]/.test(str);
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function toFlatKey(rawKey: string): string {
  const parts = rawKey.split('.');
  if (parts.length === 1) return rawKey;
  const [first, ...rest] = parts;
  return first + rest.map(capitalize).join('');
}

function suggestedFixForKey(file: string, key: string): string {
  const ns = path.basename(file, '.json');
  const knownNamespaces = new Set([
    'common', 'dashboard', 'listings', 'search', 'errors', 'auth', 'translation', 'contact', 'forms', 'media', 'favorites', 'home'
  ]);

  // If key is prefixed with its own namespace, drop it then flatten
  if (key.startsWith(ns + '.')) {
    const rest = key.slice(ns.length + 1);
    return `Change to "${toFlatKey(rest)}" in ${ns}.json`;
  }

  // If key starts with another known namespace, suggest moving
  const firstSegment = key.split('.')[0];
  if (firstSegment !== ns && knownNamespaces.has(firstSegment)) {
    const rest = key.slice(firstSegment.length + 1);
    return `Consider moving to ${firstSegment}.json as "${toFlatKey(rest)}" or flatten here as "${toFlatKey(key)}"`;
  }

  // Default: flatten in-place
  return `Flatten to "${toFlatKey(key)}" in ${ns}.json`;
}

describe('i18n rules', () => {
  it('uses only flat structures in locale JSON (except @-metadata blocks)', () => {
    const enFiles = listNamespaceFiles(EN_LOCALES_DIR);
    const arFiles = listNamespaceFiles(AR_LOCALES_DIR);
    const files = Array.from(new Set([...enFiles, ...arFiles])).sort();

    const failures: Array<{ file: string; keys: string[] }> = [];

    for (const file of files) {
      const enPath = path.join(EN_LOCALES_DIR, file);
      const arPath = path.join(AR_LOCALES_DIR, file);
      if (fs.existsSync(enPath)) {
        const enJson = readJson(enPath);
        const bad = collectNonFlatKeys(enJson);
        if (bad.length) failures.push({ file: `en/${file}`, keys: bad });
      }
      if (fs.existsSync(arPath)) {
        const arJson = readJson(arPath);
        const bad = collectNonFlatKeys(arJson);
        if (bad.length) failures.push({ file: `ar/${file}`, keys: bad });
      }
    }

    if (failures.length) {
      const msg = failures
        .map((f) => `${f.file}: ${f.keys.join(', ')}`)
        .join('\n');
      throw new Error(`Nested objects found in locale files (only @-metadata allowed):\n${msg}`);
    }
  });

  it('ensures en and ar have matching namespace files', () => {
    const enFiles = listNamespaceFiles(EN_LOCALES_DIR);
    const arFiles = listNamespaceFiles(AR_LOCALES_DIR);

    const missingInAr = enFiles.filter((f) => !arFiles.includes(f));
    const missingInEn = arFiles.filter((f) => !enFiles.includes(f));

    expect({ missingInAr, missingInEn }).toEqual({ missingInAr: [], missingInEn: [] });
  });

  it('enforces Western numerals in all locales (no Arabic-Indic digits)', () => {
    const dirs = [EN_LOCALES_DIR, AR_LOCALES_DIR];
    const offenders: string[] = [];

    for (const dir of dirs) {
      for (const file of listNamespaceFiles(dir)) {
        const json = readJson(path.join(dir, file));
        for (const [key, value] of Object.entries(json)) {
          if (typeof value === 'string' && containsArabicNumerals(value)) {
            offenders.push(`${path.basename(dir)}/${file}:${key}`);
          }
        }
      }
    }

    if (offenders.length) {
      fail(`Arabic-Indic digits found in locale strings:\n${offenders.join('\n')}`);
    }
  });

  it('discourages dot "." in keys (prefer flat keys without namespace prefix)', () => {
    const dirs = [EN_LOCALES_DIR, AR_LOCALES_DIR];
    const offenders: string[] = [];
    const suggestions: string[] = [];

    for (const dir of dirs) {
      for (const file of listNamespaceFiles(dir)) {
        const json = readJson(path.join(dir, file));
        for (const [key, value] of Object.entries(json)) {
          if (typeof value === 'string' && key.includes('.') && !key.startsWith('@')) {
            offenders.push(`${path.basename(dir)}/${file}:${key}`);
            suggestions.push(`- ${path.basename(dir)}/${file}:${key} → ${suggestedFixForKey(file, key)}`);
          }
        }
      }
    }

    if (offenders.length) {
      const message = [
        'Dot characters found in translation keys. Use flat keys and drop namespace prefixes.',
        '',
        'Offenders:',
        offenders.join('\n'),
        '',
        'Suggestions:',
        suggestions.join('\n')
      ].join('\n');
      if (process.env.FAIL_DOT_KEYS === 'true') {
        throw new Error(message);
      } else {
        console.warn(message);
      }
    }
  });
});


