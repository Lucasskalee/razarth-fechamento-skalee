import { getSupabaseClient } from "../config/supabase.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureAuthModal(pageLabel = "Painel") {
  let modal = document.getElementById("authModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "authModal";
  modal.className = "modal-shell auth-modal-shell";
  modal.innerHTML = `
    <div class="modal-card auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <div class="modal-head auth-head">
        <div>
          <span class="panel-tag">Acesso restrito</span>
          <h3 id="authTitle">Entrar no Razarth</h3>
          <p class="muted-note">Use seu usuario do Supabase para abrir o ${escapeHtml(pageLabel)}.</p>
        </div>
      </div>
      <form id="authForm" class="auth-form">
        <label class="closing-field">
          <span>Email</span>
          <input id="authEmail" type="email" autocomplete="username" required placeholder="seu.email@empresa.com">
        </label>
        <label class="closing-field">
          <span>Senha</span>
          <input id="authPassword" type="password" autocomplete="current-password" required placeholder="Digite sua senha">
        </label>
        <div class="auth-actions">
          <button id="authSubmitBtn" type="submit">Entrar</button>
        </div>
        <div id="authStatus" class="status info">Informe email e senha para continuar.</div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function setAuthStatus(type, message) {
  const status = document.getElementById("authStatus");
  if (!status) return;
  status.className = `status ${type}`;
  status.textContent = message;
}

function ensureSidebarAuthControls() {
  const panel = document.querySelector(".sidebar-bottom .sidebar-panel");
  if (!panel) return {};

  let userLabel = document.getElementById("authUserLabel");
  if (!userLabel) {
    userLabel = document.createElement("p");
    userLabel.id = "authUserLabel";
    userLabel.className = "sidebar-auth-user";
    panel.appendChild(userLabel);
  }

  let logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) {
    logoutBtn = document.createElement("button");
    logoutBtn.id = "logoutBtn";
    logoutBtn.type = "button";
    logoutBtn.className = "sidebar-logout-btn";
    logoutBtn.textContent = "Sair";
    panel.appendChild(logoutBtn);
  }

  return { userLabel, logoutBtn };
}

function updateAuthUi({ user, connectionBadge, lastSyncLabel }) {
  const controls = ensureSidebarAuthControls();
  const email = user?.email || "Usuario autenticado";
  if (connectionBadge) connectionBadge.textContent = "Sessao autenticada";
  if (lastSyncLabel) lastSyncLabel.textContent = "Acesso validado no Supabase.";
  if (controls.userLabel) controls.userLabel.textContent = `Conectado: ${email}`;
}

async function openLoginModal(client, pageLabel) {
  const modal = ensureAuthModal(pageLabel);
  modal.hidden = false;

  const form = document.getElementById("authForm");
  const emailField = document.getElementById("authEmail");
  const passwordField = document.getElementById("authPassword");
  const submitBtn = document.getElementById("authSubmitBtn");

  if (!form || !emailField || !passwordField || !submitBtn) {
    throw new Error("Nao foi possivel montar o formulario de login.");
  }

  emailField.focus();

  return new Promise((resolve, reject) => {
    const onSubmit = async (event) => {
      event.preventDefault();
      const email = emailField.value.trim();
      const password = passwordField.value;

      if (!email || !password) {
        setAuthStatus("warning", "Informe email e senha para entrar.");
        return;
      }

      submitBtn.disabled = true;
      setAuthStatus("info", "Validando credenciais...");

      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const user = data?.user || null;
        if (!user) throw new Error("Login concluido, mas sem usuario na sessao.");

        form.removeEventListener("submit", onSubmit);
        modal.hidden = true;
        resolve(user);
      } catch (error) {
        setAuthStatus("error", error.message || "Nao foi possivel autenticar.");
      } finally {
        submitBtn.disabled = false;
      }
    };

    form.addEventListener("submit", onSubmit);

    const onAbort = () => {
      form.removeEventListener("submit", onSubmit);
      reject(new Error("Login cancelado."));
    };

    window.addEventListener("beforeunload", onAbort, { once: true });
  });
}

export async function ensureAuthenticated({ connectionBadge, lastSyncLabel, pageLabel = "painel" } = {}) {
  const client = getSupabaseClient();

  const { data, error } = await client.auth.getSession();
  if (error) {
    const wrapped = new Error(error.message || "Falha ao validar sessao.");
    wrapped.userMessage = "Nao foi possivel validar o login com o Supabase.";
    throw wrapped;
  }

  let user = data?.session?.user || null;
  if (!user) {
    user = await openLoginModal(client, pageLabel);
  }

  updateAuthUi({ user, connectionBadge, lastSyncLabel });

  const controls = ensureSidebarAuthControls();
  if (controls.logoutBtn && !controls.logoutBtn.dataset.boundAuth) {
    controls.logoutBtn.dataset.boundAuth = "true";
    controls.logoutBtn.addEventListener("click", async () => {
      controls.logoutBtn.disabled = true;
      try {
        await client.auth.signOut();
      } finally {
        window.location.reload();
      }
    });
  }

  return user;
}