const THEME_KEY = "razarth-theme";

function getPreferredTheme() {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, refs) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(THEME_KEY, theme);
  if (!refs.themeToggle || !refs.themeToggleLabel) return;
  const isDark = theme === "dark";
  refs.themeToggle.setAttribute("aria-pressed", String(isDark));
  refs.themeToggleLabel.textContent = isDark ? "Tema claro" : "Tema escuro";
  window.dispatchEvent(new CustomEvent("app-theme-change", { detail: { theme } }));
}

function startClock(refs) {
  if (!refs.currentDate || !refs.currentTime || !refs.currentWeekday) return () => {};

  const renderClock = () => {
    const now = new Date();
    refs.currentDate.textContent = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    refs.currentWeekday.textContent = now.toLocaleDateString("pt-BR", { weekday: "long" });
    refs.currentTime.textContent = now.toLocaleTimeString("pt-BR");
  };

  renderClock();
  const timer = window.setInterval(renderClock, 1000);
  return () => window.clearInterval(timer);
}

function registerThemeListener(refs) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemThemeChange = (event) => {
    if (window.localStorage.getItem(THEME_KEY)) return;
    applyTheme(event.matches ? "dark" : "light", refs);
  };

  if (typeof mediaQuery.addEventListener === "function") mediaQuery.addEventListener("change", onSystemThemeChange);
  else mediaQuery.addListener(onSystemThemeChange);

  return () => {
    if (typeof mediaQuery.removeEventListener === "function") mediaQuery.removeEventListener("change", onSystemThemeChange);
    else mediaQuery.removeListener(onSystemThemeChange);
  };
}

export function touchLastSync(refs, message = "Atualizado agora") {
  if (!refs.lastSyncLabel) return;
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  refs.lastSyncLabel.textContent = `${message} as ${time}.`;
}

export function registerAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      if (window.caches?.keys) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      if (navigator.serviceWorker.getRegistrations) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.error("Falha ao registrar service worker.", error);
    }
  });
}

export function initUi(refs) {
  const theme = getPreferredTheme();
  applyTheme(theme, refs);

  refs.themeToggle?.addEventListener("click", () => {
    const nextTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(nextTheme, refs);
  });

  const stopClock = startClock(refs);
  const removeThemeListener = registerThemeListener(refs);
  touchLastSync(refs, "Painel iniciado");
  registerAppServiceWorker();

  return () => {
    stopClock();
    removeThemeListener();
  };
}
