<script lang="ts" setup>
import {
  DragIndicatorOutlined,
  PlayArrowOutlined,
  StopOutlined,
} from '@vicons/material';

import type { TranslatorConfig } from '@/domain/translate';
import type { GptWorker, SakuraWorker } from '@/model/Translator';
import { TranslateTaskDescriptor } from '@/model/Translator';

const props = defineProps<{
  worker:
    | ({ translatorId: 'sakura' } & SakuraWorker)
    | ({ translatorId: 'gpt' } & GptWorker);
  jobVersion: number;
  autoStart: boolean;
  getNextJob: () =>
    | { task: string; description: string; createAt: number }
    | undefined;
}>();

const emit = defineEmits<{
  'update:progress': [
    string,
    (
      | { state: 'finish'; abort: boolean }
      | { state: 'processed'; finished: number; error: number; total: number }
    ),
  ];
}>();

const message = useMessage();

const translatorConfig = computed(() => {
  const worker = props.worker;
  if (worker.translatorId === 'gpt') {
    return <TranslatorConfig & { id: 'gpt' }>{
      id: 'gpt',
      type: worker.type,
      model: worker.model,
      endpoint: worker.endpoint,
      key: worker.key,
    };
  } else {
    return <TranslatorConfig & { id: 'sakura' }>{
      id: 'sakura',
      endpoint: worker.endpoint,
      segLength: worker.segLength,
      prevSegLength: worker.prevSegLength,
    };
  }
});

const endpointPrefix = computed(() => {
  const worker = props.worker;
  if (worker.translatorId === 'gpt') {
    if (worker.type === 'web') {
      return `web[${worker.key.slice(-4)}]@`;
    } else {
      return `${worker.model}[${worker.key.slice(-4)}]@`;
    }
  } else {
    return `${worker.segLength ?? 500}@`;
  }
});

const translateTask = useTemplateRef('translateTask');
const currentJob = ref<{
  task: string;
  description: string;
  createAt: number;
}>();
const running = computed(() => currentJob.value !== undefined);

let abortHandler = () => {};

const processTasks = async () => {
  const controller = new AbortController();
  const { signal } = controller;
  abortHandler = () => controller.abort();

  while (true) {
    const job = props.getNextJob();
    currentJob.value = job;

    if (job === undefined) break;
    message.info('获取翻译任务');
    const { desc, params } = TranslateTaskDescriptor.parse(job.task);

    const state = await translateTask.value!.startTask(
      desc,
      params,
      translatorConfig.value,
      {
        onProgressUpdated: (progress) => {
          emit('update:progress', job.task, {
            state: 'processed',
            ...progress,
          });
        },
      },
      signal,
    );
    emit('update:progress', job.task, {
      state: 'finish',
      abort: state === 'abort',
    });

    if (state !== 'complete' || !props.autoStart) {
      break;
    }
  }
  currentJob.value = undefined;
};

const startWorker = () => {
  if (running.value) return;
  processTasks();
};
const stopWorker = () => {
  if (!running.value) return;
  abortHandler();
};

onMounted(() => {
  if (props.autoStart) {
    startWorker();
  }
});

watch(
  () => props.jobVersion,
  () => {
    if (props.autoStart && !running.value) {
      startWorker();
    }
  },
);

watch(
  () => props.autoStart,
  (autoStart) => {
    if (autoStart && !running.value) {
      startWorker();
    }
  },
);
</script>

<template>
  <n-thing content-indented>
    <template #avatar>
      <n-icon
        class="drag-trigger"
        :size="18"
        :depth="2"
        :component="DragIndicatorOutlined"
        style="cursor: move"
      />
    </template>

    <template #header>
      {{ worker.id }}
      <n-text depth="3" style="font-size: 12px; padding-left: 2px">
        {{ endpointPrefix }}{{ translatorConfig.endpoint }}
      </n-text>
    </template>

    <template #description>
      <n-p v-if="currentJob">
        {{ currentJob.description }}
      </n-p>
    </template>

    <template #header-extra>
      <n-flex :size="6" :wrap="false">
        <c-button
          v-if="running"
          label="停止"
          :icon="StopOutlined"
          size="tiny"
          secondary
          @action="stopWorker"
        />
        <c-button
          v-else
          label="开始"
          :icon="PlayArrowOutlined"
          size="tiny"
          secondary
          @action="startWorker"
        />

        <n-tag v-if="autoStart" size="small" type="success" :bordered="false">
          自动
        </n-tag>
      </n-flex>
    </template>
  </n-thing>

  <TranslateTask ref="translateTask" style="margin-top: 20px" />
</template>
