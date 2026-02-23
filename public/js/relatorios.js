// =========================
// RELATÓRIOS (FRONT-END)
// =========================

// Base da API: se já existir em outro arquivo (global.js), não sobrescreve
if (!window.API_BASE) window.API_BASE = "http://localhost:3000/api";

/**
 * Retorna token JWT salvo no localStorage
 * (se não existir, as rotas protegidas vão retornar 401)
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * Wrapper de requisições para minha API
 * -> Concatena API_BASE automaticamente
 * -> Injeta Authorization Bearer
 * -> Faz parse JSON (ou fallback raw)
 * -> Lança erro quando HTTP != 2xx para cair nos catch da tela
 */
async function api(path, options = {}) {
  const url = path.startsWith("http") ? path : window.API_BASE + path;

  const r = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + getToken()
    }
  });
  // Lê como texto primeiro (evita erro quando backend não manda JSON)
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!r.ok) throw new Error(data.error || data.message || ("Erro " + r.status));
  return data;
}

/**
 * Formata datas para pt-BR
 * Aceita ISO date/datetime. Se for inválido, devolve o valor original (debug).
 */
function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-BR");
}

//Mensagens por bloco (cada relatório tem uma msg própria)
//-> ok=false pinta de vermelho
function setMsg(id, msg, ok = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = ok ? "" : "crimson";
}

/**
=====FILTRO: CARREGAR SETORES NO SELECT=====
 * Preenche o select #setorFiltro para permitir filtrar bens por setor
 */
async function carregarSetoresFiltro() {
  const sel = document.getElementById("setorFiltro");
  if (!sel) return;

  const setores = await api("/setores");
  sel.innerHTML = `<option value="">(Todos)</option>`; // Opção padrão (sem filtro)
  setores.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.nome;
    sel.appendChild(opt);
  });
}

/**
 ======RELATÓRIO 1: TOTAL POR STATUS=====
 * Mostra quantos bens estão ATIVO / EMPRESTADO / BAIXADO etc.
 */
async function relTotalStatus() {
  setMsg("msgStatus", "");
  const tb = document.getElementById("tbStatus");
  tb.innerHTML = "";    // limpa tabela antes

   // GET /relatorios/total-por-status
  const rows = await api("/relatorios/total-por-status");
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="2">Sem dados</td></tr>`;
    return;
  }

    // Render simples: status + total
  rows.forEach(r => {
    tb.innerHTML += `<tr><td>${r.status}</td><td>${r.total}</td></tr>`;
  });
}

/**
=====RELATÓRIO 2: BENS EM EMPRÉSTIMO=====
 * Lista bens com empréstimo em aberto (ou atrasado),
 * incluindo colaborador, setor e datas.
 */
async function relEmprestimos() {
  setMsg("msgEmp", "");
  const tb = document.getElementById("tbEmp");
  tb.innerHTML = "";

  // GET /relatorios/bens-em-emprestimo
  const rows = await api("/relatorios/bens-em-emprestimo");
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="6">Nenhum empréstimo em aberto</td></tr>`;
    return;
  }
  rows.forEach(e => {
    tb.innerHTML += `
      <tr>
        <td>${e.numero_patrimonio}</td>
        <td>${e.descricao}</td>
        <td>${e.colaborador_nome}</td>
        <td>${e.setor_nome || "-"}</td>
        <td>${fmt(e.data_emprestimo)}</td>
        <td>${e.data_prevista_devolucao ? fmt(e.data_prevista_devolucao) : "-"}</td>
      </tr>
    `;
  });
}

/**
 * =====RELATÓRIO 3: BENS POR SETOR (com filtro)=====
 * -> Se setorFiltro estiver vazio: traz todos
 * -> Se tiver setor_id: manda querystring para filtrar no backend
 */
async function relBensPorSetor() {
  setMsg("msgSetor", "");
  const tb = document.getElementById("tbSetor");
  tb.innerHTML = "";

  // Lê o setor selecionado no filtro
  const setor_id = document.getElementById("setorFiltro").value;

  // Monta URL com ou sem filtro (evita duplicar função) 
  const url = setor_id
    ? `/relatorios/bens-por-setor?setor_id=${encodeURIComponent(setor_id)}`
    : `/relatorios/bens-por-setor`;

  const rows = await api(url);

  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="5">Sem bens para este filtro</td></tr>`;
    return;
  }

  rows.forEach(b => {
    tb.innerHTML += `
      <tr>
        <td>${b.numero_patrimonio}</td>
        <td>${b.descricao}</td>
        <td>${b.status}</td>
        <td>${b.setor_nome || "-"}</td>
        <td>${b.responsavel_nome || "-"}</td>
      </tr>
    `;
  });
}

/**
=====RELATÓRIO 4: HISTÓRICO POR PLAQUETA=====
 * Busca:
 * -> Dados do bem (resumo)
 * -> Lista de eventos (empréstimos, transferências, baixa, etc.)
 */
async function relHistorico() {
  setMsg("msgHist", "");
  const tb = document.getElementById("tbHist");
  tb.innerHTML = "";

  // Plaqueta digitada pelo usuário
  const plaqueta = (document.getElementById("plaquetaHist").value || "").trim();

   // Validação rápida
  if (!plaqueta) return setMsg("msgHist", "Informe uma plaqueta.", false);

  const data = await api(`/relatorios/historico/${encodeURIComponent(plaqueta)}`);
 
  // GET /relatorios/historico/:plaqueta
  const b = data.bem;
  document.getElementById("bemResumo").textContent =
    `${b.numero_patrimonio} - ${b.descricao} | Status: ${b.status} | Setor: ${b.setor_nome || "-"} | Resp: ${b.responsavel_nome || "-"}`;

  // Tabela de eventos
  const eventos = data.eventos || [];
  if (!eventos.length) {
    tb.innerHTML = `<tr><td colspan="4">Nenhum evento encontrado</td></tr>`;
    return;
  }

  eventos.forEach(ev => {
    tb.innerHTML += `
      <tr>
        <td>${fmt(ev.data_evento)}</td>
        <td>${ev.tipo}</td>
        <td>${ev.titulo || ""}</td>
        <td>${ev.detalhes || ""}</td>
      </tr>
    `;
  });
}

/**
 * ====INIT====
 * -> Carrega setores no filtro
 * -> Liga botões de cada relatório
 * -> Opcional: já carrega total por status ao abrir a tela
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await carregarSetoresFiltro();      // Primeiro: carrega filtro de setores

    // Botão: Total por status
    document.getElementById("btnStatus").addEventListener("click", () => {
      relTotalStatus().catch(err => setMsg("msgStatus", err.message, false));
    });

    // Botão: Empréstimos em aberto
    document.getElementById("btnEmprestimos").addEventListener("click", () => {
      relEmprestimos().catch(err => setMsg("msgEmp", err.message, false));
    });

     // Botão: Bens por setor (usa filtro)
    document.getElementById("btnSetor").addEventListener("click", () => {
      relBensPorSetor().catch(err => setMsg("msgSetor", err.message, false));
    });

     // Botão: Histórico por plaqueta
    document.getElementById("btnHist").addEventListener("click", () => {
      relHistorico().catch(err => setMsg("msgHist", err.message, false));
    });

    //Opcional: já carregar um relatório "default" quando abre a página
    await relTotalStatus();
  } catch (err) {
    console.error(err);
  }
});