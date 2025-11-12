/* script.js
   - Gera calendário mensal (navegação)
   - Gerencia eventos em localStorage (KEY = 'calendario_eventos')
   - Cria imagens flutuantes em #floating-bg sem sobrepor UI
*/

const KEY = 'calendario_eventos';
const imgs = [
  'imagens/1.jpg','imagens/2.jpg','imagens/3.jpg',
  'imagens/4.jpg','imagens/5.jpg','imagens/6.jpg'
];

/* DOM refs */
const calendarGrid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('monthLabel');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const agendaList = document.getElementById('agendaList');
const quickAdd = document.getElementById('quickAdd');

const modal = document.getElementById('modal');
const modalDateLabel = document.getElementById('modalDateLabel');
const eventsForDay = document.getElementById('eventsForDay');
const eventTitleInput = document.getElementById('eventTitleInput');
const eventDateInput = document.getElementById('eventDateInput');
const saveEventBtn = document.getElementById('saveEventBtn');
const closeModal = document.getElementById('closeModal');

/* state */
let viewMonth = (new Date()).getMonth();
let viewYear = (new Date()).getFullYear();
let events = JSON.parse(localStorage.getItem(KEY) || '{}');
let selectedDate = null;

/* helpers */
function pad(n){ return String(n).padStart(2,'0'); }
function ymdFromDateObj(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function ymdFromParts(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }
function human(ymd){ const [y,m,d]=ymd.split('-'); return `${d}/${m}/${y}`; }
function persist(){ localStorage.setItem(KEY, JSON.stringify(events)); }

/* render calendar */
function renderCalendar(month, year){
  calendarGrid.innerHTML = '';
  const first = new Date(year, month, 1);
  const last = new Date(year, month+1, 0);
  const startDay = first.getDay();
  const total = last.getDate();
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  monthLabel.textContent = `${months[month]} ${year}`;

  // blank slots
  for(let i=0;i<startDay;i++){
    const empty = document.createElement('div');
    empty.className='day';
    empty.setAttribute('aria-hidden','true');
    calendarGrid.appendChild(empty);
  }

  // days
  for(let d=1; d<=total; d++){
    const dateObj = new Date(year, month, d);
    const ymd = ymdFromDateObj(dateObj);
    const dayEl = document.createElement('div');
    dayEl.className = 'day' + (ymd === ymdFromDateObj(new Date()) ? ' today' : '');
    dayEl.setAttribute('data-date', ymd);

    const num = document.createElement('div'); num.className='day-num'; num.textContent = d;
    dayEl.appendChild(num);

    if (events[ymd] && events[ymd].length){
      dayEl.classList.add('has-event');
      const dots = document.createElement('div'); dots.className='dots';
      const maxDots = Math.min(events[ymd].length,3);
      for(let k=0;k<maxDots;k++){ const dot = document.createElement('span'); dot.className='dot'; dots.appendChild(dot); }
      dayEl.appendChild(dots);
    }

    dayEl.addEventListener('click', ()=> openDayModal(ymd));
    calendarGrid.appendChild(dayEl);
  }
}

/* agenda (all events sorted) */
function renderAgenda(){
  agendaList.innerHTML = '';
  const flat = [];
  for(const ymd in events){
    for(const title of events[ymd]) flat.push({date:ymd,title});
  }
  flat.sort((a,b)=>a.date.localeCompare(b.date));
  if(flat.length===0){
    agendaList.innerHTML = '<li class="agenda-item" style="justify-content:center;color:#bbb">Nenhum evento</li>';
    return;
  }
  for(const ev of flat){
    const li = document.createElement('li'); li.className='agenda-item';
    const left = document.createElement('div'); left.innerHTML = `<div><strong>${ev.title}</strong></div><div class="meta">${human(ev.date)}</div>`;
    const btn = document.createElement('button'); btn.innerHTML='🗑️';
    btn.title='Excluir';
    btn.addEventListener('click', ()=>{
      const arr = events[ev.date] || [];
      const idx = arr.indexOf(ev.title);
      if (idx>=0){ arr.splice(idx,1); if(arr.length===0) delete events[ev.date]; persist(); renderAgenda(); renderCalendar(viewMonth, viewYear); }
    });
    li.appendChild(left); li.appendChild(btn); agendaList.appendChild(li);
  }
}

/* open modal for date */
function openDayModal(ymd){
  selectedDate = ymd;
  modalDateLabel.textContent = human(ymd);
  eventDateInput.value = ymd;
  eventTitleInput.value = '';
  refreshDayEvents();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden','false');
  eventTitleInput.focus();
}

/* refresh list inside modal */
function refreshDayEvents(){
  eventsForDay.innerHTML = '';
  const arr = events[selectedDate] || [];
  if(arr.length===0){ eventsForDay.innerHTML = '<li style="color:#bbb;padding:8px">Sem eventos neste dia</li>'; return; }
  arr.forEach((t,i)=>{
    const li = document.createElement('li'); li.style.display='flex'; li.style.justifyContent='space-between'; li.style.alignItems='center'; li.style.padding='8px'; li.style.borderRadius='8px'; li.style.marginBottom='6px'; li.style.background='rgba(255,255,255,0.02)';
    li.innerHTML = `<div><strong>${t}</strong><div style="font-size:12px;color:#bdbdbd">${human(selectedDate)}</div></div>`;
    const b = document.createElement('button'); b.textContent='✖'; b.title='Excluir'; b.style.background='transparent'; b.style.border='none'; b.style.color='#ff3b3b'; b.style.cursor='pointer';
    b.addEventListener('click', ()=>{ events[selectedDate].splice(i,1); if(events[selectedDate].length===0) delete events[selectedDate]; persist(); refreshDayEvents(); renderAgenda(); renderCalendar(viewMonth, viewYear); });
    li.appendChild(b); eventsForDay.appendChild(li);
  });
}

/* save event */
function saveEvent(){
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  if(!title || !date){ alert('Preencha data e título'); return; }
  if(!events[date]) events[date]=[];
  events[date].push(title);
  persist();
  eventTitleInput.value=''; selectedDate = date;
  refreshDayEvents(); renderAgenda(); renderCalendar(viewMonth, viewYear);
}

/* close modal */
function closeModalFn(){ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }

/* quick add */
function quickAddFn(){ openDayModal(ymdFromDateObj(new Date())); }

/* spawn floating images (behind UI) */
function spawnFloatingImages(){
  const container = document.getElementById('floating-bg');
  container.innerHTML=''; // reset
  // create multiple layers with different durations/delays
  for(let i=0;i<6;i++){
    const img = document.createElement('img');
    img.src = imgs[i % imgs.length];
    img.className = 'floating-img';
    // randomize start pos off-bottom
    const left = (Math.random()*120 - 10); // -10% .. 110% in vw
    const top = 110 + Math.random()*40; // start below viewport (vh)
    img.style.left = `${left}vw`;
    img.style.top = `${top}vh`;
    // initial transform
    const scale = 0.85 + Math.random()*0.5;
    const rot = -10 + Math.random()*20;
    img.style.transform = `rotate(${rot}deg) scale(${scale})`;
    img.style.opacity = '0';
    container.appendChild(img);

    // animate using JS for better control
    const run = () => {
      // reset starting position and opacity
      img.style.transition = 'none';
      img.style.left = `${(Math.random()*120 - 10)}vw`;
      img.style.top = `${110 + Math.random()*30}vh`;
      img.style.opacity = '0';
      img.style.transform = `rotate(${rot + (Math.random()*6-3)}deg) scale(${scale})`;
      // small delay then move up
      const delay = Math.random()*3000;
      setTimeout(()=>{
        img.style.transition = `top ${14000 + Math.random()*8000}ms linear, left ${14000 + Math.random()*8000}ms linear, opacity 1200ms ease`;
        img.style.opacity = (0.18 + Math.random()*0.42).toString();
        img.style.top = `${-120 - Math.random()*20}vh`;
        img.style.left = `${(Math.random()*120 - 10)}vw`;
      }, delay);
      // schedule next loop when animation likely ended
      const total = 14000 + Math.random()*8000 + delay + 1000;
      setTimeout(run, total);
    };
    // stagger initial
    setTimeout(run, i*700 + Math.random()*1200);
  }
}

/* init */
function init(){
  renderCalendar(viewMonth, viewYear);
  renderAgenda();
  spawnFloatingImages();

  prevMonth.addEventListener('click', ()=>{ viewMonth--; if(viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(viewMonth, viewYear); });
  nextMonth.addEventListener('click', ()=>{ viewMonth++; if(viewMonth>11){ viewMonth=0; viewYear++; } renderCalendar(viewMonth, viewYear); });
  quickAdd.addEventListener('click', quickAddFn);

  closeModal.addEventListener('click', closeModalFn);
  saveEventBtn.addEventListener('click', saveEvent);

  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModalFn(); });
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModalFn(); });
}

init();
