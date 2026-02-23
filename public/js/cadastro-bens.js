//Monta o header de autenticação padrão
//Centralizei isso numa função para:
// -evitar repetir código
// -facilitar manutenção futura (ex: mudar padrão do token)
function tokenHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: "Bearer " + token };
}

/**
 * ===CARREGAR SETORES====
 * - Busca todos os setores na API
 * - Preenche o <select id="setor_id">
 */
async function carregarSetores() {
  const sel = document.getElementById("setor_id");

// Sempre começa limpando e colocando opção padrão
  sel.innerHTML = `<option value="">(Selecione)</option>`;

// GET /api/setores (rota protegida)
  const r = await fetch("/api/setores", { headers: tokenHeader() });
  const setores = await r.json();

//Preenche o select dinamicamente
  setores.forEach(s => {
    sel.innerHTML += `<option value="${s.id}">${s.nome}</option>`;
  });
}

/**
 * =====CARREGAR RESPONSÁVEIS POR SETOR=====
 * - Só carrega após escolher um setor
 * - Desabilita select até ter dados válidos
 */
async function carregarResponsaveisPorSetor(setorId) {
  const sel = document.getElementById("responsavel_id");

// padrão: desabilitado até escolher setor
  sel.disabled = true;
  sel.innerHTML = `<option value="">(Selecione um setor)</option>`;

// Se não tiver setor selecionado, não chama API
  if (!setorId) return;

// Feedback visual enquanto carrega
  sel.innerHTML = `<option value="">Carregando...</option>`;

// GET /api/colaboradores/por-setor/:id
  const r = await fetch(`/api/colaboradores/por-setor/${setorId}`, { 
  headers: tokenHeader() });
  const colabs = await r.json();

//Se não vier array ou vier vazio
  if (!Array.isArray(colabs) || colabs.length === 0) {
    sel.innerHTML = `<option value="">(Nenhum responsável no setor)</option>`;
    sel.disabled = true;
    return;
  }

//Se tiver colaboradores
  sel.innerHTML = `<option value="">(Selecione)</option>`;
  colabs.forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });

//Opcional: já selecionar o primeiro responsável do setor
  sel.value = String(colabs[0].id);
  sel.disabled = false;    // agora pode habilitar o select
}

/**=====CONFIGURAR EVENTOS=====
 * - Quando mudar setor, carrega responsáveis automaticamente */
function configurarEventos() {
  const selSetor = document.getElementById("setor_id");

  selSetor.addEventListener("change", () => {
// Converte para Number ou null (evita enviar string para API depois)
    const setorId = selSetor.value ? Number(selSetor.value) : null;
    carregarResponsaveisPorSetor(setorId);
  });
}

/**
 * =====SALVAR BEM (POST)=====
 * - Valida campos obrigatórios
 * - Monta payload
 * - Envia POST /api/bens
 */
document.getElementById("btnSalvar").addEventListener("click", async () => {
  const token = localStorage.getItem("token");

//Segurança básica: se não tiver token, redireciona para login
  if (!token) {
    alert("Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

// Monta objeto para enviar para API
  const payload = {
    numero_patrimonio: document.getElementById("numero").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),

// Se valor estiver preenchido, converte para Number
    valor_aquisicao: document.getElementById("valor").value ? Number(document.getElementById("valor").value) : null,

// Se não tiver data, envia null   
    data_aquisicao: document.getElementById("data").value || null,

// Converte selects para Number (evita enviar string)
    setor_id: document.getElementById("setor_id").value ? Number(document.getElementById("setor_id").value) : null,
    responsavel_id: document.getElementById("responsavel_id").value ? Number(document.getElementById("responsavel_id").value) : null
  };

// Validações básicas no front (melhora UX)
  if (!payload.numero_patrimonio || !payload.descricao) {
    return alert("Número de patrimônio e descrição são obrigatórios!");
  }

  if (!payload.setor_id) {
    return alert("Selecione um setor!");
  }

//POST /api/bens  
  const r = await fetch("/api/bens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  const data = await r.json();

//  Mostra resposta no elemento #msg (bom para debug no desenvolvimento)  
  document.getElementById("msg").textContent = JSON.stringify(data, null, 2);

  if (r.ok) {
    alert("Bem cadastrado!");
    window.location.href = "bens.html";   // redireciona para lista
  } else {
    alert(data.error || "Erro ao cadastrar");
  }
});

/**====INIT====
 * - Carrega setores ao abrir página
 * - Configura eventos
 * - Deixa responsável desabilitado inicialmente
 * - Opcionalmente já seleciona primeiro setor
 */
(async function init() {
  await carregarSetores();   // primeiro carrega setores
  configurarEventos();      // depois ativa evento de change   

// já deixa responsável bloqueado até escolher setor
  document.getElementById("responsavel_id").disabled = true;

// opcional: selecionar 1º setor e já carregar responsável
  const selSetor = document.getElementById("setor_id");
  if (selSetor.options.length > 1) {
    selSetor.selectedIndex = 1;     // pula "(Selecione)"
    await carregarResponsaveisPorSetor(Number(selSetor.value));
  }
})();