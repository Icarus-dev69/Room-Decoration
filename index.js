AFRAME.registerComponent('preserve-buffer', {
init: function () {
    this.el.renderer.preserveDrawingBuffer = true;
}
});
const modeSelector = document.getElementById("mode-selector");
let mode = modeSelector.value; // default

const categorySelect = document.getElementById("category");
const groups = document.querySelectorAll(".category-group");

categorySelect.addEventListener("change", (e) => {
  groups.forEach(group => {
    group.style.display = (group.id === e.target.value) ? "flex" : "none";
  });
});

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

let placedModels = [];

// Model selection
document.querySelectorAll(".model-thumb").forEach((img) => {
img.addEventListener("click", () => {
    document.querySelectorAll(".model-thumb").forEach((i) => i.classList.remove("selected"));
    img.classList.add("selected");

    const modelUrl = img.getAttribute("data-model");
    const newFurniture = document.createElement("a-entity");
    newFurniture.setAttribute("gltf-model", modelUrl);
    newFurniture.setAttribute("scale", "1 1 1");
    newFurniture.setAttribute("position", "0 0 -6");
    newFurniture.setAttribute("auto-bounds", "");
    newFurniture.classList.add("furniture-item");

    scene.appendChild(newFurniture);
    setActiveFurniture(newFurniture);
    // Add to placedModels + refresh UI
      placedModels.push({ el: newFurniture, url: modelUrl });
      updateModelListUI();
});
});

// Map to store original materials
let originalMaterials = new Map();

// Slightly brighter highlight (keep subtle)
const highlightTint = new THREE.Color(0x00ff00);

// Set the active model and apply subtle highlight
function setActiveFurniture(el) {
  if (activeFurniture) {
    restoreOriginalMaterial(activeFurniture);
  }

  activeFurniture = el;
  applyHighlightMaterial(el);
  updateModelListUI(); // refresh highlight in UI
}

// Apply subtle highlight by cloning materials
function applyHighlightMaterial(el) {
  const mesh = el.getObject3D('mesh') || el.getObject3D('gltf-model');

  if (!mesh) {
    el.addEventListener('model-loaded', () => applyHighlightMaterial(el), { once: true });
    return;
  }

  mesh.traverse((node) => {
    if (node.isMesh) {
      if (!originalMaterials.has(node)) {
        originalMaterials.set(node, node.material);
      }
      // Clone the original material and slightly tint it
      const newMat = node.material.clone();
      newMat.color.lerp(highlightTint, 0.9); // 10% tint
      node.material = newMat;
    }
  });
}

// Restore the original materials
function restoreOriginalMaterial(el) {
  const mesh = el.getObject3D('mesh') || el.getObject3D('gltf-model');

  if (!mesh) return;

  mesh.traverse((node) => {
    if (node.isMesh && originalMaterials.has(node)) {
      node.material.dispose(); // dispose cloned material
      node.material = originalMaterials.get(node);
      originalMaterials.delete(node);
    }
  });
}



// Tap to select placed model
scene.addEventListener("click", (e) => {
  const rect = scene.canvas.getBoundingClientRect(); // exact canvas size
  const mouse = new THREE.Vector2();

  // Normalize mouse coords correctly
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  const camera = scene.camera;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Collect meshes
  const furnitureMeshes = [];
  document.querySelectorAll(".furniture-item").forEach((el) => {
    const obj = el.object3D;
    if (obj) {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.userData.el = el;
          furnitureMeshes.push(child);
        }
      });
    }
  });

  const intersects = raycaster.intersectObjects(furnitureMeshes, true);

  if (intersects.length > 0) {
    const selectedEl = intersects[0].object.userData.el;
    if (selectedEl) {
      setActiveFurniture(selectedEl);
      console.log("Selected:", selectedEl);
    }
  }
});

const toggleModelsBtn = document.getElementById("toggle-models-btn");
const toggleArrow = document.getElementById("toggle-arrow");
const modelsContainer = document.getElementById("placed-models-list");

toggleModelsBtn.addEventListener("click", () => {
  if (modelsContainer.style.display === "none") {
    modelsContainer.style.display = "block";
    toggleModelsBtn.firstChild.textContent = "Hide ";
    toggleArrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6h2v12h-2zm-8 5H4v2h6v5l6-6l-6-6z"/></svg>'; // arrow right
  } else {
    modelsContainer.style.display = "none";
    toggleModelsBtn.firstChild.textContent = "Show ";
    toggleArrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6h2v12h-2zm-8 12v-5h6v-2h-6V6l-6 6z"/></svg>'; // arrow left
  }
});

const toggleThumpsBtn = document.getElementById("toggle-thumps-btn");
const toggleThumpsArrow = document.getElementById("toggle-thumps-arrow");
const ThumpsContainer = document.getElementById("model-selector");

toggleThumpsBtn.addEventListener("click", () => {
  if (ThumpsContainer.style.display === "none") {
    ThumpsContainer.style.display = "flex";
    toggleThumpsBtn.firstChild.textContent = "Hide ";
    
    toggleThumpsArrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6h2v12h-2zm-8 12v-5h6v-2h-6V6l-6 6z"/></svg>'; // arrow right
  } else {
    ThumpsContainer.style.display = "none";
    toggleThumpsBtn.firstChild.textContent = "Show ";
    toggleThumpsArrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6h2v12h-2zm-8 5H4v2h6v5l6-6l-6-6z"/></svg>'; // arrow left
  }
});


