document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('pricingSlider');
  const dots = [...document.querySelectorAll('#pricingDots button')];
  const prev = document.querySelector('.pricing-prev');
  const next = document.querySelector('.pricing-next');
  if (!slider) return;

  const cards = [...slider.querySelectorAll('.price')];

  const goTo = (index) => {
    index = Math.max(0, Math.min(index, cards.length - 1));
    cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  };

  const currentIndex = () => {
    const center = slider.getBoundingClientRect().left + slider.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs((r.left + r.right) / 2 - center);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  prev?.addEventListener('click', () => goTo(currentIndex() - 1));
  next?.addEventListener('click', () => goTo(currentIndex() + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // Mouse drag / touch swipe. Links and buttons remain normally clickable.
  let pointerActive = false;
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;
  let suppressClick = false;
  let activePointerId = null;
  const DRAG_THRESHOLD = 8;

  slider.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // A press that starts on a CTA is a click, not a slider drag.
    if (e.target.closest('a, button, input, select, textarea, label')) {
      pointerActive = false;
      isDragging = false;
      suppressClick = false;
      return;
    }

    pointerActive = true;
    isDragging = false;
    suppressClick = false;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
  });

  slider.addEventListener('pointermove', (e) => {
    if (!pointerActive || e.pointerId !== activePointerId) return;
    const dx = e.clientX - startX;

    // Do not hijack an ordinary tap/click. Dragging starts only after
    // a deliberate horizontal movement.
    if (!isDragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      isDragging = true;
      suppressClick = true;
      slider.classList.add('is-dragging');
      slider.setPointerCapture?.(e.pointerId);
    }

    slider.scrollLeft = startScroll - dx;
  });

  const finishDrag = (e) => {
    if (!pointerActive && !isDragging) return;
    const didDrag = isDragging;
    pointerActive = false;
    isDragging = false;
    activePointerId = null;
    slider.classList.remove('is-dragging');

    if (didDrag) goTo(currentIndex());
  };

  slider.addEventListener('pointerup', finishDrag);
  slider.addEventListener('pointercancel', finishDrag);
  slider.addEventListener('pointerleave', (e) => {
    if (isDragging && e.pointerType === 'mouse') finishDrag(e);
  });

  // Suppress only the synthetic click produced immediately after a real drag.
  slider.addEventListener('click', (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClick = false;
  }, true);

  slider.addEventListener('scroll', () => {
    const center = slider.getBoundingClientRect().left + slider.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs((r.left + r.right) / 2 - center);
      if (d < dist) { dist = d; best = i; }
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === best));
  }, { passive: true });
});