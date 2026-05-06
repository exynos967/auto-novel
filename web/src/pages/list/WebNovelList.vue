<script lang="ts" setup>
import { WebNovelRepo } from '@/repos';
import { FavoredRepo, useWhoamiStore } from '@/stores';
import { onUpdatePage } from './option';

const router = useRouter();

const props = defineProps<{
  page: number;
  query: string;
  selected: number[];
}>();

const whoamiStore = useWhoamiStore();
const { whoami } = storeToRefs(whoamiStore);

const favoredStore = FavoredRepo.useFavoredStore();
const { favoreds } = storeToRefs(favoredStore);

const searchQuery = ref(props.query);

const { data: novelPage, error } = WebNovelRepo.useWebNovelList(
  () => props.page,
  () => ({
    query: props.query,
    provider: 'kakuyomu,syosetu,novelup,hameln,pixiv,alphapolis',
    type: 0,
    level: whoami.value.hasNsfwAccess ? 0 : 1,
    translate: 0,
    sort: 0,
  }),
);

const doSearch = () => {
  router.push({
    path: '/novel',
    query: searchQuery.value
      ? { query: searchQuery.value, page: 1 }
      : { page: 1 },
  });
};

watch(novelPage, (novelPage) => {
  if (novelPage) {
    const favoredIds = favoreds.value.web.map((it) => it.id);
    for (const item of novelPage.items) {
      if (item.favored && !favoredIds.includes(item.favored)) {
        item.favored = undefined;
      }
    }
  }
});
</script>

<template>
  <div class="layout-content">
    <n-h1>网络小说</n-h1>

    <n-input-group style="max-width: 500px; margin-bottom: 16px">
      <n-input
        v-model:value="searchQuery"
        size="small"
        placeholder="搜索中/日标题或作者..."
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
        <NovelListWeb :items="novelPage.items" />
        <n-empty v-if="novelPage.items.length === 0" description="空列表" />
        <n-divider />
      </template>

      <CResultX v-else :error="error" title="加载错误" />
    </CPage>
  </div>
</template>
