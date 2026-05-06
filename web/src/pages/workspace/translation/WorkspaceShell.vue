<script lang="ts" setup>
import {
  AutoFixHighOutlined,
  FactCheckOutlined,
  FormatListBulletedOutlined,
  TranslateOutlined,
} from '@vicons/material';
import type { Component } from 'vue';

import type { WorkflowStage } from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

const props = defineProps<{
  currentStage: WorkflowStage;
}>();

const emit = defineEmits<{
  'update:currentStage': [stage: WorkflowStage];
}>();

const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

const stageMeta: Record<WorkflowStage, { label: string; icon: Component }> = {
  extract: { label: '提取', icon: FormatListBulletedOutlined },
  translate: { label: '翻译', icon: TranslateOutlined },
  proofread: { label: '校对', icon: FactCheckOutlined },
  polish: { label: '润色', icon: AutoFixHighOutlined },
};

const enabledStages = computed(() =>
  profile.value.stages.map((stage: WorkflowStage) => stageMeta[stage]),
);

const selectStage = (label: string) => {
  const entry = Object.entries(stageMeta).find(
    ([, meta]) => meta.label === label,
  );
  if (entry) {
    emit('update:currentStage', entry[0] as WorkflowStage);
  }
};
</script>

<template>
  <div class="translation-workspace">
    <section class="workspace-hero">
      <div>
        <n-text depth="3">翻译工作台</n-text>
        <h1>{{ stageMeta[currentStage].label }}</h1>
      </div>
      <n-flex :wrap="false" align="center" class="stage-rail">
        <template v-for="(stage, index) in enabledStages" :key="stage.label">
          <button
            class="stage-node"
            :class="{ active: stage.label === stageMeta[currentStage].label }"
            @click="selectStage(stage.label)"
          >
            <n-icon :component="stage.icon" :size="18" />
            <span>{{ stage.label }}</span>
          </button>
          <div v-if="index < enabledStages.length - 1" class="stage-line" />
        </template>
      </n-flex>
    </section>

    <slot />
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

.workspace-hero h1 {
  margin: 0;
  margin-top: 4px;
  font-size: 32px;
  letter-spacing: -0.04em;
}

.stage-rail {
  min-width: 320px;
}

.stage-node {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
  padding: 8px 14px;
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  background: transparent;
  color: var(--n-text-color-2);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.stage-node:hover {
  color: var(--n-text-color);
  border-color: var(--n-text-color-3);
}

.stage-node.active {
  color: var(--n-text-color);
  border-color: var(--primary-color, #6366f1);
  background: rgba(99, 102, 241, 0.1);
}

.stage-line {
  width: 26px;
  height: 1px;
  background: var(--n-border-color);
}

@media (max-width: 980px) {
  .workspace-hero {
    grid-template-columns: 1fr;
  }

  .stage-rail {
    min-width: 0;
    overflow-x: auto;
  }
}
</style>
