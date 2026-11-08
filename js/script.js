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

// MODO CLARO: el <head> aplica el modo guardado; aquí se gestiona el botón. Los colores salen del CSS.

const themeToggle = document.getElementById("theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');

function syncThemeControls() {
  themeToggle.setAttribute("aria-pressed", String(root.dataset.theme === "light"));
  themeColor.content = getComputedStyle(root).getPropertyValue("--background-color");
}

syncThemeControls();

themeToggle.addEventListener("click", () => {
  if (root.dataset.theme === "light") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = "light";
  }
  syncThemeControls();
  try {
    localStorage.setItem("theme", root.dataset.theme === "light" ? "light" : "dark");
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

// CURSOR circunferencia. Con ratón, un aro que sigue al puntero; con el dedo, un aro por cada toque.

const RING_SVG = '<svg viewBox="0 0 100 100" focusable="false"><path></path></svg>';
const CURSOR_POINTS = 72;
const CURSOR_RADIUS = 48;

const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.setAttribute("aria-hidden", "true");
cursor.innerHTML = RING_SVG;
document.body.append(cursor);

const cursorPath = cursor.querySelector("path");
// section: la sección cuyo color lleva el aro. Solo se vuelve a leer el color cuando cambia.
const mouseRing = { el: cursor, section: undefined };

let cursorX = 0;
let cursorY = 0;
let wavesRunning = false;

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

// Un solo bucle ondula el aro del ratón y los del dedo que están a la vista; se para cuando no queda ninguno.
// Con movimiento reducido, las formas quedan quietas.
function animateWaves(time) {
  const mouseVisible = root.classList.contains("has-cursor");
  const visibleTapRings = tapRings.filter((ring) => ring.visible);
  if (reducedMotion.matches || (!mouseVisible && visibleTapRings.length === 0)) {
    wavesRunning = false;
    return;
  }
  if (mouseVisible) cursorPath.setAttribute("d", wavePath(time));
  // Cada aro del dedo va desfasado para que no ondulen todos a la vez.
  visibleTapRings.forEach((ring) => ring.path.setAttribute("d", wavePath(time + ring.phase)));
  requestAnimationFrame(animateWaves);
}

function startWaves() {
  if (wavesRunning || reducedMotion.matches) return;
  wavesRunning = true;
  requestAnimationFrame(animateWaves);
}

cursorPath.setAttribute("d", wavePath(0));

function hideCursor() {
  root.classList.remove("has-cursor");
}

// La sección bajo un punto. Sobre una pill, la sección a la que lleva.
function sectionAt(target) {
  const pill = target?.closest?.(".bottom-nav a");
  return pill ? document.querySelector(pill.hash) : (target?.closest?.(".info") ?? null);
}

function paintRing(ring, section) {
  if (section === ring.section) return;
  ring.section = section;
  if (section) {
    ring.el.style.setProperty("--cursor-ring", getComputedStyle(section).getPropertyValue("--section-color"));
  } else {
    ring.el.style.removeProperty("--cursor-ring");
  }
}

function updateCursorMode(target) {
  cursor.classList.toggle("is-over-link", Boolean(target?.closest?.("a, button")));
  paintRing(mouseRing, sectionAt(target));
}

function moveCursor(event) {
  // El dedo lo gestiona addTapRing.
  if (event.pointerType === "touch") return;
  cursorX = event.clientX;
  cursorY = event.clientY;
  cursor.style.translate = `${cursorX}px ${cursorY}px`;
  updateCursorMode(event.target);
  root.classList.add("has-cursor");
  startWaves();
}

// Con el dedo, cada toque deja un aro pegado al contenido, cada uno con su ondulación y el color de su sección.
// Al hacer scroll se desplaza con la página. A partir de TAP_RINGS_MAX, el más antiguo se desvanece.
const TAP_RINGS_MAX = 4;
const TAP_RING_FADE_MS = 300;
const tapRings = [];

// Capa del tamaño de la página que recorta los aros, para que uno junto al borde no cree scroll horizontal.
const tapLayer = document.createElement("div");
tapLayer.className = "tap-rings";
tapLayer.setAttribute("aria-hidden", "true");
document.body.append(tapLayer);

// Marca qué aros siguen a la vista: los que el scroll ha sacado de la pantalla dejan de ondular.
const tapRingByEl = new WeakMap();
const tapRingObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const ring = tapRingByEl.get(entry.target);
    if (ring) ring.visible = entry.isIntersecting;
  });
  startWaves();
});

function addTapRing(event) {
  // changedTouches: el dedo que acaba de apoyarse, aunque ya hubiera otro en la pantalla.
  const touch = event.changedTouches[0];
  if (!touch) return;

  const el = document.createElement("div");
  el.className = "tap-ring";
  el.innerHTML = RING_SVG;
  const ring = { el, path: el.querySelector("path"), phase: Math.random() * 10000, visible: true, section: undefined };
  ring.path.setAttribute("d", wavePath(ring.phase));
  // pageX/pageY: la posición en la página, no en la pantalla, para que el aro se mueva con el contenido.
  el.style.translate = `${touch.pageX}px ${touch.pageY}px`;
  paintRing(ring, sectionAt(document.elementFromPoint(touch.clientX, touch.clientY)));
  tapLayer.append(el);
  tapRings.push(ring);
  tapRingByEl.set(el, ring);
  tapRingObserver.observe(el);
  startWaves();

  if (tapRings.length > TAP_RINGS_MAX) {
    const oldest = tapRings.shift();
    tapRingObserver.unobserve(oldest.el);
    oldest.el.classList.add("is-leaving");
    setTimeout(() => oldest.el.remove(), TAP_RING_FADE_MS);
  }
}

// Al hacer scroll sin mover el ratón, lo que hay debajo de su aro también cambia.
function refreshCursorOnScroll() {
  if (root.classList.contains("has-cursor")) {
    updateCursorMode(document.elementFromPoint(cursorX, cursorY));
  }
}

window.addEventListener("pointermove", moveCursor, { passive: true });
window.addEventListener("pointerdown", moveCursor, { passive: true });
window.addEventListener("touchstart", addTapRing, { passive: true });
window.addEventListener("scroll", refreshCursorOnScroll, { passive: true });
// El dedo también lanza pointerleave (al empezar el scroll o al levantarlo): solo el ratón oculta su aro.
root.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "touch") hideCursor();
});
