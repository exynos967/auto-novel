<script lang="ts" setup>
import { DeleteOutlineOutlined } from '@vicons/material';
import type {
  ForbiddenTermEntry,
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

const addForbiddenTerm = () => {
  updateDictionary({
    forbiddenTerms: [
      ...profile.value.dictionary.forbiddenTerms,
      { source: '', note: '' },
    ],
  });
};

const updateForbiddenTerm = (
  index: number,
  patch: Partial<ForbiddenTermEntry>,
) => {
  updateDictionary({
    forbiddenTerms: profile.value.dictionary.forbiddenTerms.map(
      (item: ForbiddenTermEntry, i: number) =>
        i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteForbiddenTerm = (index: number) => {
  updateDictionary({
    forbiddenTerms: profile.value.dictionary.forbiddenTerms.filter(
      (_: ForbiddenTermEntry, i: number) => i !== index,
    ),
  });
};
</script>

<template>
  <div class="layout-content">
    <header class="prompt-header">
      <div>
        <n-text depth="3">Table</n-text>
        <h1>禁翻表</h1>
        <p>译文中不允许出现的词会参与响应检查。</p>
      </div>
    </header>

    <section class="prompt-panel">
      <div class="panel-heading">
        <n-text depth="2">
          共 {{ profile.dictionary.forbiddenTerms.length }} 条
        </n-text>
        <c-button label="添加" size="small" @action="addForbiddenTerm" />
      </div>
      <n-empty
        v-if="profile.dictionary.forbiddenTerms.length === 0"
        description="没有禁翻词"
      />
      <div v-else class="table-list">
        <div
          v-for="(term, index) in profile.dictionary.forbiddenTerms"
          :key="index"
          class="table-row three"
        >
          <n-input
            :value="term.source"
            size="small"
            placeholder="禁止出现的词"
            @update:value="updateForbiddenTerm(index, { source: $event })"
          />
          <n-input
            :value="term.note"
            size="small"
            placeholder="备注"
            @update:value="updateForbiddenTerm(index, { note: $event })"
          />
          <c-icon-button
            tooltip="删除"
            :icon="DeleteOutlineOutlined"
            type="error"
            @action="deleteForbiddenTerm(index)"
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

.table-row.three {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
}

@media (max-width: 860px) {
  .table-row,
  .table-row.three {
    grid-template-columns: 1fr;
  }
}
</style>
