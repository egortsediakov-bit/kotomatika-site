window.KOTOMATIKA_PARENT_CONFIRM_VERSION = '2.2';
const KM_SCRIPT_BASE = (document.currentScript && document.currentScript.src) ? new URL('./', document.currentScript.src).href : '/';
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
      if (option) {
        goalSelect.value = option.value || option.textContent.trim();
        goalSelect.dispatchEvent(new Event('change', {bubbles: true}));
      }
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
  // - Russian phone: +7, 7 or 8 + 10 digits, or just 10 digits starting with 9;
  //   it is always normalized to +7XXXXXXXXXX before sending.
  // - Phone of another country: starts with +, 8–15 digits; saved as +XXXXXXXX.
  // - Telegram: @username (5–32 latin letters, digits or _) or a t.me/username link.
  const normalizeLeadContact = (rawValue) => {
    const raw = String(rawValue || '').trim();

    const link = raw.match(/^(?:https?:\/\/)?(?:t|telegram)\.me\/@?([A-Za-z0-9_]{5,32})\/?$/i);
    if (link) return {ok: true, value: '@' + link[1]};

    if (raw.startsWith('@')) {
      if (!/^@[A-Za-z0-9_]{5,32}$/.test(raw)) {
        return {
          ok: false,
          error: 'Telegram указывается как @username: от 5 символов, латинские буквы, цифры или _.'
        };
      }
      return {ok: true, value: raw};
    }

    const digits = raw.replace(/\D/g, '');

    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      return {ok: true, value: '+7' + digits.slice(1)};
    }

    if (digits.length === 10 && digits.startsWith('9') && !raw.startsWith('+')) {
      return {ok: true, value: '+7' + digits};
    }

    if (raw.startsWith('+') && digits.length >= 8 && digits.length <= 15) {
      return {ok: true, value: '+' + digits};
    }

    return {
      ok: false,
      error: 'Проверьте контакт: телефон (+7 999 123-45-67 или с кодом другой страны) либо Telegram @username.'
    };
  };

  // Names: letters of any alphabet, spaces, hyphens, apostrophes and dots;
  // at least two letters. Extra spaces are collapsed.
  const validatePersonName = (value, label) => {
    const name = String(value || '').trim().replace(/\s+/g, ' ');

    if (!name) {
      return {ok: false, error: `Заполните поле «${label}».`};
    }

    const lettersCount = (name.match(/\p{L}/gu) || []).length;
    if (!/^\p{L}[\p{L}\p{M}'’. -]*$/u.test(name) || lettersCount < 2) {
      return {
        ok: false,
        error: `В поле «${label}» используйте буквы (не меньше двух), пробел, дефис или апостроф.`
      };
    }

    return {ok: true, value: name};
  };

  // The parent / legal representative statement is part of the consent checkbox text.
  // Set to true to bring back the extra "I am a parent" dialog before sending.
  const REQUIRE_PARENT_MODAL = false;

  // ---- Form enhancements (progressive: without JS the plain <select> still works) ----

  // Turns a <select> into a row of tappable chips. The select stays in the DOM
  // (hidden) so FormData, preselection by data-goal-value and reset keep working.
  const makeChoiceChips = (select, {numeric = false} = {}) => {
    const field = select.parentElement;
    const label = field.querySelector('label');
    const options = [...select.options]
      .filter((option, index) => index > 0 || option.value)
      .map((option) => ({value: option.value || option.textContent.trim(), text: option.textContent.trim()}))
      .filter((option) => option.value);
    if (!options.length) return null;

    select.removeAttribute('required');   // validated in JS: a hidden control cannot show native errors
    field.classList.add('full', 'km-chips-host');

    const group = document.createElement('div');
    group.className = 'km-chips' + (numeric ? ' km-chips--num' : '');
    group.setAttribute('role', 'radiogroup');
    if (label) {
      label.id = label.id || `${select.id || select.name}-label`;
      group.setAttribute('aria-labelledby', label.id);
    }

    const chips = options.map((option) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'km-chip';
      chip.setAttribute('role', 'radio');
      chip.dataset.value = option.value;
      chip.textContent = option.text;
      group.appendChild(chip);
      return chip;
    });

    const sync = () => {
      const current = select.value;
      let anyChecked = false;
      chips.forEach((chip) => {
        const on = chip.dataset.value === current;
        chip.setAttribute('aria-checked', on ? 'true' : 'false');
        chip.tabIndex = on ? 0 : -1;
        anyChecked = anyChecked || on;
      });
      if (!anyChecked && chips[0]) chips[0].tabIndex = 0;
      if (anyChecked) group.classList.remove('is-invalid');
    };

    group.addEventListener('click', (event) => {
      const chip = event.target.closest('.km-chip');
      if (!chip) return;
      select.value = chip.dataset.value;
      select.dispatchEvent(new Event('change', {bubbles: true}));
    });
    group.addEventListener('keydown', (event) => {
      const keys = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1};
      if (!(event.key in keys)) return;
      event.preventDefault();
      const index = chips.indexOf(document.activeElement);
      const next = chips[(index + keys[event.key] + chips.length) % chips.length];
      next.focus();
      select.value = next.dataset.value;
      select.dispatchEvent(new Event('change', {bubbles: true}));
    });
    select.addEventListener('change', sync);

    select.after(group);
    select.hidden = true;
    sync();
    return group;
  };

  // Optional "when is it convenient to contact you" chips. The value is appended
  // to the comment of the lead, so the server and CRM need no changes.
  const addContactTimeChips = (form) => {
    const contactField = form.querySelector('input[name="contact"]')?.closest('div');
    if (!contactField || form.querySelector('.km-when')) return;
    const times = ['Утром', 'Днём', 'Вечером', 'Любое время'];
    const wrap = document.createElement('div');
    wrap.className = 'full km-when';
    wrap.innerHTML = '<label class="km-when-label">Когда удобно связаться <span class="km-opt">необязательно</span></label>' +
      '<div class="km-chips" role="radiogroup" aria-label="Когда удобно связаться"></div>' +
      '<input type="hidden" name="contact_time" value="">';
    const group = wrap.querySelector('.km-chips');
    const hidden = wrap.querySelector('input');
    times.forEach((text) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'km-chip';
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', 'false');
      chip.textContent = text;
      chip.addEventListener('click', () => {
        const same = hidden.value === text;
        hidden.value = same ? '' : text;   // second click clears the choice
        group.querySelectorAll('.km-chip').forEach((item) => item.setAttribute('aria-checked', item.textContent === hidden.value ? 'true' : 'false'));
      });
      group.appendChild(chip);
    });
    const anchor = form.querySelector('.consent-row');
    if (anchor) anchor.before(wrap); else contactField.after(wrap);
  };

  const addNextStepNote = (form) => {
    const button = form.querySelector('button[type="submit"]');
    if (!button || form.querySelector('.km-form-next')) return;
    const note = document.createElement('p');
    note.className = 'km-form-next';
    note.textContent = 'Мы свяжемся с вами по указанному контакту, чтобы согласовать время первого урока. Это бесплатно и без обязательной покупки.';
    button.after(note);
  };

  document.querySelectorAll('form[data-booking]').forEach((form) => {
    const classSelect = form.querySelector('select[name="class"]');
    const goalSelect = form.querySelector('select[name="goal"]');
    if (classSelect) makeChoiceChips(classSelect, {numeric: true});
    if (goalSelect) makeChoiceChips(goalSelect);
    addContactTimeChips(form);
    addNextStepNote(form);
  });

  // Parent confirmation before sending a lead (only when REQUIRE_PARENT_MODAL is true).
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

    const clearFormError = (event) => {
      event.target.classList?.remove('is-invalid');
      const stale = form.querySelector('.notice.notice-error');
      if (stale) { stale.style.display = 'none'; stale.classList.remove('notice-error'); stale.textContent = ''; }
    };
    form.addEventListener('input', clearFormError);
    form.addEventListener('change', clearFormError);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const notice = form.querySelector('.notice');
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);

      const showError = (message, target) => {
        if (notice) {
          notice.style.display = 'block';
          notice.classList.add('notice-error');
          notice.textContent = message;
        }
        if (!target) return;
        target.classList.add('is-invalid');
        try { target.scrollIntoView({block: 'center', behavior: 'smooth'}); } catch (_) {}
        const focusable = target.matches('input,textarea,select,button')
          ? target
          : target.querySelector('button,input:not([type="hidden"])');
        try { focusable?.focus({preventScroll: true}); } catch (_) {}
      };
      const chipsOf = (name) => form.querySelector(`select[name="${name}"]`)?.parentElement.querySelector('.km-chips');

      const parentNameResult = validatePersonName(formData.get('name'), 'Имя родителя');
      const studentNameResult = validatePersonName(formData.get('student'), 'Имя ученика');
      const classValue = String(formData.get('class') || '').trim();
      const goalValue = String(formData.get('goal') || '').trim();
      const contactResult = normalizeLeadContact(formData.get('contact'));

      if (!parentNameResult.ok) return showError(parentNameResult.error, form.querySelector('input[name="name"]'));
      if (!studentNameResult.ok) return showError(studentNameResult.error, form.querySelector('input[name="student"]'));
      if (!classValue) return showError('Выберите класс ученика.', chipsOf('class') || form.querySelector('[name="class"]'));
      if (!goalValue) return showError('Выберите, что нужно: направление занятий.', chipsOf('goal') || form.querySelector('[name="goal"]'));
      if (!contactResult.ok) return showError(contactResult.error, form.querySelector('input[name="contact"]'));

      const consentBox = form.querySelector('input[name="consent"]');
      if (!consentBox?.checked) {
        return showError('Отметьте согласие на обработку данных: без него мы не можем принять заявку.', consentBox);
      }

      if (REQUIRE_PARENT_MODAL) {
        trackMetrikaGoal('parent_confirmation_shown', {path: window.location.pathname});
        const parentConfirmed = await confirmParentSubmission();
        if (!parentConfirmed) {
          trackMetrikaGoal('parent_confirmation_cancelled', {path: window.location.pathname});
          return;
        }
        trackMetrikaGoal('parent_confirmation_confirmed', {path: window.location.pathname});
      }

      trackMetrikaGoal(funnelGoal('submit'), {
        path: window.location.pathname,
        class: String(formData.get('class') || ''),
        goal: String(formData.get('goal') || '')
      });

      if (funnelPrefix) trackMetrikaGoal('landing_form_submit', {path: window.location.pathname, landing: funnelPrefix});

      const contactTime = String(formData.get('contact_time') || '').trim();
      const baseComment = String(formData.get('comment') || '').trim();
      const composedComment = contactTime
        ? (baseComment ? baseComment + ' | ' : '') + 'Удобное время связи: ' + contactTime.toLowerCase()
        : baseComment;

      const payload = {
        name: parentNameResult.value,
        student: studentNameResult.value,
        class: classValue,
        goal: goalValue,
        contact: contactResult.value,
        comment: composedComment,
        source: window.location.href,
        consentAccepted: true,
        consentVersion: '2026-10-18',
        consentAcceptedAt: new Date().toISOString(),
        parentRepresentativeConfirmed: true
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

        // Do not show the promo window to someone who has just applied.
        try { localStorage.setItem('kotomatika_promo_20261103', String(Date.now() + 60 * 86400000)); } catch (_) {}
        // Only the first name of the parent goes to the thank-you page, and only through
        // sessionStorage of this tab: never through the URL.
        try {
          sessionStorage.setItem('kotomatika_lead', JSON.stringify({
            name: parentNameResult.value.split(' ')[0],
            at: Date.now()
          }));
        } catch (_) {}

        form.reset();
        form.querySelectorAll('select').forEach((select) => select.dispatchEvent(new Event('change', {bubbles: true})));
        form.querySelectorAll('.km-when .km-chip').forEach((chip) => chip.setAttribute('aria-checked', 'false'));

        // A short pause lets the Metrika goals leave the page, then the thank-you page opens.
        setTimeout(() => { window.location.assign(new URL('thanks/', KM_SCRIPT_BASE).href); }, 600);
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
