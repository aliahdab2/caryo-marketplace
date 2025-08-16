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

    for (const dir of dirs) {
      for (const file of listNamespaceFiles(dir)) {
        const json = readJson(path.join(dir, file));
        for (const [key, value] of Object.entries(json)) {
          if (typeof value === 'string' && key.includes('.') && !key.startsWith('@')) {
            offenders.push(`${path.basename(dir)}/${file}:${key}`);
          }
        }
      }
    }

    if (offenders.length) {
      const message = `Dot characters found in translation keys (consider removing namespace prefix in keys):\n${offenders.join('\n')}`;
      if (process.env.FAIL_DOT_KEYS === 'true') {
        throw new Error(message);
      } else {
        console.warn(message);
      }
    }
  });
});