function updateModelListUI() {
  const listEl = document.getElementById("placed-models-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (placedModels.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.innerText = "No models placed yet";
    emptyMsg.style.color = "#666";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.padding = "6px";
    listEl.appendChild(emptyMsg);
    return;
  }

  placedModels.forEach((model, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.margin = "5px 0";

    const wrapper = document.createElement("div");
    wrapper.style.flex = "1";
    wrapper.style.padding = "6px 10px";
    wrapper.style.border = "1px solid #0077ff";
    wrapper.style.borderRadius = "6px";
    wrapper.style.background = (activeFurniture === model.el) ? "#0077ff" : "white";
    wrapper.style.color = (activeFurniture === model.el) ? "white" : "black";
    wrapper.style.cursor = "pointer";

    wrapper.innerText = `Model ${index + 1}`;
    wrapper.addEventListener("click", () => {
      // Deselect if same model clicked
      if (activeFurniture === model.el) {
        restoreOriginalMaterial(activeFurniture);
        activeFurniture = null;
      } else {
        if (activeFurniture) restoreOriginalMaterial(activeFurniture);
        setActiveFurniture(model.el);
      }
      updateModelListUI(); // refresh UI highlight
    });

    const delBtn = document.createElement("button");
    delBtn.style.background = "transparent";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";
    delBtn.style.marginLeft = "4px";
    delBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="red">
        <path d="M19.45 7.5H4.55a.5.5 0 0 0-.5.54l1.28 14.14a2 2 0 0 0 2 1.82h9.34a2 2 0 0 0 2-1.82L20 8a.5.5 0 0 0-.5-.54Zm-9.2 13a.75.75 0 0 1-1.5 0v-9a.75.75 0 0 1 1.5 0Zm5 0a.75.75 0 0 1-1.5 0v-9a.75.75 0 0 1 1.5 0ZM22 4h-4.75a.25.25 0 0 1-.25-.25V2.5A2.5 2.5 0 0 0 14.5 0h-5A2.5 2.5 0 0 0 7 2.5v1.25a.25.25 0 0 1-.25.25H2a1 1 0 0 0 0 2h20a1 1 0 0 0 0-2M9 3.75V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v1.25a.25.25 0 0 1-.25.25h-5.5A.25.25 0 0 1 9 3.75"/>
      </svg>
    `;
    delBtn.addEventListener("click", () => {
      if (model.el && model.el.parentNode) {
        model.el.parentNode.removeChild(model.el);
      }
      placedModels.splice(index, 1);
      if (activeFurniture === model.el) {
        activeFurniture = null;
      }
      updateModelListUI();
    });

    row.appendChild(wrapper);
    row.appendChild(delBtn);
    listEl.appendChild(row);
  });
}


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

// Create a modal/overlay for preview
// Create preview overlay
const previewOverlay = document.createElement("div");
previewOverlay.classList.add("preview-overlay");

// Preview image
const previewImg = document.createElement("img");
previewImg.classList.add("preview-img");
previewOverlay.appendChild(previewImg);

// Download button
const downloadBtn = document.createElement("button");
downloadBtn.classList.add("preview-download-btn");
downloadBtn.innerText = "Download";
previewOverlay.appendChild(downloadBtn);

// Close button
const closeBtn = document.createElement("button");
closeBtn.classList.add("preview-close-btn");
closeBtn.innerText = "Close";
previewOverlay.appendChild(closeBtn);

document.body.appendChild(previewOverlay);

// Countdown and capture
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

    // Take screenshot
    const dataUrl = takeARScreenshot();
    previewImg.src = dataUrl;
    previewOverlay.style.display = "flex";
  }, 4000);
});

// Download button
downloadBtn.addEventListener("click", () => {
  const fileName = `ar_screenshot_${Date.now()}.png`;

  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    // iOS device
    window.open(previewImg.src, "_blank"); // let user long-press to save
  } else {
    const link = document.createElement("a");
    link.href = previewImg.src;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  previewOverlay.style.display = "none";
});

// Close button
closeBtn.addEventListener("click", () => {
  previewOverlay.style.display = "none";
});

// Modified takeARScreenshot to return data URL instead of downloading
function takeARScreenshot() {
  const sceneEl = document.querySelector("#scene");
  const renderer = sceneEl.renderer;
  const canvas3D = renderer.domElement;
  const video = document.querySelector("video"); // AR.js camera feed

  renderer.render(sceneEl.object3D, sceneEl.camera);

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvas3D.width;
  finalCanvas.height = canvas3D.height;
  const ctx = finalCanvas.getContext("2d");

  if (video) {
    ctx.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height);
  }

  ctx.drawImage(canvas3D, 0, 0, finalCanvas.width, finalCanvas.height);

  return finalCanvas.toDataURL("image/png");
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

updateModelListUI();

const fullscreenBtn = document.getElementById("fullscreen-btn");
var elem = document.body;
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

fullscreenBtn.addEventListener("click", () => {
  // if (!document.fullscreenElement) {
    openFullscreen()
  //   fullscreenBtn.textContent = "⛶ Exit Fullscreen";
  // } else {
  //   closeFullscreen()
  //   fullscreenBtn.textContent = "⛶ Fullscreen";
  // }
});