document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('reviewsSlider');
  const dotsBox = document.getElementById('reviewsDots');
  const prev = document.querySelector('.reviews-prev');
  const next = document.querySelector('.reviews-next');
  if (!slider) return;

  const cards = [...slider.querySelectorAll('.review-card')];
  if (!cards.length) return;

  const dots = cards.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsBox?.appendChild(dot);
    return dot;
  });

  function currentIndex() {
    const center = slider.getBoundingClientRect().left + slider.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const d = Math.abs((r.left + r.right) / 2 - center);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  function goTo(index) {
    index = Math.max(0, Math.min(index, cards.length - 1));
    cards[index].scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  prev?.addEventListener('click', () => goTo(currentIndex() - 1));
  next?.addEventListener('click', () => goTo(currentIndex() + 1));

  let dragging = false, startX = 0, startScroll = 0, moved = false;

  slider.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
    slider.classList.add('is-dragging');
    slider.setPointerCapture?.(e.pointerId);
  });

  slider.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    slider.scrollLeft = startScroll - dx;
  });

  function finish(e) {
    if (!dragging) return;
    dragging = false;
    slider.classList.remove('is-dragging');
    if (moved) goTo(currentIndex());
  }

  slider.addEventListener('pointerup', finish);
  slider.addEventListener('pointercancel', finish);
  slider.addEventListener('pointerleave', e => {
    if (dragging && e.pointerType === 'mouse') finish(e);
  });

  slider.addEventListener('click', e => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  }, true);

  slider.addEventListener('scroll', () => {
    const i = currentIndex();
    dots.forEach((d, n) => d.classList.toggle('active', n === i));
  }, {passive:true});

  dots[0]?.classList.add('active');
});
