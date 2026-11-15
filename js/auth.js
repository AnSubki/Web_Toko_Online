const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const formMessage = document.getElementById("form-message");
const params = new URLSearchParams(location.search);

function showFormMessage(message, type = "error") {
  if (!formMessage) return;
  formMessage.textContent = message;
  formMessage.dataset.type = type;
}

const eyeIcon =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.8 12s3.2-6 9.2-6 9.2 6 9.2 6-3.2 6-9.2 6-9.2-6-9.2-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>';
const eyeOffIcon =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A9.9 9.9 0 0 1 12 6c6 0 9.2 6 9.2 6a15 15 0 0 1-3 3.6M6.2 6.2C4 7.6 2.8 12 2.8 12s3.2 6 9.2 6a9.9 9.9 0 0 0 3-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

[
  ["toggle-password", "password"],
  ["toggle-confirm", "confirm"],
].forEach(([buttonId, inputId]) => {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!button || !input) return;

  button.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute(
      "aria-label",
      show ? "Sembunyikan password" : "Tampilkan password",
    );
    button.setAttribute("aria-pressed", String(show));
    button.innerHTML = show ? eyeOffIcon : eyeIcon;
  });
});

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (name.length < 2) {
      showFormMessage("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormMessage("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 6) {
      showFormMessage("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      showFormMessage("Konfirmasi password tidak sama.");
      return;
    }

    const users = Auth.users();
    if (users.some((user) => user.email === email)) {
      showFormMessage("Email sudah terdaftar. Silakan masuk.");
      return;
    }

    users.push({
      email,
      name,
      password: Auth.hash(password),
      createdAt: new Date().toISOString(),
    });
    Store.write(KEYS.users, users);
    location.href = "login.html?registered=1";
  });
}

if (loginForm) {
  const emailInput = document.getElementById("email");
  const rememberInput = loginForm.querySelector('[name="remember"]');
  const forgotPassword = document.getElementById("forgot-password");
  const rememberedEmail = localStorage.getItem(KEYS.remember);
  if (rememberedEmail && emailInput && rememberInput) {
    emailInput.value = rememberedEmail;
    rememberInput.checked = true;
  }
  if (params.get("registered") === "1") {
    showFormMessage("Akun berhasil dibuat. Silakan masuk.", "success");
  }
  if (forgotPassword) {
    forgotPassword.addEventListener("click", () => {
      showFormMessage(
        "Pemulihan password belum tersedia untuk akun lokal ini.",
        "info",
      );
    });
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const user = Auth.users().find(
      (candidate) =>
        candidate.email === email && candidate.password === Auth.hash(password),
    );

    if (!user) {
      showFormMessage("Email atau password tidak sesuai.");
      return;
    }

    Store.write(KEYS.session, {
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
    if (rememberInput && rememberInput.checked) {
      localStorage.setItem(KEYS.remember, email);
    } else {
      localStorage.removeItem(KEYS.remember);
    }

    const next = params.get("next");
    const safeNext = /^(index|shop|product|cart|checkout|profile)\.html$/.test(
      next || "",
    )
      ? next
      : "index.html";
    location.replace(safeNext);
  });
}
