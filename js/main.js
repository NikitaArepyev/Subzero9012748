// Общий код для всех страниц: меню, хранилище, форматирование.

// ===== Мобильное меню (бургер) =====
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");

burger.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("nav--open");
  burger.setAttribute("aria-expanded", isOpen);
  burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
});

// ===== Работа с localStorage =====
function load(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    // localStorage может быть недоступен (приватный режим) — работаем с данными по умолчанию
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Не удалось сохранить — данные останутся до перезагрузки страницы
  }
}

// ===== Даты =====
// Дата в формате YYYY-MM-DD по местному времени (toISOString дал бы UTC и сдвиг на день)
function toDateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDate(str) {
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysFromToday(days) {
  const date = today();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// ===== Подписки =====
const CATEGORIES = {
  video: "Кино и видео",
  music: "Музыка",
  cloud: "Облако",
  ai: "Нейросети",
  games: "Игры",
  other: "Другое",
};

// Демо-данные при первом запуске: даты считаются от сегодняшнего дня
const DEFAULT_SUBS = [
  { id: 1, name: "Яндекс Плюс", price: 1990, period: "month", category: "video", date: daysFromToday(2) },
  { id: 2, name: "Spotify", price: 1290, period: "month", category: "music", date: daysFromToday(9) },
  { id: 3, name: "ChatGPT Plus", price: 9990, period: "month", category: "ai", date: daysFromToday(15) },
  { id: 4, name: "iCloud 200 ГБ", price: 1490, period: "month", category: "cloud", date: daysFromToday(21) },
  { id: 5, name: "Кинопоиск", price: 14990, period: "year", category: "video", date: daysFromToday(64) },
];

function loadSubs() {
  return load("subs", DEFAULT_SUBS);
}

// Стоимость подписки в пересчёте на месяц
function monthlyPrice(sub) {
  return sub.period === "year" ? sub.price / 12 : sub.price;
}

function totalPerMonth(subs) {
  return subs.reduce((sum, sub) => sum + monthlyPrice(sub), 0);
}

const moneyFormat = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "KZT",
  currencyDisplay: "narrowSymbol", // знак ₸ вместо «KZT»
  maximumFractionDigits: 0,
});

function formatMoney(value) {
  return moneyFormat.format(value);
}
