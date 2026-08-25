import { renderMessageHtml } from "./aiMessage.js";
import { renderSuggestionCards } from "./aiSuggestionCards.js";

export function initChat({
  container,
  onSendMessage,
  onClearChat
}) {
  if (!container) return;

  container.innerHTML = `
    <div class="ai-chat-header">
      <div class="ai-chat-header-title">
        <span class="ai-bot-badge">✨ IA Razarth</span>
        <div>
          <h4>Área de Conversa</h4>
          <span class="muted-note">Análise baseada nos dados do fechamento</span>
        </div>
      </div>
      <button id="aiChatClearBtn" class="ai-chat-clear-btn" type="button" title="Limpar conversa">
        Nova conversa
      </button>
    </div>

    <div class="ai-chat-messages-container" id="aiChatMessages" aria-live="polite">
      <!-- Mensagens e sugestões aqui -->
    </div>

    <form class="ai-chat-input-form" id="aiChatForm">
      <div class="ai-input-wrapper">
        <label for="aiChatTextarea" class="sr-only">Digite sua pergunta para o Assistente IA</label>
        <textarea
          id="aiChatTextarea"
          rows="1"
          maxlength="1000"
          placeholder="Pergunte algo sobre perdas, margem, setores, lojas ou fechamentos..."
          autocomplete="off"
        ></textarea>
        <button id="aiChatSendButton" class="ai-send-btn" type="submit" aria-label="Enviar pergunta">
          <span class="ai-send-icon" aria-hidden="true">➤</span>
          <span class="ai-send-text">Enviar</span>
        </button>
      </div>
      <div class="ai-input-footer">
        <small class="ai-input-hint">Pressione <kbd>Enter</kbd> para enviar • <kbd>Shift + Enter</kbd> para nova linha</small>
      </div>
    </form>
  `;

  const messagesContainer = container.querySelector("#aiChatMessages");
  const textarea = container.querySelector("#aiChatTextarea");
  const sendBtn = container.querySelector("#aiChatSendButton");
  const form = container.querySelector("#aiChatForm");
  const clearBtn = container.querySelector("#aiChatClearBtn");

  let messages = [];
  let isAnalyzing = false;

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function autoResizeTextarea() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
  }

  function render() {
    if (!messages.length) {
      messagesContainer.innerHTML = `
        <div class="ai-chat-welcome-state">
          <div class="ai-welcome-hero">
            <span class="ai-sparkle-hero">✨</span>
            <h3>Como posso ajudar seu fechamento hoje?</h3>
            <p>Faça perguntas em linguagem natural sobre perdas, conciliação, produtos e setores, ou clique em uma das sugestões abaixo.</p>
          </div>
          <div id="aiWelcomeSuggestions" class="ai-welcome-suggestions-wrapper"></div>
        </div>
      `;
      const suggestionsWrapper = messagesContainer.querySelector("#aiWelcomeSuggestions");
      renderSuggestionCards(suggestionsWrapper, (prompt) => {
        submitPrompt(prompt);
      });
      return;
    }

    let html = messages.map((msg) => renderMessageHtml(msg)).join("");

    if (isAnalyzing) {
      html += `
        <div class="ai-chat-bubble ai-bubble-assistant is-typing">
          <div class="ai-bubble-author">
            <span class="ai-avatar bot-avatar">✨ Assistente IA</span>
          </div>
          <div class="ai-typing-indicator">
            <span class="ai-dot"></span>
            <span class="ai-dot"></span>
            <span class="ai-dot"></span>
            <span class="ai-typing-text">Analisando dados do fechamento...</span>
          </div>
        </div>
      `;
    }

    messagesContainer.innerHTML = html;
    scrollToBottom();
  }

  async function submitPrompt(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText || isAnalyzing) return;

    textarea.value = "";
    autoResizeTextarea();

    const userMessage = {
      role: "user",
      content: cleanText,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    messages.push(userMessage);
    isAnalyzing = true;
    sendBtn.disabled = true;
    render();

    try {
      if (typeof onSendMessage === "function") {
        const response = await onSendMessage(cleanText, messages);
        const assistantMessage = {
          role: "assistant",
          content: response.answer || "",
          data: response,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        };
        messages.push(assistantMessage);
      }
    } catch (err) {
      console.error("Erro no chat IA:", err);
      messages.push({
        role: "assistant",
        content: `Desculpe, ocorreu um erro ao processar sua pergunta: ${err.message || "Tente novamente mais tarde."}`,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      });
    } finally {
      isAnalyzing = false;
      sendBtn.disabled = false;
      render();
      textarea.focus();
    }
  }

  // Event Listeners
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitPrompt(textarea.value);
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPrompt(textarea.value);
    }
  });

  textarea.addEventListener("input", autoResizeTextarea);

  clearBtn.addEventListener("click", () => {
    messages = [];
    isAnalyzing = false;
    render();
    if (typeof onClearChat === "function") onClearChat();
  });

  render();

  return {
    submitPrompt,
    clearChat: () => {
      messages = [];
      render();
    },
    getMessages: () => messages
  };
}
