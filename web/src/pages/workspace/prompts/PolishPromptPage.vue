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

const updatePolishPrompts = (
  patch: Partial<WorkflowProfile['prompts']['polish']>,
) => {
  updatePrompts({
    polish: { ...profile.value.prompts.polish, ...patch },
  });
};
</script>

<template>
  <div class="layout-content">
    <header class="prompt-header">
      <div>
        <n-text depth="3">Prompt</n-text>
        <h1>润色提示词</h1>
      </div>
    </header>

    <section class="prompt-panel">
      <n-input
        :value="profile.prompts.polish.system"
        type="textarea"
        :autosize="{ minRows: 16 }"
        placeholder="润色时的提示词，当前作为配置保存"
        @update:value="updatePolishPrompts({ system: $event })"
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
