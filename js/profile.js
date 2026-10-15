// Страница «Профиль»: валидация формы и сохранение настроек в localStorage.

const form = document.getElementById("profile-form");
const message = document.getElementById("form-message");
let profile = load("profile", { name: "", email: "", budget: "", remind: "3" });

function renderCard() {
  const subs = loadSubs();
  document.getElementById("avatar").textContent = profile.name ? profile.name[0].toUpperCase() : "?";
  document.getElementById("profile-name").textContent = profile.name || "Гость";
  document.getElementById("profile-email").textContent = profile.email || "Email не указан";
  document.getElementById("stat-count").textContent = subs.length;
  document.getElementById("stat-month").textContent = formatMoney(totalPerMonth(subs));
  document.getElementById("stat-budget").textContent = profile.budget ? formatMoney(profile.budget) : "—";
}

function setError(input, text) {
  input.classList.toggle("input--invalid", Boolean(text));
  input.toggleAttribute("aria-invalid", Boolean(text));
  document.getElementById(`${input.id}-error`).textContent = text;
  return !text; // true, если поле корректно
}

function validate() {
  const name = form.username.value.trim();
  const email = form.email.value.trim();
  const budget = form.budget.value;

  const nameOk = setError(form.username, name.length >= 2 ? "" : "Введите имя (минимум 2 символа)");
  const emailOk = setError(
    form.email,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Введите корректный email, например you@example.com"
  );
  const budgetOk = setError(
    form.budget,
    budget === "" || (Number(budget) >= 0 && Number(budget) <= 1000000) ? "" : "Бюджет — от 0 до 1 000 000 ₽"
  );

  return nameOk && emailOk && budgetOk;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";
  if (!validate()) return;

  profile = {
    name: form.username.value.trim(),
    email: form.email.value.trim(),
    budget: form.budget.value,
    remind: form.remind.value,
  };
  save("profile", profile);
  renderCard();
  message.textContent = "Настройки сохранены ✓";
});

// Заполняем форму сохранёнными данными
form.username.value = profile.name;
form.email.value = profile.email;
form.budget.value = profile.budget;
form.remind.value = profile.remind;
renderCard();
