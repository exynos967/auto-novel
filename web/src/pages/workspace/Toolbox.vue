<script lang="ts" setup>
import {
  AutoFixHighOutlined,
  BlockOutlined,
  DeleteOutlineOutlined,
  ImportExportOutlined,
  MenuBookOutlined,
  PeopleOutlineOutlined,
  PublicOutlined,
  StyleOutlined,
  TranslateOutlined,
} from '@vicons/material';
import type { Component } from 'vue';

import type {
  ForbiddenTermEntry,
  TermEntry,
  TextReplacementEntry,
  WorkflowProfile,
} from '@/domain/translate/workflow';
import { useTranslationWorkflowStore } from '@/stores';

const route = useRoute();
const router = useRouter();

const workflowStore = useTranslationWorkflowStore();
const profile = computed({
  get: () => workflowStore.state.profile,
  set: (profile) => {
    workflowStore.state.profile = profile;
  },
});

type ToolboxSection =
  | 'glossary'
  | 'forbidden'
  | 'replace'
  | 'basePrompt'
  | 'character'
  | 'world'
  | 'style'
  | 'example'
  | 'polish';

const sections: {
  key: ToolboxSection;
  label: string;
  group: string;
  icon: Component;
}[] = [
  {
    key: 'glossary',
    label: '术语表',
    group: '公共表格',
    icon: MenuBookOutlined,
  },
  { key: 'forbidden', label: '禁翻表', group: '公共表格', icon: BlockOutlined },
  {
    key: 'replace',
    label: '文本替换',
    group: '公共表格',
    icon: ImportExportOutlined,
  },
  {
    key: 'basePrompt',
    label: '基础提示',
    group: '提示词管理',
    icon: TranslateOutlined,
  },
  {
    key: 'character',
    label: '角色介绍',
    group: '提示词管理',
    icon: PeopleOutlineOutlined,
  },
  {
    key: 'world',
    label: '背景设定',
    group: '提示词管理',
    icon: PublicOutlined,
  },
  { key: 'style', label: '翻译风格', group: '提示词管理', icon: StyleOutlined },
  {
    key: 'example',
    label: '翻译示例',
    group: '提示词管理',
    icon: MenuBookOutlined,
  },
  {
    key: 'polish',
    label: '润色提示词',
    group: '润色提示词',
    icon: AutoFixHighOutlined,
  },
];

type SectionItem = (typeof sections)[number];

const tabOptions: { label: string; value: ToolboxSection }[] = sections.map(
  ({ key, label }) => ({
    label,
    value: key,
  }),
);

const isSection = (value: unknown): value is ToolboxSection =>
  typeof value === 'string' &&
  sections.some((section) => section.key === value);

const activeSection = computed({
  get: () => {
    const section = route.query.section;
    return isSection(section) ? section : 'glossary';
  },
  set: (section: string | number) => {
    if (isSection(section)) {
      router.replace({ query: { ...route.query, section } });
    }
  },
});

const groupedSections = computed(() => {
  const groups: { group: string; items: SectionItem[] }[] = [];
  for (const section of sections) {
    let group = groups.find((it) => it.group === section.group);
    if (group === undefined) {
      group = { group: section.group, items: [] };
      groups.push(group);
    }
    group.items.push(section);
  }
  return groups;
});

const activeTitle = computed(
  () => sections.find((section) => section.key === activeSection.value)!.label,
);

const updateProfile = (patch: Partial<WorkflowProfile>) => {
  profile.value = { ...profile.value, ...patch };
};

const updateDictionary = (patch: Partial<WorkflowProfile['dictionary']>) => {
  updateProfile({
    dictionary: {
      ...profile.value.dictionary,
      ...patch,
    },
  });
};

const updatePrompts = (patch: Partial<WorkflowProfile['prompts']>) => {
  updateProfile({
    prompts: {
      ...profile.value.prompts,
      ...patch,
    },
  });
};

const updateTranslationPrompts = (
  patch: Partial<WorkflowProfile['prompts']['translation']>,
) => {
  updatePrompts({
    translation: {
      ...profile.value.prompts.translation,
      ...patch,
    },
  });
};

const updatePolishPrompts = (
  patch: Partial<WorkflowProfile['prompts']['polish']>,
) => {
  updatePrompts({
    polish: {
      ...profile.value.prompts.polish,
      ...patch,
    },
  });
};

const addGlossaryTerm = () => {
  updateDictionary({
    glossary: [
      ...profile.value.dictionary.glossary,
      { source: '', target: '', note: '' },
    ],
  });
};

