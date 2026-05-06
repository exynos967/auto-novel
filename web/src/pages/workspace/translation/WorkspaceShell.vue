<script lang="ts" setup>
import {
  AutoFixHighOutlined,
  DeleteOutlineOutlined,
  FactCheckOutlined,
  FormatListBulletedOutlined,
  GTranslateOutlined,
  PlayArrowOutlined,
  RuleOutlined,
  SettingsOutlined,
  TranslateOutlined,
} from '@vicons/material';
import type { Component } from 'vue';

import type {
  ForbiddenTermEntry,
  TermEntry,
  TextReplacementEntry,
  WorkflowProfile,
  WorkflowStage,
} from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

defineProps<{
  provider: 'gpt' | 'sakura';
}>();

const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.value.profile,
  set: (profile) => {
    workflowStore.state.value = { ...workflowStore.state.value, profile };
  },
});

const updateProfile = (patch: Partial<WorkflowProfile>) => {
  profile.value = { ...profile.value, ...patch };
};

const updateDictionary = (patch: Partial<WorkflowProfile['dictionary']>) => {
  updateProfile({
    dictionary: {
      ...profile.value.dictionary,
      ...patch,
    },
  });
};

const updateResponseChecks = (
  patch: Partial<WorkflowProfile['responseChecks']>,
) => {
  updateProfile({
    responseChecks: {
      ...profile.value.responseChecks,
      ...patch,
    },
  });
};

const workflowStageOptions: { label: string; value: WorkflowStage }[] = [
  { label: '提取', value: 'extract' },
  { label: '翻译', value: 'translate' },
  { label: '校对', value: 'proofread' },
  { label: '润色', value: 'polish' },
];

type PromptPreset = WorkflowProfile['promptPreset'];

const promptPresetOptions: { label: string; value: PromptPreset }[] = [
  { label: '通用', value: 'basic' },
  { label: '小说', value: 'novel' },
  { label: '忠实原文', value: 'faithful' },
];

const workflowStageValues = workflowStageOptions.map((it) => it.value);

const isWorkflowStage = (value: string | number): value is WorkflowStage =>
  typeof value === 'string' &&
  workflowStageValues.includes(value as WorkflowStage);

const updateStages = (stages: Array<string | number>) => {
  const nextStages = stages.filter(isWorkflowStage);
  updateProfile({ stages: nextStages.length > 0 ? nextStages : ['translate'] });
};

const updatePromptPreset = (value: string | number) => {
  if (value === 'basic' || value === 'novel' || value === 'faithful') {
    updateProfile({ promptPreset: value });
  }
};

const stageMeta: Record<WorkflowStage, { label: string; icon: Component }> = {
  extract: { label: '提取', icon: FormatListBulletedOutlined },
  translate: { label: '翻译', icon: TranslateOutlined },
  proofread: { label: '校对', icon: FactCheckOutlined },
  polish: { label: '润色', icon: AutoFixHighOutlined },
};

const enabledStages = computed(() =>
  profile.value.stages.map((stage) => stageMeta[stage]),
);

const addGlossaryTerm = () => {
  updateDictionary({
    glossary: [
      ...profile.value.dictionary.glossary,
      { source: '', target: '', note: '' },
    ],
  });
};

