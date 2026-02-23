// URL base da API (backend rodando localmente)
const API = "http://localhost:3000/api";

/**
====LOGIN=====
 * -> Captura email e senha
 * -> Envia POST /auth/login
 * -> Se sucesso, salva token no localStorage
 * -> Redireciona para dashboard
 */
document.getElementById("btnLogin").addEventListener("click", async () => {
  // Pega valores digitados (trim remove espaços extras no email)
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  const r = await fetch(API + "/auth/login", {  //Requisição para autenticação
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  });

  const data = await r.json();

   // Se backend retornar erro (401, 400, etc.)
  if (!r.ok) return alert(data.error || "Erro no login");

  // Salva token JWT no navegador
  localStorage.setItem("token", data.token);
  window.location.href = "dashboard.html";    // Redireciona para página principal do sistema
});

/**
 * ====TOGGLE VISIBILIDADE SENHA====
 * -> Alterna entre password e text
 * -> Atualiza ícone (lucide)
 */
document.addEventListener("DOMContentLoaded", () => {
  const senha = document.getElementById("senha");
  const toggle = document.querySelector(".toggle-eye i");
  
  document.querySelector(".toggle-eye").addEventListener("click", () => {
    // Se estiver oculto, mostra
    if (senha.type === "password") {
      senha.type = "text";
      toggle.setAttribute("data-lucide", "eye-off");
    } else {
      // Se estiver visível, oculta
      senha.type = "password";
      toggle.setAttribute("data-lucide", "eye");
    }

    // Re-renderiza ícones do Lucide
    // Necessário porque estamos alterando o atributo data-lucide dinamicamente
    lucide.createIcons();
});
});  