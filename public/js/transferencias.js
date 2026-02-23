// =========================
// TRANSFERÊNCIAS (FRONT-END)
// =========================

//Base da API: evita redeclaration e permite reaproveitar em várias páginas
if (!window.API_BASE) window.API_BASE = "http://localhost:3000/api";

// Guarda o bem encontrado para usar no POST da transferência
// (evitar que o usuário transferir sem pesquisar primeiro)
let bemAtual = null;

function getToken() {
  return localStorage.getItem("token");
}

async function api(path, options = {}) {
  const url = path.startsWith("http") ? path : window.API_BASE + path; 

  const r = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + getToken()
    }
  });

  // Leio como texto primeiro para não quebrar quando vier algo não-JSON
  const text = await r.text();
  
  // Tenta converter para JSON; se falhar, guarda resposta crua para debug
  let data = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!r.ok) throw new Error(data.error || ("Erro " + r.status));  // Padroniza erro
  return data;
}

/**
 * Mensagem na tela (elemento #msg)
 * ok=false deixa vermelho (erro)
 */
function setMsg(texto, ok = true) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = texto || "";
  el.style.color = ok ? "" : "crimson";
}

/**
=====CARREGAR SETORES (SELECTS)=====
 * -> Popula o select de destino com todos os setores
 * -> Deixa o select de origem vazio/padrão (será preenchido quando buscar o bem)
 */
async function carregarSetores() {
  const setores = await api("/setores");

    // Select de destino (usuário escolhe)
  const destino = document.getElementById("setorDestinoId");
  destino.innerHTML = `<option value="">(Selecione)</option>`;
  setores.forEach(s => destino.innerHTML += `<option value="${s.id}">${s.nome}</option>`);

  // Select de origem (informativo - preenchido ao buscar bem)
  const origem = document.getElementById("setorOrigemId");
  origem.innerHTML = `<option value="">(Origem)</option>`;
}

/**
====CARREGAR COLABORADORES (SELECTS)=====
 * -> Popula o select de responsável de destino com colaboradores
 * -> Origem fica padrão (será preenchido quando buscar o bem)
 */
async function carregarColaboradores() {
  const colabs = await api("/colaboradores");

   // Responsável de destino (usuário escolhe)
  const respDestino = document.getElementById("respDestinoId");
  respDestino.innerHTML = `<option value="">(Selecione)</option>`;
  colabs.forEach(c => respDestino.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

  // Responsável de origem (informativo)
  const respOrigem = document.getElementById("respOrigemId");
  respOrigem.innerHTML = `<option value="">(Origem)</option>`;
}

/**
 =====BUSCAR BEM PELA PLAQUETA=====
 * -> Consulta /bens/por-plaqueta/:plaqueta
 * -> Preenche resumo do bem na tela
 * -> Preenche setor/responsável de origem automaticamente
 * -> Atualiza bemAtual para permitir transferir
 */
async function buscarBemPorPlaqueta() {
  setMsg("");

   // Sanitiza entrada
  const plaqueta = (document.getElementById("plaqueta").value || "").trim();
  if (!plaqueta) return setMsg("Informe a plaqueta.", false);

   // GET bem por plaqueta
  const bem = await api("/bens/por-plaqueta/" + encodeURIComponent(plaqueta));
  bemAtual = bem;

  // Mostra o bem encontrado (confirmação visual)
  document.getElementById("bemInfo").textContent =
    `${bem.numero_patrimonio} - ${bem.descricao} | Status: ${bem.status}`;

  // Preenche "origem" com os dados do bem (somente leitura/indicativo)
  document.getElementById("setorOrigemId").innerHTML =
    `<option value="${bem.setor_id || ""}">${bem.setor_nome || "(Sem setor)"}</option>`;

  document.getElementById("respOrigemId").innerHTML =
    `<option value="${bem.responsavel_id || ""}">${bem.responsavel_nome || "(Sem responsável)"}</option>`;

  setMsg("Bem encontrado ✅");
}

/**
 ====REGISTRAR TRANSFERÊNCIA (POST)====
 * Regras:
 * -> Só registra se bemAtual existir (usuário buscou antes)
 * -> Destino não pode ser igual à origem
 * -> Exige setor e responsável de destino
 */
async function registrarTransferencia(e) {
  e.preventDefault();
  setMsg("");

  // Segurança: evita POST sem ter escolhido o bem
  if (!bemAtual) return setMsg("Busque o bem pela plaqueta antes.", false);

  // Converte IDs para number para evitar enviar string
  const setorDestinoId = Number(document.getElementById("setorDestinoId").value);
  const respDestinoId = Number(document.getElementById("respDestinoId").value);
  const motivo = (document.getElementById("motivo").value || "").trim();

   // Validações básicas
  if (!setorDestinoId) return setMsg("Selecione o setor de destino.", false);
  if (!respDestinoId) return setMsg("Selecione o responsável de destino.", false);

  // Regra: destino diferente da origem
  if (bemAtual.setor_id && setorDestinoId === Number(bemAtual.setor_id)) {
    return setMsg("Destino não pode ser igual à origem.", false);
  }

   // POST /transferencias
  await api("/transferencias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bem_id: bemAtual.id,
      setor_destino_id: setorDestinoId,
      responsavel_destino_id: respDestinoId,
      motivo     // pode ser vazio, mas envio para histórico
    })
  });

   // Feedback
  setMsg("Transferência registrada com sucesso ✅");
  alert("Transferência registrada!");

  // limpar 
  // Evita o usuário clicar de novo e mandar outra transferência por engano
  bemAtual = null;
  bemAtual = null;
  document.getElementById("bemInfo").textContent = "";
  document.getElementById("plaqueta").value = "";
  document.getElementById("setorOrigemId").innerHTML = `<option value="">(Origem)</option>`;
  document.getElementById("respOrigemId").innerHTML = `<option value="">(Origem)</option>`;
  document.getElementById("setorDestinoId").value = "";
  document.getElementById("respDestinoId").value = "";
  document.getElementById("motivo").value = "";
}

/**
====INIT====
 * -> Configura botões/eventos
 * -> Carrega listas iniciais (setores e colaboradores)
 */
document.addEventListener("DOMContentLoaded", () => {
  const btnBuscar = document.getElementById("btnBuscar");
  const form = document.getElementById("formTransferencia");
  const plaqueta = document.getElementById("plaqueta");

  // Se algum ID não existir, já acusa no console (evita erro silencioso)
  if (!btnBuscar || !form || !plaqueta) {
    console.error("IDs faltando: btnBuscar, formTransferencia, plaqueta");
    return;
  }
  // Clique no botão buscar
  btnBuscar.addEventListener("click", (e) => {
    e.preventDefault();
    buscarBemPorPlaqueta().catch(err => setMsg(err.message, false));
  });

   // Enter no input de plaqueta também busca (melhora UX)
  plaqueta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarBemPorPlaqueta().catch(err => setMsg(err.message, false));
    }
  });

  // Submit do form registra transferência
  form.addEventListener("submit", (e) => {
    registrarTransferencia(e).catch(err => setMsg(err.message, false));
  });
  
  // Carrega combos iniciais (destino)
  carregarSetores().catch(err => setMsg(err.message, false));
  carregarColaboradores().catch(err => setMsg(err.message, false));
});