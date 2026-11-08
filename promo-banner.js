/* Котоматика: промо-окно для новых посетителей.
   Показывается по центру экрана один раз, после паузы или прокрутки.
   Закрывается крестиком, кнопкой «Не сейчас», клавишей Esc и кликом по затемнению.
   Меняйте тексты и сроки в блоке CONFIG. */
(function () {
  'use strict';

  var CONFIG = {
    key: 'kotomatika_promo_20261103',   // сменить значение — окно снова покажется всем
    eyebrow: 'Бонус новым ученикам',
    title: 'Диагностика и план занятий в подарок',
    text: 'Запишитесь на бесплатный первый урок — после него подготовим для вас письменный разбор: что подтянуть и в каком порядке.',
    points: ['Бесплатный первый урок', 'Письменный разбор после урока', 'Без обязательной покупки'],
    button: 'Получить бонус',
    dismiss: 'Не сейчас',
    href: 'booking/?promo=welcome-bonus',    // относительно корня сайта; параметр попадёт в «источник» заявки
    delayMs: 5000,           // показать через 5 секунд после захода на страницу…
    scrollPercent: 25,       // …или когда прокручено 25% страницы
    waitForAnalytics: false, // true — ждать ответа на баннер аналитики, чтобы окна не накладывались
    hideAfterCloseDays: 14,
    hideAfterClickDays: 60,
    skipPaths: ['/booking', '/privacy', '/consent', '/terms', '/analytics-consent', '/404', '/diagnostic', '/thanks']
  };

  // Корень сайта берём по расположению самого скрипта: так окно работает и при запуске
  // не из корня сервера, и при открытии файла двойным щелчком.
  var SCRIPT = document.currentScript;
  var BASE = (SCRIPT && SCRIPT.src) ? new URL('./', SCRIPT.src) : new URL('/', location.href);
  function pagePath() {
    var p = location.pathname, b = BASE.pathname;
    return '/' + (p.indexOf(b) === 0 ? p.slice(b.length) : p.replace(/^\//, ''));
  }
  function debug(msg) { try { console.info('[promo] ' + msg); } catch (_) {} }
  var FORCE = /[?&]showpromo=1\b/.test(location.search);   // для проверки: сайт/?showpromo=1

  var ANALYTICS_KEY = 'kotomatika_analytics_20261018';
  var METRIKA_ID = 112505956;

  function store(op, k, v) {
    try {
      if (op === 'get') return localStorage.getItem(k);
      if (op === 'set') localStorage.setItem(k, v);
    } catch (_) {}
    return null;
  }

  function hiddenNow() {
    var until = parseInt(store('get', CONFIG.key) || '0', 10);
    return until && Date.now() < until;
  }

  function hideFor(days) {
    store('set', CONFIG.key, String(Date.now() + days * 86400000));
  }

  function skipPage() {
    var p = pagePath().replace(/\/+$/, '').replace(/\/index\.html$/, '');
    for (var i = 0; i < CONFIG.skipPaths.length; i++) {
      if (p === CONFIG.skipPaths[i] || p.indexOf(CONFIG.skipPaths[i] + '/') === 0) return true;
    }
    return false;
  }

  function goal(name) {
    try { if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', name, {path: location.pathname}); } catch (_) {}
  }

  var stylesAdded = false;
  function addStyles() {
    if (stylesAdded) return;
    stylesAdded = true;
    var s = document.createElement('style');
    s.textContent =
      '.km-promo-wrap{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(24,16,10,.58);opacity:0;transition:opacity .3s ease}' +
      '.km-promo-wrap.is-in{opacity:1}' +
      '.km-promo{position:relative;width:min(560px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;color:#242424;border-radius:28px;box-shadow:0 30px 100px #0006;padding:40px 40px 32px;font:500 16px/1.55 Manrope,Arial,sans-serif;text-align:left;transform:translateY(20px) scale(.97);transition:transform .35s ease}' +
      '.km-promo-wrap.is-in .km-promo{transform:none}' +
      '.km-promo-icon{width:64px;height:64px;border-radius:20px;background:#e86c2f;display:grid;place-items:center;font-size:32px;margin-bottom:20px}' +
      '.km-promo-eyebrow{color:#e86c2f;font:700 12px/1.3 Unbounded,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;margin:0 0 10px}' +
      '.km-promo-title{font:700 30px/1.15 Unbounded,Arial,sans-serif;letter-spacing:-.02em;margin:0 0 14px}' +
      '.km-promo-text{margin:0 0 18px;color:#4d4842;font-size:17px}' +
      '.km-promo-list{list-style:none;margin:0 0 26px;padding:0;display:grid;gap:8px}' +
      '.km-promo-list li{position:relative;padding-left:28px;font-weight:600;font-size:15px}' +
      '.km-promo-list li:before{content:"✓";position:absolute;left:0;top:0;width:20px;height:20px;border-radius:50%;background:#fde6d9;color:#e86c2f;font-size:12px;line-height:20px;text-align:center;font-weight:700}' +
      '.km-promo-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px}' +
      '.km-promo-btn{display:inline-block;background:#e86c2f;color:#fff!important;text-decoration:none;font:700 16px/1 Unbounded,Arial,sans-serif;padding:19px 30px;border-radius:16px;box-shadow:0 10px 26px #e86c2f55}' +
      '.km-promo-btn:hover{background:#d65f25}' +
      '.km-promo-later{border:0;background:transparent;color:#6b655e;font:600 15px Manrope,Arial,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px 2px}' +
      '.km-promo-later:hover{color:#222}' +
      '.km-promo-note{margin:20px 0 0;color:#8a847d;font-size:13px;font-weight:500}' +
      '.km-promo-close{position:absolute;top:16px;right:18px;width:40px;height:40px;border:0;background:#f3efe9;color:#555;font-size:26px;line-height:1;cursor:pointer;border-radius:50%}' +
      '.km-promo-close:hover{background:#e9e2d8;color:#111}' +
      'body.km-promo-open{overflow:hidden}' +
      '@media (max-width:600px){.km-promo{padding:28px 22px 24px;border-radius:24px}.km-promo-title{font-size:23px}.km-promo-text{font-size:16px}.km-promo-btn{width:100%;text-align:center;padding:18px 20px}.km-promo-actions{flex-direction:column;align-items:stretch}.km-promo-later{align-self:center}.km-promo-icon{width:54px;height:54px;font-size:28px}}' +
      '@media (prefers-reduced-motion:reduce){.km-promo-wrap,.km-promo{transition:none}}';
    document.head.appendChild(s);
  }

  var shown = false;
  function show(force) {
    if (shown || (!force && hiddenNow())) return;
    // Не накладываемся на баннер аналитики и на окно подтверждения родителя.
    if (!force && ((CONFIG.waitForAnalytics && document.querySelector('.pd-cookie')) || document.querySelector('.parent-confirm-modal.is-open'))) return;
    shown = true;
    addStyles();

    var previouslyFocused = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'km-promo-wrap';
    wrap.innerHTML =
      '<div class="km-promo" role="dialog" aria-modal="true" aria-labelledby="km-promo-title">' +
      '<button type="button" class="km-promo-close" aria-label="Закрыть">×</button>' +
      '<div class="km-promo-icon" aria-hidden="true">🎁</div>' +
      '<p class="km-promo-eyebrow"></p>' +
      '<h2 class="km-promo-title" id="km-promo-title"></h2>' +
      '<p class="km-promo-text"></p>' +
      '<ul class="km-promo-list"></ul>' +
      '<div class="km-promo-actions"><a class="km-promo-btn"></a><button type="button" class="km-promo-later"></button></div>' +
      '<p class="km-promo-note">Заявку подтверждает родитель или законный представитель ученика.</p>' +
      '</div>';
    wrap.querySelector('.km-promo-eyebrow').textContent = CONFIG.eyebrow;
    wrap.querySelector('.km-promo-title').textContent = CONFIG.title;
    wrap.querySelector('.km-promo-text').textContent = CONFIG.text;
    var list = wrap.querySelector('.km-promo-list');
    CONFIG.points.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; list.appendChild(li); });
    var btn = wrap.querySelector('.km-promo-btn');
    btn.textContent = CONFIG.button;
    btn.href = new URL(CONFIG.href, BASE).href;
    var later = wrap.querySelector('.km-promo-later');
    later.textContent = CONFIG.dismiss;

    function close() {
      hideFor(CONFIG.hideAfterCloseDays);
      wrap.classList.remove('is-in');
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('km-promo-open');
      setTimeout(function () { wrap.remove(); }, 350);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') { try { previouslyFocused.focus(); } catch (_) {} }
      goal('promo_banner_close');
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {   // фокус остаётся внутри окна
        var f = wrap.querySelectorAll('button,a[href]');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    wrap.querySelector('.km-promo-close').addEventListener('click', close);
    later.addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    btn.addEventListener('click', function () {
      hideFor(CONFIG.hideAfterClickDays);
      goal('promo_banner_click');
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(wrap);
    document.body.classList.add('km-promo-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('is-in'); }); });
    var dlg = wrap.querySelector('.km-promo'); dlg.setAttribute('tabindex', '-1'); dlg.style.outline = 'none';
    setTimeout(function () { try { dlg.focus({preventScroll: true}); } catch (_) {} }, 50);
    goal('promo_banner_shown');
  }

  // ---- Для проверки и отладки ----
  // Включить панель: добавьте к адресу ?debug=1 (выключить: ?debug=0 или кнопка в панели).
  // Из консоли: KotomatikaPromo.show()
  var DEBUG_KEY = 'kotomatika_debug';
  window.KotomatikaPromo = {
    show: function () { shown = false; show(true); },
    reset: function () {
      try { localStorage.removeItem(CONFIG.key); localStorage.removeItem(ANALYTICS_KEY); sessionStorage.removeItem('kotomatika_lead'); } catch (_) {}
    }
  };

  function initDebug() {
    try {
      if (/[?&]debug=1\b/.test(location.search)) localStorage.setItem(DEBUG_KEY, '1');
      if (/[?&]debug=0\b/.test(location.search)) localStorage.removeItem(DEBUG_KEY);
    } catch (_) {}
    if (store('get', DEBUG_KEY) !== '1') return;

    var st = document.createElement('style');
    st.textContent =
      '.km-debug{position:fixed;right:14px;bottom:14px;z-index:9500;font:600 13px/1.3 Manrope,Arial,sans-serif;color:#fff}' +
      '.km-debug-toggle{background:#242424;color:#fff;border:0;border-radius:999px;padding:11px 16px;cursor:pointer;box-shadow:0 8px 24px #0005;font:inherit}' +
      '.km-debug-menu{display:none;position:absolute;right:0;bottom:50px;min-width:260px;background:#242424;border-radius:16px;padding:8px;box-shadow:0 16px 40px #0006}' +
      '.km-debug.is-open .km-debug-menu{display:grid;gap:4px}' +
      '.km-debug-menu button{background:transparent;border:0;color:#fff;text-align:left;padding:11px 12px;border-radius:10px;cursor:pointer;font:inherit}' +
      '.km-debug-menu button:hover{background:#3a3a3a}' +
      '.km-debug-menu small{color:#aaa;padding:6px 12px 2px;font-weight:500}';
    document.head.appendChild(st);

    var box = document.createElement('div');
    box.className = 'km-debug';
    box.innerHTML = '<div class="km-debug-menu">' +
      '<small>Режим проверки сайта</small>' +
      '<button type="button" data-act="promo">Показать окно с бонусом</button>' +
      '<button type="button" data-act="thanks">Открыть страницу «Спасибо»</button>' +
      '<button type="button" data-act="reset">Сбросить память сайта и обновить</button>' +
      '<button type="button" data-act="off">Выключить режим проверки</button></div>' +
      '<button type="button" class="km-debug-toggle">🛠 Проверка</button>';
    box.querySelector('.km-debug-toggle').addEventListener('click', function () { box.classList.toggle('is-open'); });
    box.querySelector('.km-debug-menu').addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (!act) return;
      box.classList.remove('is-open');
      if (act === 'promo') window.KotomatikaPromo.show();
      if (act === 'thanks') location.href = new URL('thanks/', BASE).href;
      if (act === 'reset') { window.KotomatikaPromo.reset(); location.reload(); }
      if (act === 'off') { try { localStorage.removeItem(DEBUG_KEY); } catch (_) {} box.remove(); }
    });
    document.body.appendChild(box);
  }

  function analyticsDecided() { return !CONFIG.waitForAnalytics || !document.querySelector('.pd-cookie'); }

  function init() {
    initDebug();
    if (FORCE) { debug('режим проверки: показываю окно сразу'); setTimeout(function () { shown = false; show(true); }, 600); return; }
    if (skipPage()) { debug('страница в списке исключений: ' + pagePath()); return; }
    if (hiddenNow()) { debug('окно скрыто до ' + new Date(parseInt(store('get', CONFIG.key), 10)).toLocaleString() + ' (ключ ' + CONFIG.key + ' в localStorage)'); return; }

    var timeUp = false, scrolled = false;
    function tryShow() {
      if (shown) return;
      if (!(timeUp || scrolled)) return;
      if (!analyticsDecided()) return;   // сначала даём ответить на баннер аналитики
      show();
    }
    setTimeout(function () { timeUp = true; tryShow(); }, CONFIG.delayMs);
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var pct = (h.scrollTop + window.innerHeight) / Math.max(1, h.scrollHeight) * 100;
      if (pct >= CONFIG.scrollPercent) { scrolled = true; tryShow(); }
    }, {passive: true});
    // Если баннер аналитики закрыли позже — проверяем раз в секунду, но не дольше 3 минут.
    var n = 0, t = setInterval(function () {
      if (shown || ++n > 180) return clearInterval(t);
      tryShow();
    }, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
