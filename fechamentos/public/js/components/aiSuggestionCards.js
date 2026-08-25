export const DEFAULT_SUGGESTIONS = [
  {
    category: "Analisar perdas",
    icon: "📉",
    prompt: "Quais foram as maiores perdas deste mês?",
    description: "Visão consolidada dos maiores impactos e produtos."
  },
  {
    category: "Comparar períodos",
    icon: "📊",
    prompt: "Compare este mês com o mês anterior.",
    description: "Variação percentual, tendências e evolução."
  },
  {
    category: "Investigar setor",
    icon: "🥩",
    prompt: "Qual setor teve a pior evolução?",
    description: "Setores com maiores altas e motivos de descarte."
  },
  {
    category: "Detectar anomalias",
    icon: "🔍",
    prompt: "Existe algum valor fora do padrão?",
    description: "Desvios, picos e quebras atípicas identificadas."
  },
  {
    category: "Buscar oportunidade",
    icon: "💡",
    prompt: "Onde existe maior oportunidade de reduzir perdas?",
    description: "Ações com maior retorno sobre o fechamento."
  },
  {
    category: "Resumo executivo",
    icon: "📋",
    prompt: "Faça um resumo do fechamento deste mês.",
    description: "Diagnóstico completo para diretoria e gerência."
  }
];

export function renderSuggestionCards(container, onSelectSuggestion) {
  if (!container) return;

  container.innerHTML = `
    <div class="ai-suggestions-header">
      <span class="panel-tag">Sugestões rápidas</span>
      <h4>Perguntas recomendadas</h4>
      <p class="muted-note">Selecione uma análise pronta para executar sobre os dados do fechamento.</p>
    </div>
    <div class="ai-suggestions-grid">
      ${DEFAULT_SUGGESTIONS.map((sug, index) => `
        <button type="button" class="ai-suggestion-card" data-sug-index="${index}" aria-label="${sug.category}: ${sug.prompt}">
          <div class="ai-sug-top">
            <span class="ai-sug-icon" aria-hidden="true">${sug.icon}</span>
            <span class="ai-sug-category">${sug.category}</span>
          </div>
          <strong class="ai-sug-prompt">“${sug.prompt}”</strong>
          <span class="ai-sug-desc">${sug.description}</span>
        </button>
      `).join("")}
    </div>
  `;

  container.querySelectorAll(".ai-suggestion-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-sug-index"));
      const item = DEFAULT_SUGGESTIONS[idx];
      if (item && typeof onSelectSuggestion === "function") {
        onSelectSuggestion(item.prompt);
      }
    });
  });
}
