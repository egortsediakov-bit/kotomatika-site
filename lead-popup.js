/* Котоматика: первое посещение главной — бонусное окно */
(function () {
  'use strict';

  function initBonusPopup() {
    var overlay = document.getElementById('bonus-popup');
    if (!overlay) return;

    var dialog = overlay.querySelector('.bonus-popup__dialog');
    var closeButton = overlay.querySelector('.bonus-popup__close');
    if (!dialog || !closeButton) return;

    var STORAGE_KEY = 'kotomatika_bonus_popup_seen_v1';
    var PAUSE_DAYS = 30;
    var preview = new URLSearchParams(window.location.search).get('previewBonus') === '1';
    var previouslyFocused = null;
    var active = false;

    function rememberVisit() {
      if (preview) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch (_) {
        // Browsing without storage still supports the popup in this tab.
      }
    }

    function isRecentlyShown() {
      if (preview) return false;
      try {
        var timestamp = Number(window.localStorage.getItem(STORAGE_KEY));
        return timestamp > 0 && (Date.now() - timestamp) < PAUSE_DAYS * 86400000;
      } catch (_) {
        return false;
      }
    }

    function sendViewMetric() {
      try {
        if (typeof window.ym === 'function') {
          window.ym(112505956, 'reachGoal', 'bonus_popup_view', {path: window.location.pathname});
        }
      } catch (_) {}
    }

    function openPopup() {
      if (active) return;
      active = true;
      previouslyFocused = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('bonus-popup-open');
      rememberVisit();
      sendViewMetric();
      closeButton.focus({preventScroll:true});
    }

    function closePopup() {
      if (!active) return;
      active = false;
      overlay.hidden = true;
      document.body.classList.remove('bonus-popup-open');
      if (previouslyFocused && previouslyFocused.isConnected && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({preventScroll:true});
      }
    }

    overlay.querySelectorAll('[data-bonus-dismiss]').forEach(function (element) {
      element.addEventListener('click', closePopup);
    });

    overlay.addEventListener('keydown', function (event) {
      // Existing mandatory parent-confirmation dialog takes precedence when submitting.
      if (document.querySelector('.parent-confirm-modal.is-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closePopup();
        return;
      }
      if (event.key !== 'Tab') return;

      var focusable = Array.prototype.slice.call(
        dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],textarea:not([disabled])')
      ).filter(function (element) {
        return element.getClientRects().length > 0;
      });
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if (isRecentlyShown()) return;

    // Preview works even if the popup was dismissed before: /?previewBonus=1
    window.setTimeout(function () {
      if (document.visibilityState === 'hidden') return;
      if (document.querySelector('.parent-confirm-modal.is-open')) return;
      openPopup();
    }, preview ? 250 : 1250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBonusPopup, {once:true});
  } else {
    initBonusPopup();
  }
})();
