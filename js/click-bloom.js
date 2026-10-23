/* A small, dependency-free winter bloom. Loaded once, including with PJAX. */
(() => {
  'use strict';

  const layerId = 'click-bloom-layer';
  if (document.getElementById(layerId)) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.id = layerId;
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const active = new Map();
  const maxBlooms = 6;
  const lifetime = 1100;
  let lastClick = -Infinity;
  let variation = 0;

  const removeBloom = bloom => {
    clearTimeout(active.get(bloom));
    active.delete(bloom);
    bloom.remove();
  };

  const clear = () => {
    active.forEach((timer, bloom) => removeBloom(bloom));
  };

  const element = className => {
    const node = document.createElement('span');
    node.className = className;
    return node;
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.detail === 0 || reducedMotion.matches) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('input, textarea, select, button, label, [contenteditable]:not([contenteditable="false"]), [role="button"], audio, video')) return;
    if (window.getSelection()?.isCollapsed === false) return;

    const now = performance.now();
    if (now - lastClick < 100) return;
    lastClick = now;

    if (active.size >= maxBlooms) removeBloom(active.keys().next().value);

    const touch = event.pointerType === 'touch';
    const bloom = element('click-bloom');
    bloom.style.left = `${event.clientX}px`;
    bloom.style.top = `${event.clientY}px`;
    bloom.style.setProperty('--bloom-turn', `${(variation++ % 3 - 1) * 18}deg`);
    if (touch) bloom.classList.add('click-bloom--touch');
    if (event.target.closest('#page-header, #footer')) bloom.classList.add('click-bloom--on-cover');

    bloom.append(
      element('click-bloom__halo'),
      element('click-bloom__ring'),
      element('click-bloom__ring click-bloom__ring--echo')
    );

    const count = touch ? 5 : 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (variation % 3) * 0.3;
      const distance = (touch ? 24 : 34) + (i % 3) * 9;
      const spark = element(`click-bloom__spark${i % 2 ? ' click-bloom__spark--dust' : ''}`);
      spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance - 10}px`);
      spark.style.setProperty('--spark-delay', `${i * 16}ms`);
      spark.style.setProperty('--spark-size', `${i % 2 ? 3 : 10 + (i % 3) * 2}px`);
      bloom.appendChild(spark);
    }

    layer.appendChild(bloom);
    active.set(bloom, setTimeout(() => removeBloom(bloom), lifetime));
  }, { passive: true });

  document.addEventListener('pjax:send', clear);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
  });
  reducedMotion.addEventListener('change', clear);
})();
