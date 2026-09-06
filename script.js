
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.section,.page-hero,.hero').forEach(el=>el.classList.add('reveal'));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');io.unobserve(e.target);}}),{threshold:.08});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('seen'));

  const burger=document.querySelector('.burger'), panel=document.querySelector('.mobile-panel');
  if(burger&&panel){
    burger.addEventListener('click',()=>{const open=panel.classList.toggle('open');burger.setAttribute('aria-expanded',open?'true':'false');document.body.style.overflow=open?'hidden':'';});
    panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{panel.classList.remove('open');document.body.style.overflow='';}));
  }

  document.querySelectorAll('.faq-q').forEach(b=>b.addEventListener('click',()=>{
    const item=b.closest('.faq-item'); item.classList.toggle('open'); b.querySelector('b').textContent=item.classList.contains('open')?'−':'+';
  }));

  const form=document.querySelector('#bookingForm');
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const d=new FormData(form);
      const text=`Заявка в Котоматику\n\nИмя: ${d.get('name')}\nУченик: ${d.get('student')}\nКласс: ${d.get('class')}\nЦель: ${d.get('goal')}\nКонтакт: ${d.get('contact')}\nКомментарий: ${d.get('comment')||'—'}`;
      try{await navigator.clipboard.writeText(text);}catch(e){}
      const box=document.querySelector('#bookingResult');
      if(box){box.style.display='block';box.innerHTML='<b>Заявка подготовлена.</b><p>Мы открываем Telegram администратора. Текст заявки уже скопирован — вставьте его в чат.</p>';}
      window.open('https://t.me/kotomathadmin','_blank');
    });
  }
});
