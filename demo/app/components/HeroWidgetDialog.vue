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
      <svg
        class="c7-brand-logo c7-brand-logo--context7"
        aria-hidden="true"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="28" height="28" rx="4" fill="currentColor"></rect>
        <path :d="context7LogoPath" fill="var(--c7-footer-background, #000000)" />
      </svg>
      <span aria-hidden="true">·</span>
      <span>Enhanced by</span>
      <img :src="deSourceLabsLogoUrl" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { context7LogoPath, deSourceLabsLogoUrl } from '@desource/context7-widget/kit';

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
      { kind: 'assistant', text: 'Let visitors ask about your product, with answers from your docs.' },
      { kind: 'user', text: 'Can it use our fonts and help button?' },
      {
        kind: 'assistant',
        text: 'Yes. Match your type, colors, and spacing, then open chat from your own button.'
      }
    ],
    placeholder: 'Ask about the docs...',
    title: 'Context7 Widget Docs',
    tone: 'mint'
  }
);
</script>
