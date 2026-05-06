import { Translator } from '../Translator';
import type { TranslatorConfig } from '../Translator';
import type { Glossary } from '@/model/Glossary';
import type { TranslateTaskCallback } from '@/model/Translator';

export type WorkflowStage = 'extract' | 'translate' | 'proofread' | 'polish';

export interface TermEntry {
  source: string;
  target: string;
  note?: string;
}

export interface ForbiddenTermEntry {
  source: string;
  note?: string;
}

export interface TextReplacementEntry {
  source: string;
  target: string;
  stage: 'before' | 'after';
}

export interface WorkflowDictionary {
  glossary: TermEntry[];
  forbiddenTerms: ForbiddenTermEntry[];
  replacements: TextReplacementEntry[];
}

export interface WorkflowProfile {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  stages: WorkflowStage[];
  dictionary: WorkflowDictionary;
  promptPreset: 'basic' | 'novel' | 'faithful';
  lineLimit: number;
  roundLimit: number;
  responseChecks: {
    lineCount: boolean;
    emptyLine: boolean;
    residualSource: boolean;
    forbiddenTerms: boolean;
  };
}

export interface PreparedSegment {
  index: number;
  start: number;
  end: number;
  lines: string[];
  glossary: Glossary;
}

export interface WorkflowPlan {
  profile: WorkflowProfile;
  segments: PreparedSegment[];
}

export const defaultWorkflowProfile = (): WorkflowProfile => ({
  id: 'default-novel-translation',
  name: '小说翻译工作流',
  sourceLanguage: '日语',
  targetLanguage: '简体中文',
  stages: ['extract', 'translate', 'proofread'],
  dictionary: {
    glossary: [],
    forbiddenTerms: [],
    replacements: [],
  },
  promptPreset: 'novel',
  lineLimit: 30,
  roundLimit: 3,
  responseChecks: {
    lineCount: true,
    emptyLine: true,
    residualSource: true,
    forbiddenTerms: true,
  },
});

const normalizeGlossary = (
  glossary: Glossary,
  dictionary: WorkflowDictionary,
): Glossary => {
  const normalized: Glossary = { ...glossary };
  for (const term of dictionary.glossary) {
    if (term.source.trim() && term.target.trim()) {
      normalized[term.source.trim()] = term.note?.trim()
        ? `${term.target.trim()} # ${term.note.trim()}`
        : term.target.trim();
    }
  }
  return normalized;
};

const applyReplacements = (
  lines: string[],
  dictionary: WorkflowDictionary,
  stage: 'before' | 'after',
) => {
  const replacements = dictionary.replacements.filter(
    (item) => item.stage === stage && item.source.length > 0,
  );
  if (replacements.length === 0) return lines;

  return lines.map((line) => {
    for (const { source, target } of replacements) {
      line = line.replaceAll(source, target);
    }
    return line;
  });
};

const filterGlossary = (glossary: Glossary, lines: string[]) => {
  const filtered: Glossary = {};
  for (const word in glossary) {
    if (lines.some((line) => line.includes(word))) {
      filtered[word] = glossary[word];
    }
  }
  return filtered;
};

export const prepareWorkflowPlan = (
  lines: string[],
  glossary: Glossary,
  profile: WorkflowProfile,
): WorkflowPlan => {
  const sourceLines = applyReplacements(lines, profile.dictionary, 'before');
  const normalizedGlossary = normalizeGlossary(glossary, profile.dictionary);
  const lineLimit = Math.max(1, profile.lineLimit);
  const segments: PreparedSegment[] = [];

  for (let index = 0; index < sourceLines.length; index += lineLimit) {
    const segLines = sourceLines.slice(index, index + lineLimit);
    segments.push({
      index: segments.length,
      start: index,
      end: Math.min(index + lineLimit, sourceLines.length),
      lines: segLines,
      glossary: filterGlossary(normalizedGlossary, segLines),
    });
  }

  return { profile, segments };
};

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

const containsSourceText = (source: string[], translated: string[]) => {
  const meaningfulSource = source
    .map((line) => line.trim())
    .filter((line) => line.length >= 8);
  return meaningfulSource.some((line) =>
    translated.some((translatedLine) => translatedLine.includes(line)),
  );
};

export const checkTranslatedLines = (
  source: string[],
  translated: string[],
  profile: WorkflowProfile,
): CheckResult => {
  const checks = profile.responseChecks;

  if (checks.lineCount && source.length !== translated.length) {
    return { ok: false, reason: '译文行数与原文不一致' };
  }

  if (
    checks.emptyLine &&
    translated.some((line, index) => source[index]?.trim() && !line.trim())
  ) {
    return { ok: false, reason: '存在空译文' };
  }

  if (checks.residualSource && containsSourceText(source, translated)) {
    return { ok: false, reason: '译文疑似残留完整原文' };
  }

  if (checks.forbiddenTerms) {
    const forbidden = profile.dictionary.forbiddenTerms.find((term) =>
      translated.some((line) => line.includes(term.source)),
    );
    if (forbidden !== undefined) {
      return { ok: false, reason: `译文包含禁翻词：${forbidden.source}` };
    }
  }

  return { ok: true };
};

export const runWorkflowTranslation = async (
  textJp: string[],
  context: {
    glossary: Glossary;
    oldTextZh?: string[];
    oldGlossary?: Glossary;
    force?: boolean;
    profile?: WorkflowProfile;
    translatorConfig: TranslatorConfig;
    signal?: AbortSignal;
    log?: TranslateTaskCallback['log'];
  },
) => {
  const profile = context.profile ?? defaultWorkflowProfile();
  const translator = await Translator.create(
    context.translatorConfig,
    true,
    (message, detail) => context.log?.('　' + message, detail),
  );

  context.log?.(`工作流：${profile.name}`);
  context.log?.(`阶段：${profile.stages.join(' → ')}`);

  const plan = prepareWorkflowPlan(textJp, context.glossary, profile);
  const translatedSegments: string[][] = [];

  for (const segment of plan.segments) {
    context.log?.(`分段 ${segment.index + 1}/${plan.segments.length}`);
    let lastError: unknown;
    for (let round = 0; round < profile.roundLimit; round += 1) {
      try {
        const translated = await translator.translate(segment.lines, {
          glossary: segment.glossary,
          oldTextZh: context.oldTextZh?.slice(segment.start, segment.end),
          oldGlossary: context.oldGlossary,
          force: context.force,
          signal: context.signal,
        });
        const checked = checkTranslatedLines(
          segment.lines,
          translated,
          profile,
        );
        if (!checked.ok) {
          throw new Error(checked.reason);
        }
        translatedSegments.push(
          applyReplacements(translated, profile.dictionary, 'after'),
        );
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e;
        context.log?.(`第 ${round + 1} 轮失败：${e}`);
      }
    }
    if (lastError !== undefined) {
      throw lastError;
    }
  }

  return translatedSegments.flat();
};
