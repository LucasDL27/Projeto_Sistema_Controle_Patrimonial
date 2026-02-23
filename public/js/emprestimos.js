// public/js/emprestimos.js
/**
 * ====CONFIG BASE DA API====
 * Deixo a base da API em uma variável global para reaproveitar em outras telas.
 * Se já existir (definida em outro script), não sobrescreve.
 */
if (!window.API_BASE) window.API_BASE = "http://localhost:3000/api";

//Lê token do localStorage (gerado no login)
//Se estiver vazio/nulo, a API deve retornar 401 nas rotas protegidas.
function getToken() {
  return localStorage.getItem("token");
}

/**
 * =====FUNÇÃO GENÉRICA DE API=====
 * -> Monta URL automaticamente
 * -> Injeta Authorization Bearer em todas as requisições
 * -> Lê resposta como texto e tenta converter para JSON (fallback raw)
 * -> Se HTTP != 2xx, lança erro (para cair nos catch da UI)
 */
async function api(path, options = {}) {
  // Se vier URL absoluta (http...), usa ela. Caso contrário concatena com API_BASE.
  const url = path.startsWith("http") ? path : window.API_BASE + path;

  const r = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + getToken()
    }
  });

// LÊ como texto primeiro para não quebrar quando backend manda HTML/erro diferente
  const text = await r.text();
  let data = {};     // Tenta converter para JSON; se não der, guarda resposta crua
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  // Padroniza a mensagem de erro para mostrar pro usuário
  if (!r.ok) throw new Error(data.error || data.message || ("Erro " + r.status));
  return data;
}

/**
 * =====MENSAGENS NA TELA=====
 * Exibe texto em um elemento específico (por id)
 * ok=false pinta de vermelho (erro)
 */
function setMsg(id, texto, ok = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texto || "";
  el.style.color = ok ? "" : "crimson";
}

/**
 * =====FORMATAR DATA======
 * Converte ISO (YYYY-MM-DD ou ISO datetime) para dd/mm/yyyy
 * Se vier inválido, retorna o valor original (ajuda no debug sem quebrar UI).
 */
function formatarData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * ====SELECT DE BENS (APENAS ATIVOS)=====
 * -> Carrega todos os bens
 * -> Filtra só status ATIVO (regra do seu backend)
 * -> Preenche o <select id="bemId">
 */
async function carregarBensSelect() {
  const sel = document.getElementById("bemId");
  if (!sel) return;

  const bens = await api("/bens");

  //Regra: só pode emprestar bens ATIVOS
  const aptos = bens.filter(b => b.status === "ATIVO");


  // Opção inicial desabilitada (obriga usuário selecionar)
  sel.innerHTML = `<option value="" disabled selected>Selecione um bem</option>`;
  aptos.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = `${b.numero_patrimonio} - ${b.descricao}`;
    sel.appendChild(opt);
  });
}

/**
 * ====SELECT DE COLABORADORES====
 * -> Carrega colaboradores
 * -> Preenche <select id="colaborador_id">
 */
async function carregarColaboradoresSelect() {
  const sel = document.getElementById("colaborador_id");
  if (!sel) return;

  const colabs = await api("/colaboradores");

  sel.innerHTML = `<option value="" disabled selected>Selecione um colaborador</option>`;
  colabs.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    sel.appendChild(opt);
  });
}

/**
 * ====LISTAR EMPRÉSTIMOS EM ABERTO====
 * -> Busca todos empréstimos
 * -> Filtra ABERTO + ATRASADO
 * -> Renderiza na tabela #tblAbertos
 */
async function carregarAbertos() {
  setMsg("msgAbertos", "");
  const tbody = document.querySelector("#tblAbertos tbody");
  if (!tbody) return;

  tbody.innerHTML = "";   // Sempre limpa antes (evita duplicar linhas)

  const lista = await api("/emprestimos");

   // Considera como "em aberto" tanto ABERTO quanto ATRASADO
  const abertos = lista.filter(e => e.status === "ABERTO" || e.status === "ATRASADO");

  if (!abertos.length) {
    tbody.innerHTML = `<tr><td colspan="5">Nenhum em aberto</td></tr>`;
    return;
  }

  abertos.forEach(e => {     // Render simples (string template)
    const bemTxt = `${e.numero_patrimonio} - ${e.descricao}`;
    tbody.innerHTML += `
      <tr>
        <td>${bemTxt}</td>
        <td>${e.colaborador}</td>
        <td>${formatarData(e.data_emprestimo)}</td>
        <td>${formatarData(e.data_prevista_devolucao)}</td>
        <td>
          <button class="btn" type="button" onclick="devolverEmprestimo(${e.id})">
            Devolver
          </button>
        </td>
      </tr>
    `;
  });
}

/**
 ====REGISTRAR NOVO EMPRÉSTIMO (POST)====
 * Fluxo:
 * 1) Valida campos
 * 2) POST /emprestimos (registra no backend e muda status do bem)
 * 3) Busca dados do bem e colaborador para montar o termo
 * 4) Abre termo em nova aba (para imprimir/salvar PDF)
 * 5) Limpa formulário + atualiza lista e selects
 */
