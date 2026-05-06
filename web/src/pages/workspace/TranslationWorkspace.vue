<script lang="ts" setup>
import { BookOutlined, DeleteOutlineOutlined } from '@vicons/material';
import { VueDraggable } from 'vue-draggable-plus';

import { TranslationCacheRepo } from '@/repos';
import WorkspaceShell from './translation/WorkspaceShell.vue';
import type { GptWorker, SakuraWorker, TranslateJob } from '@/model/Translator';
import { doAction } from '@/pages/util';
import {
  useGptWorkspaceStore,
  useSakuraWorkspaceStore,
  useSettingStore,
} from '@/stores';

const message = useMessage();

const settingStore = useSettingStore();
const { setting } = storeToRefs(settingStore);

type ProcessedJob = TranslateJob & {
  progress?: { finished: number; error: number; total: number };
};

const processedJobs = ref<Map<string, ProcessedJob>>(new Map());
const queuedJobVersion = ref(0);

const gptWorkspace = useGptWorkspaceStore();
const sakuraWorkspace = useSakuraWorkspaceStore();
const activeProvider = computed<'gpt' | 'sakura'>({
  get: () => setting.value.autoTranslateProvider,
  set: (value) => {
    setting.value.autoTranslateProvider = value;
    processedJobs.value.clear();
    queuedJobVersion.value += 1;
  },
});
const workspace = computed(() =>
  activeProvider.value === 'gpt' ? gptWorkspace : sakuraWorkspace,
);
const workspaceRef = computed(() => workspace.value.ref.value);

const showLocalVolumeDrawer = ref(false);

const workerTranslatorId = (worker: GptWorker | SakuraWorker) =>
  'type' in worker ? 'gpt' : 'sakura';

const shouldAutoStart = (worker: GptWorker | SakuraWorker) =>
  setting.value.autoTranslate &&
  workerTranslatorId(worker) === activeProvider.value &&
  worker.autoStart !== false;

watch(
  () => workspaceRef.value.jobs.map((it) => it.task).join('\n'),
  () => {
    queuedJobVersion.value += 1;
  },
);

const getNextJob = () => {
  const job = workspace.value.takeNextJob(new Set(processedJobs.value.keys()));
  if (job !== undefined) {
    processedJobs.value.set(job.task, job);
    queuedJobVersion.value += 1;
  }
  return job;
};

const deleteJob = (task: string) => {
  if (processedJobs.value.has(task)) {
    message.error('任务被翻译器占用');
    return;
  }
  workspace.value.deleteJob(task);
};
const deleteAllJobs = () => {
  workspaceRef.value.jobs.forEach((job) => {
    if (processedJobs.value.has(job.task)) {
      return;
    }
    workspace.value.deleteJob(job.task);
  });
};

const topJob = (job: TranslateJob) => workspace.value.topJob(job);
const bottomJob = (job: TranslateJob) => workspace.value.bottomJob(job);

const onProgressUpdated = (
  task: string,
  state:
    | { state: 'finish'; abort: boolean }
    | { state: 'processed'; finished: number; error: number; total: number },
) => {
  if (state.state === 'finish') {
    const job = processedJobs.value.get(task)!;
    processedJobs.value.delete(task);
    if (!state.abort) {
      workspace.value.addJobRecord(job);
      workspace.value.deleteJob(task);
    }
  } else {
    const job = processedJobs.value.get(task)!;
    job.progress = {
      finished: state.finished,
      error: state.error,
      total: state.total,
    };
  }
};

const clearCache = async () =>
  doAction(
    TranslationCacheRepo.clear(
      activeProvider.value === 'gpt' ? 'gpt-seg-cache' : 'sakura-seg-cache',
    ),
    '缓存清除',
    message,
  );
</script>

<template>
  <div class="layout-content">
    <workspace-shell :provider="activeProvider">
      <template #workers>
        <n-flex vertical size="small">
          <c-action-wrapper title="提供商">
            <c-radio-group
              v-model:value="activeProvider"
              :options="[
                { label: 'LLM', value: 'gpt' },
                { label: 'Sakura', value: 'sakura' },
              ]"
              size="small"
            />
          </c-action-wrapper>
          <c-button-confirm
            hint="真的要清空缓存吗？"
            label="清空缓存"
            :icon="DeleteOutlineOutlined"
            size="small"
            @action="clearCache"
          />
          <n-empty
            v-if="workspaceRef.workers.length === 0"
            description="没有翻译器，请先到设置里添加翻译器"
          />
          <n-list v-else>
            <vue-draggable
              v-model="workspaceRef.workers"
              :animation="150"
              handle=".drag-trigger"
            >
              <n-list-item
                v-for="worker of workspaceRef.workers"
                :key="worker.id"
              >
                <job-worker
                  :worker="{
                    translatorId: workerTranslatorId(worker),
                    ...worker,
                  }"
                  :get-next-job="getNextJob"
                  :job-version="queuedJobVersion"
                  :auto-start="shouldAutoStart(worker)"
                  @update:progress="onProgressUpdated"
                />
              </n-list-item>
            </vue-draggable>
          </n-list>
        </n-flex>
      </template>

      <template #tasks>
        <n-flex
          justify="space-between"
          align="center"
          style="margin-bottom: 12px"
        >
          <n-text depth="3">{{ workspaceRef.jobs.length }} 个等待任务</n-text>
          <n-flex :size="8">
            <c-button
              label="本地书架"
              :icon="BookOutlined"
              size="small"
              @action="showLocalVolumeDrawer = true"
            />
            <c-button-confirm
              hint="真的要清空队列吗？"
              label="清空队列"
              :icon="DeleteOutlineOutlined"
              size="small"
              @action="deleteAllJobs"
            />
          </n-flex>
        </n-flex>
        <n-empty v-if="workspaceRef.jobs.length === 0" description="没有任务" />
        <n-list v-else>
          <vue-draggable
            v-model="workspaceRef.jobs"
            :animation="150"
            handle=".drag-trigger"
          >
            <n-list-item v-for="job of workspaceRef.jobs" :key="job.task">
              <job-queue
                :job="job"
                :progress="processedJobs.get(job.task)?.progress"
                @top-job="topJob(job)"
                @bottom-job="bottomJob(job)"
                @delete-job="deleteJob(job.task)"
              />
            </n-list-item>
          </vue-draggable>
        </n-list>
      </template>

      <template #records>
        <job-record-section :id="activeProvider" />
      </template>
    </workspace-shell>
  </div>

  <local-volume-list-specific-translation
    v-model:show="showLocalVolumeDrawer"
    :type="activeProvider"
  />
</template>
