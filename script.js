
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.section,.page-hero,.hero').forEach(el=>el.classList.add('reveal'));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');io.unobserve(e.target);}}),{threshold:.08});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('seen'));

  const burger=document.querySelector('.burger'), panel=document.querySelector('.mobile-panel');
  if(burger&&panel){
    burger.addEventListener('click',()=>{
      const open=panel.classList.toggle('open');
      burger.setAttribute('aria-expanded',open?'true':'false');
      document.body.style.overflow=open?'hidden':'';
    });
    panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      panel.classList.remove('open'); document.body.style.overflow='';
    }));
  }

  document.querySelectorAll('.faq-q').forEach(b=>b.addEventListener('click',()=>{
    const item=b.closest('.faq-item');
    item.classList.toggle('open');
    b.querySelector('b').textContent=item.classList.contains('open')?'−':'+';
  }));

  const form=document.querySelector('#bookingForm');
  if(form){
    form.addEventListener('submit', async e=>{
      e.preventDefault();

      const submit = form.querySelector('button[type="submit"]');
      const box = document.querySelector('#bookingResult');
      const d = new FormData(form);

      // Honeypot: обычный пользователь это поле не видит и не заполняет.
      if ((d.get('website') || '').trim()) return;

      const payload = {
        name: (d.get('name') || '').trim(),
        student: (d.get('student') || '').trim(),
        class: (d.get('class') || '').trim(),
        goal: (d.get('goal') || '').trim(),
        contact: (d.get('contact') || '').trim(),
        comment: (d.get('comment') || '').trim(),
        source: location.href,
        ts: new Date().toISOString()
      };

      if(!payload.name || !payload.student || !payload.class || !payload.goal || !payload.contact){
        if(box){ box.style.display='block'; box.innerHTML='<b>Проверьте поля.</b><p>Заполните имя, ученика, класс, цель и контакт.</p>'; }
        return;
      }

      const api = (window.KOTOMATIKA_API_URL || '').trim();

      submit.disabled = true;
      submit.textContent = 'Отправляем…';
      if(box){ box.style.display='block'; box.innerHTML='<p>Отправляем заявку администратору…</p>'; }

      let sent = false;
      let errorText = '';

      if(api && !api.includes('PASTE_YANDEX_FUNCTION_URL_HERE')){
        try{
          const r = await fetch(api, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(payload)
          });
          const data = await r.json().catch(()=>({}));
          sent = r.ok && data.ok === true;
          if(!sent) errorText = data.error || `HTTP ${r.status}`;
        }catch(err){
          errorText = err && err.message ? err.message : 'network error';
        }
      }else{
        errorText = 'API URL не настроен';
      }

      if(sent){
        if(box){
          box.style.display='block';
          box.innerHTML='<b>Готово!</b><p>Заявка отправлена администратору. Мы свяжемся с вами по указанному контакту.</p>';
        }
        form.reset();
      }else{
        const text=`Заявка в Котоматику

Имя: ${payload.name}
Ученик: ${payload.student}
Класс: ${payload.class}
Цель: ${payload.goal}
Контакт: ${payload.contact}
Комментарий: ${payload.comment || '—'}`;

        try{ await navigator.clipboard.writeText(text); }catch(e){}

        if(box){
          box.style.display='block';
          box.innerHTML='<b>Автоматическая отправка временно недоступна.</b><p>Заявка скопирована. Откроем Telegram администратора — вставьте текст в чат.</p>';
        }
        window.open('https://t.me/kotomathadmin','_blank');
        console.warn('Lead API error:', errorText);
      }

      submit.disabled = false;
      submit.textContent = 'Отправить заявку';
    });
  }
});
