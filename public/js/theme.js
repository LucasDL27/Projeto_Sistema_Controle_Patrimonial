/* js/theme.js */
(function () {
    const KEY = "theme"; // "dark" | "light"
    const root = document.documentElement;
  
    function applyTheme(theme) {
      // Padrão do sistema = escuro (sem atributo)
      if (theme === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme"); // dark padrão
    }
  
    function getSavedTheme() {
      return localStorage.getItem(KEY); // "dark" | "light" | null
    }
  
    function setSavedTheme(theme) {
      localStorage.setItem(KEY, theme);
    }
  
    function updateThemeButton(theme) {
      const btn = document.getElementById("btnTema");
      if (!btn) return;
  
      const isLight = theme === "light";
      btn.textContent = isLight ? "🌞 Claro" : "🌙 Escuro";
      btn.setAttribute("aria-label", isLight ? "Ativar modo escuro" : "Ativar modo claro");
      btn.setAttribute("title", isLight ? "Ativar modo escuro" : "Ativar modo claro");
    }
  
    function getCurrentTheme() {
      // Se tem atributo light, é light; caso contrário, é dark (padrão)
      return root.getAttribute("data-theme") === "light" ? "light" : "dark";
    }
  
    function toggleTheme() {
      const current = getCurrentTheme();
      const next = current === "dark" ? "light" : "dark";
      setSavedTheme(next);
      applyTheme(next);
      updateThemeButton(next);
    }
  
    // aplica tema salvo ao carregar (dark como padrão)
    const saved = getSavedTheme();
    applyTheme(saved === "light" ? "light" : "dark");
  
    // expõe se você quiser usar onclick
    window.toggleTheme = toggleTheme;
  
    // DOM ready
    window.addEventListener("DOMContentLoaded", () => {
      // Menu pode vir depois via fetch(menu.html). Então:
      // 1) tenta ligar no botão agora
      // 2) observa o DOM para ligar quando o botão aparecer
      function bindThemeButtonIfExists() {
        const btn = document.getElementById("btnTema");
        if (!btn) return false;
  
        // evita registrar evento duplicado
        if (!btn.dataset.bound) {
          btn.addEventListener("click", toggleTheme);
          btn.dataset.bound = "1";
        }
  
        updateThemeButton(getCurrentTheme());
        return true;
      }
  
      // tenta já
      bindThemeButtonIfExists();
  
      // observa inserções (ex: menu.html inserido depois)
      const obs = new MutationObserver(() => {
        if (bindThemeButtonIfExists()) obs.disconnect();
      });
  
      obs.observe(document.body, { childList: true, subtree: true });
    });
  })();
  
  /* Marcar link ativo automaticamente (funciona mesmo com menu via fetch) */
  (function () {
    function markActiveLinks() {
      const path = (window.location.pathname.split("/").pop() || "").toLowerCase();
  
      document.querySelectorAll(".menu a[data-page]").forEach(link => {
        const key = (link.getAttribute("data-page") || "").toLowerCase();
        if (key && path.includes(key)) link.classList.add("active");
      });
    }
  
    // Se menu já existe
    document.addEventListener("DOMContentLoaded", () => {
      markActiveLinks();
  
      // Se menu entrar depois
      const obs = new MutationObserver(() => markActiveLinks());
      obs.observe(document.body, { childList: true, subtree: true });
    });
  })();