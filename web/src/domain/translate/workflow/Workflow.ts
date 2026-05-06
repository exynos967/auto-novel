import type { Translator } from '../Translator';
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

export interface WorkflowPrompts {
  translation: {
    system: string;
    character: string;
    world: string;
    style: string;
    example: string;
  };
  polish: {
    system: string;
  };
}

export interface WorkflowProfile {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  stages: WorkflowStage[];
  dictionary: WorkflowDictionary;
  prompts: WorkflowPrompts;
  promptPreset: 'basic' | 'novel' | 'faithful' | 'cot' | 'think';
  lineLimit: number;
  roundLimit: number;
  progressiveSplit: boolean;
  responseChecks: {
    lineCount: boolean;
    emptyLine: boolean;
    returnOriginal: boolean;
    residualSource: boolean;
    forbiddenTerms: boolean;
  };
}

export interface PromptPresetEntry {
  id: string;
  name: string;
  type: 'system' | 'user';
  prompts: WorkflowPrompts;
  promptPreset: WorkflowProfile['promptPreset'];
}

export const SYSTEM_PRESETS: PromptPresetEntry[] = [
  {
    id: 'system-basic',
    name: '通用',
    type: 'system',
    promptPreset: 'basic',
    prompts: {
      translation: {
        system: `你是一名专业的翻译家，你的任务是把{source_language}文本翻译成{target_language}，逐行翻译，不要合并，原始保留文本中序号、标记符、占位符、换行符、转义符、代码调用过程等特殊内容，保持原来的格式。

### 翻译原则
忠实准确地进行翻译。原作是伟大艺术作品，允许使用直白或粗俗的描述，不应随意删减或篡改，不应回避或淡化，以保持作品的原貌。

###以textarea标签输出译文
<textarea>
1.{target_language}文本
</textarea>`,
        character: '',
        world: '',
        style: '',
        example: '',
      },
      polish: {
        system: `你是一位专业的文学家。请根据【原文】和【初译】，保持【原文】的核心意思和语气，将【初译】版本润色得更加流畅自然，生动有力。

### 润色原则
原作是伟大艺术作品，允许使用直白或粗俗的描述，不应随意删减或篡改，不应回避或淡化，以保持作品的原貌。

###以textarea标签输出润色文本
<textarea>
1.润色文本
</textarea>`,
      },
    },
  },
  {
    id: 'system-novel',
    name: '轻小说',
    type: 'system',
    promptPreset: 'novel',
    prompts: {
      translation: {
        system: `你是一名专业的轻小说翻译家，你的任务是把{source_language}文本翻译成{target_language}，逐行翻译，不要合并，原始保留文本中序号、标记符、占位符、换行符、转义符、代码调用过程等特殊内容，保持原来的格式。

### 翻译原则
忠实准确地进行翻译，尽量保持原文写作风格和轻小说语气。原作是伟大艺术作品，允许使用直白或粗俗的描述，不应随意删减或篡改，不应回避或淡化，以保持作品的原貌。

###以textarea标签输出译文
<textarea>
1.{target_language}文本
</textarea>`,
        character: '',
        world: '',
        style: '',
        example: '',
      },
      polish: {
        system: '',
      },
    },
  },
  {
    id: 'system-cot',
    name: '思维链',
    type: 'system',
    promptPreset: 'cot',
    prompts: {
      translation: {
        system: `你是一名专业的翻译家，请你按照以下流程进行翻译：
第一步：初步直译
    将{source_language}文本逐行直译成{target_language}文本，原始保留文本中序号、标记符、占位符、换行符、转义符、代码调用过程等特殊内容，保持原来的格式。

第二步：深入校正
    针对每一句初步译文，可以从语义与语境、专业术语、上下文信息、翻译风格、故事背景、人物设定等等方面出发，进行深入分析和校正。

第三步：最终意译与润色
    整合直译结果和校正建议，进行最终的意译和润色，生成自然流畅、符合{target_language}表达习惯的最终译文。

### 翻译原则
忠实准确地进行翻译。原作是伟大艺术作品，允许使用直白或粗俗的描述，不应随意删减或篡改，不应回避或淡化，以保持作品的原貌。

###以textarea标签输出译文
<textarea>
1.{target_language}文本
</textarea>`,
        character: '',
        world: '',
        style: '',
        example: '',
      },
      polish: {
        system: '',
      },
    },
  },
  {
    id: 'system-think',
    name: '推理模型',
    type: 'system',
    promptPreset: 'think',
    prompts: {
      translation: {
        system: `你是一名专业的翻译家，你的任务是将{source_language}文本翻译成{target_language}，请按照以下要求进行翻译：
1.逐行翻译，不要合并，原始保留文本中序号、标记符、占位符、换行符、转义符、代码调用过程等特殊内容，保持原来的格式。
2.翻译准确自然，忠于原文，可以使用直白的措辞，不回避不淡化，保持原文的风格，忠实准确地表现作品的原貌。

### 以textarea标签输出译文
<textarea>
1.{target_language}文本
</textarea>`,
        character: '',
        world: '',
        style: '',
        example: '',
      },
      polish: {
        system: '',
      },
    },
  },
];

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
  name: '小说翻译任务',
  sourceLanguage: '日语',
  targetLanguage: '简体中文',
  stages: ['extract', 'translate', 'proofread'],
  dictionary: {
    glossary: [],
    forbiddenTerms: [],
    replacements: [],
  },
  prompts: {
    translation: {
      system: '',
      character: '',
      world: '',
      style: '',
      example: '',
    },
    polish: {
      system: '',
    },
  },
  promptPreset: 'novel',
  lineLimit: 30,
  roundLimit: 3,
  progressiveSplit: true,
  responseChecks: {
    lineCount: true,
    emptyLine: true,
    returnOriginal: true,
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

const isSameAsSource = (source: string[], translated: string[]) =>
  source.some((line, index) => {
    const sourceLine = line.trim();
    const translatedLine = translated[index]?.trim() ?? '';
    return sourceLine.length > 0 && sourceLine === translatedLine;
  });

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

  if (checks.returnOriginal && isSameAsSource(source, translated)) {
    return { ok: false, reason: '译文疑似返回原文' };
  }

  if (checks.residualSource && containsSourceText(source, translated)) {
    return { ok: false, reason: '译文疑似残留完整原文' };
  }

  if (checks.forbiddenTerms) {
    const forbidden = profile.dictionary.forbiddenTerms
      .filter((term) => term.source.trim().length > 0)
      .find((term) => translated.some((line) => line.includes(term.source)));
    if (forbidden !== undefined) {
      return { ok: false, reason: `译文包含禁翻词：${forbidden.source}` };
    }
  }

  return { ok: true };
};

