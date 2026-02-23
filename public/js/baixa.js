//Definir base da API
if (!window.API_BASE) window.API_BASE = "http://localhost:3000/api";

//Guardar o "bem" encontrado para usar no POST da baixa, e evitar dar baixa sem pesquisar antes
let bemAtual = null;

//Pega o token salvo no LocalStorage(gerado no Login)
function getToken() {
  return localStorage.getItem("token");
}

async function api(path, options = {}) {

// Se vier URL completa (http...), usa ela; senão concatena com API_BASE
  const url = path.startsWith("http") ? path : window.API_BASE + path;

  const r = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + getToken() //Token obrigatorio em rotas protegidas
    }
  });

// Ler como texto p/ não quebrar caso API retorne algo que não seja JSON
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; } //FALLBACK
 
// Se não for 2xx, joga erro para cair no catch do front e mostrar mensagem
  if (!r.ok) throw new Error(data.error || data.message || ("Erro " + r.status));
  return data;
}

//Mensagens no topo da tela
function setMsg(texto, ok = true) {   //ok = true : cor padrão, ok = false: destaque em vermelho
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = texto || "";
  el.style.color = ok ? "" : "crimson";
}

//buscar bem pela plaqueta digitada, atualiza o bemAtual e bloqueia se o bem já estiver sido baixado
async function buscarBemPorPlaqueta() {
  setMsg("");

// evitar string vazia / espaços
  const plaqueta = (document.getElementById("plaqueta").value || "").trim();
  if (!plaqueta) return setMsg("Informe a plaqueta.", false);

// GET /bens/por-plaqueta/:plaqueta
  const bem = await api("/bens/por-plaqueta/" + encodeURIComponent(plaqueta));

// Mostra um resumo do bem na tela (para o usuário confirmar se é o item certo)
  document.getElementById("bemInfo").textContent =
    `${bem.numero_patrimonio} - ${bem.descricao} (${bem.status})`;

// Se já está baixado, não deixa registrar nova baixa
  if (bem.status === "BAIXADO") {
    bemAtual = null;
    return setMsg("Este bem já está BAIXADO.", false);
  }

// Se chegar aqui, o bem é válido para registrar baixa
  bemAtual = bem;
  setMsg("Bem encontrado ✅");
}

//Registro de baixa, Envia POST / baixas com payloaad necessario
async function registrarBaixa(e) {
  e.preventDefault();   // evita reload do form
  setMsg("");

// Segurança: não deixa enviar se não buscou/selecionou o bem
  if (!bemAtual) return setMsg("Busque o bem pela plaqueta antes.", false);// Campos do formulário
  const data_baixa = document.getElementById("dataBaixa").value; // YYYY-MM-DD
  const tipo = document.getElementById("tipo").value;            // ENUM
  const motivo = (document.getElementById("motivo").value || "").trim() || null;
  const descricao_motivo = (document.getElementById("descricaoMotivo").value || "").trim() || null;
 
// Validações mínimas
  if (!data_baixa) return setMsg("Informe a data da baixa.", false);
  if (!tipo) return setMsg("Selecione o tipo.", false);

// POST /baixas
  // Obs: bem_id vem do bemAtual.id (resultado da busca)
  await api("/baixas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bem_id: bemAtual.id,
      data_baixa,
      tipo,
      motivo,
      descricao_motivo
    })
  });

// Feedback para usuário  
  setMsg("Baixa registrada com sucesso ✅");
  alert("Baixa registrada!");

  // limpar tela, evita baixa duplicada por engano
  bemAtual = null;
  document.getElementById("plaqueta").value = "";
  document.getElementById("bemInfo").textContent = "";
  document.getElementById("motivo").value = "";
  document.getElementById("descricaoMotivo").value = "";
}

// Botão buscar. enter no campo plaqueta e submit do form
document.addEventListener("DOMContentLoaded", () => {
  const btnBuscar = document.getElementById("btnBuscar");
  const form = document.getElementById("formBaixa");
  const plaqueta = document.getElementById("plaqueta");
  const dataEl = document.getElementById("dataBaixa"); //set data padrão como hoje

   // Se algum ID não existe, já acusa no console (evita erro silencioso)
  if (!btnBuscar || !form || !plaqueta) {
    console.error("IDs faltando: btnBuscar, formBaixa, plaqueta");
    return;
  }

  // data padrão hoje, formato YYYY-MM-DD
  if (dataEl && !dataEl.value) dataEl.value = new Date().toISOString().slice(0, 10);

// clique no botaão buscar  
  btnBuscar.addEventListener("click", (e) => {
    e.preventDefault();
    buscarBemPorPlaqueta().catch(err => setMsg(err.message, false));
  });

// Enter dentro do input de plaqueta também busca  
  plaqueta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarBemPorPlaqueta().catch(err => setMsg(err.message, false));
    }
  });

// Submit do formulário registra a baixa
  form.addEventListener("submit", (e) => {
    registrarBaixa(e).catch(err => setMsg(err.message, false));
  });
});