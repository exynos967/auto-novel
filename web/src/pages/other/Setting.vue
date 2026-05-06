<script lang="ts" setup>
import {
  Setting,
  useSettingStore,
  useTranslationWorkflowStore,
  useWebSearchHistoryStore,
  useWenkuSearchHistoryStore,
} from '@/stores';
import type {
  WorkflowProfile,
  WorkflowStage,
} from '@/domain/translate/workflow';
import { InfoOutlined } from '@vicons/material';

const message = useMessage();
const route = useRoute();
const router = useRouter();

const settingStore = useSettingStore();
const { setting } = storeToRefs(settingStore);

const workflowStore = useTranslationWorkflowStore();
const workflowProfile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

type SettingTab = 'basic' | 'workflow' | 'output' | 'translator' | 'reading';

const tabs: { label: string; value: SettingTab }[] = [
  { label: '基础', value: 'basic' },
  { label: '任务设置', value: 'workflow' },
  { label: '输出设置', value: 'output' },
  { label: '翻译器', value: 'translator' },
  { label: '阅读与搜索', value: 'reading' },
];

const isSettingTab = (value: unknown): value is SettingTab =>
  typeof value === 'string' && tabs.some((tab) => tab.value === value);

const activeTab = computed({
  get: () => {
    const tab = route.query.tab;
    return isSettingTab(tab) ? tab : 'basic';
  },
  set: (tab: string | number) => {
    if (isSettingTab(tab)) {
      router.replace({ query: { ...route.query, tab } });
    }
  },
});

const autoTranslate = computed({
  get: () => setting.value.autoTranslate,
  set: (autoTranslate: boolean) => {
    setting.value = { ...setting.value, autoTranslate };
  },
});

const autoTranslateProvider = computed({
  get: () => setting.value.autoTranslateProvider,
  set: (autoTranslateProvider: 'gpt' | 'sakura') => {
    setting.value = { ...setting.value, autoTranslateProvider };
  },
});

const updateWorkflowProfile = (patch: Partial<WorkflowProfile>) => {
  workflowProfile.value = { ...workflowProfile.value, ...patch };
};

const updateResponseChecks = (
  patch: Partial<WorkflowProfile['responseChecks']>,
) => {
  updateWorkflowProfile({
    responseChecks: {
      ...workflowProfile.value.responseChecks,
      ...patch,
    },
  });
};

const workflowStageOptions: { label: string; value: WorkflowStage }[] = [
  { label: '提取', value: 'extract' },
  { label: '翻译', value: 'translate' },
  { label: '校对', value: 'proofread' },
  { label: '润色', value: 'polish' },
];
const workflowStageValues = workflowStageOptions.map((it) => it.value);
const isWorkflowStage = (value: string | number): value is WorkflowStage =>
  typeof value === 'string' &&
  workflowStageValues.includes(value as WorkflowStage);
const updateStages = (stages: Array<string | number>) => {
  const nextStages = stages.filter(isWorkflowStage);
  updateWorkflowProfile({
    stages: nextStages.length > 0 ? nextStages : ['translate'],
  });
};

type PromptPreset = WorkflowProfile['promptPreset'];
const promptPresetOptions: { label: string; value: PromptPreset }[] = [
  { label: '通用', value: 'basic' },
  { label: '小说', value: 'novel' },
  { label: '忠实原文', value: 'faithful' },
];
const updatePromptPreset = (value: string | number) => {
  if (value === 'basic' || value === 'novel' || value === 'faithful') {
    updateWorkflowProfile({ promptPreset: value });
  }
};

const clearWebSearchHistory = () => {
  useWebSearchHistoryStore().clear();
  message.success('清空成功');
};

const clearWenkuSearchHistory = () => {
  useWenkuSearchHistoryStore().clear();
  message.success('清空成功');
};
</script>

