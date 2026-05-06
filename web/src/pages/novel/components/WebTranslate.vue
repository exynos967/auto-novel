<script lang="ts" setup>
import ky from 'ky';

import { WebNovelApi } from '@/api';
import { GenericNovelId } from '@/model/Common';
import { TranslateTaskDescriptor } from '@/model/Translator';
import {
  useLocalVolumeStore,
  useSettingStore,
  useWhoamiStore,
  useWorkspaceStore,
} from '@/stores';
import { Crawler } from '@/domain/crawler';
import { doAction } from '@/pages/util';

const props = defineProps<{
  providerId: string;
  novelId: string;
  titleJp: string;
  titleZh?: string;
  total: number;
  jp: number;
  gpt: number;
  sakura: number;
  glossary: { [key: string]: string };
}>();

const { providerId, novelId, titleJp, titleZh, total } = props;

const message = useMessage();

const whoamiStore = useWhoamiStore();
const { whoami } = storeToRefs(whoamiStore);

const settingStore = useSettingStore();
const { setting } = storeToRefs(settingStore);

const translateOptions = useTemplateRef('translateOptions');

const files = computed(() => {
  const title =
    setting.value.downloadFilenameType === 'jp' ? titleJp : titleZh ?? titleJp;

  const { mode, translationsMode, translations, type } =
    setting.value.downloadFormat;

  return {
    jp: WebNovelApi.createFileUrl({
      providerId,
      novelId,
      mode: 'jp',
      translationsMode,
      translations: [],
      type,
      title,
    }),
    zh: WebNovelApi.createFileUrl({
      providerId,
      novelId,
      mode: mode,
      translationsMode,
      translations,
      type,
      title,
    }),
  };
});

const updateNovel = () => {
  if (!Crawler.checkAddon()) {
    message.error('无法更新目录：未检测到Addon');
    return;
  }
  return doAction(
    Crawler.updateWebNovel(providerId, novelId),
    '更新小说（伪）',
    message,
  );
};

const importToWorkspace = async () => {
  const blob = await ky.get(files.value.jp.url).blob();
  const file = new File([blob], files.value.jp.filename);

  const repo = await useLocalVolumeStore();
  await repo
    .createVolume(file, 'default')
    .then(() => repo.updateGlossary(file.name, toRaw(props.glossary)))
    .then(() => message.success('导入成功'))
    .catch((error) => message.error(`导入失败:${error}`));
};

const submitWorkflowJob = () => {
  const id = setting.value.autoTranslateProvider;
  const { startIndex, endIndex, level, forceMetadata } =
    translateOptions.value!.getTranslateTaskParams();
  const taskNumber = translateOptions.value!.getTaskNumber();

  if (endIndex <= startIndex || startIndex >= total) {
    message.error('添加失败：没有选中章节');
    return;
  }

  const tasks: string[] = [];
  if (taskNumber > 1) {
    const taskSize = (Math.min(endIndex, total) - startIndex) / taskNumber;
    for (let i = 0; i < taskNumber; i++) {
      const start = Math.round(startIndex + i * taskSize);
      const end = Math.round(startIndex + (i + 1) * taskSize);
      if (end > start) {
        const task = TranslateTaskDescriptor.web(providerId, novelId, {
          level,
          forceMetadata,
          startIndex: start,
          endIndex: end,
        });
        tasks.push(task);
      }
    }
  } else {
    const task = TranslateTaskDescriptor.web(providerId, novelId, {
      level,
      forceMetadata,
      startIndex,
      endIndex,
    });
    tasks.push(task);
  }

  const workspace = useWorkspaceStore(id);

  const results = tasks.map((task) => {
    const job = {
      task,
      description: titleZh ?? titleJp,
      createAt: Date.now(),
    };
    const success = workspace.addJob(job);
    if (success) {
      if (setting.value.autoTopJobWhenAddTask) {
        workspace.topJob(job);
      }
    }
    return success;
  });
  if (results.length === 1 && !results[0]) {
    message.error('添加失败：翻译任务已经存在');
  } else {
    message.success('已加入任务');
  }
};
</script>

<template>
  <n-text v-if="!whoami.isSignedIn">游客无法使用翻译功能，请先登录。</n-text>
  <n-text v-else-if="setting.enabledTranslator.length === 0">
    没有翻译器启用。
  </n-text>
  <TranslateOptions
    v-else
    ref="translateOptions"
    :gnid="GenericNovelId.web(providerId, novelId)"
    :glossary="glossary"
  />

  <n-flex vertical style="margin-top: 16px">
    <n-text>总计 {{ total }} / LLM {{ gpt }} / Sakura {{ sakura }}</n-text>

    <template v-if="whoami.isSignedIn && setting.enabledTranslator.length > 0">
      <n-button-group>
        <c-button
          v-if="
            setting.enabledTranslator.includes(setting.autoTranslateProvider)
          "
          :label="`开始${setting.autoTranslateProvider === 'gpt' ? 'LLM' : 'Sakura'}翻译`"
          :round="false"
          @action="submitWorkflowJob"
        />
      </n-button-group>
    </template>

    <n-button-group>
      <c-button
        label="下载原文"
        :round="false"
        tag="a"
        :href="files.jp.url"
        :download="files.jp.filename"
        target="_blank"
      />
      <c-button
        label="下载机翻"
        :round="false"
        tag="a"
        :href="files.zh.url"
        :download="files.zh.filename"
        target="_blank"
      />
      <c-button
        label="导入原文到本地书架"
        :round="false"
        @action="importToWorkspace"
      />
      <c-button
        v-if="whoami.isAdmin"
        label="更新目录"
        :round="false"
        @action="updateNovel()"
      />
    </n-button-group>
  </n-flex>
</template>
