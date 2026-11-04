// IDIOMA: el <head> decide el idioma inicial; aquí se aplican los textos y se gestiona el botón.

const root = document.documentElement;
const i18nBindings = [];

document.querySelectorAll("[data-i18n]").forEach((el) => {
  i18nBindings.push({
    key: el.dataset.i18n,
    en: el.textContent,
    apply: (text) => {
      el.textContent = text;
    },
  });
});

["title", "aria-label", "content"].forEach((attr) => {
  document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
    i18nBindings.push({
      key: el.getAttribute(`data-i18n-${attr}`),
      en: el.getAttribute(attr),
      apply: (text) => el.setAttribute(attr, text),
    });
  });
});

function setLanguage(lang) {
  root.lang = lang;
  i18nBindings.forEach(({ key, en, apply }) => {
    apply(lang === "es" ? (translationsEs[key] ?? en) : en);
  });
}

setLanguage(root.lang);
root.classList.remove("i18n-pending");

document.getElementById("lang-toggle").addEventListener("click", () => {
  const next = root.lang === "es" ? "en" : "es";
  setLanguage(next);
  try {
    localStorage.setItem("lang", next);
  } catch (e) {
    // Sin almacenamiento el cambio funciona igual, pero no se recuerda.
  }
});

// BOTTOM NAV: marca la sección visible y desplaza la barra hasta su pill.

const navList = document.querySelector(".bottom-nav ul");
const navItems = [...navList.querySelectorAll("a")].map((link) => ({
  link,
  section: document.querySelector(link.hash),
}));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const NAV_LOCK_MS = 200;

let activeLink = null;
let navLock = null;
let spyFrame = null;

function setActiveLink(link) {
  if (link === activeLink) return;
  activeLink?.removeAttribute("aria-current");
  activeLink = link;
  link?.setAttribute("aria-current", "location");

  const left = link
    ? link.getBoundingClientRect().left -
      navList.getBoundingClientRect().left +
      navList.scrollLeft -
      parseFloat(getComputedStyle(navList).paddingLeft)
    : 0;
  navList.scrollTo({ left, behavior: reducedMotion.matches ? "auto" : "smooth" });
}

function findCurrentLink() {
  // La última sección puede no llegar arriba del todo: al final de la página, gana ella.
  const atPageEnd = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
  if (atPageEnd) return navItems[navItems.length - 1].link;

  const line = window.innerHeight / 3;
  const current = navItems.findLast(({ section }) => section.getBoundingClientRect().top <= line);
  return current ? current.link : null;
}

// Tras pulsar una pill, se respeta esa elección hasta que termina el scroll del ancla.
function holdNavLock() {
  clearTimeout(navLock);
  navLock = setTimeout(() => {
    navLock = null;
  }, NAV_LOCK_MS);
}

function updateActiveLink() {
  if (navLock !== null) {
    holdNavLock();
    return;
  }
  if (spyFrame !== null) return;
  spyFrame = requestAnimationFrame(() => {
    spyFrame = null;
    if (navLock === null) setActiveLink(findCurrentLink());
  });
}

navItems.forEach(({ link }) => {
  link.addEventListener("click", () => {
    setActiveLink(link);
    holdNavLock();
  });
});

window.addEventListener("scroll", updateActiveLink, { passive: true });
window.addEventListener("resize", updateActiveLink);
updateActiveLink();

// FRASE DE MARCA: alterna "nunca / a veces / siempre". Se pausa al pasar el cursor o al tocarla.

const brand = document.querySelector(".brand");
const brandItems = [...brand.querySelectorAll(".brand-word")];
const BRAND_INTERVAL_MS = 2200;
const brandSlot = brand.querySelector(".brand-words");
let brandIndex = 0;

function fitBrandSlot() {
  brandSlot.style.width = reducedMotion.matches ? "" : `${brandItems[brandIndex].offsetWidth + 1}px`;
}

function showNextBrandWord() {
  if (reducedMotion.matches || document.hidden || brand.matches(":hover")) return;

  brandItems.forEach((word) => word.classList.remove("is-leaving"));
  brandItems[brandIndex].classList.replace("is-active", "is-leaving");
  brandIndex = (brandIndex + 1) % brandItems.length;
  brandItems[brandIndex].classList.add("is-active");
  fitBrandSlot();
}

fitBrandSlot();
document.fonts?.ready.then(fitBrandSlot);
window.addEventListener("resize", fitBrandSlot);
reducedMotion.addEventListener("change", fitBrandSlot);
setInterval(showNextBrandWord, BRAND_INTERVAL_MS);

// CURSOR circunferencia

const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");
document.body.append(cursor);

let cursorX = 0;
let cursorY = 0;

function hideCursor() {
  root.classList.remove("has-cursor");
}

function updateCursorMode(target) {
  cursor.classList.toggle("is-over-link", Boolean(target?.closest?.("a, button")));

  const colored = target?.closest?.(".card-title, .bottom-nav a");
  const section = target?.closest?.(".info");

  if (colored) {
    cursor.style.setProperty("--cursor-ring", getComputedStyle(colored).color);
  } else if (section) {
    cursor.style.setProperty("--cursor-ring", getComputedStyle(section).getPropertyValue("--section-color"));
  } else {
    cursor.style.removeProperty("--cursor-ring");
  }
}

function moveCursor(event) {
  if (event.pointerType === "touch") {
    hideCursor();
    return;
  }
  cursorX = event.clientX;
  cursorY = event.clientY;
  cursor.style.translate = `${cursorX}px ${cursorY}px`;
  updateCursorMode(event.target);
  root.classList.add("has-cursor");
}

// Al hacer scroll sin mover el ratón, lo que hay debajo del cursor también cambia.
function refreshCursorOnScroll() {
  if (root.classList.contains("has-cursor")) {
    updateCursorMode(document.elementFromPoint(cursorX, cursorY));
  }
}

window.addEventListener("pointermove", moveCursor, { passive: true });
window.addEventListener("pointerdown", moveCursor, { passive: true });
window.addEventListener("scroll", refreshCursorOnScroll, { passive: true });
root.addEventListener("pointerleave", hideCursor);