<template>
  <div class="layout-content setting-page">
    <header class="setting-header">
      <div>
        <n-text depth="3">Settings</n-text>
        <n-h1>设置</n-h1>
      </div>
      <c-radio-group v-model:value="activeTab" :options="tabs" size="small" />
    </header>

    <n-list v-if="activeTab === 'basic'" bordered>
      <n-list-item>
        <n-flex vertical>
          <b>主题</b>
          <c-radio-group
            v-model:value="setting.theme"
            :options="Setting.themeOptions"
            size="small"
          />
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>快捷键说明</b>
          <n-ul>
            <n-li>列表页面，可以使用左右方向键翻页。</n-li>
            <n-li>阅读页面，可以使用左右方向键跳转上/下一章。</n-li>
            <n-li>阅读页面，可以使用数字键1～2快速切换翻译。</n-li>
          </n-ul>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>工作区</b>
          <n-checkbox v-model:checked="setting.autoTopJobWhenAddTask">
            添加翻译任务时自动置顶
          </n-checkbox>
          <n-checkbox v-model:checked="autoTranslate">
            进入开始翻译页面自动开始翻译
          </n-checkbox>
          <n-flex v-if="autoTranslate" align="center">
            自动翻译提供商
            <c-radio-group
              v-model:value="autoTranslateProvider"
              :options="Setting.autoTranslateProviderOptions"
              size="small"
            />
          </n-flex>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>显示的翻译按钮</b>
          <translator-check
            v-model:value="setting.enabledTranslator"
            size="small"
          />
        </n-flex>
      </n-list-item>
    </n-list>

    <n-list v-else-if="activeTab === 'workflow'" bordered>
      <n-list-item>
        <n-flex vertical>
          <b>任务流程</b>
          <c-action-wrapper title="名称">
            <n-input
              :value="workflowProfile.name"
              size="small"
              @update:value="updateWorkflowProfile({ name: $event })"
            />
          </c-action-wrapper>
          <c-action-wrapper title="语言">
            <n-input-group>
              <n-input
                :value="workflowProfile.sourceLanguage"
                size="small"
                placeholder="源语言"
                @update:value="
                  updateWorkflowProfile({ sourceLanguage: $event })
                "
              />
              <n-input
                :value="workflowProfile.targetLanguage"
                size="small"
                placeholder="目标语言"
                @update:value="
                  updateWorkflowProfile({ targetLanguage: $event })
                "
              />
            </n-input-group>
          </c-action-wrapper>
          <c-action-wrapper title="流程标记">
            <n-checkbox-group
              :value="workflowProfile.stages"
              @update:value="updateStages"
            >
              <n-flex size="small">
                <n-checkbox
                  v-for="stage in workflowStageOptions"
                  :key="stage.value"
                  :value="stage.value"
                >
                  {{ stage.label }}
                </n-checkbox>
              </n-flex>
            </n-checkbox-group>
          </c-action-wrapper>
          <c-action-wrapper title="提示词风格">
            <n-radio-group
              :value="workflowProfile.promptPreset"
              @update:value="updatePromptPreset"
            >
              <n-radio-button
                v-for="option in promptPresetOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </n-radio-group>
          </c-action-wrapper>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>任务切分</b>
          <c-action-wrapper title="分段行数">
            <n-input-number
              :value="workflowProfile.lineLimit"
              size="small"
              :min="1"
              :max="200"
              @update:value="updateWorkflowProfile({ lineLimit: $event ?? 30 })"
            />
          </c-action-wrapper>
          <c-action-wrapper title="最大轮次">
            <n-input-number
              :value="workflowProfile.roundLimit"
              size="small"
              :min="1"
              :max="10"
              @update:value="updateWorkflowProfile({ roundLimit: $event ?? 3 })"
            />
          </c-action-wrapper>
          <n-checkbox
            :checked="workflowProfile.progressiveSplit"
            @update:checked="
              updateWorkflowProfile({ progressiveSplit: $event })
            "
          >
            重试时自动缩小分段
          </n-checkbox>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>响应检查</b>
          <n-checkbox
            :checked="workflowProfile.responseChecks.lineCount"
            @update:checked="updateResponseChecks({ lineCount: $event })"
          >
            行数一致
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.emptyLine"
            @update:checked="updateResponseChecks({ emptyLine: $event })"
          >
            拒绝空译文
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.returnOriginal"
            @update:checked="updateResponseChecks({ returnOriginal: $event })"
          >
            检查返回原文
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.residualSource"
            @update:checked="updateResponseChecks({ residualSource: $event })"
          >
            检查残留原文
          </n-checkbox>
          <n-checkbox
            :checked="workflowProfile.responseChecks.forbiddenTerms"
            @update:checked="updateResponseChecks({ forbiddenTerms: $event })"
          >
            检查禁翻词
          </n-checkbox>
        </n-flex>
      </n-list-item>
    </n-list>

    <n-list v-else-if="activeTab === 'output'" bordered>
      <n-list-item>
        <n-flex vertical>
          <b>输出设置</b>
          <c-action-wrapper title="文件名">
            <c-radio-group
              v-model:value="setting.downloadFilenameType"
              :options="[
                { label: '日文标题', value: 'jp' },
                { label: '中文标题', value: 'zh' },
              ]"
              size="small"
            />
          </c-action-wrapper>
          <c-action-wrapper title="内容">
            <c-radio-group
              v-model:value="setting.downloadFormat.mode"
              :options="Setting.downloadModeOptions"
              size="small"
            />
          </c-action-wrapper>
          <c-action-wrapper title="翻译选择">
            <n-flex>
              <c-radio-group
                v-model:value="setting.downloadFormat.translationsMode"
                :options="Setting.downloadTranslationModeOptions"
                size="small"
              />
              <translator-check
                v-model:value="setting.downloadFormat.translations"
                show-order
                size="small"
              />
            </n-flex>
          </c-action-wrapper>
          <c-action-wrapper title="格式">
            <c-radio-group
              v-model:value="setting.downloadFormat.type"
              :options="Setting.downloadTypeOptions"
              size="small"
            />
          </c-action-wrapper>
        </n-flex>
      </n-list-item>
    </n-list>

    <n-list v-else-if="activeTab === 'translator'" bordered>
      <n-list-item>
        <n-flex vertical>
          <worker-list-setting type="gpt" />
          <n-divider />
          <worker-list-setting type="sakura" />
        </n-flex>
      </n-list-item>
    </n-list>

    <n-list v-else bordered>
      <n-list-item>
        <n-flex vertical>
          <b>网络小说目录</b>
          <n-checkbox v-model:checked="setting.tocCollapseInNarrowScreen">
            目录折叠在侧边栏 (移动端)
          </n-checkbox>
          <n-checkbox v-model:checked="setting.tocExpandAll">
            目录默认展开所有章节
            <n-tooltip trigger="hover" placement="top" style="max-width: 400px">
              <template #trigger>
                <n-button text @click.stop>
                  <n-icon depth="4" :component="InfoOutlined" size="12" />
                </n-button>
              </template>
              开启：默认展开所有章节（可能导致性能问题）
              <br />
              关闭：只展开上次阅读的章节（如无记录则展开第一个章节）
              <br />
              不影响无分章的网络小说
            </n-tooltip>
          </n-checkbox>
          <b>收藏夹</b>
          <n-checkbox v-model:checked="setting.showTagInWebFavored">
            显示收藏夹里网络小说的标签
          </n-checkbox>
          <n-checkbox v-model:checked="setting.favoriteCreateTimeFirst">
            收藏时间排序优先
          </n-checkbox>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>列表分页方式</b>
          <c-radio-group
            v-model:value="setting.paginationMode"
            :options="Setting.paginationModeOptions"
            size="small"
          />
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical align="start">
          <b>清空搜索历史</b>
          <n-flex>
            <c-button
              label="清空网络搜索历史"
              size="small"
              @action="clearWebSearchHistory"
            />
            <c-button
              label="清空文库搜索历史"
              size="small"
              @action="clearWenkuSearchHistory"
            />
          </n-flex>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>黑名单</b>
          <n-flex>
            <user-block-button />
          </n-flex>
        </n-flex>
      </n-list-item>

      <n-list-item>
        <n-flex vertical>
          <b>语言</b>
          简繁转换目前只覆盖web章节内容。
          <c-radio-group
            v-model:value="setting.locale"
            :options="Setting.localeOptions"
            size="small"
          />
          <n-checkbox v-model:checked="setting.searchLocaleAware">
            支持繁体搜索（不稳定）
          </n-checkbox>
        </n-flex>
      </n-list-item>
    </n-list>
  </div>
</template>

<style scoped>
.setting-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-header {
  display: flex;
  gap: 16px;
  align-items: start;
  flex-direction: column;
}

.setting-header :deep(.n-h1) {
  margin: 4px 0 0;
}

@media (max-width: 720px) {
  .setting-header {
    overflow-x: auto;
  }
}
</style>
