// script.js (modular - usa Firestore para sincronização em tempo real)
// IMPORT: note que precisamos do import do firebase.js — por isso carregar este script como module
import { db, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from './firebase.js';

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

let viewMonth = (new Date()).getMonth();
let viewYear = (new Date()).getFullYear();

/*
  eventsMap structure (in-memory):
  {
    "2025-11-13": [ { id: 'abc123', title: 'Jantar' }, ... ],
    ...
  }
*/
let eventsMap = {};
let selectedDate = null;

/* helpers */
function pad(n){ return String(n).padStart(2,'0'); }
function ymdFromDateObj(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function human(ymd){ const [y,m,d]=ymd.split('-'); return `${d}/${m}/${y}`; }

function groupSnapshotToMap(snapshot){
  const map = {};
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const date = data.date; // expects 'YYYY-MM-DD'
    const title = data.title;
    if(!date || !title) return;
    if(!map[date]) map[date] = [];
    map[date].push({ id, title });
  });
  // optional: sort each day's events by createdAt if present (not required)
  return map;
}

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
    const todayYmd = ymdFromDateObj(new Date());
    dayEl.className = 'day' + (ymd === todayYmd ? ' today' : '');
    dayEl.setAttribute('data-date', ymd);
    dayEl.style.position = 'relative';

    const num = document.createElement('div'); num.className='day-num'; num.textContent = d;
    dayEl.appendChild(num);

    if (eventsMap[ymd] && eventsMap[ymd].length){
      dayEl.classList.add('has-event');
      const dots = document.createElement('div'); dots.className='dots';
      const maxDots = Math.min(eventsMap[ymd].length,3);
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
  for(const ymd in eventsMap){
    for(const ev of eventsMap[ymd]) flat.push({date:ymd,id:ev.id,title:ev.title});
  }
  flat.sort((a,b)=> a.date.localeCompare(b.date) || (a.title.localeCompare(b.title)));
  if(flat.length===0){
    agendaList.innerHTML = '<li class="agenda-item" style="justify-content:center;color:#bbb">Nenhum evento</li>';
    return;
  }
  for(const ev of flat){
    const li = document.createElement('li'); li.className='agenda-item';
    const left = document.createElement('div'); left.innerHTML = `<div><strong>${ev.title}</strong></div><div class="meta">${human(ev.date)}</div>`;
    const btn = document.createElement('button'); btn.innerHTML='🗑️';
    btn.title='Excluir';
    btn.addEventListener('click', async ()=>{
      try {
        await deleteDoc(doc(db, 'events', ev.id));
        // realtime listener will update UI
      } catch(err){
        console.error('Erro ao excluir evento:', err);
        alert('Falha ao excluir evento');
      }
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
  const arr = eventsMap[selectedDate] || [];
  if(arr.length===0){ eventsForDay.innerHTML = '<li style="color:#bbb;padding:8px">Sem eventos neste dia</li>'; return; }
  arr.forEach((ev,i)=>{
    const li = document.createElement('li');
    li.style.display='flex'; li.style.justifyContent='space-between';
    li.style.alignItems='center'; li.style.padding='8px'; li.style.borderRadius='8px';
    li.style.marginBottom='6px'; li.style.background='rgba(255,255,255,0.02)';
    li.innerHTML = `<div><strong>${ev.title}</strong><div style="font-size:12px;color:#bdbdbd">${human(selectedDate)}</div></div>`;
    const b = document.createElement('button'); b.textContent='✖'; b.title='Excluir';
    b.style.background='transparent'; b.style.border='none'; b.style.color='#ff3b3b'; b.style.cursor='pointer';
    b.addEventListener('click', async ()=>{
      try {
        await deleteDoc(doc(db, 'events', ev.id));
        // realtime listener will trigger refresh
      } catch(err){
        console.error('Erro ao excluir evento:', err);
        alert('Falha ao excluir evento');
      }
    });
    li.appendChild(b); eventsForDay.appendChild(li);
  });
}

/* save event -> write to Firestore */
async function saveEvent(){
  const title = eventTitleInput.value.trim();
  const date = eventDateInput.value;
  if(!title || !date){ alert('Preencha data e título'); return; }
  try {
    await addDoc(collection(db, 'events'), {
      date,
      title,
      createdAt: serverTimestamp()
    });
    // listener updates UI automatically
    eventTitleInput.value=''; selectedDate = date;
    eventDateInput.value = date;
    eventTitleInput.focus();
  } catch(err){
    console.error('Erro ao salvar no Firestore:', err);
    alert('Falha ao salvar evento');
  }
}

/* close modal */
function closeModalFn(){ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }

/* quick add */
function quickAddFn(){ openDayModal(ymdFromDateObj(new Date())); }

/* spawn floating images (behind UI) */
function spawnFloatingImages(){
  const container = document.getElementById('floating-bg');
  if(!container) return;
  container.innerHTML='';
  for(let i=0;i<6;i++){
    const img = document.createElement('img');
    img.src = imgs[i % imgs.length];
    img.className = 'floating-img';
    const left = (Math.random()*120 - 10);
    const top = 110 + Math.random()*40;
    img.style.left = `${left}vw`;
    img.style.top = `${top}vh`;
    const scale = 0.85 + Math.random()*0.5;
    const rot = -10 + Math.random()*20;
    img.style.transform = `rotate(${rot}deg) scale(${scale})`;
    img.style.opacity = '0';
    container.appendChild(img);

    const run = () => {
      img.style.transition = 'none';
      img.style.left = `${(Math.random()*120 - 10)}vw`;
      img.style.top = `${110 + Math.random()*30}vh`;
      img.style.opacity = '0';
      img.style.transform = `rotate(${rot + (Math.random()*6-3)}deg) scale(${scale})`;
      const delay = Math.random()*3000;
      setTimeout(()=>{
        img.style.transition = `top ${14000 + Math.random()*8000}ms linear, left ${14000 + Math.random()*8000}ms linear, opacity 1200ms ease`;
        img.style.opacity = (0.18 + Math.random()*0.42).toString();
        img.style.top = `${-120 - Math.random()*20}vh`;
        img.style.left = `${(Math.random()*120 - 10)}vw`;
      }, delay);
      const total = 14000 + Math.random()*8000 + delay + 1000;
      setTimeout(run, total);
    };
    setTimeout(run, i*700 + Math.random()*1200);
  }
}

/* Realtime listener: escuta coleção 'events' e atualiza UI automaticamente */
function startRealtimeListener(){
  const collRef = collection(db, 'events');
  // onSnapshot atualiza sempre que houver mudança
  onSnapshot(collRef, (snapshot) => {
    eventsMap = groupSnapshotToMap(snapshot);
    renderCalendar(viewMonth, viewYear);
    renderAgenda();
    // Se modal estiver aberto para um dia, atualiza a lista
    if(selectedDate) refreshDayEvents();
  }, (err) => {
    console.error('Erro no listener do Firestore:', err);
  });
}

/* init */
function init(){
  renderCalendar(viewMonth, viewYear);
  renderAgenda();
  spawnFloatingImages();
  startRealtimeListener();

  prevMonth.addEventListener('click', ()=>{ viewMonth--; if(viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(viewMonth, viewYear); });
  nextMonth.addEventListener('click', ()=>{ viewMonth++; if(viewMonth>11){ viewMonth=0; viewYear++; } renderCalendar(viewMonth, viewYear); });
  quickAdd.addEventListener('click', quickAddFn);

  closeModal.addEventListener('click', closeModalFn);
  saveEventBtn.addEventListener('click', saveEvent);

  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModalFn(); });
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModalFn(); });
}

init();
