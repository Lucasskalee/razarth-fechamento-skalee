import { escapeHtml } from "../services/classificacao.js?v=20260428-2";

export function renderInsightsPanel(container, insights = [], onInvestigate) {
  if (!container) return;

  if (!insights.length) {
    container.innerHTML = `
      <div class="panel-head">
        <div>
          <span class="panel-tag">Insights automáticos</span>
          <h3>Insights detectados</h3>
          <p class="muted-note">Análise contínua de desvios, metas e concentrações no recorte atual.</p>
        </div>
      </div>
      <div class="ai-insights-empty">
        <span class="ai-insights-empty-icon">✨</span>
        <p>Nenhuma anomalia crítica ou desvio atípico detectado no período selecionado.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="panel-head">
      <div>
        <span class="panel-tag">Insights automáticos</span>
        <h3>Insights detectados (${insights.length})</h3>
        <p class="muted-note">Padrões e anomalias calculados automaticamente sobre os dados do fechamento.</p>
      </div>
    </div>
    <div class="ai-insights-list">
      ${insights.map((ins, index) => `
        <article class="ai-insight-card is-${ins.type || 'info'}">
          <div class="ai-insight-header">
            <span class="status-badge ${ins.type === 'danger' ? 'danger' : (ins.type === 'warning' ? 'warning' : 'success')}">
              ${escapeHtml(ins.tag || 'Insight')}
            </span>
            <button type="button" class="ai-insight-action-btn" data-insight-idx="${index}">
              Investigar com IA →
            </button>
          </div>
          <strong class="ai-insight-title">${escapeHtml(ins.title)}</strong>
          <p class="ai-insight-desc">${escapeHtml(ins.description)}</p>
        </article>
      `).join("")}
    </div>
  `;

  container.querySelectorAll(".ai-insight-action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-insight-idx"));
      const item = insights[idx];
      if (item && typeof onInvestigate === "function") {
        onInvestigate(item.actionPrompt || item.title);
      }
    });
  });
}
