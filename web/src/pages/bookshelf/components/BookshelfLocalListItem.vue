<script lang="ts" setup>
import { GenericNovelId } from '@/model/Common';
import type { LocalVolumeMetadata } from '@/model/LocalVolume';

const props = defineProps<{
  volume: LocalVolumeMetadata;
}>();

const gpt = computed(() => props.volume.toc.filter((it) => it.gpt).length);
const sakura = computed(
  () => props.volume.toc.filter((it) => it.sakura).length,
);
</script>

<template>
  <n-flex :size="4" vertical>
    <c-a
      v-if="!volume.id.endsWith('.epub')"
      :to="`/workspace/reader/${encodeURIComponent(volume.id)}/0`"
    >
      {{ volume.id }}
    </c-a>
    <n-text v-else>{{ volume.id }}</n-text>

    <n-text depth="3">
      总计 {{ volume.toc.length }} / LLM {{ gpt }} / Sakura {{ sakura }}
    </n-text>

    <n-flex :size="8">
      <glossary-button
        :gnid="GenericNovelId.local(volume.id)"
        :value="volume.glossary"
        size="tiny"
        secondary
      />
    </n-flex>
  </n-flex>
</template>
