<script lang="ts" setup>
import type {
  WorkflowProfile,
  WorkflowStage,
} from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

const workflowStore = useTranslationWorkflowStore();
const workflowProfile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

const updateWorkflowProfile = (patch: Partial<WorkflowProfile>) => {
  workflowProfile.value = { ...workflowProfile.value, ...patch };
};

const updateResponseChecks = (
  patch: Partial<WorkflowProfile['responseChecks']>,
) => {
  updateWorkflowProfile({
    responseChecks: {
      ...workflowProfile.value.responseChecks,
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
const workflowStageValues = workflowStageOptions.map((it) => it.value);
const isWorkflowStage = (value: string | number): value is WorkflowStage =>
  typeof value === 'string' &&
  workflowStageValues.includes(value as WorkflowStage);
const updateStages = (stages: Array<string | number>) => {
  const nextStages = stages.filter(isWorkflowStage);
  updateWorkflowProfile({
    stages: nextStages.length > 0 ? nextStages : ['translate'],
  });
};

type PromptPreset = WorkflowProfile['promptPreset'];
const promptPresetOptions: { label: string; value: PromptPreset }[] = [
  { label: '通用', value: 'basic' },
  { label: '小说', value: 'novel' },
  { label: '忠实原文', value: 'faithful' },
];
const updatePromptPreset = (value: string | number) => {
  if (value === 'basic' || value === 'novel' || value === 'faithful') {
    updateWorkflowProfile({ promptPreset: value });
  }
};
</script>

<template>
  <div class="layout-content">
    <header class="settings-header">
      <div>
        <n-text depth="3">Workflow</n-text>
        <h1>任务设置</h1>
      </div>
    </header>

    <n-list bordered>
      <n-list-item>
        <n-flex vertical>
          <b>任务流程</b>
          <c-action-wrapper title="名称">
            <n-input
              :value="workflowProfile.name"
              size="small"
              @update:value="updateWorkflowProfile({ name: $event })"
            />
          </c-action-wrapper>
          <c-action-wrapper title="语言">
            <n-input-group>
              <n-input
                :value="workflowProfile.sourceLanguage"
                size="small"
                placeholder="源语言"
                @update:value="
                  updateWorkflowProfile({ sourceLanguage: $event })
                "
              />
              <n-input
                :value="workflowProfile.targetLanguage"
                size="small"
                placeholder="目标语言"
                @update:value="
                  updateWorkflowProfile({ targetLanguage: $event })
                "
              />
            </n-input-group>
          </c-action-wrapper>
          <c-action-wrapper title="流程标记">
            <n-checkbox-group
              :value="workflowProfile.stages"
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
          <c-action-wrapper title="提示词风格">
            <n-radio-group
              :value="workflowProfile.promptPreset"
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
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>任务切分</b>
          <c-action-wrapper title="分段行数">
            <n-input-number
              :value="workflowProfile.lineLimit"
              size="small"
              :min="1"
              :max="200"
              @update:value="updateWorkflowProfile({ lineLimit: $event ?? 30 })"
            />
          </c-action-wrapper>
          <c-action-wrapper title="最大轮次">
            <n-input-number
              :value="workflowProfile.roundLimit"
              size="small"
              :min="1"
              :max="10"
              @update:value="updateWorkflowProfile({ roundLimit: $event ?? 3 })"
            />
          </c-action-wrapper>
          <n-checkbox
            :checked="workflowProfile.progressiveSplit"
            @update:checked="
              updateWorkflowProfile({ progressiveSplit: $event })
            "
          >
            重试时自动缩小分段
          </n-checkbox>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>响应检查</b>
          <n-checkbox
            :checked="workflowProfile.responseChecks.lineCount"
            @update:checked="updateResponseChecks({ lineCount: $event })"
          >
            行数一致
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.emptyLine"
            @update:checked="updateResponseChecks({ emptyLine: $event })"
          >
            拒绝空译文
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.returnOriginal"
            @update:checked="updateResponseChecks({ returnOriginal: $event })"
          >
            检查返回原文
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.residualSource"
            @update:checked="updateResponseChecks({ residualSource: $event })"
          >
            检查残留原文
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.forbiddenTerms"
            @update:checked="updateResponseChecks({ forbiddenTerms: $event })"
          >
            检查禁翻词
          </n-checkbox>
        </n-flex>
      </n-list-item>
    </n-list>
  </div>
</template>

<style scoped>
.settings-header {
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(125, 125, 125, 0.12),
    rgba(125, 125, 125, 0.04)
  );
  margin-bottom: 16px;
}

.settings-header h1 {
  margin: 0;
}
</style>
