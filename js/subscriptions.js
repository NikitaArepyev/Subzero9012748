// Страница «Мои подписки»: список, поиск, фильтр, сортировка, добавление и удаление.

let subs = loadSubs();
const profile = load("profile", {});
const remindDays = Number(profile.remind) || 3;

const list = document.getElementById("sub-list");
const empty = document.getElementById("empty");
const template = document.getElementById("sub-template");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("filter-category");
const sortSelect = document.getElementById("sort");

const modal = document.getElementById("sub-modal");
const form = document.getElementById("sub-form");
const modalTitle = document.getElementById("modal-title");
let editingId = null; // id редактируемой подписки, null — добавление новой

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

// Заполняем выпадающие списки категорий из одного объекта CATEGORIES
for (const [value, label] of Object.entries(CATEGORIES)) {
  categoryFilter.add(new Option(label, value));
  form.category.add(new Option(label, value));
}

// Если дата списания уже прошла, переносим её на следующий период
function rollDate(sub) {
  const date = parseDate(sub.date);
  while (date < today()) {
    if (sub.period === "year") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
  }
  sub.date = toDateString(date);
}

function daysLeft(sub) {
  return Math.round((parseDate(sub.date) - today()) / 86400000);
}

function daysText(days) {
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  // Склонение: 1 день, 2 дня, 5 дней
  const forms = { one: "день", few: "дня", many: "дней" };
  return `через ${days} ${forms[new Intl.PluralRules("ru-RU").select(days)]}`;
}

// Отбор и сортировка по текущим значениям панели инструментов
function getVisibleSubs() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const result = subs.filter(
    (sub) =>
      sub.name.toLowerCase().includes(query) &&
      (category === "all" || sub.category === category)
  );

  const sorters = {
    date: (a, b) => a.date.localeCompare(b.date),
    "price-desc": (a, b) => monthlyPrice(b) - monthlyPrice(a),
    "price-asc": (a, b) => monthlyPrice(a) - monthlyPrice(b),
    name: (a, b) => a.name.localeCompare(b.name, "ru"),
  };
  return result.sort(sorters[sortSelect.value]);
}

function renderList() {
  const visible = getVisibleSubs();
  list.replaceChildren();

  for (const sub of visible) {
    const card = template.content.firstElementChild.cloneNode(true);
    const days = daysLeft(sub);

    card.dataset.id = sub.id;
    card.classList.toggle("sub--soon", days <= remindDays);
    // textContent, а не innerHTML — защита от вставки HTML через название
    card.querySelector(".sub__icon").textContent = sub.name[0].toUpperCase();
    card.querySelector(".sub__name").textContent = sub.name;
    card.querySelector(".sub__category").textContent = CATEGORIES[sub.category];
    card.querySelector(".sub__price").innerHTML =
      `${formatMoney(sub.price)}<span class="sub__period">${sub.period === "year" ? "в год" : "в месяц"}</span>`;
    card.querySelector(".sub__date").textContent =
      `Списание ${dateFormat.format(parseDate(sub.date))} — ${daysText(days)}`;

    list.append(card);
  }

  empty.hidden = visible.length > 0;
}

function renderStats() {
  const month = totalPerMonth(subs);
  document.getElementById("total-month").textContent = formatMoney(month);
  document.getElementById("total-year").textContent = formatMoney(month * 12);

  const next = [...subs].sort((a, b) => a.date.localeCompare(b.date))[0];
  document.getElementById("next-payment").textContent = next
    ? `${next.name}, ${daysText(daysLeft(next))}`
    : "—";

  // Полоса бюджета: зелёная до 80%, жёлтая до 100%, красная при превышении
  const budget = Number(profile.budget);
  if (!budget) return;

  const percent = (month / budget) * 100;
  const fill = document.getElementById("budget-fill");
  fill.style.width = `${Math.min(percent, 100)}%`;
  fill.classList.toggle("budget__fill--warning", percent >= 80 && percent <= 100);
  fill.classList.toggle("budget__fill--over", percent > 100);
  document.getElementById("budget-text").textContent =
    `${formatMoney(month)} из ${formatMoney(budget)} (${Math.round(percent)}%)`;
}

function render() {
  subs.forEach(rollDate);
  save("subs", subs);
  renderList();
  renderStats();
}

// ===== Модальное окно =====
function openModal(sub) {
  editingId = sub ? sub.id : null;
  modalTitle.textContent = sub ? "Изменить подписку" : "Новая подписка";
  form.reset();
  clearErrors();

  form.title.value = sub ? sub.name : "";
  form.price.value = sub ? sub.price : "";
  form.period.value = sub ? sub.period : "month";
  form.category.value = sub ? sub.category : "video";
  form.date.value = sub ? sub.date : toDateString(today());

  modal.showModal();
  form.title.focus();
}

function showError(input, message) {
  input.classList.add("input--invalid");
  input.setAttribute("aria-invalid", "true");
  document.getElementById(`${input.id}-error`).textContent = message;
}

function clearErrors() {
  form.querySelectorAll(".input--invalid").forEach((input) => {
    input.classList.remove("input--invalid");
    input.removeAttribute("aria-invalid");
  });
  form.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
}

function validate() {
  clearErrors();
  let valid = true;
  const name = form.title.value.trim();
  const price = Number(form.price.value);

  if (name.length < 2 || name.length > 40) {
    showError(form.title, "Название — от 2 до 40 символов");
    valid = false;
  }
  if (!form.price.value || price <= 0 || price > 100000) {
    showError(form.price, "Укажите цену от 1 до 100 000 ₽");
    valid = false;
  }
  if (!form.date.value) {
    showError(form.date, "Выберите дату");
    valid = false;
  }
  return valid;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;

  const data = {
    id: editingId ?? Date.now(),
    name: form.title.value.trim(),
    price: Number(form.price.value),
    period: form.period.value,
    category: form.category.value,
    date: form.date.value,
  };

  if (editingId) {
    subs = subs.map((sub) => (sub.id === editingId ? data : sub));
  } else {
    subs.push(data);
  }

  modal.close();
  render();
});

document.getElementById("add-btn").addEventListener("click", () => openModal());
document.getElementById("cancel-btn").addEventListener("click", () => modal.close());

// Закрытие по клику на затемнённый фон вокруг окна
modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

// Одна обработка кликов на весь список (делегирование событий)
list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.closest(".sub").dataset.id);
  if (button.dataset.action === "edit") {
    openModal(subs.find((sub) => sub.id === id));
  } else {
    subs = subs.filter((sub) => sub.id !== id);
    render();
  }
});

searchInput.addEventListener("input", renderList);
categoryFilter.addEventListener("change", renderList);
sortSelect.addEventListener("change", renderList);

render();
