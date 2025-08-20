
AFRAME.registerComponent('preserve-buffer', {
init: function () {
    this.el.renderer.preserveDrawingBuffer = true;
}
});
const modeSelector = document.getElementById("mode-selector");
let mode = modeSelector.value; // default

modeSelector.addEventListener("change", () => {
mode = modeSelector.value;
console.log("Mode changed to:", mode);
});

let activeFurniture = null;
let scene = document.querySelector("a-scene");

// Touch interaction
let touchStartX = 0;
let touchStartY = 0;
let initialPos = null;
let initialRot = null;

let initialDistance = null;
let initialScale = null;

// Model selection
document.querySelectorAll(".model-thumb").forEach((img) => {
img.addEventListener("click", () => {
    document.querySelectorAll(".model-thumb").forEach((i) => i.classList.remove("selected"));
    img.classList.add("selected");

    const modelUrl = img.getAttribute("data-model");
    const newFurniture = document.createElement("a-entity");
    newFurniture.setAttribute("gltf-model", modelUrl);
    newFurniture.setAttribute("scale", "0.1 0.1 0.1");
    newFurniture.setAttribute("position", "0 0 -4");
    newFurniture.setAttribute("auto-bounds", "");
    newFurniture.classList.add("furniture-item");

    scene.appendChild(newFurniture);
    setActiveFurniture(newFurniture);
});
});

// function to set active furniture
function setActiveFurniture(el) {
  activeFurniture = el;
  showSelectionBox(el);
}

// Tap to select placed model
scene.addEventListener("click", (e) => {
  const touch = e; // click or touch event
  const mouse = new THREE.Vector2();
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

  const camera = scene.camera;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const furnitureItems = Array.from(document.querySelectorAll(".furniture-item")).map(e => e.object3D);
  const intersects = raycaster.intersectObjects(furnitureItems, true);

  if (intersects.length > 0) {
    // select the first intersected model
    const selectedEl = intersects[0].object.el;
    setActiveFurniture(selectedEl);
    console.log(selectedEl)
  }
});

// Touch start
scene.addEventListener("touchstart", (e) => {
    if (!activeFurniture) return;

    if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        initialPos = Object.assign({}, activeFurniture.getAttribute("position"));
        initialRot = Object.assign({}, activeFurniture.getAttribute("rotation"));
    }

    if (e.touches.length === 2 && mode === "scale") {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale = Object.assign({}, activeFurniture.getAttribute("scale"));
    }
});

// Touch move
scene.addEventListener("touchmove", (e) => {
    if (!activeFurniture) return;
    e.preventDefault();

    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (mode === "move") {
        const scaleFactor = 0.01;
        const newX = initialPos.x + dx * scaleFactor;
        const newY = initialPos.y + dy * -scaleFactor; // negative to match screen direction
        activeFurniture.setAttribute("position", { x: newX, y: newY, z: initialPos.z });
    } else if (mode === "rotateY") {
        const newRotX = initialRot.x + dy * 0.5;
        activeFurniture.setAttribute("rotation", {
            x: newRotX,
            y: initialRot.y,
            z: initialRot.z,
        });
        } else if (mode === "rotateX") {
        const newRotY = initialRot.y + dx * 0.5;
        activeFurniture.setAttribute("rotation", {
            x: initialRot.x,
            y: newRotY,
            z: initialRot.z,
        });
        }
    }

    if (e.touches.length === 2 && mode === "scale" && initialDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scaleFactor = currentDistance / initialDistance;

        const newScale = {
        x: initialScale.x * scaleFactor,
        y: initialScale.y * scaleFactor,
        z: initialScale.z * scaleFactor,
        };

        const minScale = 0.001;
        const maxScale = 5;

        newScale.x = Math.min(maxScale, Math.max(minScale, newScale.x));
        newScale.y = Math.min(maxScale, Math.max(minScale, newScale.y));
        newScale.z = Math.min(maxScale, Math.max(minScale, newScale.z));

        activeFurniture.setAttribute("scale", newScale);
    }
});

const takePicBtn = document.getElementById("take-picture-btn");
const countdownText = document.getElementById("countdown-text");

takePicBtn.addEventListener("click", () => {
countdownText.style.display = "block";
countdownText.innerText = "3";

let counter = 3;
const interval = setInterval(() => {
    counter--;
    if (counter > 0) {
    countdownText.innerText = counter;
    } else {
    countdownText.innerText = "Please stay still";
    }
}, 1000);

setTimeout(() => {
    clearInterval(interval);
    countdownText.style.display = "none";

    // Take the screenshot
    takeARScreenshot();
}, 4000); // 3 sec countdown + 1 sec for "Please stay still"
});


function takeARScreenshot() {
const sceneEl = document.querySelector("#scene");
const renderer = sceneEl.renderer;
const canvas3D = renderer.domElement;
const video = document.querySelector("video"); // AR.js camera feed

// Make sure renderer has rendered the latest frame
renderer.render(sceneEl.object3D, sceneEl.camera);

// Prepare output canvas
const finalCanvas = document.createElement("canvas");
finalCanvas.width = canvas3D.width;
finalCanvas.height = canvas3D.height;
const ctx = finalCanvas.getContext("2d");

// 1. Draw camera video as background
if (video) {
    ctx.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height);
}

// 2. Draw the WebGL scene
ctx.drawImage(canvas3D, 0, 0, finalCanvas.width, finalCanvas.height);

// 3. Save as PNG
finalCanvas.toBlob((blob) => {
    if (!blob) {
    console.error("Failed to capture AR screenshot");
    return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ar_screenshot_${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);
}, "image/png");
}

const orientationWarning = document.getElementById("orientation-warning");

function checkOrientation() {
  if (window.innerWidth > window.innerHeight) {
    // Landscape
    takePicBtn.style.display = "block";
    orientationWarning.style.display = "none";
  } else {
    // Portrait
    takePicBtn.style.display = "none";
    orientationWarning.style.display = "block";
  }
}

// Run on load
checkOrientation();

// Run on resize or orientation change
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

let selectionBox = null;

function showSelectionBox(el) {
  // Remove previous box
  if (selectionBox) {
    selectionBox.parentNode.removeChild(selectionBox);
    selectionBox = null;
  }

  if (!el) return;

  // Get model's bounding box
  const object3D = el.getObject3D("mesh") || el.getObject3D("gltf-model");
  if (!object3D) return;

  const box = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Create wireframe box
  const geometry = new THREE.BoxGeometry(size.x * 1.1, size.y * 1.1, size.z * 1.1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const boxMesh = new THREE.Mesh(geometry, material);

  // Position box relative to model
  boxMesh.position.copy(center);

  // Add box as child of model
  el.object3D.add(boxMesh);

  selectionBox = boxMesh;
}