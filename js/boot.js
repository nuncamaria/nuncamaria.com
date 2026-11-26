// Runs before paint: saved choice first, then the browser language, English otherwise.

(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var lang = null;
  try {
    var saved = localStorage.getItem("lang");
    if (saved === "es" || saved === "en") lang = saved;
  } catch (e) { }

  var preferred = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || "en"];
  for (var i = 0; !lang && i < preferred.length; i++) {
    var code = preferred[i].slice(0, 2).toLowerCase();
    if (code === "es" || code === "en") lang = code;
  }

  root.lang = lang || "en";

  if (root.lang === "es") {
    root.classList.add("i18n-pending");
    setTimeout(function () { root.classList.remove("i18n-pending"); }, 1500);
  }
})();
