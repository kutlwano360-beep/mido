const menuButton =
    document.getElementById(
        "menuButton"
    );

const closeMenu =
    document.getElementById(
        "closeMenu"
    );

const menuOverlay =
    document.getElementById(
        "menuOverlay"
    );

const sideMenu =
    document.getElementById(
        "sideMenu"
    );

const menuRestartButton =
    document.getElementById(
        "menuRestartButton"
    );


function openMenu() {

    if (sideMenu) {
        sideMenu.classList.add("open");
    }

    if (menuOverlay) {
        menuOverlay.classList.add("open");
    }

}


function closeSideMenu() {

    if (sideMenu) {
        sideMenu.classList.remove("open");
    }

    if (menuOverlay) {
        menuOverlay.classList.remove("open");
    }

}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openMenu
    );

}


if (closeMenu) {

    closeMenu.addEventListener(
        "click",
        closeSideMenu
    );

}


if (menuOverlay) {

    menuOverlay.addEventListener(
        "click",
        closeSideMenu
    );

}


if (menuRestartButton) {

    menuRestartButton.addEventListener(
        "click",
        function () {

            closeSideMenu();

            if (
                typeof restartGame ===
                "function"
            ) {

                restartGame();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {
            closeSideMenu();
        }

    }
);