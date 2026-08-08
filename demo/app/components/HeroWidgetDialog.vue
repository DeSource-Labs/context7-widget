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
        <path
          d="M10.5724 15.2565C10.5724 17.5025 9.6613 19.3778 8.17805 21.1047H11.6319L11.6319 22.7786H6.33459V21.1895C7.95557 19.3566 8.58065 17.8628 8.58065 15.2565L10.5724 15.2565Z"
          fill="var(--c7-footer-background, #000000)"
        ></path>
        <path
          d="M17.4276 15.2565C17.4276 17.5025 18.3387 19.3778 19.822 21.1047H16.3681V22.7786H21.6654V21.1895C20.0444 19.3566 19.4194 17.8628 19.4194 15.2565H17.4276Z"
          fill="var(--c7-footer-background, #000000)"
        ></path>
        <path
          d="M10.5724 12.7435C10.5724 10.4975 9.66131 8.62224 8.17807 6.89532L11.6319 6.89532V5.22137L6.33461 5.22137V6.81056C7.95558 8.64343 8.58066 10.1373 8.58066 12.7435L10.5724 12.7435Z"
          fill="var(--c7-footer-background, #000000)"
        ></path>
        <path
          d="M17.4276 12.7435C17.4276 10.4975 18.3387 8.62224 19.822 6.89532L16.3681 6.89532L16.3681 5.22138L21.6654 5.22138V6.81056C20.0445 8.64343 19.4194 10.1373 19.4194 12.7435H17.4276Z"
          fill="var(--c7-footer-background, #000000)"
        ></path>
      </svg>
      <span aria-hidden="true">·</span>
      <span>Enhanced by</span>
      <img :src="deSourceLabsLogoUrl" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { context7LogoUrl, deSourceLabsLogoUrl } from '@desource/context7-widget/kit';

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
