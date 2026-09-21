window.KOTOMATIKA_PARENT_CONFIRM_VERSION = '2.2';
document.addEventListener('DOMContentLoaded', () => {
  const METRIKA_ID = 112505956;
  const trackMetrikaGoal = (goal, params = {}) => {
    try {
      if (typeof window.ym === 'function') {
        window.ym(METRIKA_ID, 'reachGoal', goal, params);
      }
    } catch (error) {
      console.warn('Metrika goal failed:', goal, error);
    }
  };

  // Explicit funnel events for advertising traffic.
  document.querySelectorAll('[data-metrika-goal]').forEach((element) => {
    element.addEventListener('click', () => {
      trackMetrikaGoal(element.dataset.metrikaGoal, {
        path: window.location.pathname,
        href: element.getAttribute('href') || ''
      });
    });
  });

  // Cards and CTA buttons can preselect a goal in the nearest conversion form.
  document.querySelectorAll('[data-goal-value]').forEach((element) => {
    element.addEventListener('click', () => {
      const wanted = String(element.dataset.goalValue || '');
      const localForm = document.querySelector('form[data-booking]');
      const goalSelect = localForm?.querySelector('select[name="goal"]');
      if (!goalSelect) return;
      const option = [...goalSelect.options].find((item) => item.value === wanted || item.textContent.trim() === wanted);
      if (option) goalSelect.value = option.value || option.textContent.trim();
    });
  });

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

  // Parent confirmation before sending a lead.
  // The website accepts applications from a parent or legal representative,
  // not directly from a child. The modal is injected once and reused by all forms.
  const confirmParentSubmission = () => new Promise((resolve) => {
    let modal = document.querySelector('[data-parent-confirm-modal]');

    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'parent-confirm-modal';
      modal.setAttribute('data-parent-confirm-modal', '');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="parent-confirm-backdrop" data-parent-confirm-cancel></div>
        <div class="parent-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="parent-confirm-title" aria-describedby="parent-confirm-text">
          <button class="parent-confirm-close" type="button" aria-label="Закрыть" data-parent-confirm-cancel>×</button>
          <div class="parent-confirm-icon" aria-hidden="true">👨‍👩‍👧</div>
          <div class="eyebrow">Перед отправкой заявки</div>
          <h3 id="parent-confirm-title">Заявку должен отправить взрослый</h3>
          <p id="parent-confirm-text">Для записи на обучение заявку должен подтвердить родитель или законный представитель ребёнка.</p>
          <div class="parent-confirm-actions">
            <button class="btn primary" type="button" data-parent-confirm-ok>Я родитель / представитель</button>
            <button class="btn ghost" type="button" data-parent-confirm-cancel>Назад</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }

    const okButton = modal.querySelector('[data-parent-confirm-ok]');
    const cancelButtons = modal.querySelectorAll('[data-parent-confirm-cancel]');
    const previouslyFocused = document.activeElement;

    const finish = (answer) => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('parent-confirm-open');
      document.removeEventListener('keydown', onKeydown);
      okButton?.removeEventListener('click', onConfirm);
      cancelButtons.forEach((button) => button.removeEventListener('click', onCancel));
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
      resolve(answer);
    };

    const onConfirm = () => finish(true);
    const onCancel = () => finish(false);
    const onKeydown = (event) => {
      if (event.key === 'Escape') finish(false);
    };

    okButton?.addEventListener('click', onConfirm);
    cancelButtons.forEach((button) => button.addEventListener('click', onCancel));
    document.addEventListener('keydown', onKeydown);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('parent-confirm-open');
    setTimeout(() => okButton?.focus(), 0);
  });

  // Booking form: website -> Yandex Cloud Function -> YDB.
  document.querySelectorAll('form[data-booking]').forEach((form) => {
    let formStarted = false;
    const funnelPrefix = String(form.dataset.metrikaPrefix || '').trim();
    const funnelGoal = (stage) => {
      if (form.hasAttribute('data-home-booking')) return `home_form_${stage}`;
      if (funnelPrefix) return `${funnelPrefix}_form_${stage}`;
      return `booking_form_${stage}`;
    };
    const markFormStart = () => {
      if (formStarted) return;
      formStarted = true;
      trackMetrikaGoal(funnelGoal('start'), {path: window.location.pathname});
      if (funnelPrefix) trackMetrikaGoal('landing_form_start', {path: window.location.pathname, landing: funnelPrefix});
    };
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      field.addEventListener('input', markFormStart, {once:true});
      field.addEventListener('change', markFormStart, {once:true});
    });

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

      trackMetrikaGoal('parent_confirmation_shown', {path: window.location.pathname});
      const parentConfirmed = await confirmParentSubmission();
      if (!parentConfirmed) {
        trackMetrikaGoal('parent_confirmation_cancelled', {path: window.location.pathname});
        return;
      }
      trackMetrikaGoal('parent_confirmation_confirmed', {path: window.location.pathname});

      trackMetrikaGoal(funnelGoal('submit'), {
        path: window.location.pathname,
        class: String(formData.get('class') || ''),
        goal: String(formData.get('goal') || '')
      });

      if (funnelPrefix) trackMetrikaGoal('landing_form_submit', {path: window.location.pathname, landing: funnelPrefix});

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
          notice.textContent = 'Не удалось отправить заявку. Напишите нам в Telegram: @kotomatica100.';
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

        trackMetrikaGoal(funnelGoal('success'), {
          path: window.location.pathname,
          class: payload.class,
          goal: payload.goal
        });

        if (funnelPrefix) trackMetrikaGoal('landing_form_success', {path: window.location.pathname, landing: funnelPrefix});

        form.reset();
      } catch (error) {
        console.error('Booking submit error:', error);
        trackMetrikaGoal(funnelGoal('error'), {path: window.location.pathname});
        if (funnelPrefix) trackMetrikaGoal('landing_form_error', {path: window.location.pathname, landing: funnelPrefix});
        if (notice) {
          notice.style.display = 'block';
          notice.classList.add('notice-error');
          notice.innerHTML = 'Не удалось отправить заявку автоматически. Напишите администратору в Telegram: <a href="https://t.me/kotomatica100" target="_blank" rel="noopener">@kotomatica100</a>.';
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
