/* Kotomatika: optional web analytics only after separate opt-in. */
(function () {
  'use strict';
  const KEY = 'kotomatika_analytics_20261018';
  const COUNTER = 112505956;
  const getChoice = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const saveChoice = (v) => { try { localStorage.setItem(KEY, v); } catch (_) {} };
  let initialized = false;
  function startAnalytics() {
    if (initialized) return;
    initialized = true;
    document.querySelectorAll('form[data-booking] input, form[data-booking] textarea').forEach(el => el.classList.add('ym-disable-keys'));
    (function(m,e,t,r,i,k,a) {
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      k=e.createElement(t); a=e.getElementsByTagName(t)[0];
      k.async=1; k.src=r; a.parentNode.insertBefore(k,a);
    })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id='+COUNTER,'ym');
    ym(COUNTER,'init',{ssr:true,webvisor:false,clickmap:true,referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
  }
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = '.pd-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9000;max-width:750px;margin:auto;background:#fff;color:#242424;border:1px solid #e8e1d9;border-radius:18px;box-shadow:0 16px 70px #0003;padding:18px 22px;font:14px/1.5 Arial,sans-serif}.pd-cookie p{margin:0 0 12px}.pd-cookie a{color:#c45d29;text-decoration:underline}.pd-cookie-actions{display:flex;flex-wrap:wrap;gap:8px}.pd-cookie button{padding:10px 17px;border-radius:11px;border:1px solid #bcb6af;background:#fff;cursor:pointer;font-weight:bold}.pd-cookie button[data-accept]{background:#e86c2f;color:#fff;border-color:#e86c2f}.pd-cookie-setting{border:0!important;background:transparent!important;color:inherit!important;text-decoration:underline;cursor:pointer;font:inherit!important;padding:2px 0!important}';
    document.head.appendChild(style);
  }
  function showChoice() {
    if (document.querySelector('.pd-cookie')) return;
    const b=document.createElement('div'); b.className='pd-cookie';b.setAttribute('role','dialog');b.setAttribute('aria-label','Настройки аналитики');
    b.innerHTML='<p><strong>Аналитика сайта</strong>. С вашего разрешения мы включим Яндекс Метрику, чтобы улучшать сайт. Это необязательно для записи на занятие. <a href="/analytics-consent/">Условия согласия на аналитику</a> и <a href="/privacy/">Политика ПДн</a>.</p><div class="pd-cookie-actions"><button type="button" data-accept>Разрешить</button><button type="button" data-reject>Не разрешать</button></div>';
    b.querySelector('[data-accept]').addEventListener('click',()=>{saveChoice('yes');b.remove();startAnalytics();});
    b.querySelector('[data-reject]').addEventListener('click',()=>{saveChoice('no');b.remove();});
    document.body.appendChild(b);
  }
  function addControl() {
    const footer=document.querySelector('.footer-bottom') || document.querySelector('.footer-legal') || document.querySelector('footer');
    if(!footer) return;
    const btn=document.createElement('button');btn.type='button';btn.className='pd-cookie-setting';btn.textContent='Настройки аналитики';btn.addEventListener('click',()=>showChoice());
    const wrap=document.createElement('span');wrap.style.marginLeft='12px';wrap.appendChild(btn);footer.appendChild(wrap);
  }
  function init(){
    addStyles();addControl();
    if(getChoice()==='yes')startAnalytics();
    else if(getChoice()!=='no')showChoice();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
