import { get } from 'lodash-es';

export const downloadFile = (filename: string, blob: Blob) => {
  const el = document.createElement('a');
  el.href = URL.createObjectURL(blob);
  el.target = '_blank';
  el.download = filename;
  el.click();
};

export const querySearch = <T>(
  data: T[],
  field: string,
  options: {
    query: string;
    enableRegexMode: boolean;
  },
): T[] => {
  const { query, enableRegexMode } = options;
  if (!query) {
    return data;
  }
  const buildSearchFilter = () => {
    const parts = query
      .trim()
      .split(' ')
      .filter((v) => v.length > 0);
    if (enableRegexMode) {
      const regs = parts.map((it) => new RegExp(it, 'i'));
      return (s: string) => !regs.some((r) => !r.test(s));
    } else {
      return (s: string) => !parts.some((r) => !s.includes(r));
    }
  };
  const filter = buildSearchFilter();
  return data.filter((it) => filter(get(it, field)));
};

export const safeJson = <T extends object>(text: string) => {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    return undefined;
  }
};

export const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    let timeout: number | null = null;
    const abortHandler = () => {
      clearTimeout(timeout!);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    timeout = window.setTimeout(() => {
      resolve();
      signal?.removeEventListener('abort', abortHandler);
    }, ms);
    signal?.addEventListener('abort', abortHandler);
  });

export function* parseEventStream<T>(text: string) {
  for (const line of text.split('\n')) {
    if (line == '[DONE]') {
      return;
    } else if (!line.trim() || line.startsWith(': ping')) {
      continue;
    } else {
      try {
        const obj: T = JSON.parse(line.replace(/^data\:/, '').trim());
        yield obj;
      } catch {
        continue;
      }
    }
  }
}

export const requestKeepAlive = () => {};

export const releaseKeepAlive = () => {};

type Context<T> = {
  finished: number;
  promises: Promise<T>[];
};

export const parallelExec = async <T>(
  fns: (() => Promise<T>)[],
  concurrent: number,
  beforeExec: (context: Context<T>) => void,
) => {
  const context: Context<T> = {
    finished: 0,
    promises: [],
  };
  for (const fn of fns) {
    const p = fn().finally(() => {
      context.promises.splice(context.promises.indexOf(p), 1);
      context.finished += 1;
    });
    context.promises.push(p);
    if (context.promises.length === concurrent) {
      beforeExec(context);
      await Promise.race([...context.promises.values()]);
    }
  }
  while (context.promises.length > 0) {
    beforeExec(context);
    await Promise.race([...context.promises.values()]);
  }
};

export namespace RegexUtil {
  const englishChars = /[a-z]|[A-Z]/;
  export const hasEnglishChars = (str: string) => /[\u4E00-\u9FAF]/.test(str);

  const hanzi = /[\u4E00-\u9FAF]/;
  export const hasHanzi = (str: string) => hanzi.test(str);

  const kanaChars = /[\u3041-\u3096]|[\u30A1-\u30FA]/;
  export const hasKanaChars = (str: string) => kanaChars.test(str);

  // U+1100–U+11FF: Hangul Jamo
  // U+3130–U+318F: Hangul Compatibility Jamo
  // U+A960–U+A97F: Hangul Jamo Extended-A
  // U+D7B0–U+D7FF: Hangul Jamo Extended-B
  const hangulJamo =
    /[\u1100-\u11FF]|[\u3130-\u318F]|[\uA960-\uA97F]|[\uD7B0-\uD7FF]/;

  // U+3200–U+321E: Parenthesised Hangul
  // U+3260–U+327E: Circled Hangul
  const hangulEnclosed = /[\u3200-\u321E]|[\u3260-\u327E]/;

  // U+FFA0–U+FFDC: Half-width Hangul
  const hangulHalfWidth = /[\uFFA0-\uFFDC]/;

  // U+AC00–U+D7A3: Hangul Syllables
  const hangulSyllables = /[\uAC00-\uD7AF]/;

  // https://en.wikipedia.org/wiki/Hangul#Unicode
  export const hasHangulChars = (str: string) =>
    hangulSyllables.test(str) ||
    hangulJamo.test(str) ||
    hangulEnclosed.test(str) ||
    hangulHalfWidth.test(str);

  export const countLanguageCharacters = (str: string) => {
    const countResult = { en: 0, ko: 0, jp: 0, zh: 0, total: str.length };
    for (const c of str) {
      if (hasKanaChars(c)) {
        countResult.jp += 1;
      } else if (hasHangulChars(c)) {
        countResult.ko += 1;
      } else if (hasHanzi(c)) {
        countResult.zh += 1;
      } else if (hasEnglishChars(c)) {
        countResult.en += 1;
      }
    }
    return countResult;
  };

  export function isUrl(str: string) {
    try {
      new URL(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  export const getLeadingSpaces = (str: string) => str.match(/^\s*/)?.[0] ?? '';

  export const isSafari = (agent: string) =>
    /^((?!chrome|android).)*safari/i.test(agent);
}

export namespace Humanize {
  const unit = (rawNum: number, units: string[], times: number) => {
    const i = Math.floor(Math.log(rawNum) / Math.log(times));
    const j = Math.max(Math.min(i, units.length), 0);
    const fmtNum = (rawNum / Math.pow(times, j)).toFixed(2);
    return `${fmtNum}${units[j]}`;
  };

  export const bytes = (rawNum: number) =>
    unit(rawNum, ['B', 'KB', 'MB', 'GB', 'TB', 'PB'], 1024);
}

export const lazy = <T>(factory: () => T) => {
  let value: T;
  const get = () => {
    if (value === undefined) {
      value = factory();
    }
    return value;
  };
  return get;
};

export * from './useOpenCC';
export * from './useStorage';
export * from './useUserData';
