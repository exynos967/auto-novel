<script lang="ts" setup>
import {
  BlockOutlined,
  MenuBookOutlined,
  PeopleOutlineOutlined,
  PlayArrowOutlined,
  StopOutlined,
} from '@vicons/material';
import type { TreeOption } from 'naive-ui';
import type { Component } from 'vue';

import { useTranslationWorkflowStore } from '@/stores';

const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

type ExtractView = 'characters' | 'terms' | 'nonTranslate';

const currentView = ref<ExtractView>('characters');

const viewMeta: Record<
  ExtractView,
  { label: string; icon: Component; description: string }
> = {
  characters: {
    label: '角色表',
    icon: PeopleOutlineOutlined,
    description: 'AI 从原文中提取的角色、人称等信息，可编辑后保存到术语表。',
  },
  terms: {
    label: '术语表',
    icon: MenuBookOutlined,
    description: 'AI 从原文中提取的专有名词、物品、组织等术语。',
  },
  nonTranslate: {
    label: '禁翻表',
    icon: BlockOutlined,
    description: 'AI 识别的标签、占位符、变量等不需要翻译的内容。',
  },
};

const navTreeOptions = computed<TreeOption[]>(() => [
  {
    key: 'characters',
    label: `${viewMeta.characters.label} (0)`,
    children: [],
  },
  {
    key: 'terms',
    label: `${viewMeta.terms.label} (0)`,
    children: [],
  },
  {
    key: 'nonTranslate',
    label: `${viewMeta.nonTranslate.label} (0)`,
    children: [],
  },
]);

const handleNavSelect = (_keys: (string | number)[], option: TreeOption) => {
  if (option.key && typeof option.key === 'string') {
    currentView.value = option.key as ExtractView;
  }
};

const analysisRunning = ref(false);
const analysisProgress = ref(0);
const analysisStats = ref({ characters: 0, terms: 0, nonTranslate: 0 });

const startAnalysis = () => {
  analysisRunning.value = true;
  analysisProgress.value = 0;
};

const stopAnalysis = () => {
  analysisRunning.value = false;
};
</script>

<template>
  <div class="extract-stage">
    <header class="extract-header">
      <div class="header-left">
        <n-text depth="3">Analysis</n-text>
        <h1>提取</h1>
        <p>
          AI
          分析原文内容，自动提取角色、术语和不翻译项，支持手动编辑后保存到公共表。
        </p>
      </div>
      <div class="header-cards">
        <div class="stat-card">
          <n-text depth="3">操作</n-text>
          <n-flex :size="8" style="margin-top: 8px">
            <n-button
              v-if="!analysisRunning"
              type="primary"
              size="small"
              :disabled="true"
              @click="startAnalysis"
            >
              <n-icon :component="PlayArrowOutlined" :size="16" />
              开始分析
            </n-button>
            <n-button v-else type="warning" size="small" @click="stopAnalysis">
              <n-icon :component="StopOutlined" :size="16" />
              停止
            </n-button>
          </n-flex>
        </div>
        <div class="stat-card">
          <n-text depth="3">进度</n-text>
          <n-progress
            :percentage="analysisProgress"
            :indicator-placement="'inside'"
            style="margin-top: 8px"
          />
        </div>
        <div class="stat-card">
          <n-text depth="3">结果</n-text>
          <n-flex :size="16" style="margin-top: 8px" justify="center">
            <div class="stat-item">
              <strong>{{ analysisStats.characters }}</strong>
              <n-text depth="3">角色</n-text>
            </div>
            <div class="stat-item">
              <strong>{{ analysisStats.terms }}</strong>
              <n-text depth="3">术语</n-text>
            </div>
            <div class="stat-item">
              <strong>{{ analysisStats.nonTranslate }}</strong>
              <n-text depth="3">禁翻</n-text>
            </div>
          </n-flex>
        </div>
      </div>
    </header>

    <div class="extract-body">
      <aside class="extract-nav">
        <n-tree
          :data="navTreeOptions"
          :default-expanded-keys="['characters', 'terms', 'nonTranslate']"
          block-line
          @update:selected-keys="handleNavSelect"
        />
      </aside>

      <main class="extract-main">
        <div class="extract-placeholder">
          <n-icon
            :component="viewMeta[currentView].icon"
            :size="48"
            depth="3"
          />
          <h2>{{ viewMeta[currentView].label }}</h2>
          <p>{{ viewMeta[currentView].description }}</p>
          <n-text depth="3">
            此功能需要后端 AI 分析服务支持，将在后续版本中实现。
          </n-text>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.extract-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.extract-header {
  padding: 24px;
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

.extract-header h1 {
  margin: 4px 0 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.extract-header p {
  max-width: 720px;
  margin: 8px 0 0;
  color: var(--n-text-color-2);
}

.header-cards {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  padding: 12px 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  min-width: 120px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-item strong {
  font-size: 20px;
}

.extract-body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.extract-nav {
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
  position: sticky;
  top: 66px;
}

.extract-main {
  min-height: 400px;
}

.extract-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  border: 1px dashed var(--n-border-color);
  border-radius: 16px;
  text-align: center;
}

.extract-placeholder h2 {
  margin: 0;
}

.extract-placeholder p {
  max-width: 480px;
  color: var(--n-text-color-2);
}

@media (max-width: 860px) {
  .extract-body {
    grid-template-columns: 1fr;
  }

  .extract-nav {
    display: none;
  }

  .header-cards {
    grid-template-columns: 1fr;
  }
}
</style>
