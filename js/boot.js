// Se carga sin defer en el <head> de cada página: aplica idioma y modo antes de pintar.

(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // Aplica el modo guardado antes de pintar, para no ver un instante el oscuro.
  try {
    if (localStorage.getItem("theme") === "light") root.dataset.theme = "light";
  } catch (e) { }

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

  // Evita ver el inglés un instante; el temporizador muestra la página aunque falle el JS.
  if (root.lang === "es") {
    root.classList.add("i18n-pending");
    setTimeout(function () { root.classList.remove("i18n-pending"); }, 1500);
  }
})();
