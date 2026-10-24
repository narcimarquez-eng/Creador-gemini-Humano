import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { characterGroup, CONFIG, MAT } from './character.js';

let renderer;
let scene;
let camera;
let controls;
let wireframeEnabled = false;

// Estado de interpolación suave de cámara (hacia zonas o vistas rápidas)
const camTargetPos = new THREE.Vector3();
const camTargetLook = new THREE.Vector3(0, 0.92, 0);
let isTransitioningCamera = false;

/**
 * Detecta WebGL por software (SwiftShader / llvmpipe) para ajustar coste de renderizado
 */
export const isSoftwareGl = (() => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

/**
 * Inicializa la escena 3D de estudio, iluminación de 3 puntos, suelo con sombra de contacto y Raycaster
 */
export function initViewer(containerEl, onZonePicked) {
  renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  containerEl.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xedf1f7);
  scene.fog = new THREE.Fog(0xedf1f7, 8, 24);

  // Entorno PBR de estudio sin archivos externos
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0.0, 1.25, 3.15);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.92, 0);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.55;
  controls.maxDistance = 8.5;
  controls.maxPolarAngle = Math.PI / 1.92;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1.2;

  controls.addEventListener('start', () => {
    isTransitioningCamera = false;
  });

  // Iluminación de estudio de 3 puntos (Luz Principal Cálida, Relleno Hemisférico Frío y Contraluz)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.15);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
  keyLight.position.set(3.5, 5.5, 4.0);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(2048, 2048);
  Object.assign(keyLight.shadow.camera, {
    left: -1.8,
    right: 1.8,
    top: 2.4,
    bottom: -0.5,
    near: 0.5,
    far: 15,
  });
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.015;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.05);
  fillLight.position.set(-4.0, 3.0, 2.5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.35);
  rimLight.position.set(0.0, 3.8, -4.5);
  scene.add(rimLight);

  // Plataforma / Suelo de estudio con retícula de proporción y sombra de contacto
  const floorGroup = new THREE.Group();
  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 64),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.001;
  shadowPlane.receiveShadow = true;
  floorGroup.add(shadowPlane);

  // Sombra de contacto radial suave bajo los pies (funciona incluso en software WebGL)
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 128;
  contactCanvas.height = 128;
  const ctx = contactCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.34)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.12)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const contactTex = new THREE.CanvasTexture(contactCanvas);
  const contactMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
    })
  );
  contactMesh.rotation.x = -Math.PI / 2;
  contactMesh.position.y = 0.002;
  floorGroup.add(contactMesh);

  // Anillo de referencia métrica en el suelo
  const ringGeo = new THREE.RingGeometry(0.52, 0.535, 64);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMesh = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.65 })
  );
  ringMesh.position.y = 0.003;
  floorGroup.add(ringMesh);

  scene.add(floorGroup);
  scene.add(characterGroup);

  // ==========================================================================
  // INTERACCIÓN CON RAYCASTER (CLIC EN ZONA ANATÓMICA vs ARRASTRE DE ÓRBITA)
  // ==========================================================================
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let downY = 0;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (dist > 6) return; // Fue un arrastre de cámara, no un clic de selección

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(characterGroup.children, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.zone) {
        obj = obj.parent;
      }
      if (obj && obj.userData.zone) {
        CONFIG.selectedZone = obj.userData.zone;
        flashSelectedZone(obj.userData.zone);
        if (onZonePicked) onZonePicked(obj.userData.zone);
      }
    }
  });

  // Cambio de cursor al pasar el ratón sobre el cuerpo 3D
  let lastHoverCheck = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastHoverCheck < 50) return;
    lastHoverCheck = now;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(characterGroup.children, true);
    renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Bucle de renderizado con soporte para GPU y Software WebGL
  const clock = new THREE.Clock();

  function afterDraw(cb) {
    const gl = renderer.getContext();
    if (!gl || !gl.fenceSync) {
      window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        window.setTimeout(cb, 80);
      }
    };
    window.setTimeout(poll, 5);
  }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.1);

    if (isTransitioningCamera) {
      const alpha = 1 - Math.exp(-8 * dt);
      camera.position.lerp(camTargetPos, alpha);
      controls.target.lerp(camTargetLook, alpha);
      if (
        camera.position.distanceToSquared(camTargetPos) < 0.0005 &&
        controls.target.distanceToSquared(camTargetLook) < 0.0005
      ) {
        isTransitioningCamera = false;
      }
    }

    controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      requestAnimationFrame(tick);
    }
  }

  tick();
}

/**
 * Emite un destello sutil de selección en la zona anatómica clicada
 */
export function flashSelectedZone(zoneName) {
  const highlightedMeshes = [];
  characterGroup.traverse((o) => {
    if (o.isMesh && o.userData.zone === zoneName && o.material && o.material.emissive) {
      const clonedMat = o.material.clone();
      clonedMat.emissive.setHex(0x1d4ed8);
      clonedMat.emissiveIntensity = 0.25;
      const origMat = o.material;
      o.material = clonedMat;
      highlightedMeshes.push({ mesh: o, origMat, clonedMat });
    }
  });

  if (highlightedMeshes.length > 0) {
    setTimeout(() => {
      highlightedMeshes.forEach(({ mesh, origMat, clonedMat }) => {
        mesh.material = origMat;
        clonedMat.dispose();
      });
    }, 260);
  }
}

/**
 * Enfoca suavemente la cámara hacia un ángulo o zona anatómica específica
 */
export function setCameraPreset(presetName) {
  const presets = {
    full: { pos: [0.0, 1.22, 3.15], look: [0, 0.92, 0] },
    face: { pos: [0.0, 1.62, 0.95], look: [0, 1.56, 0] },
    torso: { pos: [0.0, 1.24, 1.65], look: [0, 1.15, 0] },
    brazos: { pos: [0.65, 1.22, 1.85], look: [0, 1.12, 0] },
    piernas: { pos: [0.35, 0.62, 1.95], look: [0, 0.52, 0] },
    side: { pos: [2.85, 1.18, 0.35], look: [0, 0.92, 0] },
  };

  const p = presets[presetName] || presets.full;
  camTargetPos.set(...p.pos);
  camTargetLook.set(...p.look);
  isTransitioningCamera = true;
}

/**
 * Alterna el giro automático de la cámara de estudio
 */
export function toggleAutoRotate() {
  if (!controls) return false;
  controls.autoRotate = !controls.autoRotate;
  return controls.autoRotate;
}

/**
 * Alterna entre vista sólida PBR y malla topológica (Wireframe) para inspeccionar la geometría procedural
 */
export function toggleWireframeMode() {
  wireframeEnabled = !wireframeEnabled;
  Object.values(MAT).forEach((mat) => {
    if ('wireframe' in mat) {
      mat.wireframe = wireframeEnabled;
    }
  });
  return wireframeEnabled;
}
