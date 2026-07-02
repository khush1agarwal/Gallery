const PASSWORD = "mwah";

const FRAME_SHAPES = [
    "portrait", "portrait", "landscape", "square", "portrait",
    "landscape", "portrait", "square", "portrait", "landscape"
];

const EMPTY_FRAME_TEXT = "Memories to be made";

const ROOM_SETTINGS = {
    rows: 3,
    sidePadding: 320,
    wallPaddingX: 300,
    cellWidth: 140,
    cellGap: 34,
    minimumColumns: 17,
    cornerWidth: 16
};

let galleryItems = [];

function getShape(index) {
    return FRAME_SHAPES[index % FRAME_SHAPES.length];
}

async function loadGallery() {
    const response = await fetch("gallery.json");

    if (!response.ok) {
        throw new Error("Could not load gallery.json");
    }

    const items = await response.json();

    if (!Array.isArray(items)) {
        throw new Error("gallery.json must contain an array of gallery items");
    }

    galleryItems = items;
    return items;
}

function splitGalleryItems(items) {
    const splitIndex = Math.ceil(items.length / 2);

    return {
        leftItems: items.slice(0, splitIndex),
        rightItems: items.slice(splitIndex)
    };
}

function calculateWallLayout(itemCount) {
    const columns = Math.max(
        ROOM_SETTINGS.minimumColumns,
        Math.ceil(itemCount / ROOM_SETTINGS.rows)
    );

    return {
        columns: columns,
        width: ROOM_SETTINGS.wallPaddingX +
            (columns * ROOM_SETTINGS.cellWidth) +
            ((columns - 1) * ROOM_SETTINGS.cellGap)
    };
}

function applyRoomSizing(leftCount, rightCount) {
    const leftLayout = calculateWallLayout(leftCount);
    const rightLayout = calculateWallLayout(rightCount);
    const roomWidth = ROOM_SETTINGS.sidePadding + leftLayout.width + rightLayout.width + ROOM_SETTINGS.sidePadding;
    const cornerLeft = ROOM_SETTINGS.sidePadding + leftLayout.width - (ROOM_SETTINGS.cornerWidth / 2);
    const root = document.documentElement;
    const leftWall = document.getElementById("leftWall");
    const rightWall = document.getElementById("rightWall");

    root.style.setProperty("--wall-width", leftLayout.width + "px");
    root.style.setProperty("--room-width", roomWidth + "px");
    root.style.setProperty("--corner-left", cornerLeft + "px");

    leftWall.style.width = leftLayout.width + "px";
    leftWall.style.gridTemplateColumns = "repeat(" + leftLayout.columns + ", " + ROOM_SETTINGS.cellWidth + "px)";

    rightWall.style.width = rightLayout.width + "px";
    rightWall.style.gridTemplateColumns = "repeat(" + rightLayout.columns + ", " + ROOM_SETTINGS.cellWidth + "px)";
}

function createFrame(item, index) {
    const shape = getShape(index);
    const card = document.createElement("article");
    card.className = "frame-card " + shape;

    const frameButton = document.createElement("div");
    frameButton.className = "gold-frame";
    frameButton.setAttribute("role", "button");
    frameButton.setAttribute("tabindex", "0");
    frameButton.setAttribute("aria-label", "Open " + item.description);

    const art = document.createElement("div");
    art.className = "art";

    if (item.image) {
        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.description || "Gallery image " + item.id;
        image.addEventListener("error", function() {
            art.textContent = EMPTY_FRAME_TEXT;
        });
        art.appendChild(image);
    } else {
        art.textContent = EMPTY_FRAME_TEXT;
    }

    frameButton.appendChild(art);

    frameButton.addEventListener("click", function() {
        openModal(item);
    });

    frameButton.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            openModal(item);
        }
    });

    const labelBox = document.createElement("div");
    labelBox.className = "label-box";

    const labelText = document.createElement("div");
    labelText.className = "label-text";
    labelText.textContent = item.description || "";

    labelBox.appendChild(labelText);

    card.appendChild(frameButton);
    card.appendChild(labelBox);

    return card;
}

function renderWall(wall, items, startingIndex) {
    wall.innerHTML = "";

    items.forEach(function(item, index) {
        wall.appendChild(createFrame(item, startingIndex + index));
    });
}

function renderGallery(items) {
    const leftWall = document.getElementById("leftWall");
    const rightWall = document.getElementById("rightWall");
    const splitItems = splitGalleryItems(items);

    applyRoomSizing(splitItems.leftItems.length, splitItems.rightItems.length);

    renderWall(leftWall, splitItems.leftItems, 0);
    renderWall(rightWall, splitItems.rightItems, splitItems.leftItems.length);
}

/* ===========================
   PASSWORD SCREEN
=========================== */

function enterGallery() {

    const input = document.getElementById("passwordInput");

    if (input.value !== PASSWORD) {
        document.getElementById("error").textContent = "Incorrect password.";
        input.value = "";
        return;
    }

    document.querySelector(".gallery-shell").style.opacity = "1";

    const screen = document.getElementById("passwordScreen");

    screen.style.opacity = "0";

    setTimeout(function () {
        screen.style.display = "none";
    }, 800);
}

/* ===========================
   MODAL
=========================== */

function openModal(item) {
    if (!item.image) {
        return;
    }

    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modalImage");
    const modalCaption = document.getElementById("modalCaption");

    modalImage.src = item.image;
    modalImage.alt = item.description || "Gallery image " + item.id;
    modalCaption.textContent = item.description || "";

    modal.classList.add("is-open");

    fitCaptionToImage();
}

function fitCaptionToImage() {
    const modalImage = document.getElementById("modalImage");
    const modalCaption = document.getElementById("modalCaption");

    requestAnimationFrame(function() {
        const imageWidth = modalImage.getBoundingClientRect().width;

        if (imageWidth > 0) {
            modalCaption.style.width = imageWidth + "px";
        }
    });
}

function closeModal() {
    document.getElementById("modal").classList.remove("is-open");
}

function scrollToCorner() {
    const gallery = document.querySelector(".gallery-shell");
    const corner = document.getElementById("corner");
    const centeredCorner = corner.offsetLeft - (window.innerWidth / 2);

    gallery.scrollLeft = Math.max(0, centeredCorner);
}

async function initializeGallery() {
    try {

        document.querySelector(".gallery-shell").style.opacity = "0";

        const items = await loadGallery();

        renderGallery(items);

        scrollToCorner();

    } catch (error) {
        console.error(error);
        renderGallery([]);
    }
}

/* ===========================
   EVENT LISTENERS
=========================== */

document.getElementById("modal").addEventListener("click", closeModal);

document.getElementById("closeModal").addEventListener("click", closeModal);

document.getElementById("modalCard").addEventListener("click", function(event) {
    event.stopPropagation();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});

document.getElementById("modalImage").addEventListener("load", fitCaptionToImage);

window.addEventListener("resize", fitCaptionToImage);

document.getElementById("passwordInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        enterGallery();
    }
});

window.addEventListener("load", initializeGallery);
