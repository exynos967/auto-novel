<script lang="ts" setup>
import {
  FolderOpenOutlined,
  HistoryOutlined,
  PlayArrowOutlined,
} from '@vicons/material';

const emit = defineEmits<{
  loaded: [];
}>();

const showLocalVolumeDrawer = ref(false);
const activeProjectType = ref('auto');

const projectTypes = [
  { label: '自动检测', value: 'auto' },
  { label: '轻小说（标准）', value: 'novel' },
  { label: '游戏文本', value: 'game' },
];
</script>

<template>
  <div class="layout-content startup-page">
    <section class="startup-hero">
      <n-text depth="3">翻译工作台</n-text>
      <h1>开始翻译</h1>
      <p>
        选择项目类型和输入文件夹，或者从下方历史记录中选择继续之前的翻译任务。
      </p>
    </section>

    <div class="startup-grid">
      <section class="startup-card">
        <div class="card-heading">
          <n-icon :component="FolderOpenOutlined" :size="20" />
          <span>新建项目</span>
        </div>
        <n-flex vertical>
          <c-action-wrapper title="项目类型">
            <c-radio-group
              v-model:value="activeProjectType"
              :options="projectTypes"
              size="small"
            />
          </c-action-wrapper>
          <c-action-wrapper title="输入文件夹">
            <c-button
              label="选择本地书架"
              :icon="FolderOpenOutlined"
              size="small"
              @action="showLocalVolumeDrawer = true"
            />
          </c-action-wrapper>
        </n-flex>
      </section>

      <section class="startup-card">
        <div class="card-heading">
          <n-icon :component="HistoryOutlined" :size="20" />
          <span>项目历史</span>
        </div>
        <n-empty description="暂无翻译历史，选择本地书架开始翻译吧" />
      </section>
    </div>

    <local-volume-list-specific-translation
      v-model:show="showLocalVolumeDrawer"
      type="gpt"
      @update:show="
        showLocalVolumeDrawer = $event;
        if (!$event) emit('loaded');
      "
    />
  </div>
</template>

<style scoped>
.startup-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.startup-hero {
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

.startup-hero h1 {
  margin: 4px 0 0;
  font-size: 32px;
  letter-spacing: -0.04em;
}

.startup-hero p {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--n-text-color-2);
}

.startup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.startup-card {
  padding: 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}

.card-heading {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  margin-bottom: 16px;
}

@media (max-width: 720px) {
  .startup-grid {
    grid-template-columns: 1fr;
  }
}
</style>
