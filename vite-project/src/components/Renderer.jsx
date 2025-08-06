// renderer.js
import * as THREE from 'three';
import { ARUtils, ARView } from 'three.ar.js';

const Renderer = () => {
  let renderer = new THREE.WebGLRenderer({ alpha: true });
  let vrDisplay = null;
  let arView = null;
  let canvas = null;

  async function initRenderer() {
    const display = await ARUtils.getARDisplay();
    if (display) {
      vrDisplay = display;
      setupRenderer();
      return true;
    }
    ARUtils.displayUnsupportedMessage?.();
    return false;
  }

  function setupRenderer() {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    canvas = renderer.domElement;
    document.body.appendChild(canvas);
    arView = new ARView(vrDisplay, renderer);
  }

  function update(scene, camera, updateCallback) {
    renderer.clearColor();
    arView?.render();
    renderer.clearDepth();
    renderer.render(scene, camera);
    vrDisplay?.requestAnimationFrame(updateCallback);
  }

  function getCanvas() {
    return canvas;
  }

  function dispose() {
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    renderer.dispose();
    vrDisplay = null;
    arView = null;
    canvas = null;
  }

  return {
    initRenderer,
    update,
    getCanvas,
    dispose,
  };
}

export default Renderer
