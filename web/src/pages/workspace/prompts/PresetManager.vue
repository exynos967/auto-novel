<script lang="ts" setup>
import {
  AddOutlined,
  CheckCircleOutlined,
  DeleteOutlineOutlined,
  LockOutlined,
  PersonOutlined,
} from '@vicons/material';

import {
  SYSTEM_PRESETS,
  type PromptPresetEntry,
} from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

const message = useMessage();
const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.profile,
  set: (p) => {
    workflowStore.state.profile = p;
  },
});

const activePresetId = computed({
  get: () => profile.value.promptPreset,
  set: (id) => {
    profile.value = {
      ...profile.value,
      promptPreset: id as typeof profile.value.promptPreset,
    };
  },
});

const userPresets = ref<PromptPresetEntry[]>([]);

const allPresets = computed<PromptPresetEntry[]>(() => [
  ...SYSTEM_PRESETS,
  ...userPresets.value,
]);

const showCreateModal = ref(false);
const newPresetName = ref('');
const newPresetPreset = ref<PromptPresetEntry['promptPreset']>('novel');

const createPreset = () => {
  if (!newPresetName.value.trim()) return;
  const currentPrompts = { ...profile.value.prompts };
  userPresets.value.push({
    id: `user-${Date.now()}`,
    name: newPresetName.value.trim(),
    type: 'user',
    promptPreset: newPresetPreset.value,
    prompts: currentPrompts,
  });
  showCreateModal.value = false;
  newPresetName.value = '';
  message.success('预设已创建');
};

const deletePreset = (id: string) => {
  userPresets.value = userPresets.value.filter((p) => p.id !== id);
  message.success('预设已删除');
};

const applyPreset = (preset: PromptPresetEntry) => {
  activePresetId.value = preset.promptPreset;
  profile.value = {
    ...profile.value,
    prompts: { ...preset.prompts },
    promptPreset: preset.promptPreset,
  };
  message.success(`已应用预设：${preset.name}`);
};
</script>

<template>
  <div class="layout-content preset-page">
    <header class="preset-header">
      <div>
        <n-text depth="3">Prompt Presets</n-text>
        <h1>预设提示词</h1>
        <p>
          系统内置多种翻译风格预设，也可以将当前的提示词配置保存为自定义预设。
        </p>
      </div>
      <c-button
        label="新建预设"
        :icon="AddOutlined"
        size="small"
        @action="showCreateModal = true"
      />
    </header>

    <div class="preset-grid">
      <div
        v-for="preset in allPresets"
        :key="preset.id"
        class="preset-card"
        :class="{ active: profile.promptPreset === preset.promptPreset }"
        @click="applyPreset(preset)"
      >
        <div class="card-top">
          <div class="card-badge" :class="preset.type">
            <n-icon
              :component="
                preset.type === 'system' ? LockOutlined : PersonOutlined
              "
              :size="12"
            />
            {{ preset.type === 'system' ? '系统' : '自定义' }}
          </div>
          <c-icon-button
            v-if="preset.type === 'user'"
            tooltip="删除"
            :icon="DeleteOutlineOutlined"
            type="error"
            size="tiny"
            @action.stop="deletePreset(preset.id)"
          />
          <n-icon
            v-if="profile.promptPreset === preset.promptPreset"
            :component="CheckCircleOutlined"
            color="var(--primary-color, #6366f1)"
            :size="20"
          />
        </div>
        <strong class="card-name">{{ preset.name }}</strong>
        <n-text depth="3" class="card-desc">
          {{ preset.prompts.translation.system.slice(0, 80) }}...
        </n-text>
      </div>
    </div>

    <c-modal v-model:show="showCreateModal" title="新建预设">
      <n-flex vertical>
        <c-action-wrapper title="名称">
          <n-input
            v-model:value="newPresetName"
            size="small"
            placeholder="预设名称"
          />
        </c-action-wrapper>
        <c-action-wrapper title="风格">
          <c-radio-group
            v-model:value="newPresetPreset"
            :options="[
              { label: '通用', value: 'basic' },
              { label: '轻小说', value: 'novel' },
              { label: '思维链', value: 'cot' },
              { label: '推理模型', value: 'think' },
              { label: '忠实原文', value: 'faithful' },
            ]"
            size="small"
          />
        </c-action-wrapper>
        <n-text depth="3">将当前填写的所有提示词内容保存为新预设。</n-text>
      </n-flex>
      <template #footer>
        <n-flex justify="end">
          <n-button size="small" @click="showCreateModal = false">
            取消
          </n-button>
          <n-button
            size="small"
            type="primary"
            @click="createPreset"
            :disabled="!newPresetName.trim()"
          >
            创建
          </n-button>
        </n-flex>
      </template>
    </c-modal>
  </div>
</template>

<style scoped>
.preset-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preset-header {
  display: flex;
  gap: 16px;
  align-items: start;
  justify-content: space-between;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(125, 125, 125, 0.12),
    rgba(125, 125, 125, 0.04)
  );
}

.preset-header h1 {
  margin: 0;
}

.preset-header p {
  max-width: 600px;
  margin: 6px 0 0;
  color: var(--n-text-color-2);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.preset-card {
  padding: 18px;
  border: 2px solid var(--n-border-color);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.preset-card:hover {
  border-color: var(--n-text-color-3);
}

.preset-card.active {
  border-color: var(--primary-color, #6366f1);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.card-badge.system {
  background: rgba(99, 102, 241, 0.12);
  color: var(--primary-color, #6366f1);
}

.card-badge.user {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.card-name {
  display: block;
  margin-bottom: 6px;
}

.card-desc {
  display: block;
  font-size: 12px;
}
</style>
