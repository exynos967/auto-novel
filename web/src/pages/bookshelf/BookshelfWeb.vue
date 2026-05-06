<script lang="ts" setup>
import { ChecklistOutlined } from '@vicons/material';

import { useIsWideScreen } from '@/pages/util';
import { WebNovelRepo } from '@/repos';
import { useSettingStore, useWhoamiStore } from '@/stores';
import { onUpdatePage } from '../list/option';
import { parseFavoredListValueSort } from './option';

const router = useRouter();

const props = defineProps<{
  page: number;
  query: string;
  selected: number[];
  favoredId: string;
}>();

const isWideScreen = useIsWideScreen();

const whoamiStore = useWhoamiStore();
const { whoami } = storeToRefs(whoamiStore);

const settingStore = useSettingStore();
const { setting } = storeToRefs(settingStore);

const searchQuery = ref(props.query);

const { data: novelPage, error } = WebNovelRepo.useWebNovelFavoredList(
  () => props.page,
  () => props.favoredId,
  () => ({
    query: props.query,
    provider: 'kakuyomu,syosetu,novelup,hameln,pixiv,alphapolis',
    type: 0,
    level: whoami.value.hasNsfwAccess ? 0 : 1,
    translate: 0,
    sort: parseFavoredListValueSort(
      [
        { label: '收藏时间', value: 'createAt' },
        { label: '更新时间', value: 'update' },
      ],
      setting.value.favoriteCreateTimeFirst ? 0 : 1,
    ),
  }),
);

const doSearch = () => {
  router.push({
    path: `/favorite/web/${props.favoredId}`,
    query: searchQuery.value
      ? { query: searchQuery.value, page: 1 }
      : { page: 1 },
  });
};

const showControlPanel = ref(false);
const novelListRef = useTemplateRef('novelList');
</script>

<template>
  <bookshelf-layout :menu-key="`web/${favoredId}`">
    <n-flex style="margin-bottom: 24px">
      <c-button
        label="选择"
        :icon="ChecklistOutlined"
        @action="showControlPanel = !showControlPanel"
      />
      <bookshelf-list-button
        v-if="!isWideScreen"
        :menu-key="`web/${favoredId}`"
      />
    </n-flex>

    <n-collapse-transition :show="showControlPanel" style="margin-bottom: 16px">
      <bookshelf-web-control
        :selected-novels="novelListRef?.selectedNovels ?? []"
        :favored-id="favoredId"
        @select-all="novelListRef?.selectAll()"
        @invert-selection="novelListRef?.invertSelection()"
      />
    </n-collapse-transition>

    <n-input-group style="max-width: 400px; margin-bottom: 12px">
      <n-input
        v-model:value="searchQuery"
        size="small"
        placeholder="搜索收藏..."
        :input-props="{ spellcheck: false }"
        @keyup.enter="doSearch"
      />
      <n-button size="small" type="primary" @click="doSearch">搜索</n-button>
    </n-input-group>

    <CPage
      :page="page"
      :page-number="novelPage?.pageNumber"
      @update:page="onUpdatePage"
    >
      <template v-if="novelPage">
        <n-divider />
        <NovelListWeb
          ref="novelList"
          :items="novelPage.items"
          :selectable="showControlPanel"
          :simple="!setting.showTagInWebFavored"
        />
        <n-empty v-if="novelPage.items.length === 0" description="空列表" />
        <n-divider />
      </template>

      <CResultX v-else :error="error" title="加载错误" />
    </CPage>
  </bookshelf-layout>
</template>
