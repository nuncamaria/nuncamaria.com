const accordion = document.getElementsByClassName("accordion");
const kebabmenu = document.querySelector(".kebab-menu");
const openMenu = document.querySelector(".open-menu");

for (i = 0; i < accordion.length; i++) {
    accordion[i].addEventListener("click", function () {

        this.classList.toggle("active");

        const panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    });
}

kebabmenu.addEventListener("click", () => {
    kebabmenu.classList.toggle("active");
    openMenu.classList.toggle("active");
});