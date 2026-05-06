<script lang="ts" setup>
import {
  AutoFixHighOutlined,
  BlockOutlined,
  FindInPageOutlined,
  ImportExportOutlined,
  RuleFolderOutlined,
  SpellcheckOutlined,
} from '@vicons/material';

const modules = [
  {
    title: '术语表',
    description: '维护原文、译文和备注，翻译时自动筛选当前分段命中的条目。',
    icon: SpellcheckOutlined,
  },
  {
    title: '禁翻表',
    description: '记录不允许出现在译文中的词，并参与工作流校验。',
    icon: BlockOutlined,
  },
  {
    title: '文本替换',
    description: '支持译前清洗和译后替换，用来处理固定符号、称呼和格式。',
    icon: ImportExportOutlined,
  },
  {
    title: '文本提取',
    description: '统一采用 AiNiee 的文件提取思路，收拢本地小说导入流程。',
    icon: FindInPageOutlined,
  },
  {
    title: '校对规则',
    description: '管理行数、空译文、残留原文和禁翻词检查。',
    icon: RuleFolderOutlined,
  },
  {
    title: '润色提示词',
    description: '管理校润工作流的独立 prompt，不再混在普通翻译器配置里。',
    icon: AutoFixHighOutlined,
  },
];
</script>

<template>
  <div class="layout-content toolbox-page">
    <section class="toolbox-hero">
      <n-text depth="3">Prompt / Table / Rule</n-text>
      <h1>提示词与公共表格</h1>
      <p>
        这里集中管理 AiNiee
        风格的术语表、禁翻表、文本替换、提取和校润规则，并统一服务翻译工作流。
      </p>
    </section>

    <div class="toolbox-grid">
      <section v-for="item in modules" :key="item.title" class="toolbox-item">
        <n-icon :component="item.icon" :size="24" />
        <div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.toolbox-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbox-hero {
  padding: 28px;
  border-radius: 18px;
  background: radial-gradient(
      circle at top left,
      rgba(16, 185, 129, 0.16),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      rgba(125, 125, 125, 0.12),
      rgba(125, 125, 125, 0.04)
    );
}

.toolbox-hero h1,
.toolbox-item h2 {
  margin: 0;
}

.toolbox-hero h1 {
  margin-top: 4px;
  font-size: 32px;
  letter-spacing: -0.04em;
}

.toolbox-hero p {
  max-width: 760px;
  margin: 10px 0 0;
  color: var(--n-text-color-2);
}

.toolbox-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.toolbox-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}

.toolbox-item p {
  margin: 6px 0 0;
  color: var(--n-text-color-2);
}

@media (max-width: 760px) {
  .toolbox-grid {
    grid-template-columns: 1fr;
  }
}
</style>
