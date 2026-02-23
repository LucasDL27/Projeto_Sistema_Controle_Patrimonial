/**
 * =========================
 * AUTENTICAÇÃO BÁSICA (FRONT-END)
 * =========================
 * O trecho garante que:
 * -> Só usuários logados acessem páginas internas
 * -> O botão "Sair" faça logout corretamente
 */

/**
 * Retorna o token salvo no navegador
 * O token foi salvo no login usando localStorage.setItem("token", ...)
 */
function getToken() {
    return localStorage.getItem("token");
  }

/**
 * Verifica se o usuário está autenticado
 * Se não tiver token, redireciona para tela de login (index.html)
 * 
 * Proteção no FRONT.
 * A proteção real mesmo está na API (middleware JWT).
 */
  function requireAuth() {
    if (!getToken()) {
      window.location.href = "index.html";
    }
  }

/**
 * ====INIT=====
 * - Ao carregar a página:
 * -> Verifica autenticação
 * -> Configura botão de logout
 */
  document.addEventListener("DOMContentLoaded", () => {
    //Bloqueia acesso se não estiver autenticado
    requireAuth();
  
  //Configura botão de sair (logout)
    document.getElementById("btnSair").addEventListener("click", () => {
      localStorage.removeItem("token");   // Remove token do navegador
      window.location.href = "index.html";   // Redireciona para login
    });
  });
  