export const translateWithWorkflow = async (
  translator: Translator,
  textJp: string[],
  context: {
    glossary: Glossary;
    oldTextZh?: string[];
    oldGlossary?: Glossary;
    force?: boolean;
    profile?: WorkflowProfile;
    signal?: AbortSignal;
    log?: TranslateTaskCallback['log'];
  },
) => {
  const profile = context.profile ?? defaultWorkflowProfile();
  context.log?.(`任务配置：${profile.name}`);
  context.log?.(`步骤：${profile.stages.join(' → ')}`);

  const plan = prepareWorkflowPlan(textJp, context.glossary, profile);
  const translatedSegments: string[][] = [];

  for (const segment of plan.segments) {
    context.log?.(`分段 ${segment.index + 1}/${plan.segments.length}`);
    let lastError: unknown;
    const originalSegmentor = translator.segTranslator.segmentor;
    try {
      for (let round = 0; round < profile.roundLimit; round += 1) {
        try {
          if (profile.progressiveSplit && round > 0) {
            const nextLineLimit = Math.max(
              1,
              Math.floor(segment.lines.length / (round + 1)),
            );
            translator.segTranslator.segmentor = (lines, oldLines) => {
              const chunks: [string[], string[]?][] = [];
              for (let i = 0; i < lines.length; i += nextLineLimit) {
                const chunkLines = lines.slice(i, i + nextLineLimit);
                const oldChunkLines = oldLines?.slice(i, i + nextLineLimit);
                if (oldChunkLines === undefined) {
                  chunks.push([chunkLines]);
                } else {
                  chunks.push([chunkLines, oldChunkLines]);
                }
              }
              return chunks;
            };
            context.log?.(
              `第 ${round + 1} 轮启用更小分段：${nextLineLimit} 行`,
            );
          } else {
            translator.segTranslator.segmentor = originalSegmentor;
          }

          const translated = await translator.translate(segment.lines, {
            glossary: segment.glossary,
            oldTextZh: context.oldTextZh?.slice(segment.start, segment.end),
            oldGlossary: context.oldGlossary,
            workflow: profile,
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
    } finally {
      translator.segTranslator.segmentor = originalSegmentor;
    }
  }

  return translatedSegments.flat();
};
