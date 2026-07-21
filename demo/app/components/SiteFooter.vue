<template>
  <footer class="site-footer">
    <div class="site-footer__top">
      <div class="site-footer__brand">
        <a class="brand" href="/" aria-label="Context7 Widget home">
          <span>7</span>
          Context7 Widget
        </a>
        <p>Context7 answers with a widget surface your product team can actually design.</p>
        <a class="site-footer__primary" href="/examples">Try it now</a>
      </div>

      <div class="site-footer__group" aria-label="Project links">
        <strong>Product</strong>
        <a href="/examples">Live examples</a>
        <a href="/customization">Customization guide</a>
        <a class="external" href="/widget.js" target="_blank" rel="noopener noreferrer">Hosted widget.js</a>
      </div>

      <div class="site-footer__group" aria-label="Project links">
        <strong>Project</strong>
        <a
          class="external"
          href="https://github.com/DeSource-Labs/context7-widget"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          class="external"
          href="https://github.com/DeSource-Labs/browser-ai/blob/main/SECURITY.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Security
        </a>
        <a class="external" href="https://desource-labs.org" target="_blank" rel="noopener noreferrer">
          DeSource Labs
        </a>
      </div>
    </div>

    <div class="site-footer__bottom">
      <span>© {{ year }} DeSource Labs. MIT licensed.</span>
      <div v-once class="site-footer__socials">
        <Social
          v-for="social in socials"
          :key="social.type"
          size="1.1rem"
          :aria-label="`Visit DeSource Labs ${social.type}`"
          :type="social.type"
          :href="social.href"
        />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const socials = socialMediaArray;
const year = new Date().getFullYear();
</script>
