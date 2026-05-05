<script lang="ts" setup>
import {
  DeleteOutlineOutlined,
  FlashOnOutlined,
  PlusOutlined,
  SettingsOutlined,
} from '@vicons/material';

import type { TranslatorConfig } from '@/domain/translate';
import { Translator } from '@/domain/translate';
import type { GptWorker, SakuraWorker } from '@/model/Translator';
import { useGptWorkspaceStore, useSakuraWorkspaceStore } from '@/stores';

const props = defineProps<{
  type: 'gpt' | 'sakura';
}>();

const message = useMessage();

const gptWorkspace = useGptWorkspaceStore();
const sakuraWorkspace = useSakuraWorkspaceStore();

const workspace = computed(() =>
  props.type === 'gpt' ? gptWorkspace : sakuraWorkspace,
);
const workspaceRef = computed(() => workspace.value.ref.value);
const workers = computed(() => workspaceRef.value.workers);

const showCreateWorkerModal = ref(false);
const editingWorkerId = ref<string>();
const editingWorker = computed(() =>
  workers.value.find((it) => it.id === editingWorkerId.value),
);
const showEditWorkerModal = computed({
  get: () => editingWorker.value !== undefined,
  set: (value) => {
    if (!value) {
      editingWorkerId.value = undefined;
    }
  },
});

const workerDescription = (worker: GptWorker | SakuraWorker) => {
  if (props.type === 'gpt') {
    const gptWorker = worker as GptWorker;
    return `${gptWorker.model}@${gptWorker.endpoint}`;
  }
  const sakuraWorker = worker as SakuraWorker;
  return `${sakuraWorker.segLength ?? 500}@${sakuraWorker.endpoint}`;
};

const buildTranslatorConfig = (
  worker: GptWorker | SakuraWorker,
): TranslatorConfig => {
  if (props.type === 'gpt') {
    const gptWorker = worker as GptWorker;
    return {
      id: 'gpt',
      type: gptWorker.type,
      model: gptWorker.model,
      endpoint: gptWorker.endpoint,
      key: gptWorker.key,
    };
  }

  const sakuraWorker = worker as SakuraWorker;
  return {
    id: 'sakura',
    endpoint: sakuraWorker.endpoint,
    segLength: sakuraWorker.segLength,
    prevSegLength: sakuraWorker.prevSegLength,
  };
};

const testWorker = async (worker: GptWorker | SakuraWorker) => {
  const textJp = [
    '国境の長いトンネルを抜けると雪国であった。夜の底が白くなった。信号所に汽車が止まった。',
  ];
  try {
    const translator = await Translator.create(buildTranslatorConfig(worker));
    const textZh = await translator.translate(textJp);

    const lineJp = textJp[0];
    const lineZh = textZh[0];

    if (props.type === 'gpt') {
      message.success(`原文：${lineJp}\n译文：${lineZh}`);
    } else {
      message.success(
        [
          `原文：${lineJp}`,
          `译文：${lineZh}`,
          `模型：${translator.sakuraModel()} ${
            translator.allowUpload() ? '允许上传' : '禁止上传'
          }`,
        ].join('\n'),
      );
    }
  } catch (e: unknown) {
    message.error(`翻译器错误：${e}`);
  }
};

const deleteWorker = (id: string) => {
  workspace.value.deleteWorker(id);
};
</script>

<template>
  <n-flex vertical>
    <n-flex justify="space-between" align="center">
      <b>{{ type === 'gpt' ? 'LLM翻译器' : 'Sakura翻译器' }}</b>
      <c-button
        label="添加翻译器"
        :icon="PlusOutlined"
        size="small"
        @action="showCreateWorkerModal = true"
      />
    </n-flex>

    <n-empty v-if="workers.length === 0" description="没有翻译器" />
    <n-list v-else>
      <n-list-item v-for="worker of workers" :key="worker.id">
        <n-thing>
          <template #header>
            {{ worker.id }}
          </template>
          <template #description>
            {{ workerDescription(worker) }}
          </template>
          <template #header-extra>
            <n-flex :size="6" :wrap="false">
              <c-icon-button
                tooltip="测试"
                :icon="FlashOnOutlined"
                @action="testWorker(worker)"
              />
              <c-icon-button
                tooltip="设置"
                :icon="SettingsOutlined"
                @action="editingWorkerId = worker.id"
              />
              <c-button-confirm
                hint="真的要删除这个翻译器吗？"
                :icon="DeleteOutlineOutlined"
                type="error"
                size="tiny"
                secondary
                circle
                @action="deleteWorker(worker.id)"
              />
            </n-flex>
          </template>
        </n-thing>
      </n-list-item>
    </n-list>
  </n-flex>

  <template v-if="type === 'gpt'">
    <gpt-worker-modal v-model:show="showCreateWorkerModal" />
    <gpt-worker-modal
      v-if="editingWorker !== undefined"
      v-model:show="showEditWorkerModal"
      :worker="editingWorker as GptWorker"
    />
  </template>
  <template v-else>
    <sakura-worker-modal v-model:show="showCreateWorkerModal" />
    <sakura-worker-modal
      v-if="editingWorker !== undefined"
      v-model:show="showEditWorkerModal"
      :worker="editingWorker as SakuraWorker"
    />
  </template>
</template>
