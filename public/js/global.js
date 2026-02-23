// Base da API (sempre disponível e não dá redeclaration)
if (!window.API_BASE) window.API_BASE = "http://localhost:3000/api";

/**
 * Busca o token salvo no navegador
 * Esse token é usado para autenticar as requisições na API (Authorization: Bearer ...)
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * Protege páginas internas do sistema
 * -> Se não tiver token, significa que não está logado
 * -> Então redireciono para a tela de login (index.html)
 */
function protegerPagina() {
  if (!getToken()) window.location.href = "index.html";
}

/**
 * Faz logout do usuário
 * -> Remove o token do localStorage
 * -> Redireciona para tela de login
 */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}