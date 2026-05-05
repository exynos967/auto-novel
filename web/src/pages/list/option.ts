import type {
  ListOptions,
  ListSelectOption,
  ListTextOption,
  ListValue,
} from '@/components/list/types';
import router from '@/router';

export const onUpdatePage = (page: number) => {
  const route = router.currentRoute.value;
  const query = { ...route.query, page };
  router.push({ path: route.path, query });
};

export function onUpdateListValue(
  listOptions: ListOptions,
  listFilter: ListValue<ListOptions>,
) {
  const route = router.currentRoute.value;
  router.push({
    path: route.path,
    query: {
      ...route.query,
      page: 1,
      query: listFilter.搜索,
      selected: Object.entries(listOptions)
        .filter(([, option]) => option.type === 'select')
        .map(([label]) => listFilter[label] as number),
    },
  });
}

export interface WebListOptions extends ListOptions {
  搜索: ListTextOption;
  来源: ListSelectOption;
  类型: ListSelectOption;
  分级: ListSelectOption;
  翻译: ListSelectOption;
  排序: ListSelectOption;
}

export type WebListValue = ListValue<WebListOptions>;

export function getWebListOptions(allowNsfw: boolean): WebListOptions {
  return {
    搜索: {
      type: 'text',
      history: 'web',
      placeholder: '请输入中/日标题或作者',
    },
    来源: {
      type: 'select',
      tags: [
        'Kakuyomu',
        '成为小说家吧',
        'Novelup',
        'Hameln',
        'Pixiv',
        'Alphapolis',
      ],
      multiple: true,
    },
    类型: {
      type: 'select',
      tags: ['全部', '连载中', '已完结', '短篇'],
    },
    分级: {
      type: 'select',
      tags: ['全部', '一般向', 'R18'],
      hide: !allowNsfw,
    },
    翻译: {
      type: 'select',
      tags: ['全部', 'LLM', 'Sakura'],
    },
    排序: {
      type: 'select',
      tags: ['更新', '点击', '相关'],
    },
  };
}

export function parseWebListValueProvider(v: number): string {
  const tags = [
    'kakuyomu',
    'syosetu',
    'novelup',
    'hameln',
    'pixiv',
    'alphapolis',
  ];

  return tags.filter((_, index) => (v & (1 << index)) !== 0).join();
}

export interface WenkuListOptions extends ListOptions {
  搜索: ListTextOption;
  分级: ListSelectOption;
}

export type WenkuListValue = ListValue<WenkuListOptions>;

export function getWenkuListOptions(allowNsfw: boolean): WenkuListOptions {
  const levels = ['全部小说', '轻小说', '轻文学', '文学', '非小说'];
  const levelsNsfw = ['R18男性向', 'R18女性向'];
  return {
    搜索: {
      type: 'text',
      history: 'wenku',
    },
    分级: {
      type: 'select',
      tags: allowNsfw ? [...levels, ...levelsNsfw] : levels,
    },
  };
}
