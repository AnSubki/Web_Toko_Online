class CustomerServiceChat {
  constructor() {
    this.isOpen = false;
    this.messages = this.loadMessages();
    this.saveMessages();
    this.initUI();
    this.renderMessages();
  }

  loadMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem("mita_cs_chat") || "null");
      if (Array.isArray(saved)) {
        const messages = saved
          .filter(
            (message) =>
              message &&
              (message.sender === "user" || message.sender === "cs") &&
              typeof message.text === "string",
          )
          .slice(-50)
          .map((message) => ({
            sender: message.sender,
            text: message.text,
            time:
              typeof message.time === "string"
                ? message.time
                : this.getCurrentTime(),
          }));
        if (messages.length) return messages;
      }
    } catch (error) {
      console.error("Gagal membaca riwayat chat.", error);
    }

    return [
      {
        sender: "cs",
        text: "Halo! Selamat datang di Layanan Pelanggan MitaElektronik 👋. Ada yang bisa kami bantu terkait produk atau pesananmu?",
        time: this.getCurrentTime(),
      },
    ];
  }

  saveMessages() {
    try {
      localStorage.setItem(
        "mita_cs_chat",
        JSON.stringify(this.messages.slice(-50)),
      );
    } catch (error) {
      console.error("Gagal menyimpan riwayat chat.", error);
    }
  }

  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  initUI() {
    if (document.getElementById("cs-chat-container")) return;

    const container = document.createElement("div");
    container.id = "cs-chat-container";
    container.innerHTML = `
      <div id="cs-chat-window" role="dialog" aria-label="Layanan pelanggan" aria-hidden="true">
        <div class="cs-header">
          <div class="cs-header-info">
            <span class="cs-avatar">🎧</span>
            <div>
              <div class="cs-title">Layanan Pelanggan</div>
              <div class="cs-status">● Online · Siap membantu</div>
            </div>
          </div>
          <button id="cs-close-btn" type="button" aria-label="Tutup chat">✕</button>
        </div>

        <div class="cs-messages" id="cs-messages-list" aria-live="polite"></div>

        <div class="cs-quick-replies" id="cs-quick-replies">
          <button data-topic="Keluhan Produk">📦 Keluhan Produk</button>
          <button data-topic="Kritik & Saran Situs">💡 Kritik & Saran Situs</button>
          <button data-topic="Kendala Pembayaran / Pesanan">💳 Kendala Pesanan</button>
        </div>

        <form class="cs-input-area" id="cs-chat-form">
          <input type="text" id="cs-chat-input" placeholder="Tulis pesan, keluhan, atau saran..." autocomplete="off" maxlength="500" required />
          <button type="submit" id="cs-send-btn" title="Kirim Pesan">➤</button>
        </form>
      </div>

      <button id="cs-toggle-btn" type="button" title="Buka layanan pelanggan" aria-label="Buka layanan pelanggan" aria-expanded="false" aria-controls="cs-chat-window">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2 1.1-4.3A7.5 7.5 0 1 1 20 11.5Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          <path d="M8 11.5h8M8 15h5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
        </svg>
      </button>
    `;
    document.body.appendChild(container);

    const style = document.createElement("style");
    style.innerHTML = `
      #cs-chat-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      #cs-toggle-btn {
        width: 58px;
        height: 58px;
        padding: 0;
        display: grid;
        place-items: center;
        background: var(--primary);
        color: #ffffff;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(17, 17, 17, 0.24);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      #cs-toggle-btn svg {
        display: block;
        width: 27px;
        height: 27px;
      }
      #cs-toggle-btn:hover {
        transform: translateY(-2px) scale(1.04);
        background: var(--primary-hover);
        box-shadow: 0 9px 24px rgba(17, 17, 17, 0.28);
      }
      #cs-toggle-btn:focus-visible,
      #cs-close-btn:focus-visible,
      .cs-input-area button:focus-visible {
        outline: 3px solid var(--primary);
        outline-offset: 3px;
      }
      #cs-chat-window {
        position: absolute;
        bottom: calc(100% + 14px);
        right: 0;
        width: min(360px, calc(100vw - 32px));
        height: min(460px, calc(100vh - 110px));
        height: min(460px, calc(100dvh - 110px));
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
        border: 1px solid var(--line);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(12px) scale(0.98);
        transform-origin: bottom right;
        transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;
      }
      #cs-chat-window.is-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }
      .cs-header {
        background: var(--hero-gradient);
        color: #ffffff;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .cs-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .cs-avatar {
        font-size: 20px;
        background: rgba(255, 255, 255, 0.15);
        padding: 6px 8px;
        border-radius: 50%;
      }
      .cs-title {
        font-weight: 700;
        font-size: 14px;
      }
      .cs-status {
        font-size: 11px;
        color: var(--primary-soft);
      }
      #cs-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
      }
      .cs-messages {
        flex: 1;
        padding: 14px;
        overflow-y: auto;
        background: var(--bg);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .cs-msg {
        max-width: 82%;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.45;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      .cs-msg.cs {
        align-self: flex-start;
        background: #ffffff;
        color: var(--text);
        border: 1px solid var(--line);
        border-bottom-left-radius: 4px;
      }
      .cs-msg.user {
        align-self: flex-end;
        background: var(--primary-hover);
        color: #ffffff;
        border-bottom-right-radius: 4px;
      }
      .cs-msg-time {
        display: block;
        font-size: 10px;
        margin-top: 4px;
        opacity: 0.7;
        text-align: right;
      }
      .cs-quick-replies {
        padding: 8px 12px;
        background: #ffffff;
        border-top: 1px solid var(--line);
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      .cs-quick-replies button {
        background: var(--bg);
        color: var(--text);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 5px 10px;
        font-size: 11px;
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.2s;
      }
      .cs-quick-replies button:hover {
        background: var(--primary-soft);
      }
      .cs-input-area {
        display: flex;
        padding: 10px;
        background: #ffffff;
        border-top: 1px solid var(--line);
        gap: 8px;
      }
      #cs-chat-input {
        flex: 1;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 8px 14px;
        font-size: 13px;
        outline: none;
      }
      #cs-chat-input:focus {
        border-color: var(--primary);
      }
      .cs-input-area button {
        background: var(--primary);
        color: #ffffff;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cs-input-area button:hover {
        background: var(--primary-hover);
      }
      @media (max-width: 480px) {
        #cs-chat-container {
          right: 16px;
          bottom: 16px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        #cs-toggle-btn,
        #cs-chat-window {
          transition: none;
        }
      }
    `;
    document.head.appendChild(style);

    // Event Listeners
    document
      .getElementById("cs-toggle-btn")
      .addEventListener("click", () => this.toggleChat());
    document
      .getElementById("cs-close-btn")
      .addEventListener("click", () => this.toggleChat(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.toggleChat(false);
    });

    document.getElementById("cs-chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("cs-chat-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      this.handleUserMessage(text);
    });

    document.querySelectorAll("#cs-quick-replies button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const topic = btn.getAttribute("data-topic");
        this.handleUserMessage(`Saya ingin menyampaikan: ${topic}`);
      });
    });
  }

  toggleChat(forceState) {
    const win = document.getElementById("cs-chat-window");
    this.isOpen = typeof forceState === "boolean" ? forceState : !this.isOpen;
    win.classList.toggle("is-open", this.isOpen);
    win.setAttribute("aria-hidden", String(!this.isOpen));
    const toggle = document.getElementById("cs-toggle-btn");
    toggle.setAttribute("aria-expanded", String(this.isOpen));
    if (this.isOpen) {
      this.scrollToBottom();
      const focusDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? 0
        : 240;
      setTimeout(() => {
        if (this.isOpen) document.getElementById("cs-chat-input").focus();
      }, focusDelay);
    } else toggle.focus();
  }

  handleUserMessage(text) {
    this.addMessage("user", text);
    const reply = this.generateAutoReply(text);
    setTimeout(() => {
      this.addMessage("cs", reply);
      if (this.isOpen) document.getElementById("cs-chat-input").focus();
    }, 600);
  }

  generateAutoReply(userText) {
    const text = userText.toLowerCase();
    if (
      ["keluhan produk", "rusak", "cacat"].some((word) => text.includes(word))
    ) {
      return "Maaf ya atas kendala pada produknya. Silakan ceritakan masalah yang dialami dan sertakan nomor pesanan agar kami bisa membantu.";
    }
    if (
      ["kritik", "saran", "website", "tampilan"].some((word) =>
        text.includes(word),
      )
    ) {
      return "Terima kasih atas kritik dan sarannya. Bagian website atau tampilan mana yang ingin kamu sampaikan?";
    }
    if (
      ["pembayaran", "order", "checkout", "keranjang"].some((word) =>
        text.includes(word),
      )
    ) {
      return "Maaf atas kendala pesananmu. Periksa kembali status di Profil > Pesanan, lalu kirim nomor pesanan atau detail kendalanya agar kami bisa membantu.";
    }
    return "Terima kasih sudah menghubungi Layanan Pelanggan MitaElektronik. Ada hal lain terkait produk atau pesanan yang bisa kami bantu?";
  }

  addMessage(sender, text) {
    this.messages.push({
      sender,
      text: String(text),
      time: this.getCurrentTime(),
    });
    // Simpan maksimal 50 pesan terakhir
    this.messages = this.messages.slice(-50);
    this.saveMessages();
    this.renderMessages();
  }

  renderMessages() {
    const list = document.getElementById("cs-messages-list");
    if (!list) return;

    const fragment = document.createDocumentFragment();
    this.messages.forEach((message) => {
      const bubble = document.createElement("div");
      bubble.className = `cs-msg ${message.sender}`;
      bubble.textContent = message.text;

      const time = document.createElement("span");
      time.className = "cs-msg-time";
      time.textContent = message.time;
      bubble.appendChild(time);
      fragment.appendChild(bubble);
    });

    list.replaceChildren(fragment);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const list = document.getElementById("cs-messages-list");
    if (list) list.scrollTop = list.scrollHeight;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.csChat = new CustomerServiceChat();
});
