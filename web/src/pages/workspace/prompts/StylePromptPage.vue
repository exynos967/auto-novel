<script lang="ts" setup>
import type { WorkflowProfile } from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

const updatePrompts = (patch: Partial<WorkflowProfile['prompts']>) => {
  profile.value = {
    ...profile.value,
    prompts: { ...profile.value.prompts, ...patch },
  };
};

const updateTranslationPrompts = (
  patch: Partial<WorkflowProfile['prompts']['translation']>,
) => {
  updatePrompts({
    translation: { ...profile.value.prompts.translation, ...patch },
  });
};
</script>

<template>
  <div class="layout-content">
    <header class="prompt-header">
      <div>
        <n-text depth="3">Prompt</n-text>
        <h1>翻译风格</h1>
      </div>
    </header>

    <section class="prompt-panel">
      <n-input
        :value="profile.prompts.translation.style"
        type="textarea"
        :autosize="{ minRows: 16 }"
        placeholder="语气、文风、保留习惯等要求"
        @update:value="updateTranslationPrompts({ style: $event })"
      />
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

.prompt-panel {
  padding: 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}
</style>
