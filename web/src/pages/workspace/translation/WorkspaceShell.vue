<script lang="ts" setup>
import {
  AutoFixHighOutlined,
  FactCheckOutlined,
  FormatListBulletedOutlined,
  GTranslateOutlined,
  PlayArrowOutlined,
  RuleOutlined,
  SettingsOutlined,
  TranslateOutlined,
} from '@vicons/material';
import type { Component } from 'vue';

import type { WorkflowStage } from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

defineProps<{
  provider: 'gpt' | 'sakura';
}>();

const workflowStore = useTranslationWorkflowStore();
const router = useRouter();
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
</script>

<template>
  <div class="translation-workspace">
    <section class="workspace-hero">
      <div>
        <n-text depth="3">翻译工作台</n-text>
        <h1>开始翻译</h1>
        <p>
          这里专注处理翻译任务、翻译器和任务记录；任务设置、输出设置、公共表格和提示词都放到独立页面维护。
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
              <n-text depth="3">Config</n-text>
              <h2>配置入口</h2>
            </div>
            <n-icon :component="SettingsOutlined" :size="22" />
          </div>
          <n-flex vertical size="small">
            <c-action-wrapper title="流程">
              <n-flex size="small">
                <n-tag
                  v-for="stage in enabledStages"
                  :key="stage.label"
                  :bordered="false"
                  type="info"
                >
                  {{ stage.label }}
                </n-tag>
              </n-flex>
            </c-action-wrapper>
            <n-text depth="3">
              分段和检查已移动到「任务设置」，术语表和提示词已移动到侧边栏独立页面。
            </n-text>
            <n-flex>
              <c-button
                label="任务设置"
                size="small"
                @action="router.push('/workspace/task-settings')"
              />
              <c-button
                label="术语表"
                size="small"
                @action="router.push('/workspace/tables/glossary')"
              />
            </n-flex>
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
