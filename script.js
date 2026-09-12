document.addEventListener('DOMContentLoaded', () => {
  // Stable home navigation for both GitHub Pages and the custom domain.
  // On GitHub Pages the site lives under /kotomatika-site/,
  // while on kotomatika.ru it lives at /.
  const getSiteRoot = () => {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname;

    if (host.endsWith('github.io')) {
      const repoPrefix = '/kotomatika-site/';
      if (path === '/kotomatika-site' || path.startsWith(repoPrefix)) {
        return repoPrefix;
      }
    }

    return '/';
  };

  const siteRoot = getSiteRoot();

  // Logo and every visible "Главная" link always return to the actual site root.
  document.querySelectorAll('a').forEach((link) => {
    const label = (link.textContent || '').trim();
    if (link.classList.contains('brand') || label === 'Главная') {
      link.setAttribute('href', siteRoot);
    }
  });

  // FAQ
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;
      item.classList.toggle('open');
      const icon = btn.querySelector('span');
      if (icon) icon.textContent = item.classList.contains('open') ? '−' : '+';
    });
  });

  // Mobile menu
  const menuBtn = document.querySelector('.menu');
  const nav = document.querySelector('.nav');

  if (menuBtn && nav) {
    const openMenu = () => {
      nav.classList.add('is-open');
      document.body.classList.add('mobile-menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Закрыть меню');
      menuBtn.textContent = '×';
    };

    const closeMenu = () => {
      nav.classList.remove('is-open');
      document.body.classList.remove('mobile-menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Открыть меню');
      menuBtn.textContent = '☰';
    };

    menuBtn.setAttribute('aria-expanded', 'false');

    menuBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    // A tap on any menu item must work normally and close the overlay.
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  // Contact rules:
  // - Russian phone may start with +7, 7 or 8; separators are allowed.
  // - It is always normalized to +7XXXXXXXXXX before sending.
  // - Telegram username must start with @.
  const normalizeLeadContact = (rawValue) => {
    const raw = String(rawValue || '').trim();

    if (raw.startsWith('@')) {
      if (!/^@[A-Za-z0-9_]{5,32}$/.test(raw)) {
        return {
          ok: false,
          error: 'Введите Telegram в формате @username (латинские буквы, цифры или _).'
        };
      }
      return {ok: true, value: raw};
    }

    const digits = raw.replace(/\D/g, '');

    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      return {ok: true, value: '+7' + digits.slice(1)};
    }

    return {
      ok: false,
      error: 'Введите российский номер, начинающийся с +7 или 8, либо Telegram в формате @username.'
    };
  };

  const validatePersonName = (value, label) => {
    const name = String(value || '').trim();

    if (!name) {
      return {ok: false, error: `Заполните поле «${label}».`};
    }

    // Letters only, but allow spaces and hyphens between name parts.
    // Supports Russian and Latin letters, including Ё/ё.
    if (!/^[A-Za-zА-Яа-яЁё]+(?:[ -][A-Za-zА-Яа-яЁё]+)*$/.test(name)) {
      return {
        ok: false,
        error: `В поле «${label}» можно использовать только буквы, пробелы и дефис.`
      };
    }

    return {ok: true, value: name};
  };

  // Booking form: website -> Yandex Cloud Function -> YDB.
  document.querySelectorAll('form[data-booking]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const notice = form.querySelector('.notice');
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);

      const parentNameResult = validatePersonName(formData.get('name'), 'Имя родителя');
      const studentNameResult = validatePersonName(formData.get('student'), 'Имя ученика');
      const contactResult = normalizeLeadContact(formData.get('contact'));

      if (!parentNameResult.ok || !studentNameResult.ok) {
        const firstError = !parentNameResult.ok ? parentNameResult.error : studentNameResult.error;
        if (notice) {
          notice.style.display = 'block';
          notice.classList.add('notice-error');
          notice.textContent = firstError;
        }
        return;
      }

      if (!contactResult.ok) {
        if (notice) {
          notice.style.display = 'block';
          notice.classList.add('notice-error');
          notice.textContent = contactResult.error;
        }
        return;
      }

      const payload = {
        name: parentNameResult.value,
        student: studentNameResult.value,
        class: String(formData.get('class') || '').trim(),
        goal: String(formData.get('goal') || '').trim(),
        contact: contactResult.value,
        comment: String(formData.get('comment') || '').trim(),
        source: window.location.href
      };

      const apiUrl = String(window.KOTOMATIKA_API_URL || '').trim();

      if (!apiUrl) {
        if (notice) {
          notice.style.display = 'block';
          notice.classList.add('notice-error');
          notice.textContent = 'Не удалось отправить заявку. Напишите администратору: @kotomathadmin.';
        }
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Отправляем…';
      }

      if (notice) {
        notice.style.display = 'block';
        notice.classList.remove('notice-error');
        notice.textContent = 'Отправляем заявку…';
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        if (notice) {
          notice.style.display = 'block';
          notice.classList.remove('notice-error');
          notice.textContent = 'Готово! Заявка отправлена. Мы свяжемся с вами по указанному контакту.';
        }

        form.reset();
      } catch (error) {
        console.error('Booking submit error:', error);
        if (notice) {
          notice.style.display = 'block';
          notice.classList.add('notice-error');
          notice.innerHTML = 'Не удалось отправить заявку автоматически. Напишите администратору в Telegram: <a href="https://t.me/kotomathadmin" target="_blank" rel="noopener">@kotomathadmin</a>.';
        }
      } finally {
        clearTimeout(timer);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText || 'Записаться на бесплатный урок';
        }
      }
    });
  });

  // Class sliders: arrows + mouse drag + touch swipe + wheel.
  // Important: a simple click on a class must navigate normally.
  document.querySelectorAll('.class-slider-wrap').forEach((wrap) => {
    const slider = wrap.querySelector('.class-slider');
    const track = wrap.querySelector('.class-slider-track');
    const prev = wrap.querySelector('.class-prev');
    const next = wrap.querySelector('.class-next');
    if (!slider || !track) return;

    const getStep = () => {
      const card = track.querySelector('a');
      if (!card) return 240;
      const gap = parseFloat(getComputedStyle(track).gap) || 10;
      return card.getBoundingClientRect().width + gap;
    };

    const updateButtons = () => {
      const max = Math.max(0, slider.scrollWidth - slider.clientWidth);
      if (prev) prev.disabled = slider.scrollLeft <= 2;
      if (next) next.disabled = slider.scrollLeft >= max - 2;
    };

    prev?.addEventListener('click', () => {
      slider.scrollBy({left: -getStep(), behavior: 'smooth'});
    });
    next?.addEventListener('click', () => {
      slider.scrollBy({left: getStep(), behavior: 'smooth'});
    });

    slider.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
      }
    }, {passive:false});

    let pressed = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let pointerId = null;

    slider.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pressed = true;
      dragging = false;
      startX = e.clientX;
      startScroll = slider.scrollLeft;
      pointerId = e.pointerId;
    });

    slider.addEventListener('pointermove', (e) => {
      if (!pressed || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) < 7) return;
      dragging = true;
      slider.classList.add('is-dragging');
      slider.scrollLeft = startScroll - dx;
    });

    const finishPointer = () => {
      if (!pressed) return;
      pressed = false;
      slider.classList.remove('is-dragging');
      pointerId = null;
      // Keep the flag for the immediately following click event.
      setTimeout(() => { dragging = false; }, 0);
      updateButtons();
    };

    slider.addEventListener('pointerup', finishPointer);
    slider.addEventListener('pointercancel', finishPointer);

    // A click is the primary navigation mechanism. It is blocked only when
    // the user actually dragged the slider, preventing accidental navigation.
    track.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (dragging) {
          e.preventDefault();
          e.stopPropagation();
          dragging = false;
        }
      });
    });

    slider.addEventListener('scroll', updateButtons, {passive:true});
    window.addEventListener('resize', updateButtons);
    updateButtons();
  });
});
