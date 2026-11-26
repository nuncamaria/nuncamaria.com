const root = document.documentElement;
const layout = document.getElementById("layout");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

// ─── Language ─────────────────────────────────────

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

const langOptions = document.querySelectorAll(".lang-option");
const lastUpdated = document.querySelector(".last-updated");

function formatLastUpdated(lang) {
  if (!lastUpdated) return;
  const [year, month, day] = lastUpdated.getAttribute("datetime").split("-").map(Number);
  lastUpdated.textContent = new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function setLanguage(lang) {
  root.lang = lang;
  i18nBindings.forEach(({ key, en, apply }) => {
    apply(lang === "es" ? (translationsEs[key] ?? en) : en);
  });
  formatLastUpdated(lang);
  langOptions.forEach((option) => {
    option.setAttribute("aria-pressed", String(option.dataset.lang === lang));
  });
}

setLanguage(root.lang);
root.classList.remove("i18n-pending");

langOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const lang = option.dataset.lang;
    if (lang === root.lang) return;
    setLanguage(lang);
    try {
      localStorage.setItem("lang", lang);
    } catch (e) { }
  });
});

// ─── Brand rotator ────────────────────────────────

const brand = document.querySelector(".brand");
const brandWords = [...brand.querySelectorAll(".brand-word")];
let brandIndex = 0;

setInterval(() => {
  if (reducedMotion.matches || document.hidden || brand.matches(":hover")) return;

  brandWords.forEach((word) => word.classList.remove("is-leaving"));
  brandWords[brandIndex].classList.replace("is-active", "is-leaving");
  brandIndex = (brandIndex + 1) % brandWords.length;
  brandWords[brandIndex].classList.add("is-active");
}, 2200);

// ─── Bio panel: collapse on desktop, drawer on mobile ───

const bioPanel = document.getElementById("bio-panel");
const bioInner = bioPanel.querySelector(".bio-inner");
const knob = document.getElementById("col-knob");
const mobileQuery = window.matchMedia("(max-width: 960px)");

function isBioVisible() {
  return mobileQuery.matches
    ? layout.classList.contains("is-sheet-open")
    : !layout.classList.contains("is-collapsed");
}

function syncBioState() {
  const visible = isBioVisible();
  knob.setAttribute("aria-expanded", String(visible));
  bioInner.inert = !visible;
}

function resetBioScroll() {
  if (!isBioVisible()) bioPanel.scrollTop = 0;
}

function setBioVisible(visible) {
  if (mobileQuery.matches) layout.classList.toggle("is-sheet-open", visible);
  else layout.classList.toggle("is-collapsed", !visible);
  syncBioState();
  // With reduced motion there's no transition, so no transitionend to wait for.
  if (!visible && reducedMotion.matches) resetBioScroll();
}

knob.addEventListener("click", () => setBioVisible(!isBioVisible()));

// Reset the scroll once the drawer has finished closing, so it doesn't jump mid-slide.
bioPanel.addEventListener("transitionend", (event) => {
  if (event.target === bioPanel && event.propertyName === "transform") resetBioScroll();
});

// On desktop, clicking the collapsed panel expands it. On mobile only the button opens the drawer.
bioPanel.addEventListener("click", () => {
  if (!mobileQuery.matches && !isBioVisible()) setBioVisible(true);
});

mobileQuery.addEventListener("change", syncBioState);
syncBioState();

// ─── Thumbnails and active section ────────────────

const workPanel = document.getElementById("work-panel");
const thumbs = [...document.querySelectorAll(".thumb")];
const sections = thumbs.map((thumb) => document.getElementById(thumb.dataset.target));

function setActiveThumb(sectionId) {
  thumbs.forEach((thumb) => {
    const active = thumb.dataset.target === sectionId;
    thumb.classList.toggle("is-active", active);
    if (active) thumb.setAttribute("aria-current", "true");
    else thumb.removeAttribute("aria-current");
  });
}

let thumbFrame = null;

function syncActiveThumb() {
  if (thumbFrame !== null) return;
  thumbFrame = requestAnimationFrame(() => {
    thumbFrame = null;
    const index = Math.round(workPanel.scrollTop / workPanel.clientHeight);
    const section = sections[Math.min(index, sections.length - 1)];
    if (section) setActiveThumb(section.id);
  });
}

workPanel.addEventListener("scroll", syncActiveThumb, { passive: true });
window.addEventListener("resize", syncActiveThumb);
syncActiveThumb();

thumbs.forEach((thumb, i) => {
  thumb.addEventListener("click", () => {
    if (openDetailEl) closeDetail();
    sections[i].scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  });
});

// ─── Project detail ───────────────────────────────

const details = new Map(
  [...document.querySelectorAll(".detail")].map((el) => [el.dataset.project, el])
);
let openDetailEl = null;
let openedInPage = false;

function openDetail(name) {
  const detail = details.get(name);
  if (!detail || detail === openDetailEl) return;
  if (openDetailEl) openDetailEl.hidden = true;

  if (mobileQuery.matches) setBioVisible(false);
  document.getElementById(`section-${name}`)?.scrollIntoView({ block: "start" });

  openDetailEl = detail;
  detail.hidden = false;
  detail.scrollTop = 0;
  root.classList.add("detail-open");
  detail.querySelector(".detail-close").focus({ preventScroll: true });
}

function closeDetail() {
  if (!openDetailEl) return;
  const name = openDetailEl.dataset.project;
  openDetailEl.hidden = true;
  openDetailEl = null;
  root.classList.remove("detail-open");

  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  openedInPage = false;
  document.querySelector(`.work-frame[href="#${name}"]`)?.focus({ preventScroll: true });
}

function requestClose() {
  if (openedInPage) history.back();
  else closeDetail();
}

function route() {
  const name = location.hash.slice(1);
  if (details.has(name)) openDetail(name);
  else closeDetail();
}

window.addEventListener("hashchange", () => {
  openedInPage = details.has(location.hash.slice(1));
  route();
});

document.querySelectorAll(".detail-close").forEach((button) => {
  button.addEventListener("click", requestClose);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && openDetailEl) requestClose();
});

route();

// ─── Cursor ring ──────────────────────────────────

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
let cursorTarget = null;
let cursorWaveRunning = false;

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

function updateCursorTarget(target) {
  if (!target || target === cursorTarget) return;
  cursorTarget = target;
  cursor.classList.toggle("is-over-link", Boolean(target.closest("a, button")));
  const ring = getComputedStyle(target).getPropertyValue("--ring").trim();
  if (ring) cursor.style.setProperty("--cursor-ring", ring);
  else cursor.style.removeProperty("--cursor-ring");
}

function moveCursor(event) {
  if (event.pointerType === "touch") return;
  cursorX = event.clientX;
  cursorY = event.clientY;
  cursor.style.translate = `${cursorX}px ${cursorY}px`;
  updateCursorTarget(event.target);
  root.classList.add("has-cursor");
  startCursorWave();
}

function refreshCursorOnScroll() {
  if (root.classList.contains("has-cursor")) {
    updateCursorTarget(document.elementFromPoint(cursorX, cursorY));
  }
}

window.addEventListener("pointermove", moveCursor, { passive: true });
window.addEventListener("pointerdown", moveCursor, { passive: true });
document.addEventListener("scroll", refreshCursorOnScroll, { passive: true, capture: true });
root.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
