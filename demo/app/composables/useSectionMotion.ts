const cardSelector = [
  '.audience-card',
  '.path-card',
  '.use-case',
  '.example-card',
  '.preset-card',
  '.customization-playbook article',
  '.token-card',
  '.parts-grid article'
].join(',');

export function useSectionMotion() {
  const nuxt = useNuxtApp();
  let cleanup: (() => void) | undefined;

  onMounted(() => {
    if (!('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach(({ target }, index) => {
            observer.unobserve(target);
            if (preference.matches || seen.has(target)) return;
            seen.add(target);
            // Content stays fully opaque even before hydration or if motion is interrupted.
            const animation = target.animate([{ translate: '0 48px' }, { translate: '0 0' }], {
              duration: 360,
              delay: Math.min(index, 3) * 35,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
            });
            animations.add(animation);
            animation.finished.then(
              () => animations.delete(animation),
              () => animations.delete(animation)
            );
          });
      },
      { threshold: 0.08 }
    );

    const refresh = () => {
      observer.disconnect();
      for (const animation of animations) animation.cancel();
      animations.clear();
      if (preference.matches) return;
      document.querySelectorAll(cardSelector).forEach((card) => {
        if (!seen.has(card)) observer.observe(card);
      });
    };
    const removeHook = nuxt.hook('page:finish', refresh);
    preference.addEventListener('change', refresh);
    refresh();
    cleanup = () => {
      removeHook();
      preference.removeEventListener('change', refresh);
      observer.disconnect();
      for (const animation of animations) animation.cancel();
    };
  });

  onBeforeUnmount(() => cleanup?.());
}
