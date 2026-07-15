<template>
  <div ref="scene" class="hero-scene" aria-hidden="true">
    <div class="hero-scene__aurora" />
    <div class="hero-scene__mesh" />
    <div class="hero-scene__scanner" />
    <div class="hero-scene__rail hero-scene__rail--left">
      <span v-for="item in leftSignals" :key="item">{{ item }}</span>
    </div>
    <div class="hero-scene__rail hero-scene__rail--right">
      <span v-for="item in rightSignals" :key="item">{{ item }}</span>
    </div>
    <div class="hero-scene__stack">
      <div class="browser-frame browser-frame--script">
        <div class="browser-frame__top">
          <span />
          <span />
          <span />
        </div>
        <pre><code>&lt;script src="/widget.js"
  data-library="/vercel/next.js"
  data-color="#7cffb2"&gt;
&lt;/script&gt;</code></pre>
      </div>
      <div class="browser-frame browser-frame--chat">
        <div class="chat-line chat-line--assistant">Theme inherits from your app.</div>
        <div class="chat-line chat-line--user">Can I use a custom trigger?</div>
        <div class="chat-line chat-line--assistant">Yes. Keep the widget, replace the button.</div>
      </div>
      <div class="browser-frame browser-frame--events">
        <span>c7:question</span>
        <span>c7:first-token</span>
        <span>c7:answer-complete</span>
      </div>
      <div class="browser-frame browser-frame--token">
        <strong>MIT</strong>
        <span>upstream watched daily</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const scene = ref<HTMLElement | null>(null);

const leftSignals = ["script", "core", "vue", "scss", "events", "shadow-parts"];
const rightSignals = ["widget.js", "npm", "nuxt", "analytics", "themes", "vercel"];

const handlePointerMove = (event: PointerEvent) => {
  const element = scene.value;
  if (!element) return;

  const rect = element.getBoundingClientRect();
  element.style.setProperty("--pointer-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
  element.style.setProperty("--pointer-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
};

onMounted(() => {
  scene.value?.addEventListener("pointermove", handlePointerMove);
});

onBeforeUnmount(() => {
  scene.value?.removeEventListener("pointermove", handlePointerMove);
});
</script>
