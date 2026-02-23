// js/bens.js
// Cache local da lista de bens para:
// evitar ficar pedindo pra API toda vez que filtra
// permitir render rápido e filtro instantâneo
let bensCache = [];

/* =====API GET =====*/

//Recebe um path (ex: "/api/bens")
//Envia Authorization Bearer automaticamente
//Loga a resposta crua pra facilitar debug no início do projeto
async function apiGet(path) {
  const token = localStorage.getItem("token"); // token salvo no login

  const r = await fetch(path, {
    headers: { Authorization: "Bearer " + token }
  });
// Leio como texto primeiro para não quebrar caso venha HTML/erro não-JSON
  const text = await r.text();

//Logs úteis: mostram status e resposta da API no console (debug)  
  console.log("GET", path, "status:", r.status);
  console.log("Resposta crua:", text);

//Tenta parsear JSON; se não der, guarda no campo raw para inspecionar  
  let data = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

// Se a API respondeu erro (status != 2xx), lançar erro pra tratar no try/catch
  if (!r.ok) throw new Error(data.error || ("Erro " + r.status));
  return data;
}

/* ====MENSAGENS (UI)=====*/
//Mostra mensagens no topo (sucesso/erro/muted)
//Depende das classes CSS: .success .error .muted
function setMsg(text, type = "") {
  const msg = document.getElementById("msg");
  if (!msg) return;

 // Limpa classes antigas antes de aplicar a nova
  msg.classList.remove("success", "error", "muted");
  if (type) msg.classList.add(type);  // Se veio tipo (success/error), usa; se não, deixa "muted" (neutro)
  else msg.classList.add("muted");

  msg.textContent = text || "";
}

/* ====BADGES STATUs====*/
//Converte status do bem em badge HTML
//Obs: deixo padronizado em UPPERCASE pra não depender do formato da API
function badgeStatus(status) {
  if (!status) return "";

  const s = String(status).toUpperCase();

  //Classes CSS diferentes para cada situação, diferencia visualmente e ajuda
  if (s === "ATIVO") return `<span class="badge ativo">ATIVO</span>`;
  if (s === "EMPRESTADO") return `<span class="badge emprestado">EMPRESTADO</span>`;
  if (s === "BAIXADO") return `<span class="badge baixado">BAIXADO</span>`;

  //fallback: caso a API crie novos status no futuro
  return `<span class="badge">${s}</span>`;
}

/* ====RENDER TABELA=====*/
//Renderiza a tabela de bens no <tbody id="tabelaBens">
// Recebe uma lista já filtrada
//Monta HTML com map/join (rápido e simples)
function render(lista) {
  const tb = document.getElementById("tabelaBens");
  if (!tb) return;

// Sempre limpa antes (evita "duplicar" linhas)
  tb.innerHTML = "";

// Se não tiver itens, mostra mensagem ocupando a linha toda
  if (!lista.length) {
    tb.innerHTML = `<tr><td colspan="6" class="muted">Nenhum bem encontrado</td></tr>`;
    return;
  }

// Observação: injetando HTML (badgeStatus + campos)
  tb.innerHTML = lista.map(b => `
    <tr>
      <td>${b.numero_patrimonio ?? ""}</td>
      <td>${b.descricao ?? ""}</td>
      <td>${formatarMoeda(b.valor_aquisicao)}</td>
      <td>${badgeStatus(b.status)}</td>
      <td>${b.setor_nome || "-"}</td>
      <td>${b.responsavel_nome || "-"}</td>
      <td>
        <button class="btn small" type="button" onclick="editar(${b.id})">Editar</button>
      </td>
    </tr>
  `).join("");
}

//Formata valor em moeda (BRL)
//Trata null/undefined/string vazia
//Trata NaN
function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const n = Number(valor);
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" 
  });
}

/* ====FILTRO=====*/
//Filtra a lista em memória (bensCache) e re-renderiza
//filtro por texto (patrimônio ou descrição)
//filtro por status (select)
function aplicarFiltro() {
  const buscaEl = document.getElementById("busca");
  const statusEl = document.getElementById("filtroStatus");

//Normaliza termo para facilitar comparação
  const termo = (buscaEl?.value || "").toLowerCase();
  const status = statusEl?.value || "";

//Começa com tudo do cache
  let lista = [...bensCache];

//Filtro por termo 
  if (termo) {
    lista = lista.filter(b =>
      (b.numero_patrimonio || "").toLowerCase().includes(termo) ||
      (b.descricao || "").toLowerCase().includes(termo)
    );
  }
//Filtro por status
  if (status) lista = lista.filter(b => (b.status || "") === status);

//Renderiza resultado final
  render(lista);
}

/* ====EDITAR (PUT)====*/
//Edita a descrição do bem via PUT
//Pega o item no cache
//Abre prompt para nova descrição (simples e funcional)
//Envia PUT /api/bens/:id com { descricao }
async function editar(id) {
  const bem = bensCache.find(x => x.id === id);
  const nova = prompt("Nova descrição:", bem?.descricao || "");
  if (nova === null) return; // cancelou

  try {
    const token = localStorage.getItem("token");
    const r = await fetch("/api/bens/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ descricao: nova })
    });

// Ler texto primeiro e tenta converter para JSON (estratégia igual do GET)
    const respText = await r.text();
    let resp = {};
    try { resp = JSON.parse(respText); } catch { resp = { raw: respText }; }

// Se falhar, mostra mensagem e não continua
    if (!r.ok) {
      setMsg(resp.error || "Erro ao atualizar", "error");
      return;
    }
// Se ok, atualiza UI e recarrega lista para refletir no cache/tabela
    setMsg("Descrição atualizada com sucesso.", "success");
    await carregar();
  } catch (e) {
    setMsg("Erro: " + e.message, "error");
    console.error(e);
  }
}

/* =====CARREGAR LISTA==== */
//Carrega bens da API e salva no cache
//Depois aplica o filtro (que também renderiza)
async function carregar() {
  console.log("URL atual:", window.location.href);
  console.log("Token no navegador:", localStorage.getItem("token"));

  try {
// GET /api/bens (retorna array)
    const bens = await apiGet("/api/bens");

// Garante que bensCache sempre seja array (evita quebrar filtro/render)    
    bensCache = Array.isArray(bens) ? bens : [];

// Render usando filtros atuais
    aplicarFiltro();
    setMsg("");      // Limpa mensagem se carregou corretamente
  } catch (e) {
    setMsg("Erro: " + e.message, "error");
    console.error(e);
  }
}

/* =====INIT===== */
//input na busca filtra em tempo real
//change no select de status filtra também
//carrega lista ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
  const busca = document.getElementById("busca");
  const filtro = document.getElementById("filtroStatus");

  if (busca) busca.addEventListener("input", aplicarFiltro);
  if (filtro) filtro.addEventListener("change", aplicarFiltro);

  carregar();
});