const updateGlossaryTerm = (index: number, patch: Partial<TermEntry>) => {
  updateDictionary({
    glossary: profile.value.dictionary.glossary.map(
      (item: TermEntry, i: number) =>
        i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteGlossaryTerm = (index: number) => {
  updateDictionary({
    glossary: profile.value.dictionary.glossary.filter(
      (_: TermEntry, i: number) => i !== index,
    ),
  });
};

const addForbiddenTerm = () => {
  updateDictionary({
    forbiddenTerms: [
      ...profile.value.dictionary.forbiddenTerms,
      { source: '', note: '' },
    ],
  });
};

const updateForbiddenTerm = (
  index: number,
  patch: Partial<ForbiddenTermEntry>,
) => {
  updateDictionary({
    forbiddenTerms: profile.value.dictionary.forbiddenTerms.map(
      (item: ForbiddenTermEntry, i: number) =>
        i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteForbiddenTerm = (index: number) => {
  updateDictionary({
    forbiddenTerms: profile.value.dictionary.forbiddenTerms.filter(
      (_: ForbiddenTermEntry, i: number) => i !== index,
    ),
  });
};

const addReplacement = () => {
  updateDictionary({
    replacements: [
      ...profile.value.dictionary.replacements,
      { source: '', target: '', stage: 'before' },
    ],
  });
};

const updateReplacement = (
  index: number,
  patch: Partial<TextReplacementEntry>,
) => {
  updateDictionary({
    replacements: profile.value.dictionary.replacements.map(
      (item: TextReplacementEntry, i: number) =>
        i === index ? { ...item, ...patch } : item,
    ),
  });
};

const deleteReplacement = (index: number) => {
  updateDictionary({
    replacements: profile.value.dictionary.replacements.filter(
      (_: TextReplacementEntry, i: number) => i !== index,
    ),
  });
};

const updateReplacementStage = (index: number, value: string | number) => {
  updateReplacement(index, { stage: value === 'after' ? 'after' : 'before' });
};
</script>

<template>
  <div class="layout-content prompt-page">
    <aside class="prompt-sidebar">
      <div class="sidebar-title">提示词管理</div>
      <section v-for="group in groupedSections" :key="group.group">
        <n-text depth="3" class="group-title">{{ group.group }}</n-text>
        <button
          v-for="item in group.items"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeSection === item.key }"
          @click="activeSection = item.key"
        >
          <n-icon :component="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </section>
    </aside>

    <main class="prompt-main">
      <header class="prompt-header">
        <div>
          <n-text depth="3">Prompt / Table / Rule</n-text>
          <h1>{{ activeTitle }}</h1>
        </div>
        <c-radio-group
          v-model:value="activeSection"
          :options="tabOptions"
          size="small"
        />
      </header>

      <section v-if="activeSection === 'glossary'" class="prompt-panel">
        <div class="panel-heading">
          <div>
            <h2>术语表</h2>
            <p>通过原文、译文和备注统一翻译，可作为当前工作流的补充术语。</p>
          </div>
          <c-button label="添加" size="small" @action="addGlossaryTerm" />
        </div>
        <n-empty
          v-if="profile.dictionary.glossary.length === 0"
          description="没有术语"
        />
        <div v-else class="table-list">
          <div
            v-for="(term, index) in profile.dictionary.glossary"
            :key="index"
            class="table-row four"
          >
            <n-input
              :value="term.source"
              size="small"
              placeholder="原文"
              @update:value="updateGlossaryTerm(index, { source: $event })"
            />
            <n-input
              :value="term.target"
              size="small"
              placeholder="译文"
              @update:value="updateGlossaryTerm(index, { target: $event })"
            />
            <n-input
              :value="term.note"
              size="small"
              placeholder="备注"
              @update:value="updateGlossaryTerm(index, { note: $event })"
            />
            <c-icon-button
              tooltip="删除"
              :icon="DeleteOutlineOutlined"
              type="error"
              @action="deleteGlossaryTerm(index)"
            />
          </div>
        </div>
      </section>

      <section v-else-if="activeSection === 'forbidden'" class="prompt-panel">
        <div class="panel-heading">
          <div>
            <h2>禁翻表</h2>
            <p>译文中不允许出现的词会参与响应检查。</p>
          </div>
          <c-button label="添加" size="small" @action="addForbiddenTerm" />
        </div>
        <n-empty
          v-if="profile.dictionary.forbiddenTerms.length === 0"
          description="没有禁翻词"
        />
        <div v-else class="table-list">
          <div
            v-for="(term, index) in profile.dictionary.forbiddenTerms"
            :key="index"
            class="table-row three"
          >
            <n-input
              :value="term.source"
              size="small"
              placeholder="禁止出现的词"
              @update:value="updateForbiddenTerm(index, { source: $event })"
            />
            <n-input
              :value="term.note"
              size="small"
              placeholder="备注"
              @update:value="updateForbiddenTerm(index, { note: $event })"
            />
            <c-icon-button
              tooltip="删除"
              :icon="DeleteOutlineOutlined"
              type="error"
              @action="deleteForbiddenTerm(index)"
            />
          </div>
        </div>
      </section>

      <section v-else-if="activeSection === 'replace'" class="prompt-panel">
        <div class="panel-heading">
          <div>
            <h2>文本替换</h2>
            <p>支持译前清洗和译后替换，适合固定符号、称呼和格式处理。</p>
          </div>
          <c-button label="添加" size="small" @action="addReplacement" />
        </div>
        <n-empty
          v-if="profile.dictionary.replacements.length === 0"
          description="没有替换规则"
        />
        <div v-else class="table-list">
          <div
            v-for="(item, index) in profile.dictionary.replacements"
            :key="index"
            class="table-row four"
          >
            <n-radio-group
              :value="item.stage"
              @update:value="updateReplacementStage(index, $event)"
            >
              <n-radio-button value="before" label="译前" />
              <n-radio-button value="after" label="译后" />
            </n-radio-group>
            <n-input
              :value="item.source"
              size="small"
              placeholder="查找"
              @update:value="updateReplacement(index, { source: $event })"
            />
            <n-input
              :value="item.target"
              size="small"
              placeholder="替换为"
              @update:value="updateReplacement(index, { target: $event })"
            />
            <c-icon-button
              tooltip="删除"
              :icon="DeleteOutlineOutlined"
              type="error"
              @action="deleteReplacement(index)"
            />
          </div>
        </div>
      </section>

      <section v-else class="prompt-panel prompt-editor">
        <template v-if="activeSection === 'basePrompt'">
          <h2>基础提示</h2>
          <n-input
            :value="profile.prompts.translation.system"
            type="textarea"
            :autosize="{ minRows: 12 }"
            placeholder="基础翻译提示词"
            @update:value="updateTranslationPrompts({ system: $event })"
          />
        </template>
        <template v-else-if="activeSection === 'character'">
          <h2>角色介绍</h2>
          <n-input
            :value="profile.prompts.translation.character"
            type="textarea"
            :autosize="{ minRows: 12 }"
            placeholder="角色、人称、称呼等设定"
            @update:value="updateTranslationPrompts({ character: $event })"
          />
        </template>
        <template v-else-if="activeSection === 'world'">
          <h2>背景设定</h2>
          <n-input
            :value="profile.prompts.translation.world"
            type="textarea"
            :autosize="{ minRows: 12 }"
            placeholder="世界观、专有名词背景、作品设定"
            @update:value="updateTranslationPrompts({ world: $event })"
          />
        </template>
        <template v-else-if="activeSection === 'style'">
          <h2>翻译风格</h2>
          <n-input
            :value="profile.prompts.translation.style"
            type="textarea"
            :autosize="{ minRows: 12 }"
            placeholder="语气、文风、保留习惯等要求"
            @update:value="updateTranslationPrompts({ style: $event })"
          />
        </template>
        <template v-else-if="activeSection === 'example'">
          <h2>翻译示例</h2>
          <n-input
            :value="profile.prompts.translation.example"
            type="textarea"
            :autosize="{ minRows: 12 }"
            placeholder="示例：原文 => 译文"
            @update:value="updateTranslationPrompts({ example: $event })"
          />
        </template>
        <template v-else>
          <h2>润色提示词</h2>
          <n-input
            :value="profile.prompts.polish.system"
            type="textarea"
            :autosize="{ minRows: 12 }"
            placeholder="润色时的提示词，当前作为配置保存"
            @update:value="updatePolishPrompts({ system: $event })"
          />
        </template>
      </section>
    </main>
  </div>
</template>

<style scoped>
.prompt-page {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.prompt-sidebar {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}

.sidebar-title {
  font-weight: 700;
}

.group-title {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}

.nav-item {
  display: flex;
  width: 100%;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  color: var(--n-text-color);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 10px;
}

.nav-item.active,
.nav-item:hover {
  background: rgba(125, 125, 125, 0.12);
}

.prompt-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-header {
  display: flex;
  gap: 16px;
  align-items: end;
  justify-content: space-between;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(125, 125, 125, 0.12),
    rgba(125, 125, 125, 0.04)
  );
}

.prompt-header h1,
.prompt-panel h2 {
  margin: 0;
}

.prompt-panel {
  padding: 20px;
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
}

.panel-heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-heading p {
  margin: 6px 0 0;
  color: var(--n-text-color-2);
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-row {
  display: grid;
  gap: 8px;
  align-items: center;
}

.table-row.four {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1fr) auto;
}

.table-row.three {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
}

.prompt-editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (max-width: 860px) {
  .prompt-page {
    grid-template-columns: 1fr;
  }

  .prompt-sidebar {
    display: none;
  }

  .prompt-header {
    align-items: start;
    flex-direction: column;
  }

  .table-row,
  .table-row.four,
  .table-row.three {
    grid-template-columns: 1fr;
  }
}
</style>