async function registrarEmprestimo(e) {
  e.preventDefault();
  setMsg("msgNovo", "");

  // Converte para Number para evitar enviar string para API
  const bem_id = Number(document.getElementById("bemId").value);
  const colaborador_id = Number(document.getElementById("colaborador_id").value);

  // Campo opcional (pode ser null)
  const data_prevista_devolucao = document.getElementById("dataPrevista").value || null;

  // Observações/termo opcional
  const observacoes = (document.getElementById("termo").value || "").trim() || null;

  if (!bem_id) return setMsg("msgNovo", "Selecione um bem.", false);
  if (!colaborador_id) return setMsg("msgNovo", "Selecione o colaborador.", false);

  // 1) cria empréstimo no backend
  await api("/emprestimos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bem_id, colaborador_id, data_prevista_devolucao, observacoes })
  });

  // 2) busca dados completos do bem e colaborador para montar o termo
  const bens = await api("/bens");
  const bem = bens.find(x => Number(x.id) === bem_id);

  const colabs = await api("/colaboradores");
  const col = colabs.find(x => Number(x.id) === colaborador_id);

  // 3) abre o termo de empréstimo em nova aba (imprimir / salvar PDF)
  const q = new URLSearchParams({
    numero_patrimonio: bem?.numero_patrimonio || "",
    descricao: bem?.descricao || "",
    setor_nome: bem?.setor_nome || "",
    responsavel_nome: bem?.responsavel_nome || "",
    colaborador_nome: col?.nome || "",
    matricula: col?.matricula || "",
    data_saida: new Date().toLocaleDateString("pt-BR"),
    data_prevista: data_prevista_devolucao ? formatarData(data_prevista_devolucao) : "",
    observacoes: observacoes || ""
  }).toString();

  window.open("termo-emprestimo.html?" + q, "_blank");

  // 4) feedback e limpeza
  setMsg("msgNovo", "Empréstimo registrado ✅");
  alert("Empréstimo registrado!");

  // Limpa formulário e reseta data de saída pra hoje
  document.getElementById("formEmprestimo").reset();
  const dataSaida = document.getElementById("dataSaida");
  if (dataSaida) dataSaida.value = new Date().toISOString().slice(0, 10);
  
  // Atualiza listagem e select de bens (bem emprestado sai da lista de ATIVOS)
  await carregarAbertos();
  await carregarBensSelect();
}

/**
 * =====DEVOLUÇÃO DE EMPRÉSTIMO=====
 * Fluxo:
 * 1) Confirma com usuário
 * 2) Pega dados do empréstimo ANTES de devolver (para o termo)
 * 3) POST /emprestimos/:id/devolver
 * 4) Abre termo de devolução (nova aba)
 * 5) Atualiza lista e select de bens (bem volta a ATIVO)
 */
async function devolverEmprestimo(id) {
  if (!confirm("Confirmar devolução deste item?")) return;

  // 1) pega os dados ANTES de devolver, pra preencher o termo
  const listaAntes = await api("/emprestimos");
  const emp = listaAntes.find(x => Number(x.id) === Number(id));

  if (!emp) {
    return alert("Empréstimo não encontrado na listagem.");
  }

  // 2) registra devolução no backend
  await api(`/emprestimos/${id}/devolver`, { method: "POST" });

  // 3) abre termo de devolução
  const q = new URLSearchParams({
    numero_patrimonio: emp?.numero_patrimonio || "",
    descricao: emp?.descricao || "",
    colaborador_nome: emp?.colaborador || "",
    matricula: emp?.matricula ||"",
    data_saida: formatarData(emp?.data_emprestimo || ""),
    data_devolucao: new Date().toLocaleDateString("pt-BR"),
    observacoes: emp?.observacoes || ""
  }).toString();

  window.open("termo-devolucao.html?" + q, "_blank");

  // 4) atualiza tela
  alert("Devolução registrada ✅");
  await carregarAbertos();
  await carregarBensSelect();
}

// precisa ficar global porque usamos onclick no HTML da tabela
window.devolverEmprestimo = devolverEmprestimo;

/**
====INIT (quando a página carregar)====
 * -> Preenche campos/selects
 * -> Carrega empréstimos abertos
 * -> Configura submit do form
 * -> Configura botão "recarregar"
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // data saída: hoje (mesmo que o backend use CURRENT_TIMESTAMP)
    const dataSaida = document.getElementById("dataSaida");
    if (dataSaida && !dataSaida.value) dataSaida.value = new Date().toISOString().slice(0, 10);

    await carregarBensSelect();      // Carrega dados iniciais
    await carregarColaboradoresSelect();
    await carregarAbertos();

    // Submit do formulário
    const form = document.getElementById("formEmprestimo");
    if (form) {
      form.addEventListener("submit", (e) => {
        registrarEmprestimo(e).catch(err => setMsg("msgNovo", err.message, false));
      });
    }

    // Botão de recarregar listagem (sem recarregar página inteira)
    const btnRecarregar = document.getElementById("btnRecarregar");
    if (btnRecarregar) {
      btnRecarregar.addEventListener("click", (e) => {
        e.preventDefault();
        carregarAbertos().catch(err => setMsg("msgAbertos", err.message, false));
      });
    }
  } catch (err) {
    
     // Qualquer falha no init cai aqui (ex: token inválido, API fora, rota errada)
    console.error(err);
    setMsg("msgAbertos", err.message, false);
  }
});