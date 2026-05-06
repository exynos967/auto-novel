<script lang="ts" setup>
import { Setting, useSettingStore } from '@/stores';

const settingStore = useSettingStore();
const { setting } = storeToRefs(settingStore);
</script>

<template>
  <div class="layout-content">
    <header class="settings-header">
      <div>
        <n-text depth="3">Output</n-text>
        <h1>输出设置</h1>
      </div>
    </header>

    <n-list bordered>
      <n-list-item>
        <n-flex vertical>
          <b>输出设置</b>
          <c-action-wrapper title="文件名">
            <c-radio-group
              v-model:value="setting.downloadFilenameType"
              :options="[
                { label: '日文标题', value: 'jp' },
                { label: '中文标题', value: 'zh' },
              ]"
              size="small"
            />
          </c-action-wrapper>
          <c-action-wrapper title="内容">
            <c-radio-group
              v-model:value="setting.downloadFormat.mode"
              :options="Setting.downloadModeOptions"
              size="small"
            />
          </c-action-wrapper>
          <c-action-wrapper title="翻译选择">
            <n-flex>
              <c-radio-group
                v-model:value="setting.downloadFormat.translationsMode"
                :options="Setting.downloadTranslationModeOptions"
                size="small"
              />
              <translator-check
                v-model:value="setting.downloadFormat.translations"
                show-order
                size="small"
              />
            </n-flex>
          </c-action-wrapper>
          <c-action-wrapper title="格式">
            <c-radio-group
              v-model:value="setting.downloadFormat.type"
              :options="Setting.downloadTypeOptions"
              size="small"
            />
          </c-action-wrapper>
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
