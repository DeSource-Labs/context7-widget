<template>
  <div class="hero-widget-dialog" :class="`hero-widget-dialog--${tone}`">
    <div class="hero-widget-dialog__header">
      <strong>{{ title }}</strong>
      <button aria-label="Close preview" tabindex="-1" type="button">
        <span />
        <span />
      </button>
    </div>

    <div class="hero-widget-dialog__body">
      <div
        v-for="message in messages"
        :key="message.text"
        class="hero-widget-dialog__message"
        :class="`hero-widget-dialog__message--${message.kind}`"
      >
        {{ message.text }}
      </div>
    </div>

    <div class="hero-widget-dialog__composer">
      <span>{{ placeholder }}</span>
      <strong>Send</strong>
    </div>

    <div class="hero-widget-dialog__powered">
      <span>Powered by</span>
      <strong>7</strong>
      <span>Context7</span>
    </div>
  </div>
</template>

<script setup lang="ts">
type HeroWidgetDialogTone = 'amber' | 'blue' | 'mint';

type HeroWidgetDialogMessage = {
  kind: 'assistant' | 'user';
  text: string;
};

withDefaults(
  defineProps<{
    messages?: HeroWidgetDialogMessage[];
    placeholder?: string;
    title?: string;
    tone?: HeroWidgetDialogTone;
  }>(),
  {
    messages: () => [
      { kind: 'assistant', text: 'Add Context7 answers without sending users away from your product.' },
      { kind: 'user', text: 'Can it match our interface?' },
      {
        kind: 'assistant',
        text: 'Use presets, CSS variables, custom triggers, and events while Context7 handles the docs.'
      }
    ],
    placeholder: 'Ask about the docs...',
    title: 'Context7 Widget Docs',
    tone: 'mint'
  }
);
</script>
