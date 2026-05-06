<script lang="ts" setup>
import { DeleteOutlineOutlined } from '@vicons/material';
import type {
  TextReplacementEntry,
  WorkflowProfile,
} from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

const updateProfile = (patch: Partial<WorkflowProfile>) => {
  profile.value = { ...profile.value, ...patch };
};

const updateDictionary = (patch: Partial<WorkflowProfile['dictionary']>) => {
  updateProfile({
    dictionary: { ...profile.value.dictionary, ...patch },
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
    replacements: profile.value.dictionary.replacements.map(
      (item: TextReplacementEntry, i: number) =>
        i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteReplacement = (index: number) => {
  updateDictionary({
    replacements: profile.value.dictionary.replacements.filter(
      (_: TextReplacementEntry, i: number) => i !== index,
    ),
  });
};

const updateReplacementStage = (index: number, value: string | number) => {
  updateReplacement(index, { stage: value === 'after' ? 'after' : 'before' });
};
</script>

<template>
  <div class="layout-content">
    <header class="prompt-header">
      <div>
        <n-text depth="3">Table</n-text>
        <h1>文本替换</h1>
        <p>支持译前清洗和译后替换，适合固定符号、称呼和格式处理。</p>
      </div>
    </header>

    <section class="prompt-panel">
      <div class="panel-heading">
        <n-text depth="2">
          共 {{ profile.dictionary.replacements.length }} 条
        </n-text>
        <c-button label="添加" size="small" @action="addReplacement" />
      </div>
      <n-empty
        v-if="profile.dictionary.replacements.length === 0"
        description="没有替换规则"
      />
      <div v-else class="table-list">
        <div
          v-for="(item, index) in profile.dictionary.replacements"
          :key="index"
          class="table-row four"
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
      </div>
    </section>
  </div>
</template>

<style scoped>
.prompt-header {
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(125, 125, 125, 0.12),
    rgba(125, 125, 125, 0.04)
  );
  margin-bottom: 16px;
}

.prompt-header h1 {
  margin: 0;
}

.prompt-header p {
  margin: 6px 0 0;
  color: var(--n-text-color-2);
}

.prompt-panel {
  padding: 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}

.panel-heading {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-row {
  display: grid;
  gap: 8px;
  align-items: center;
}

.table-row.four {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1fr) auto;
}

@media (max-width: 860px) {
  .table-row,
  .table-row.four {
    grid-template-columns: 1fr;
  }
}
</style>
