import { db, collection, addDoc, getDocs, deleteDoc, doc } from "./firebase.js";

const calendarDiv = document.getElementById("calendar");
const eventDateInput = document.getElementById("event-date");
const eventTitleInput = document.getElementById("event-title");
const addEventBtn = document.getElementById("add-event");
const eventUl = document.getElementById("event-ul");
const eventsRef = collection(db, "eventos");

const monthYearLabel = document.getElementById("month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Nomes dos meses
const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

// Gera o calendário do mês atual
function gerarCalendario(mes, ano) {
  calendarDiv.innerHTML = "";
  monthYearLabel.textContent = `${meses[mes]} ${ano}`;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  // Dias vazios antes do início do mês
  for (let i = 0; i < primeiroDia; i++) {
    const div = document.createElement("div");
    calendarDiv.appendChild(div);
  }

  // Dias do mês
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const div = document.createElement("div");
    div.textContent = dia;
    div.classList.add("day");

    div.addEventListener("click", () => {
      const dataFormatada = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      eventDateInput.value = dataFormatada;
      eventDateInput.scrollIntoView({ behavior: "smooth" });
    });

    calendarDiv.appendChild(div);
  }
}

// Navegação entre meses
prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  gerarCalendario(currentMonth, currentYear);
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  gerarCalendario(currentMonth, currentYear);
});

// Adicionar evento
addEventBtn.addEventListener("click", async () => {
  const data = eventDateInput.value;
  const titulo = eventTitleInput.value.trim();

  if (!data || !titulo) {
    alert("Preencha todos os campos!");
    return;
  }

  await addDoc(eventsRef, { data, titulo });
  eventDateInput.value = "";
  eventTitleInput.value = "";
  carregarEventos();
});

// Listar eventos
async function carregarEventos() {
  eventUl.innerHTML = "";
  const snapshot = await getDocs(eventsRef);
  snapshot.forEach((docSnap) => {
    const li = document.createElement("li");
    li.textContent = `${docSnap.data().data} — ${docSnap.data().titulo}`;

    const btn = document.createElement("button");
    btn.textContent = "Excluir";
    btn.onclick = async () => {
      await deleteDoc(doc(db, "eventos", docSnap.id));
      carregarEventos();
    };

    li.appendChild(btn);
    eventUl.appendChild(li);
  });
}

// Inicialização
gerarCalendario(currentMonth, currentYear);
carregarEventos();
