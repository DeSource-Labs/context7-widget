<template>
  <div class="code-block">
    <div v-if="header" class="code-block__bar">
      <span>{{ label }}</span>
      <button class="icon-button" type="button" :aria-label="copyLabel" @click="copy(code, id)">
        <Check v-if="copiedKey === id" :size="16" aria-hidden="true" />
        <Copy v-else :size="16" aria-hidden="true" />
      </button>
    </div>
    <button
      v-if="!header"
      class="icon-button icon-button--fixed"
      type="button"
      :aria-label="copyLabel"
      @click="copy(code, id)"
    >
      <Check v-if="copiedKey === id" :size="16" aria-hidden="true" />
      <Copy v-else :size="16" aria-hidden="true" />
    </button>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { Check, Copy } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    code: string;
    id: string;
    label: string;
    header?: boolean;
  }>(),
  {
    header: true
  }
);

const { copiedKey, copy } = useCopy();
const copyLabel = computed(() => (copiedKey.value === props.id ? 'Copied' : `Copy ${props.label}`));
</script>
