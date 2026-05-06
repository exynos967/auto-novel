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

const stageTabs: { key: WorkflowStage; label: string; icon: Component }[] = [
  { key: 'extract', label: '提取', icon: FormatListBulletedOutlined },
  { key: 'translate', label: '翻译', icon: TranslateOutlined },
  { key: 'proofread', label: '校润', icon: FactCheckOutlined },
];
</script>

<template>
  <div class="translation-workspace">
    <section class="workspace-hero">
      <div>
        <n-text depth="3">翻译工作台</n-text>
        <h1>开始翻译</h1>
        <p>选择提取、翻译或校润阶段，完成轻小说机翻全流程。</p>
      </div>
    </section>

    <nav class="stage-tabs">
      <button
        v-for="tab in stageTabs"
        :key="tab.key"
        class="stage-tab"
        :class="{ active: tab.key === currentStage }"
        @click="emit('update:currentStage', tab.key)"
      >
        <n-icon :component="tab.icon" :size="20" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <slot />
  </div>
</template>

<style scoped>
.translation-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-hero {
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

.workspace-hero p {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--n-text-color-2);
}

.stage-tabs {
  display: flex;
  gap: 0;
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  overflow: hidden;
  width: fit-content;
}

.stage-tab {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 10px 24px;
  border: none;
  background: transparent;
  color: var(--n-text-color-2);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  border-right: 1px solid var(--n-border-color);
}

.stage-tab:last-child {
  border-right: none;
}

.stage-tab:hover {
  color: var(--n-text-color);
  background: rgba(125, 125, 125, 0.06);
}

.stage-tab.active {
  color: #fff;
  background: var(--primary-color, #6366f1);
}
</style>
