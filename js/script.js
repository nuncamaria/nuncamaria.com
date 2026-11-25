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

["title", "aria-label", "content", "alt"].forEach((attr) => {
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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// BOTTOM NAV: marca la sección visible y desplaza la barra hasta su pill. Solo existe en la portada.

const navList = document.querySelector(".bottom-nav ul");

if (navList) {
  const navItems = [...navList.querySelectorAll("a")].map((link) => ({
    link,
    section: document.querySelector(link.hash),
  }));
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
}

// FRASE DE MARCA: alterna "nunca / a veces / siempre". Se pausa al pasar el cursor o al tocarla. Solo existe en la portada.

const brand = document.querySelector(".brand");

if (brand) {
  const brandItems = [...brand.querySelectorAll(".brand-word")];
  const BRAND_INTERVAL_MS = 2200;
  let brandIndex = 0;

  function showNextBrandWord() {
    if (reducedMotion.matches || document.hidden || brand.matches(":hover")) return;

    brandItems.forEach((word) => word.classList.remove("is-leaving"));
    brandItems[brandIndex].classList.replace("is-active", "is-leaving");
    brandIndex = (brandIndex + 1) % brandItems.length;
    brandItems[brandIndex].classList.add("is-active");
  }

  setInterval(showNextBrandWord, BRAND_INTERVAL_MS);
}

// CURSOR circunferencia: un aro que sigue al ratón. Con el dedo no aparece.

const CURSOR_POINTS = 72;
const CURSOR_RADIUS = 48;

const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");
cursor.innerHTML = '<svg viewBox="0 0 100 100" focusable="false"><path></path></svg>';
document.body.append(cursor);

const cursorPath = cursor.querySelector("path");

let cursorX = 0;
let cursorY = 0;
let cursorWaveRunning = false;
// Sección cuyo color lleva el aro. Mientras no cambie, no hace falta volver a leerlo (en el scroll, cada fotograma).
let ringSection = null;

// Suma varias ondas que avanzan a distinto ritmo para que el temblor no parezca repetitivo.
function wavePath(time) {
  const t = time / 1000;
  let path = "";
  for (let i = 0; i < CURSOR_POINTS; i++) {
    const angle = (i / CURSOR_POINTS) * Math.PI * 2;
    const radius =
      CURSOR_RADIUS +
      1.6 * Math.sin(3 * angle + t * 2.4) +
      1 * Math.sin(5 * angle - t * 3.7) +
      0.5 * Math.sin(8 * angle + t * 5.3);
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    path += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${path}Z`;
}

// Solo anima mientras se ve el aro. Con movimiento reducido, la forma queda quieta.
function animateCursorWave(time) {
  if (!root.classList.contains("has-cursor") || reducedMotion.matches) {
    cursorWaveRunning = false;
    return;
  }
  cursorPath.setAttribute("d", wavePath(time));
  requestAnimationFrame(animateCursorWave);
}

function startCursorWave() {
  if (cursorWaveRunning || reducedMotion.matches) return;
  cursorWaveRunning = true;
  requestAnimationFrame(animateCursorWave);
}

cursorPath.setAttribute("d", wavePath(0));

function hideCursor() {
  root.classList.remove("has-cursor");
}

function updateCursorMode(target) {
  cursor.classList.toggle("is-over-link", Boolean(target?.closest?.("a, button")));

  // Sobre una pill, el aro anticipa el color de la sección a la que lleva.
  const pill = target?.closest?.(".bottom-nav a");
  const section = pill ? document.querySelector(pill.hash) : target?.closest?.(".info");
  if (section === ringSection) return;
  ringSection = section;
  if (section) {
    cursor.style.setProperty("--cursor-ring", getComputedStyle(section).getPropertyValue("--section-color"));
  } else {
    cursor.style.removeProperty("--cursor-ring");
  }
}

function moveCursor(event) {
  // Con el dedo no hay aro.
  if (event.pointerType === "touch") return;
  cursorX = event.clientX;
  cursorY = event.clientY;
  cursor.style.translate = `${cursorX}px ${cursorY}px`;
  updateCursorMode(event.target);
  root.classList.add("has-cursor");
  startCursorWave();
}

// Al hacer scroll sin mover el ratón, lo que hay debajo del aro también cambia.
function refreshCursorOnScroll() {
  if (root.classList.contains("has-cursor")) {
    updateCursorMode(document.elementFromPoint(cursorX, cursorY));
  }
}

window.addEventListener("pointermove", moveCursor, { passive: true });
window.addEventListener("pointerdown", moveCursor, { passive: true });
window.addEventListener("scroll", refreshCursorOnScroll, { passive: true });
root.addEventListener("pointerleave", hideCursor);
