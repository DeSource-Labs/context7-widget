<template>
  <div class="hero-scene">
    <GridScan
      class="hero-scene__background"
      lines-color="#265746"
      scan-color="#7cffb2"
      line-style="solid"
      scan-direction="pingpong"
      :bloom-intensity="0.34"
      :bloom-smoothing="0.32"
      :bloom-threshold="0.04"
      :chromatic-aberration="0.0018"
      :grid-scale="0.085"
      :line-jitter="0.05"
      :line-thickness="1.25"
      :noise-intensity="0.012"
      :scan-delay="0.9"
      :scan-duration="2.8"
      :scan-glow="0.92"
      :scan-on-click="true"
      :scan-opacity="0.76"
      :scan-phase-taper="0.32"
      :scan-softness="1.45"
      :sensitivity="0.48"
    />
    <div class="hero-scene__shade" />
    <div class="hero-scene__stack">
      <div class="browser-frame browser-frame--chat">
        <HeroWidgetDialog tone="mint" />
      </div>
    </div>
  </div>
</template>
