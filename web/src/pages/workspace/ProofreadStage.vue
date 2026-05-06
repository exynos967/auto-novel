<script lang="ts" setup>
import {
  FactCheckOutlined,
  RuleOutlined,
  SearchOutlined,
  SpellcheckOutlined,
} from '@vicons/material';

type CheckType = 'language' | 'terminology' | 'rule' | 'search';

const activeCheck = ref<CheckType>('language');

const checkTypes: {
  key: CheckType;
  label: string;
  description: string;
}[] = [
  {
    key: 'language',
    label: '语言检查',
    description: '检查译文的语法、拼写和流畅度问题。',
  },
  {
    key: 'terminology',
    label: '术语检查',
    description: '对照术语表检查译文中的术语使用是否一致。',
  },
  {
    key: 'rule',
    label: '规则检查',
    description: '检查译文是否满足禁翻词、行数限制等规则约束。',
  },
  {
    key: 'search',
    label: '搜索替换',
    description: '在译文/原文中搜索和替换特定内容。',
  },
];
</script>

<template>
  <div class="proofread-stage">
    <header class="proofread-header">
      <div>
        <n-text depth="3">Review</n-text>
        <h1>校润</h1>
        <p>
          对译文进行质量检查，包括语言流畅度、术语一致性、规则合规性和内容搜索替换。
        </p>
      </div>
    </header>

    <div class="proofread-body">
      <aside class="proofread-nav">
        <div class="nav-title">检查类型</div>
        <button
          v-for="item in checkTypes"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeCheck === item.key }"
          @click="activeCheck = item.key"
        >
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <main class="proofread-main">
        <div class="proofread-placeholder">
          <n-icon :component="FactCheckOutlined" :size="48" depth="3" />
          <h2>{{ checkTypes.find((t) => t.key === activeCheck)?.label }}</h2>
          <p>
            {{ checkTypes.find((t) => t.key === activeCheck)?.description }}
          </p>
          <n-text depth="3">
            此功能需要后端 AI 校润服务支持，将在后续版本中实现。
          </n-text>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.proofread-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.proofread-header {
  padding: 24px;
  border-radius: 18px;
  background: radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.15),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      rgba(125, 125, 125, 0.12),
      rgba(125, 125, 125, 0.04)
    );
}

.proofread-header h1 {
  margin: 4px 0 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.proofread-header p {
  max-width: 720px;
  margin: 8px 0 0;
  color: var(--n-text-color-2);
}

.proofread-body {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.proofread-nav {
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
  position: sticky;
  top: 66px;
}

.nav-title {
  font-weight: 700;
  margin-bottom: 12px;
}

.nav-item {
  display: block;
  width: 100%;
  padding: 9px 10px;
  color: var(--n-text-color);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 10px;
  font-size: 14px;
}

.nav-item.active,
.nav-item:hover {
  background: rgba(125, 125, 125, 0.12);
}

.proofread-main {
  min-height: 400px;
}

.proofread-placeholder {
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

.proofread-placeholder h2 {
  margin: 0;
}

.proofread-placeholder p {
  max-width: 480px;
  color: var(--n-text-color-2);
}

@media (max-width: 860px) {
  .proofread-body {
    grid-template-columns: 1fr;
  }

  .proofread-nav {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    position: static;
  }

  .nav-title {
    width: 100%;
    margin-bottom: 4px;
  }
}
</style>
