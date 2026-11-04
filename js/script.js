const accordions = document.querySelectorAll(".accordion");

accordions.forEach((button) => {
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
  });
});

function openFromHash() {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const button = target && target.querySelector(":scope > h3 > .accordion");
  if (button) button.setAttribute("aria-expanded", "true");
}

openFromHash();
window.addEventListener("hashchange", openFromHash);

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