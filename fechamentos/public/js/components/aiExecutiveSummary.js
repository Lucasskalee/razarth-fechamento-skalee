import { escapeHtml, brl, num } from "../services/classificacao.js?v=20260428-2";

export function showExecutiveSummaryModal(summaryData) {
  let modal = document.getElementById("aiExecutiveSummaryModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "aiExecutiveSummaryModal";
    modal.className = "modal-shell ai-summary-modal-shell";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="ai-summary-modal-card" role="dialog" aria-modal="true" aria-labelledby="summaryModalTitle">
      <div class="ai-summary-modal-head">
        <div>
          <span class="panel-tag">Relatório Executivo</span>
          <h3 id="summaryModalTitle">Resumo Executivo do Fechamento</h3>
          <p class="muted-note">Período: ${escapeHtml(summaryData.periodo)}</p>
        </div>
        <button id="closeSummaryModalBtn" class="ai-modal-close" type="button" aria-label="Fechar">✕</button>
      </div>

      <div class="ai-summary-modal-body">
        <div class="ai-summary-highlight-box">
          <div class="ai-summary-lead-text">
            <p>${escapeHtml(summaryData.resumoTexto)}</p>
          </div>
        </div>

        <div class="ai-summary-kpis-grid">
          ${summaryData.metricas.map((m) => `
            <div class="ai-summary-kpi">
              <span class="ai-summary-kpi-label">${escapeHtml(m.label)}</span>
              <strong class="ai-summary-kpi-val">${escapeHtml(String(m.value))}</strong>
              <small class="ai-summary-kpi-comp">${escapeHtml(m.comp || "")}</small>
            </div>
          `).join("")}
        </div>

        ${summaryData.setoresCriticos && summaryData.setoresCriticos.length ? `
          <div class="ai-summary-section">
            <h4>Setores com Maior Concentração</h4>
            <div class="ai-summary-sector-list">
              ${summaryData.setoresCriticos.map((s) => `
                <div class="ai-summary-sector-item">
                  <div class="ai-sum-sec-info">
                    <strong>${escapeHtml(s.sector)}</strong>
                    <small>Principal motivo: ${escapeHtml(s.mainReason || "Sem motivo")}</small>
                  </div>
                  <div class="ai-sum-sec-vals">
                    <strong>${brl(s.value)}</strong>
                    <span class="status-badge warning">${num(s.percent)}% do total</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${summaryData.acoesPrioritarias && summaryData.acoesPrioritarias.length ? `
          <div class="ai-summary-section">
            <h4>Recomendações e Ações Prioritárias</h4>
            <ul class="ai-summary-actions-list">
              ${summaryData.acoesPrioritarias.map((action) => `
                <li>
                  <span class="ai-action-bullet">▸</span>
                  <span>${escapeHtml(action)}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        ` : ""}
      </div>

      <div class="ai-summary-modal-footer">
        <button id="copySummaryBtn" class="ai-copy-btn" type="button">
          📋 Copiar Texto do Resumo
        </button>
        <button id="printSummaryBtn" class="ai-subtle-btn" type="button">
          🖨️ Imprimir
        </button>
        <button id="dismissSummaryBtn" class="ai-secondary-btn" type="button">
          Fechar
        </button>
      </div>
    </div>
  `;

  modal.hidden = false;

  const close = () => {
    modal.hidden = true;
  };

  modal.querySelector("#closeSummaryModalBtn").addEventListener("click", close);
  modal.querySelector("#dismissSummaryBtn").addEventListener("click", close);

  modal.querySelector("#copySummaryBtn").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(summaryData.resumoTexto);
      const btn = e.currentTarget;
      const original = btn.innerHTML;
      btn.innerHTML = "✅ Resumo Copiado!";
      setTimeout(() => { btn.innerHTML = original; }, 2500);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  });

  modal.querySelector("#printSummaryBtn").addEventListener("click", () => {
    window.print();
  });
}
