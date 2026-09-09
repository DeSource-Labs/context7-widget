<template>
  <footer class="site-footer">
    <div class="site-footer__top">
      <div class="site-footer__brand">
        <a class="brand" href="/" aria-label="Context7 Widget home">
          <img src="/logo/android-chrome-192x192.png" alt="" width="32" height="32" />
          Context7 Widget
        </a>
        <p>AI docs chat that belongs on your site</p>
        <a class="site-footer__primary" href="/examples">Try the upgrade</a>
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
          href="https://github.com/DeSource-Labs/context7-widget/blob/main/SECURITY.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Security
        </a>
        <a class="external" href="https://desourcelabs.com" target="_blank" rel="noopener noreferrer">
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
