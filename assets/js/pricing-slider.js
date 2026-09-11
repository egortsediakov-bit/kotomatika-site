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

  // Mouse drag / touch swipe.
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  slider.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
    slider.classList.add('is-dragging');
    slider.setPointerCapture?.(e.pointerId);
  });

  slider.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    slider.scrollLeft = startScroll - dx;
  });

  const finishDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove('is-dragging');

    // Snap to the nearest card after dragging.
    if (moved) goTo(currentIndex());
  };

  slider.addEventListener('pointerup', finishDrag);
  slider.addEventListener('pointercancel', finishDrag);
  slider.addEventListener('pointerleave', (e) => {
    if (isDragging && e.pointerType === 'mouse') finishDrag(e);
  });

  // Prevent accidental link clicks after a drag.
  slider.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
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