const updateGlossaryTerm = (index: number, patch: Partial<TermEntry>) => {
  updateDictionary({
    glossary: profile.value.dictionary.glossary.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteGlossaryTerm = (index: number) => {
  updateDictionary({
    glossary: profile.value.dictionary.glossary.filter((_, i) => i !== index),
  });
};

const addForbiddenTerm = () => {
  updateDictionary({
    forbiddenTerms: [
      ...profile.value.dictionary.forbiddenTerms,
      { source: '', note: '' },
    ],
  });
};

const updateForbiddenTerm = (
  index: number,
  patch: Partial<ForbiddenTermEntry>,
) => {
  updateDictionary({
    forbiddenTerms: profile.value.dictionary.forbiddenTerms.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteForbiddenTerm = (index: number) => {
  updateDictionary({
    forbiddenTerms: profile.value.dictionary.forbiddenTerms.filter(
      (_, i) => i !== index,
    ),
  });
};

const addReplacement = () => {
  updateDictionary({
    replacements: [
      ...profile.value.dictionary.replacements,
      { source: '', target: '', stage: 'before' },
    ],
  });
};

const updateReplacement = (
  index: number,
  patch: Partial<TextReplacementEntry>,
) => {
  updateDictionary({
    replacements: profile.value.dictionary.replacements.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteReplacement = (index: number) => {
  updateDictionary({
    replacements: profile.value.dictionary.replacements.filter(
      (_, i) => i !== index,
    ),
  });
};

const updateReplacementStage = (index: number, value: string | number) => {
  updateReplacement(index, { stage: value === 'after' ? 'after' : 'before' });
};
</script>

<template>
  <div class="translation-workspace">
    <section class="workspace-hero">
      <div>
        <n-text depth="3">翻译工作台</n-text>
        <h1>翻译工作流</h1>
        <p>
          按 AiNiee
          的思路组织提取、翻译、校对和润色流程；任务、翻译器、工作流设置和记录集中在同一个工作台里。
        </p>
      </div>
      <n-flex :wrap="false" align="center" class="stage-rail">
        <template v-for="(stage, index) in enabledStages" :key="stage.label">
          <div class="stage-node">
            <n-icon :component="stage.icon" :size="18" />
            <span>{{ stage.label }}</span>
          </div>
          <div v-if="index < enabledStages.length - 1" class="stage-line" />
        </template>
      </n-flex>
    </section>

    <div class="workspace-grid">
      <main class="workspace-main">
        <section class="workspace-panel">
          <div class="panel-heading">
            <div>
              <n-text depth="3">Task</n-text>
              <h2>翻译任务</h2>
            </div>
            <n-icon :component="PlayArrowOutlined" :size="22" />
          </div>
          <slot name="tasks" />
        </section>

        <section class="workspace-panel">
          <div class="panel-heading">
            <div>
              <n-text depth="3">History</n-text>
              <h2>任务记录</h2>
            </div>
            <n-icon :component="RuleOutlined" :size="22" />
          </div>
          <slot name="records" />
        </section>
      </main>

      <aside class="workspace-aside">
        <section class="workspace-panel compact">
          <div class="panel-heading">
            <div>
              <n-text depth="3">Engine</n-text>
              <h2>翻译器</h2>
            </div>
            <n-icon :component="GTranslateOutlined" :size="22" />
          </div>
          <slot name="workers" />
        </section>

        <section class="workspace-panel compact">
          <div class="panel-heading">
            <div>
              <n-text depth="3">Workflow</n-text>
              <h2>工作流设置</h2>
            </div>
            <n-icon :component="SettingsOutlined" :size="22" />
          </div>
          <n-flex vertical size="small">
            <c-action-wrapper title="名称">
              <n-input
                :value="profile.name"
                size="small"
                @update:value="updateProfile({ name: $event })"
              />
            </c-action-wrapper>
            <c-action-wrapper title="语言">
              <n-input-group>
                <n-input
                  :value="profile.sourceLanguage"
                  size="small"
                  placeholder="源语言"
                  @update:value="updateProfile({ sourceLanguage: $event })"
                />
                <n-input
                  :value="profile.targetLanguage"
                  size="small"
                  placeholder="目标语言"
                  @update:value="updateProfile({ targetLanguage: $event })"
                />
              </n-input-group>
            </c-action-wrapper>
            <c-action-wrapper title="流程">
              <n-checkbox-group
                :value="profile.stages"
                @update:value="updateStages"
              >
                <n-flex size="small">
                  <n-checkbox
                    v-for="stage in workflowStageOptions"
                    :key="stage.value"
                    :value="stage.value"
                  >
                    {{ stage.label }}
                  </n-checkbox>
                </n-flex>
              </n-checkbox-group>
            </c-action-wrapper>
            <c-action-wrapper title="提示词">
              <n-radio-group
                :value="profile.promptPreset"
                @update:value="updatePromptPreset"
              >
                <n-radio-button
                  v-for="option in promptPresetOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </n-radio-group>
            </c-action-wrapper>
            <c-action-wrapper title="分段行数">
              <n-input-number
                :value="profile.lineLimit"
                size="small"
                :min="1"
                :max="200"
                @update:value="updateProfile({ lineLimit: $event ?? 30 })"
              />
            </c-action-wrapper>
            <c-action-wrapper title="最大轮次">
              <n-input-number
                :value="profile.roundLimit"
                size="small"
                :min="1"
                :max="10"
                @update:value="updateProfile({ roundLimit: $event ?? 3 })"
              />
            </c-action-wrapper>
            <n-checkbox
              :checked="profile.progressiveSplit"
              @update:checked="updateProfile({ progressiveSplit: $event })"
            >
              重试时自动缩小分段
            </n-checkbox>
            <c-action-wrapper title="响应检查">
              <n-flex vertical size="small">
                <n-checkbox
                  :checked="profile.responseChecks.lineCount"
                  @update:checked="updateResponseChecks({ lineCount: $event })"
                >
                  行数一致
                </n-checkbox>
                <n-checkbox
                  :checked="profile.responseChecks.emptyLine"
                  @update:checked="updateResponseChecks({ emptyLine: $event })"
                >
                  拒绝空译文
                </n-checkbox>
                <n-checkbox
                  :checked="profile.responseChecks.returnOriginal"
                  @update:checked="
                    updateResponseChecks({ returnOriginal: $event })
                  "
                >
                  检查返回原文
                </n-checkbox>
                <n-checkbox
                  :checked="profile.responseChecks.residualSource"
                  @update:checked="
                    updateResponseChecks({ residualSource: $event })
                  "
                >
                  检查残留原文
                </n-checkbox>
                <n-checkbox
                  :checked="profile.responseChecks.forbiddenTerms"
                  @update:checked="
                    updateResponseChecks({ forbiddenTerms: $event })
                  "
                >
                  检查禁翻词
                </n-checkbox>
              </n-flex>
            </c-action-wrapper>
          </n-flex>
        </section>

        <section class="workspace-panel compact">
          <div class="panel-heading">
            <div>
              <n-text depth="3">Glossary</n-text>
              <h2>术语表</h2>
            </div>
            <c-button label="添加" size="small" @action="addGlossaryTerm" />
          </div>
          <n-empty
            v-if="profile.dictionary.glossary.length === 0"
            description="没有工作流术语"
          />
          <n-flex v-else vertical size="small">
            <div
              v-for="(term, index) in profile.dictionary.glossary"
              :key="index"
              class="dict-row"
            >
              <n-input
                :value="term.source"
                size="small"
                placeholder="原文"
                @update:value="updateGlossaryTerm(index, { source: $event })"
              />
              <n-input
                :value="term.target"
                size="small"
                placeholder="译文"
                @update:value="updateGlossaryTerm(index, { target: $event })"
              />
              <n-input
                :value="term.note"
                size="small"
                placeholder="备注"
                @update:value="updateGlossaryTerm(index, { note: $event })"
              />
              <c-icon-button
                tooltip="删除"
                :icon="DeleteOutlineOutlined"
                type="error"
                @action="deleteGlossaryTerm(index)"
              />
            </div>
          </n-flex>
        </section>

        <section class="workspace-panel compact">
          <div class="panel-heading">
            <div>
              <n-text depth="3">Forbidden</n-text>
              <h2>禁翻表</h2>
            </div>
            <c-button label="添加" size="small" @action="addForbiddenTerm" />
          </div>
          <n-empty
            v-if="profile.dictionary.forbiddenTerms.length === 0"
            description="没有禁翻词"
          />
          <n-flex v-else vertical size="small">
            <div
              v-for="(term, index) in profile.dictionary.forbiddenTerms"
              :key="index"
              class="dict-row two"
            >
              <n-input
                :value="term.source"
                size="small"
                placeholder="禁止出现的词"
                @update:value="updateForbiddenTerm(index, { source: $event })"
              />
              <n-input
                :value="term.note"
                size="small"
                placeholder="备注"
                @update:value="updateForbiddenTerm(index, { note: $event })"
              />
              <c-icon-button
                tooltip="删除"
                :icon="DeleteOutlineOutlined"
                type="error"
                @action="deleteForbiddenTerm(index)"
              />
            </div>
          </n-flex>
        </section>

        <section class="workspace-panel compact">
          <div class="panel-heading">
            <div>
              <n-text depth="3">Replace</n-text>
              <h2>文本替换</h2>
            </div>
            <c-button label="添加" size="small" @action="addReplacement" />
          </div>
          <n-empty
            v-if="profile.dictionary.replacements.length === 0"
            description="没有替换规则"
          />
          <n-flex v-else vertical size="small">
            <div
              v-for="(item, index) in profile.dictionary.replacements"
              :key="index"
              class="dict-row"
            >
              <n-radio-group
                :value="item.stage"
                @update:value="updateReplacementStage(index, $event)"
              >
                <n-radio-button value="before" label="译前" />
                <n-radio-button value="after" label="译后" />
              </n-radio-group>
              <n-input
                :value="item.source"
                size="small"
                placeholder="查找"
                @update:value="updateReplacement(index, { source: $event })"
              />
              <n-input
                :value="item.target"
                size="small"
                placeholder="替换为"
                @update:value="updateReplacement(index, { target: $event })"
              />
              <c-icon-button
                tooltip="删除"
                :icon="DeleteOutlineOutlined"
                type="error"
                @action="deleteReplacement(index)"
              />
            </div>
          </n-flex>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.translation-workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: end;
  padding: 28px;
  border-radius: 18px;
  background: radial-gradient(
      circle at top right,
      rgba(99, 102, 241, 0.18),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      rgba(125, 125, 125, 0.12),
      rgba(125, 125, 125, 0.04)
    );
}

.workspace-hero h1,
.panel-heading h2 {
  margin: 0;
}

.workspace-hero h1 {
  margin-top: 4px;
  font-size: 32px;
  letter-spacing: -0.04em;
}

.workspace-hero p {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--n-text-color-2);
}

.stage-rail {
  min-width: 320px;
}

.stage-node {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

.stage-line {
  width: 26px;
  height: 1px;
  background: var(--n-border-color);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 20px;
  align-items: start;
}

.workspace-main,
.workspace-aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace-panel {
  padding: 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}

.workspace-panel.compact {
  padding: 18px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.dict-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.dict-row.two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
}

@media (max-width: 980px) {
  .workspace-hero,
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .stage-rail {
    min-width: 0;
    overflow-x: auto;
  }
}
</style>
