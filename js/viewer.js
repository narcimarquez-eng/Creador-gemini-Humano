import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  characterGroup,
  CONFIG,
  MAT,
  updateCharacterAnimation,
} from './character.js';

let renderer;
let scene;
let camera;
let controls;
let wireframeEnabled = false;

// Objetos 3D para Efectos Visuales Procedurales (Skills Definitivas, Nado, Combate)
let vfxGroup;
let novaSphere;
let novaRing;
let slamRing1;
let slamRing2;
let beamOrb;
let beamCylinder;
let swimRipple1;
let swimRipple2;

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
 * Crea las mallas de efectos visuales procedurales para Skills Definitivas y Nado
 * (Fuera de characterGroup para no alterar la exportación GLB del personaje)
 */
function createProceduralVFX() {
  vfxGroup = new THREE.Group();
  vfxGroup.name = 'StudioVFX';

  // 1. Supernova (Esfera de energía + Anillo de expansión)
  novaSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 28, 28),
    new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    })
  );
  novaRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.018, 12, 48),
    new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.0,
    })
  );
  novaRing.rotation.x = Math.PI / 2;
  vfxGroup.add(novaSphere, novaRing);

  // 2. Impacto Sísmico (Anillos de onda expansiva en el suelo)
  const slamRingGeo = new THREE.RingGeometry(0.18, 0.26, 48);
  slamRingGeo.rotateX(-Math.PI / 2);
  slamRing1 = new THREE.Mesh(
    slamRingGeo,
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  slamRing1.position.y = 0.01;

  slamRing2 = new THREE.Mesh(
    slamRingGeo.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  slamRing2.position.y = 0.012;
  vfxGroup.add(slamRing1, slamRing2);

  // 3. Cañón de Energía (Orbe de carga + Haz cilíndrico frontal)
  beamOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0,
    })
  );

  const cylGeo = new THREE.CylinderGeometry(0.09, 0.14, 2.6, 24, 1, true);
  cylGeo.rotateX(Math.PI / 2);
  beamCylinder = new THREE.Mesh(
    cylGeo,
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  vfxGroup.add(beamOrb, beamCylinder);

  // 4. Ondas de agua para la animación de Nadar
  const waterRingGeo = new THREE.RingGeometry(0.32, 0.35, 48);
  waterRingGeo.rotateX(-Math.PI / 2);
  swimRipple1 = new THREE.Mesh(
    waterRingGeo,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  swimRipple2 = new THREE.Mesh(
    waterRingGeo.clone(),
    new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  vfxGroup.add(swimRipple1, swimRipple2);

  scene.add(vfxGroup);
}

/**
 * Actualiza la visibilidad y escala de los efectos visuales según la animación en curso
 */
function updateProceduralVFX(vfxType, u) {
  if (!vfxGroup) return;

  // Ocultar por defecto
  novaSphere.material.opacity = 0;
  novaRing.material.opacity = 0;
  slamRing1.material.opacity = 0;
  slamRing2.material.opacity = 0;
  beamOrb.material.opacity = 0;
  beamCylinder.material.opacity = 0;
  swimRipple1.material.opacity = 0;
  swimRipple2.material.opacity = 0;

  if (!vfxType) return;

  if (vfxType === 'nova') {
    if (u < 0.42) {
      // Fase de carga concentrando energía
      const t = u / 0.42;
      novaSphere.position.set(0, 1.15 + t * 0.22, 0);
      novaSphere.scale.setScalar(1.3 - t * 0.85);
      novaSphere.rotation.y += 0.08;
      novaSphere.material.opacity = t * 0.55;
    } else if (u < 0.85) {
      // Fase de explosión Supernova
      const t = (u - 0.42) / 0.43;
      const scale = 0.45 + t * 3.8;
      novaSphere.position.set(0, 1.38, 0);
      novaSphere.scale.setScalar(scale);
      novaSphere.rotation.y += 0.14;
      novaSphere.material.opacity = (1 - t) * 0.65;

      novaRing.position.set(0, 1.32, 0);
      novaRing.scale.setScalar(0.5 + t * 4.5);
      novaRing.material.opacity = (1 - t) * 0.85;
    }
  } else if (vfxType === 'slam') {
    if (u >= 0.56) {
      const t = (u - 0.56) / 0.44;
      slamRing1.scale.setScalar(0.6 + t * 6.5);
      slamRing1.material.opacity = (1 - t) * 0.85;

      const t2 = Math.max(0, (u - 0.62) / 0.38);
      slamRing2.scale.setScalar(0.4 + t2 * 4.8);
      slamRing2.material.opacity = t2 > 0 ? (1 - t2) * 0.7 : 0;
    }
  } else if (vfxType === 'beam') {
    if (u < 0.42) {
      const t = u / 0.42;
      beamOrb.position.set(-0.24, 0.96, 0.08);
      beamOrb.scale.setScalar(0.3 + t * 1.1 + Math.sin(t * 25) * 0.08);
      beamOrb.material.opacity = t * 0.85;
    } else if (u < 0.88) {
      const t = (u - 0.42) / 0.46;
      const fade = t > 0.8 ? (1 - t) / 0.2 : 1.0;
      beamOrb.position.set(0, 1.15, 0.48);
      beamOrb.scale.setScalar(1.25 + Math.sin(t * 40) * 0.12);
      beamOrb.material.opacity = 0.85 * fade;

      beamCylinder.position.set(0, 1.15, 1.78);
      const pulse = 1 + Math.sin(t * 50) * 0.12;
      beamCylinder.scale.set(pulse, pulse, 1.0);
      beamCylinder.material.opacity = 0.68 * fade;
    }
  } else if (vfxType === 'swim') {
    const t1 = u;
    const t2 = (u + 0.5) % 1.0;
    swimRipple1.position.set(0, 1.12, 0);
    swimRipple1.scale.setScalar(0.8 + t1 * 2.4);
    swimRipple1.material.opacity = (1 - t1) * 0.45;

    swimRipple2.position.set(0, 1.12, 0);
    swimRipple2.scale.setScalar(0.8 + t2 * 2.4);
    swimRipple2.material.opacity = (1 - t2) * 0.45;
  }
}

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

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0.0, 1.25, 3.25);

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

  // Iluminación de estudio de 3 puntos
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

  // Plataforma de estudio
  const floorGroup = new THREE.Group();
  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 64),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.001;
  shadowPlane.receiveShadow = true;
  floorGroup.add(shadowPlane);

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
  createProceduralVFX();

  // ==========================================================================
  // INTERACCIÓN CON RAYCASTER
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
    if (dist > 6) return;

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

    // Actualizar animación esquelética en tiempo real y efectos visuales
    const { vfxType, vfxProgress } = updateCharacterAnimation(dt);
    updateProceduralVFX(vfxType, vfxProgress);

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
    full: { pos: [0.0, 1.22, 3.25], look: [0, 0.92, 0] },
    face: { pos: [0.0, 1.62, 0.95], look: [0, 1.56, 0] },
    torso: { pos: [0.0, 1.24, 1.65], look: [0, 1.15, 0] },
    brazos: { pos: [0.65, 1.22, 1.85], look: [0, 1.12, 0] },
    piernas: { pos: [0.35, 0.62, 1.95], look: [0, 0.52, 0] },
    side: { pos: [2.95, 1.18, 0.35], look: [0, 0.92, 0] },
  };

  const p = presets[presetName] || presets.full;
  camTargetPos.set(...p.pos);
  camTargetLook.set(...p.look);
  isTransitioningCamera = true;
}

export function toggleAutoRotate() {
  if (!controls) return false;
  controls.autoRotate = !controls.autoRotate;
  return controls.autoRotate;
}

export function toggleWireframeMode() {
  wireframeEnabled = !wireframeEnabled;
  Object.values(MAT).forEach((mat) => {
    if ('wireframe' in mat) {
      mat.wireframe = wireframeEnabled;
    }
  });
  return wireframeEnabled;
}
