<template>
  <div class="code-block">
    <div class="code-block__bar">
      <span>{{ label }}</span>
      <button class="icon-button" type="button" :aria-label="copyLabel" @click="copy(code, id)">
        <Check v-if="copiedKey === id" :size="16" aria-hidden="true" />
        <Copy v-else :size="16" aria-hidden="true" />
      </button>
    </div>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next';

const props = defineProps<{
  code: string;
  id: string;
  label: string;
}>();

const { copiedKey, copy } = useCopy();
const copyLabel = computed(() => (copiedKey.value === props.id ? 'Copied' : `Copy ${props.label}`));
</script>
