import { escapeHtml } from "../services/classificacao.js?v=20260428-2";

const PRIORITY_META = {
  low: { label: "Baixa Prioridade", class: "success" },
  medium: { label: "Média Prioridade", class: "warning" },
  high: { label: "Alta Prioridade", class: "danger" },
  critical: { label: "Prioridade Crítica", class: "danger" }
};

const HYPOTHESIS_TYPE_META = {
  fato: { label: "FATO", class: "tag-fato" },
  correlacao: { label: "CORRELAÇÃO", class: "tag-correlacao" },
  hipotese: { label: "HIPÓTESE", class: "tag-hipotese" }
};

/**
 * Renderiza uma mensagem do chat (seja do usuário ou uma resposta estruturada do assistente)
 */
export function renderMessageHtml(message) {
  if (message.role === "user") {
    return `
      <div class="ai-chat-bubble ai-bubble-user">
        <div class="ai-bubble-author">
          <span class="ai-avatar user-avatar">Você</span>
          <span class="ai-time">${message.time || ""}</span>
        </div>
        <div class="ai-bubble-content">
          <p>${escapeHtml(message.content).replace(/\n/g, "<br>")}</p>
        </div>
      </div>
    `;
  }

  // Resposta estruturada do Assistente
  const data = message.data || {};
  const priorityInfo = PRIORITY_META[data.priority] || PRIORITY_META.medium;

  const hasStructuredData = Boolean(
    data.diagnosis || (data.evidence && data.evidence.length) || (data.hypotheses && data.hypotheses.length)
  );

  return `
    <div class="ai-chat-bubble ai-bubble-assistant">
      <div class="ai-bubble-author">
        <span class="ai-avatar bot-avatar">✨ Assistente IA</span>
        <span class="ai-time">${message.time || ""}</span>
        ${data.priority ? `<span class="status-badge ${priorityInfo.class}">${priorityInfo.label}</span>` : ""}
      </div>

      <div class="ai-bubble-content">
        ${data.answer ? `<div class="ai-answer-lead">${escapeHtml(data.answer).replace(/\n/g, "<br>")}</div>` : ""}

        ${hasStructuredData ? `
          <div class="ai-structured-card">
            ${data.diagnosis ? `
              <div class="ai-struct-section ai-struct-diagnosis">
                <div class="ai-section-title">
                  <span class="ai-section-icon">🩺</span>
                  <strong>Diagnóstico</strong>
                </div>
                <p>${escapeHtml(data.diagnosis)}</p>
              </div>
            ` : ""}

            ${data.evidence && data.evidence.length ? `
              <div class="ai-struct-section ai-struct-evidence">
                <div class="ai-section-title">
                  <span class="ai-section-icon">📊</span>
                  <strong>Evidências Numéricas</strong>
                </div>
                <div class="ai-evidence-grid">
                  ${data.evidence.map((ev) => `
                    <div class="ai-evidence-item">
                      <span class="ai-ev-label">${escapeHtml(ev.label)}</span>
                      <strong class="ai-ev-value">${escapeHtml(String(ev.value))}</strong>
                      ${ev.comparison ? `<small class="ai-ev-comp">${escapeHtml(ev.comparison)}</small>` : ""}
                    </div>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            ${data.hypotheses && data.hypotheses.length ? `
              <div class="ai-struct-section ai-struct-hypotheses">
                <div class="ai-section-title">
                  <span class="ai-section-icon">💡</span>
                  <strong>Possíveis Causas & Hipóteses</strong>
                </div>
                <ul class="ai-hypo-list">
                  ${data.hypotheses.map((h) => {
                    const tagInfo = HYPOTHESIS_TYPE_META[h.type] || HYPOTHESIS_TYPE_META.hipotese;
                    return `
                      <li class="ai-hypo-item">
                        <span class="ai-tag ${tagInfo.class}">${tagInfo.label}</span>
                        <div class="ai-hypo-body">
                          <p>${escapeHtml(h.description)}</p>
                          ${h.validation ? `<small class="ai-validation-hint">🔍 Como validar: ${escapeHtml(h.validation)}</small>` : ""}
                        </div>
                      </li>
                    `;
                  }).join("")}
                </ul>
              </div>
            ` : ""}

            ${data.impact ? `
              <div class="ai-struct-section ai-struct-impact">
                <div class="ai-section-title">
                  <span class="ai-section-icon">💥</span>
                  <strong>Impacto</strong>
                </div>
                <p>${escapeHtml(data.impact)}</p>
              </div>
            ` : ""}

            ${data.recommendations && data.recommendations.length ? `
              <div class="ai-struct-section ai-struct-actions">
                <div class="ai-section-title">
                  <span class="ai-section-icon">📋</span>
                  <strong>Ações Recomendadas</strong>
                </div>
                <ol class="ai-action-list">
                  ${data.recommendations.map((rec, idx) => `
                    <li class="ai-action-item">
                      <span class="ai-action-num">${idx + 1}</span>
                      <div class="ai-action-body">
                        <strong>${escapeHtml(rec.action)}</strong>
                        ${rec.indicator ? `<span class="ai-action-ind">Indicador: ${escapeHtml(rec.indicator)}</span>` : ""}
                      </div>
                    </li>
                  `).join("")}
                </ol>
              </div>
            ` : ""}

            ${data.conferencias && data.conferencias.length ? `
              <div class="ai-struct-section ai-struct-check">
                <div class="ai-section-title">
                  <span class="ai-section-icon">✔️</span>
                  <strong>Conferência Humana Obrigatória</strong>
                </div>
                <ul class="ai-check-list">
                  ${data.conferencias.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}
