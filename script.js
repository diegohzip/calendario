document.addEventListener("DOMContentLoaded", () => {
  const calendar = document.getElementById("calendar");
  const listaEventos = document.getElementById("lista-eventos");
  const btnAdd = document.getElementById("btnAdd");
  const modal = document.getElementById("modal");
  const eventoInput = document.getElementById("eventoInput");
  const salvarEvento = document.getElementById("salvarEvento");
  const cancelarEvento = document.getElementById("cancelarEvento");

  let eventos = JSON.parse(localStorage.getItem("eventos")) || {};
  let dataSelecionada = null;

  // Cria o calendário fixo (mês atual)
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let i = 1; i <= diasNoMes; i++) {
    const diaDiv = document.createElement("div");
    diaDiv.classList.add("dia");
    diaDiv.textContent = i;
    const dataStr = `${ano}-${mes}-${i}`;

    if (eventos[dataStr]?.length) diaDiv.classList.add("ocupado");
    if (i === hoje.getDate()) diaDiv.classList.add("atual");


    diaDiv.addEventListener("click", () => {
      dataSelecionada = dataStr;
      mostrarEventos(dataSelecionada);
    });

    calendar.appendChild(diaDiv);
  }

  function mostrarEventos(data) {
    listaEventos.innerHTML = "";
    const evts = eventos[data] || [];
    if (evts.length === 0) {
      listaEventos.innerHTML = "<li>Nenhum evento neste dia.</li>";
    } else {
      evts.forEach((evt, index) => {
        const li = document.createElement("li");
        li.innerHTML = `${evt} <button data-index="${index}">✖</button>`;
        li.querySelector("button").addEventListener("click", () => {
          evts.splice(index, 1);
          if (evts.length === 0) delete eventos[data];
          localStorage.setItem("eventos", JSON.stringify(eventos));
          atualizarCalendario();
          mostrarEventos(data);
        });
        listaEventos.appendChild(li);
      });
    }
  }

  function atualizarCalendario() {
    [...calendar.children].forEach((dia) => {
      const dataStr = `${ano}-${mes}-${dia.textContent}`;
      if (eventos[dataStr]?.length) {
        dia.classList.add("ocupado");
      } else {
        dia.classList.remove("ocupado");
      }
    });
  }

  btnAdd.addEventListener("click", () => {
    if (!dataSelecionada) {
      alert("Selecione um dia no calendário!");
      return;
    }
    modal.style.display = "flex";
  });

  salvarEvento.addEventListener("click", () => {
    const texto = eventoInput.value.trim();
    if (!texto) return alert("Digite algo!");

    if (!eventos[dataSelecionada]) eventos[dataSelecionada] = [];
    eventos[dataSelecionada].push(texto);
    localStorage.setItem("eventos", JSON.stringify(eventos));
    eventoInput.value = "";
    modal.style.display = "none";
    atualizarCalendario();
    mostrarEventos(dataSelecionada);
  });

  cancelarEvento.addEventListener("click", () => {
    modal.style.display = "none";
  });
});
