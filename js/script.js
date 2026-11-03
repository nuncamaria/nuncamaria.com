const accordions = document.querySelectorAll(".accordion");

accordions.forEach((button) => {
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
  });
});

function openFromHash() {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const button = target && target.querySelector(".accordion");
  if (button) button.setAttribute("aria-expanded", "true");
}

openFromHash();
window.addEventListener("hashchange", openFromHash);
