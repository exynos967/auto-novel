<script lang="ts" setup>
import { BookOutlined, DeleteOutlineOutlined } from '@vicons/material';
import { VueDraggable } from 'vue-draggable-plus';

import { TranslationCacheRepo } from '@/repos';
import WorkspaceShell from './translation/WorkspaceShell.vue';
import type { SakuraWorker, TranslateJob } from '@/model/Translator';
import { doAction } from '@/pages/util';
import { useSakuraWorkspaceStore, useSettingStore } from '@/stores';

const message = useMessage();

const workspace = useSakuraWorkspaceStore();
const workspaceRef = workspace.ref;
const settingStore = useSettingStore();
const { setting } = storeToRefs(settingStore);

const showLocalVolumeDrawer = ref(false);

type ProcessedJob = TranslateJob & {
  progress?: { finished: number; error: number; total: number };
};

const processedJobs = ref<Map<string, ProcessedJob>>(new Map());
const queuedJobVersion = ref(0);

const shouldAutoStart = (worker: SakuraWorker) =>
  setting.value.autoTranslate &&
  setting.value.autoTranslateProvider === 'sakura' &&
  worker.autoStart !== false;

watch(
  () => workspaceRef.value.jobs.map((it) => it.task).join('\n'),
  () => {
    queuedJobVersion.value += 1;
  },
);

const getNextJob = () => {
  const job = workspace.takeNextJob(new Set(processedJobs.value.keys()));
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
  workspace.deleteJob(task);
};
const deleteAllJobs = () => {
  workspaceRef.value.jobs.forEach((job) => {
    if (processedJobs.value.has(job.task)) {
      return;
    }
    workspace.deleteJob(job.task);
  });
};

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
      job.finishAt = Date.now();
      workspace.addJobRecord(job as TranslateJob);
      workspace.deleteJob(task);
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
  doAction(TranslationCacheRepo.clear('sakura-seg-cache'), '缓存清除', message);
</script>

<template>
  <div class="layout-content">
    <workspace-shell provider="sakura">
      <template #workers>
        <n-flex vertical size="small">
          <c-button-confirm
            hint="真的要清空缓存吗？"
            label="清空缓存"
            :icon="DeleteOutlineOutlined"
            size="small"
            @action="clearCache"
          />
          <n-empty
            v-if="workspaceRef.workers.length === 0"
            description="没有翻译器，请先到设置里添加 Sakura 翻译器"
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
                  :worker="{ translatorId: 'sakura', ...worker }"
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
                @top-job="workspace.topJob(job)"
                @bottom-job="workspace.bottomJob(job)"
                @delete-job="deleteJob(job.task)"
              />
            </n-list-item>
          </vue-draggable>
        </n-list>
      </template>

      <template #records>
        <job-record-section id="sakura" />
      </template>
    </workspace-shell>
  </div>

  <local-volume-list-specific-translation
    v-model:show="showLocalVolumeDrawer"
    type="sakura"
  />
</template>
