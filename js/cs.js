class CustomerServiceChat {
  constructor() {
    this.isOpen = false;
    this.apiKey = "AQ.Ab8RN6JDUWTkPED4tt7VaBnOrsf7PvuK-4wwK_KkeflR5JGhbw";

    this.messages = JSON.parse(localStorage.getItem("mita_cs_chat_v2")) || [
      {
        id: "msg-init",
        sender: "cs",
        text: "Halo! Selamat datang di Layanan Pelanggan MitaElektronik 👋. Ada yang bisa kami bantu terkait produk atau pesananmu?",
        time: this.getCurrentTime(),
      },
    ];
    this.initUI();
    this.renderMessages();
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
              <div class="cs-title">Layanan Pelanggan MitaElektronik</div>
              <div class="cs-status">● Online · AI Siap Membantu</div>
            </div>
          </div>
          <button id="cs-close-btn" type="button" aria-label="Tutup chat">✕</button>
        </div>

        <div class="cs-messages" id="cs-messages-list"></div>

        <div class="cs-quick-replies" id="cs-quick-replies">
          <button data-topic="Bagaimana cara klaim garansi produk elektronik?">📦 Klaim Garansi</button>
          <button data-topic="Rekomendasi kipas angin atau pendingin ruangan terbaik?">❄️ Rekomendasi Kipas</button>
          <button data-topic="Bagaimana cara melacak status pesanan saya?">💳 Cek Pesanan</button>
        </div>

        <form class="cs-input-area" id="cs-chat-form">
          <input type="text" id="cs-chat-input" placeholder="Tulis pertanyaan seputar produk..." autocomplete="off" required />
          <button type="submit" title="Kirim Pesan">➤</button>
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
        background: #0066cc;
        color: #ffffff;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(17, 17, 17, 0.24);
        transition: transform 0.2s ease;
      }
      #cs-toggle-btn svg {
        display: block;
        width: 27px;
        height: 27px;
      }
      #cs-toggle-btn:hover {
        transform: scale(1.04);
        background: #0052a3;
      }
      #cs-chat-window {
        position: absolute;
        bottom: calc(100% + 14px);
        right: 0;
        width: min(360px, calc(100vw - 32px));
        height: 460px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
        border: 1px solid #ddd;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transform: translateY(12px) scale(0.98);
        transform-origin: bottom right;
        transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;
      }
      #cs-chat-window.is-open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }
      .cs-header {
        background: #0066cc;
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
        color: #d0e8ff;
      }
      #cs-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 16px;
        cursor: pointer;
      }
      .cs-messages {
        flex: 1;
        padding: 14px;
        overflow-y: auto;
        background: #f9f9f9;
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
      }
      .cs-msg.cs {
        align-self: flex-start;
        background: #ffffff;
        color: #333;
        border: 1px solid #e0e0e0;
        border-bottom-left-radius: 4px;
      }
      .cs-msg.user {
        align-self: flex-end;
        background: #0066cc;
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
        border-top: 1px solid #eee;
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      .cs-quick-replies button {
        background: #f1f3f5;
        color: #333;
        border: 1px solid #dcdcdc;
        border-radius: 16px;
        padding: 5px 10px;
        font-size: 11px;
        white-space: nowrap;
        cursor: pointer;
      }
      .cs-quick-replies button:hover {
        background: #e2e6ea;
      }
      .cs-input-area {
        display: flex;
        padding: 10px;
        background: #ffffff;
        border-top: 1px solid #eee;
        gap: 8px;
      }
      #cs-chat-input {
        flex: 1;
        border: 1px solid #ccc;
        border-radius: 20px;
        padding: 8px 14px;
        font-size: 13px;
        outline: none;
      }
      #cs-chat-input:focus {
        border-color: #0066cc;
      }
      .cs-input-area button {
        background: #0066cc;
        color: #ffffff;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
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
      this.handleUserMessage(text);
      input.value = "";
    });

    document.querySelectorAll("#cs-quick-replies button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const topic = btn.getAttribute("data-topic");
        this.handleUserMessage(topic);
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
      setTimeout(() => document.getElementById("cs-chat-input").focus(), 200);
    }
  }

  async handleUserMessage(text) {
    this.addMessage("user", text);

    const loadingId = "loading-" + Date.now();
    this.messages.push({
      id: loadingId,
      sender: "cs",
      text: "Sedang mengetik...",
      time: this.getCurrentTime(),
    });
    this.renderMessages();

    // Simulasi jeda pengetikan agar terasa natural
    setTimeout(() => {
      const aiReply = this.getSmartResponse(text);

      this.messages = this.messages.filter((m) => m.id !== loadingId);
      this.messages.push({
        id: "msg-" + Date.now(),
        sender: "cs",
        text: aiReply,
        time: this.getCurrentTime(),
      });
      localStorage.setItem("mita_cs_chat_v2", JSON.stringify(this.messages));
      this.renderMessages();
    }, 800);
  }

  getSmartResponse(userPrompt) {
    const query = userPrompt.toLowerCase();

    if (query.includes("garansi") || query.includes("klaim")) {
      return "Untuk klaim garansi produk di MitaElektronik sangat mudah! Pastikan Anda membawa nota pembelian dan kartu garansi resmi. Klaim dapat diajukan langsung melalui toko fisik kami atau menghubungi layanan pusat bantuan kami.";
    } else if (
      query.includes("kipas") ||
      query.includes("pendingin") ||
      query.includes("ac")
    ) {
      return "Kami merekomendasikan kipas angin 3-in-1 MitaElektronik atau pendingin udara portabel yang hemat energi dan memiliki hembusan angin yang sejuk serta senyap. Cocok untuk ruang kerja maupun kamar tidur Anda!";
    } else if (
      query.includes("pesan") ||
      query.includes("lacak") ||
      query.includes("status") ||
      query.includes("kirim")
    ) {
      return "Anda dapat melacak status pesanan secara berkala melalui menu 'Cek Pesanan' di akun Anda atau memasukkan nomor resi pengiriman yang dikirimkan melalui email konfirmasi.";
    } else if (
      query.includes("mouse") ||
      query.includes("gaming") ||
      query.includes("razer")
    ) {
      return "Untuk perangkat gaming, kami menyediakan Mouse Gaming Razer DeathAdder Essential dengan sensor optik presisi tinggi serta Mouse Nirkabel Asus MW103 yang nyaman untuk produktivitas harian.";
    } else if (
      query.includes("halo") ||
      query.includes("hi") ||
      query.includes("pagi") ||
      query.includes("siang")
    ) {
      return "Halo! Selamat datang kembali di MitaElektronik. Ada produk elektronik, perangkat gaming, atau pesanan yang ingin Anda tanyakan hari ini?";
    } else {
      return `Terima kasih telah bertanya mengenai "${userPrompt}". Tim Layanan Pelanggan MitaElektronik siap membantu Anda mencarikan solusi terbaik seputar produk rumah tangga dan perangkat elektronik kami!`;
    }
  }

  addMessage(sender, text) {
    this.messages.push({
      id: "msg-" + Date.now(),
      sender,
      text,
      time: this.getCurrentTime(),
    });
    localStorage.setItem("mita_cs_chat_v2", JSON.stringify(this.messages));
    this.renderMessages();
  }

  renderMessages() {
    const list = document.getElementById("cs-messages-list");
    if (!list) return;

    list.innerHTML = this.messages
      .map(
        (m) => `
        <div class="cs-msg ${m.sender}">
          ${this.escapeHTML(m.text)}
          <span class="cs-msg-time">${m.time}</span>
        </div>
      `,
      )
      .join("");
    this.scrollToBottom();
  }

  scrollToBottom() {
    const list = document.getElementById("cs-messages-list");
    if (list) list.scrollTop = list.scrollHeight;
  }

  escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.csChat = new CustomerServiceChat();
});
