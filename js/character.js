import * as THREE from 'three';
import {
  createAnatomicalLathe,
  buildSculptedTorsoGeometry,
  buildSculptedHeadGroup,
  buildProceduralHairGroup,
  createProceduralFaceSkinMaterial,
  buildSculptedUpperArmGeometry,
  buildSculptedForearmGeometry,
  buildHandGroup,
  buildFootGroup,
} from './procedural.js';
import {
  POSES,
  evaluateGameAnimation,
  buildProceduralItems,
} from './items.js';

/**
 * Estado global de configuración anatómica y de animación del personaje
 */
export const CONFIG = {
  selectedZone: 'cara',
  colors: {
    skin: '#e8b49a',
    eyes: '#3b82f6',
    hair: '#2c1b12',
    beard: '#2c1b12',
    lips: '#c26d68',
    cloth: '#1e293b',
  },
  cara: {
    headWidth: 0.94,
    headHeight: 0.78,
    jawWidth: 0.84,
    chinLength: 1.42,
    chinY: 1.38,
    browRidge: 1.0,
    eyeType: 'almendrado',
    eyeSlant: 0.0,
    eyeOpen: 1.0,
    eyeSize: 1.12,
    eyeSpacing: 1.10,
    eyeY: 0.72,
    eyeSquash: 1.0,
    eyeAspect: 1.0,
    eyeAngular: 0.0,
    noseLength: 1.35,
    noseWidth: 0.98,
    lipWidth: 1.0,
    lipThickness: 0.55,
    earSize: 1.05,
    beardStyle: 'ninguna',
    beardLength: 1.0,
    poreDetail: 1.0,
  },
  pelo: {
    style: 'corto',
    volume: 1.0,
    height: 1.0,
    density: 1.0,
    hairline: 1.0,
  },
  torso: {
    chestWidth: 1.06,
    waistWidth: 0.94,
    hipWidth: 0.98,
    chestDepth: 1.02,
    height: 1.0,
    neckWidth: 1.0,
    muscleDef: 0.65,
  },
  brazos: {
    length: 1.0,
    thickness: 1.0,
    bicepSize: 1.08,
    forearmSize: 1.0,
    handSize: 1.0,
  },
  piernas: {
    length: 1.0,
    thickness: 1.04,
    calfSize: 1.05,
    gluteSize: 1.0,
    footSize: 1.0,
  },
  items: {
    pose: 'apose', // Pose A (55°) por defecto: óptima para rigging y animación
    animation: 'none', // 'none', 'idle', 'walk', 'run', 'jump', 'swim', 'punch', 'kick', 'ultimate_nova', etc.
    animSpeed: 1.0,
    animPlaying: true,
    outfit: 'shorts',
    accessory: 'ninguno',
  },
};

export const DEFAULTS = JSON.parse(JSON.stringify(CONFIG));

/**
 * Arquetipos anatómicos predefinidos
 */
export const ARCHETYPES = {
  hombre: {
    label: 'Hombre',
    torso: { chestWidth: 1.14, waistWidth: 0.94, hipWidth: 0.96, chestDepth: 1.08, height: 1.02, neckWidth: 1.06, muscleDef: 0.62 },
    brazos: { length: 1.02, thickness: 1.06, bicepSize: 1.12, forearmSize: 1.06, handSize: 1.02 },
    piernas: { length: 1.02, thickness: 1.05, calfSize: 1.06, gluteSize: 1.0, footSize: 1.02 },
    cara: {
      headWidth: 0.98,
      headHeight: 0.96,
      jawWidth: 1.04,
      chinLength: 1.15,
      chinY: 1.10,
      browRidge: 1.10,
      eyeType: 'almendrado',
      eyeOpen: 1.0,
      eyeSlant: 0.0,
      eyeSize: 1.06,
      eyeSpacing: 1.08,
      eyeY: 0.72,
      eyeSquash: 0.95,
      eyeAspect: 1.05,
      eyeAngular: 0.20,
      noseLength: 1.15,
      noseWidth: 1.05,
      lipWidth: 1.0,
      lipThickness: 0.52,
      earSize: 1.02,
      beardStyle: 'sombra',
      beardLength: 1.0,
    },
    pelo: { style: 'corto', volume: 1.0, height: 1.0 },
    colors: { hair: '#2c1b12', beard: '#2c1b12', skin: '#e8b49a', eyes: '#3b82f6' },
  },
  mujer: {
    label: 'Mujer',
    torso: { chestWidth: 0.92, waistWidth: 0.76, hipWidth: 1.18, chestDepth: 1.14, height: 0.96, neckWidth: 0.82, muscleDef: 0.18 },
    brazos: { length: 0.96, thickness: 0.86, bicepSize: 0.84, forearmSize: 0.86, handSize: 0.90 },
    piernas: { length: 0.98, thickness: 0.95, calfSize: 0.94, gluteSize: 1.20, footSize: 0.92 },
    cara: {
      headWidth: 0.90,
      headHeight: 0.92,
      jawWidth: 0.76,
      chinLength: 1.02,
      chinY: 1.18,
      browRidge: 0.72,
      eyeType: 'almendrado',
      eyeOpen: 1.08,
      eyeSlant: 0.08,
      eyeSize: 1.14,
      eyeSpacing: 1.06,
      eyeY: 0.74,
      eyeSquash: 1.0,
      eyeAspect: 1.0,
      eyeAngular: 0.0,
      noseLength: 0.95,
      noseWidth: 0.88,
      lipWidth: 1.02,
      lipThickness: 0.74,
      earSize: 0.92,
      beardStyle: 'ninguna',
      beardLength: 0.0,
    },
    pelo: { style: 'largo', volume: 1.12, height: 1.05 },
    colors: { hair: '#4a2c18', beard: '#4a2c18', skin: '#f2c4ad', eyes: '#2563eb', lips: '#c45a66' },
  },
  anciano: {
    label: 'Anciano',
    torso: { chestWidth: 1.02, waistWidth: 1.02, hipWidth: 0.96, chestDepth: 0.98, height: 0.96, neckWidth: 0.95, muscleDef: 0.22 },
    brazos: { length: 0.98, thickness: 0.92, bicepSize: 0.86, forearmSize: 0.90, handSize: 1.02 },
    piernas: { length: 0.96, thickness: 0.92, calfSize: 0.90, gluteSize: 0.88, footSize: 1.0 },
    cara: {
      headWidth: 0.96,
      headHeight: 0.94,
      jawWidth: 0.98,
      chinLength: 1.12,
      chinY: 1.15,
      browRidge: 1.18,
      eyeType: 'caido',
      eyeOpen: 0.82,
      eyeSlant: -0.10,
      eyeSize: 0.96,
      eyeSpacing: 1.08,
      eyeY: 0.70,
      eyeSquash: 0.85,
      eyeAspect: 1.0,
      eyeAngular: 0.1,
      noseLength: 1.22,
      noseWidth: 1.10,
      lipWidth: 0.92,
      lipThickness: 0.44,
      earSize: 1.22,
      beardStyle: 'perilla',
      beardLength: 1.15,
    },
    pelo: { style: 'corto', volume: 0.88, height: 0.85 },
    colors: { hair: '#d4d4d8', beard: '#d4d4d8', skin: '#d9a78d', eyes: '#64748b' },
  },
  anciana: {
    label: 'Anciana',
    torso: { chestWidth: 0.94, waistWidth: 0.92, hipWidth: 1.12, chestDepth: 1.02, height: 0.92, neckWidth: 0.84, muscleDef: 0.12 },
    brazos: { length: 0.94, thickness: 0.85, bicepSize: 0.80, forearmSize: 0.82, handSize: 0.90 },
    piernas: { length: 0.92, thickness: 0.90, calfSize: 0.88, gluteSize: 1.04, footSize: 0.90 },
    cara: {
      headWidth: 0.92,
      headHeight: 0.90,
      jawWidth: 0.82,
      chinLength: 0.98,
      chinY: 1.14,
      browRidge: 0.78,
      eyeType: 'caido',
      eyeOpen: 0.86,
      eyeSlant: -0.08,
      eyeSize: 0.98,
      eyeSpacing: 1.06,
      eyeY: 0.72,
      eyeSquash: 0.88,
      eyeAspect: 1.0,
      eyeAngular: 0.0,
      noseLength: 1.12,
      noseWidth: 0.98,
      lipWidth: 0.90,
      lipThickness: 0.42,
      earSize: 1.16,
      beardStyle: 'ninguna',
      beardLength: 0.0,
    },
    pelo: { style: 'recogido', volume: 1.02, height: 0.95 },
    colors: { hair: '#e2e8f0', beard: '#e2e8f0', skin: '#dfab94', lips: '#a8656d' },
  },
  nino: {
    label: 'Niño',
    torso: { chestWidth: 0.82, waistWidth: 0.82, hipWidth: 0.84, chestDepth: 0.84, height: 0.76, neckWidth: 0.80, muscleDef: 0.04 },
    brazos: { length: 0.82, thickness: 0.78, bicepSize: 0.76, forearmSize: 0.76, handSize: 0.82 },
    piernas: { length: 0.78, thickness: 0.80, calfSize: 0.80, gluteSize: 0.85, footSize: 0.82 },
    cara: {
      headWidth: 1.18,
      headHeight: 1.14,
      jawWidth: 0.74,
      chinLength: 0.84,
      chinY: 1.10,
      browRidge: 0.62,
      eyeType: 'redondo',
      eyeOpen: 1.12,
      eyeSlant: 0.0,
      eyeSize: 1.26,
      eyeSpacing: 1.12,
      eyeY: 0.72,
      eyeSquash: 1.05,
      eyeAspect: 0.98,
      eyeAngular: 0.0,
      noseLength: 0.82,
      noseWidth: 0.86,
      lipWidth: 0.92,
      lipThickness: 0.62,
      earSize: 0.98,
      beardStyle: 'ninguna',
      beardLength: 0.0,
    },
    pelo: { style: 'cresta', volume: 1.08, height: 1.05 },
    colors: { hair: '#3b2518', beard: '#3b2518', skin: '#f5cbb7', eyes: '#2563eb' },
  },
  nina: {
    label: 'Niña',
    torso: { chestWidth: 0.80, waistWidth: 0.80, hipWidth: 0.82, chestDepth: 0.82, height: 0.75, neckWidth: 0.78, muscleDef: 0.02 },
    brazos: { length: 0.80, thickness: 0.74, bicepSize: 0.74, forearmSize: 0.74, handSize: 0.80 },
    piernas: { length: 0.76, thickness: 0.76, calfSize: 0.78, gluteSize: 0.84, footSize: 0.80 },
    cara: {
      headWidth: 1.16,
      headHeight: 1.12,
      jawWidth: 0.72,
      chinLength: 0.80,
      chinY: 1.12,
      browRidge: 0.58,
      eyeType: 'redondo',
      eyeOpen: 1.14,
      eyeSlant: 0.0,
      eyeSize: 1.28,
      eyeSpacing: 1.10,
      eyeY: 0.72,
      eyeSquash: 1.06,
      eyeAspect: 0.98,
      eyeAngular: 0.0,
      noseLength: 0.80,
      noseWidth: 0.84,
      lipWidth: 0.94,
      lipThickness: 0.65,
      earSize: 0.94,
      beardStyle: 'ninguna',
      beardLength: 0.0,
    },
    pelo: { style: 'medio', volume: 1.15, height: 1.08 },
    colors: { hair: '#78350f', beard: '#78350f', skin: '#f8d0c0', eyes: '#0d9488', lips: '#d9777f' },
  },
  proporcional: {
    label: 'Rostro Humano',
    torso: { chestWidth: 1.04, waistWidth: 0.92, hipWidth: 0.96, chestDepth: 1.00, height: 1.0, neckWidth: 0.98, muscleDef: 0.55 },
    brazos: { length: 1.0, thickness: 1.0, bicepSize: 1.05, forearmSize: 1.0, handSize: 1.0 },
    piernas: { length: 1.0, thickness: 1.02, calfSize: 1.02, gluteSize: 1.0, footSize: 1.0 },
    cara: {
      headWidth: 0.94,
      headHeight: 0.78,
      jawWidth: 0.84,
      chinLength: 1.42,
      chinY: 1.38,
      browRidge: 1.0,
      eyeType: 'almendrado',
      eyeSlant: 0.0,
      eyeOpen: 1.0,
      eyeSize: 1.12,
      eyeSpacing: 1.10,
      eyeY: 0.72,
      eyeSquash: 1.0,
      eyeAspect: 1.0,
      eyeAngular: 0.0,
      noseLength: 1.35,
      noseWidth: 0.98,
      lipWidth: 1.0,
      lipThickness: 0.55,
      earSize: 1.05,
      beardStyle: 'ninguna',
      beardLength: 1.0,
    },
  },
  atletico: {
    label: 'Atlético',
    torso: { chestWidth: 1.08, waistWidth: 0.92, hipWidth: 0.96, chestDepth: 1.04, height: 1.02, neckWidth: 1.02, muscleDef: 0.68 },
    brazos: { length: 1.0, thickness: 1.05, bicepSize: 1.12, forearmSize: 1.04, handSize: 1.0 },
    piernas: { length: 1.02, thickness: 1.06, calfSize: 1.08, gluteSize: 1.04, footSize: 1.0 },
    cara: { jawWidth: 1.04, chinLength: 1.0, chinY: 1.02, browRidge: 1.05, headWidth: 1.0, headHeight: 1.0 },
  },
  culturista: {
    label: 'Culturista',
    torso: { chestWidth: 1.32, waistWidth: 0.88, hipWidth: 0.98, chestDepth: 1.24, height: 1.0, neckWidth: 1.22, muscleDef: 0.96 },
    brazos: { length: 1.0, thickness: 1.32, bicepSize: 1.42, forearmSize: 1.25, handSize: 1.05 },
    piernas: { length: 1.0, thickness: 1.30, calfSize: 1.34, gluteSize: 1.22, footSize: 1.04 },
    cara: { jawWidth: 1.14, chinLength: 1.08, chinY: 1.05, browRidge: 1.15, headWidth: 1.04, headHeight: 0.98 },
  },
  esbelto: {
    label: 'Esbelto',
    torso: { chestWidth: 0.90, waistWidth: 0.82, hipWidth: 0.90, chestDepth: 0.88, height: 1.06, neckWidth: 0.88, muscleDef: 0.32 },
    brazos: { length: 1.05, thickness: 0.82, bicepSize: 0.85, forearmSize: 0.84, handSize: 0.95 },
    piernas: { length: 1.08, thickness: 0.86, calfSize: 0.88, gluteSize: 0.90, footSize: 0.96 },
    cara: { jawWidth: 0.90, chinLength: 0.96, chinY: 0.98, browRidge: 0.85, headWidth: 0.95, headHeight: 1.04 },
  },
  robusto: {
    label: 'Robusto',
    torso: { chestWidth: 1.26, waistWidth: 1.22, hipWidth: 1.18, chestDepth: 1.26, height: 0.96, neckWidth: 1.20, muscleDef: 0.48 },
    brazos: { length: 0.95, thickness: 1.26, bicepSize: 1.20, forearmSize: 1.22, handSize: 1.08 },
    piernas: { length: 0.94, thickness: 1.25, calfSize: 1.22, gluteSize: 1.18, footSize: 1.06 },
    cara: { jawWidth: 1.16, chinLength: 1.02, chinY: 0.96, browRidge: 1.10, headWidth: 1.08, headHeight: 0.96 },
  },
};

/**
 * Materiales PBR con ligero contraste tonal entre piel base y relieve muscular
 */
export const MAT = {
  skin: new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.skin,
    roughness: 0.52,
    metalness: 0.02,
    clearcoat: 0.08,
    clearcoatRoughness: 0.65,
  }),
  faceSkin: createProceduralFaceSkinMaterial(CONFIG.colors.skin),
  muscle: new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.skin,
    roughness: 0.45,
    metalness: 0.03,
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
  }),
  eyeWhite: new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 1.0,
  }),
  eyeIris: new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.eyes,
    roughness: 0.18,
    metalness: 0.1,
    clearcoat: 1.0,
  }),
  eyePupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
  hair: new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.hair,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.48,
    clearcoatRoughness: 0.28,
    sheen: 0.88,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color(CONFIG.colors.hair).offsetHSL(0, 0.08, 0.16),
    reflectivity: 0.60,
  }),
  scalpTransition: new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.52,
    metalness: 0.02,
    clearcoat: 0.28,
    clearcoatRoughness: 0.38,
    sheen: 0.45,
    sheenRoughness: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  }),
  beard: new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.beard || CONFIG.colors.hair,
    roughness: 0.46,
    metalness: 0.04,
    clearcoat: 0.42,
    clearcoatRoughness: 0.32,
    sheen: 0.82,
    sheenRoughness: 0.38,
    sheenColor: new THREE.Color(CONFIG.colors.beard || CONFIG.colors.hair).offsetHSL(0, 0.08, 0.16),
    reflectivity: 0.55,
  }),
  caruncula: new THREE.MeshPhysicalMaterial({
    color: 0xdf8080,
    roughness: 0.15,
    metalness: 0.0,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    transmission: 0.10,
    ior: 1.38,
  }),
  lips: new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.lips,
    roughness: 0.36,
    metalness: 0.02,
    clearcoat: 0.25,
  }),
  cloth: new THREE.MeshStandardMaterial({
    color: CONFIG.colors.cloth,
    roughness: 0.68,
    metalness: 0.08,
  }),
};

/**
 * Grupo raíz del personaje y diccionario de pivotes jerárquicos con nombres estándar de Rigging
 */
export const characterGroup = new THREE.Group();
characterGroup.name = 'ProceduralHumanCharacter';

export const rig = {
  pelvis: new THREE.Group(),
  torso: new THREE.Group(),
  neck: new THREE.Group(),
  head: new THREE.Group(),
  shoulderL: new THREE.Group(),
  shoulderR: new THREE.Group(),
  upperArmL: new THREE.Group(),
  upperArmR: new THREE.Group(),
  elbowL: new THREE.Group(),
  elbowR: new THREE.Group(),
  forearmL: new THREE.Group(),
  forearmR: new THREE.Group(),
  wristL: new THREE.Group(),
  wristR: new THREE.Group(),
  hipL: new THREE.Group(),
  hipR: new THREE.Group(),
  thighL: new THREE.Group(),
  thighR: new THREE.Group(),
  kneeL: new THREE.Group(),
  kneeR: new THREE.Group(),
  shinL: new THREE.Group(),
  shinR: new THREE.Group(),
  ankleL: new THREE.Group(),
  ankleR: new THREE.Group(),
};

// Asignar nombres de huesos únicos para exportación de AnimationClips en GLB
rig.pelvis.name = 'Pelvis';
rig.torso.name = 'Torso';
rig.neck.name = 'Neck';
rig.head.name = 'Head';
rig.shoulderL.name = 'Shoulder_L';
rig.shoulderR.name = 'Shoulder_R';
rig.upperArmL.name = 'UpperArm_L';
rig.upperArmR.name = 'UpperArm_R';
rig.elbowL.name = 'Elbow_L';
rig.elbowR.name = 'Elbow_R';
rig.forearmL.name = 'Forearm_L';
rig.forearmR.name = 'Forearm_R';
rig.wristL.name = 'Wrist_L';
rig.wristR.name = 'Wrist_R';
rig.hipL.name = 'Hip_L';
rig.hipR.name = 'Hip_R';
rig.thighL.name = 'Thigh_L';
rig.thighR.name = 'Thigh_R';
rig.kneeL.name = 'Knee_L';
rig.kneeR.name = 'Knee_R';
rig.shinL.name = 'Shin_L';
rig.shinR.name = 'Shin_R';
rig.ankleL.name = 'Ankle_L';
rig.ankleR.name = 'Ankle_R';

let animAccumulatedTime = 0;

/**
 * Asigna recursivamente la etiqueta userData.zone para el Raycaster
 */
function assignZone(obj, zoneName) {
  obj.traverse((child) => {
    if (child.isMesh && !child.userData.zone) {
      child.userData.zone = zoneName;
    }
  });
}

/**
 * Limpia recursivamente las geometrías de un grupo antes de reconstruir
 */
function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse((o) => {
      if (o.isMesh && o.geometry) {
        o.geometry.dispose();
      }
    });
  }
}

/**
 * Sincroniza colores de materiales con CONFIG.colors
 */
export function syncMaterialColors() {
  const skinCol = new THREE.Color(CONFIG.colors.skin);
  MAT.skin.color.copy(skinCol);
  MAT.muscle.color.copy(skinCol);
  if (MAT.faceSkin) {
    MAT.faceSkin.color.copy(skinCol);
    const detail = CONFIG.cara.poreDetail ?? 1.0;
    if (MAT.faceSkin.userData?.uBaseSkinColor) {
      MAT.faceSkin.userData.uBaseSkinColor.value.copy(skinCol);
      MAT.faceSkin.userData.uPoreDepth.value = 0.85 * detail;
      MAT.faceSkin.userData.uImperfectionAmount.value = 0.65 * detail;
      MAT.faceSkin.userData.uMicroRoughness.value = 0.70 * detail;
    }
  }

  MAT.eyeIris.color.set(CONFIG.colors.eyes);

  // Sincronizar tono y brillo sedoso de queratina para cabello y barba
  const hairCol = new THREE.Color(CONFIG.colors.hair);
  MAT.hair.color.copy(hairCol);
  if (MAT.hair.sheenColor) {
    MAT.hair.sheenColor.copy(hairCol).offsetHSL(0, 0.08, 0.16);
  }

  const beardHex = CONFIG.colors.beard || CONFIG.colors.hair;
  const beardCol = new THREE.Color(beardHex);
  if (MAT.beard) {
    MAT.beard.color.copy(beardCol);
    if (MAT.beard.sheenColor) {
      MAT.beard.sheenColor.copy(beardCol).offsetHSL(0, 0.08, 0.16);
    }
  }

  // Tono mucoso adaptado anatómicamente para la carúncula lagrimal
  if (MAT.caruncula) {
    const mucosalCol = new THREE.Color(0xdf8080).lerp(skinCol, 0.22);
    MAT.caruncula.color.copy(mucosalCol);
  }

  MAT.lips.color.set(CONFIG.colors.lips);
  MAT.cloth.color.set(CONFIG.colors.cloth);

  // Sincronizar degradado de cuero cabelludo/raíz con piel y pelo
  characterGroup.traverse((obj) => {
    if (obj.name === 'hairScalpTransition' && obj.geometry && obj.geometry.userData?.updateColors) {
      obj.geometry.userData.updateColors(CONFIG.colors.skin, CONFIG.colors.hair);
    }
  });
}

/**
 * Construye el personaje humano completo 100% por código matemático con jerarquía esquelética conectada
 */
export function rebuildCharacter() {
  clearGroup(characterGroup);
  Object.values(rig).forEach((g) => {
    clearGroup(g);
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    g.scale.set(1, 1, 1);
  });

  syncMaterialColors();

  const c = CONFIG;
  const mDef = c.torso.muscleDef;
  const pose = POSES[c.items.pose] || POSES.apose;

  // Dimensiones maestras conectadas
  const torsoH = 0.62 * c.torso.height;
  const upperArmLen = 0.28 * c.brazos.length;
  const forearmLen = 0.26 * c.brazos.length;
  const thighLen = 0.42 * c.piernas.length;
  const shinLen = 0.40 * c.piernas.length;

  // ==========================================================================
  // 1. ESTRUCTURA JERÁRQUICA DE ESQUELETO (PIVOTES CONECTADOS)
  // ==========================================================================
  characterGroup.add(rig.pelvis);
  rig.pelvis.add(rig.torso);

  const shoulderY = torsoH * 0.36;
  const shoulderX = 0.212 * c.torso.chestWidth;
  const neckY = torsoH * 0.47;
  const hipY = -torsoH * 0.46;
  const hipX = 0.105 * (c.torso.hipWidth ?? 1.0);

  // Cuello y Cabeza
  rig.neck.position.set(0, neckY, -0.005);
  rig.torso.add(rig.neck);

  const neckLen = 0.11;
  rig.head.position.set(0, neckLen * 0.72, 0.008);
  rig.neck.add(rig.head);

  // Brazos Izquierdo (+X) y Derecho (-X)
  rig.shoulderL.position.set(shoulderX, shoulderY, 0.0);
  rig.shoulderR.position.set(-shoulderX, shoulderY, 0.0);
  rig.torso.add(rig.shoulderL, rig.shoulderR);

  rig.shoulderL.add(rig.upperArmL);
  rig.shoulderR.add(rig.upperArmR);

  rig.elbowL.position.set(0, -upperArmLen, 0);
  rig.elbowR.position.set(0, -upperArmLen, 0);
  rig.upperArmL.add(rig.elbowL);
  rig.upperArmR.add(rig.elbowR);

  rig.elbowL.add(rig.forearmL);
  rig.elbowR.add(rig.forearmR);

  rig.wristL.position.set(0, -forearmLen, 0);
  rig.wristR.position.set(0, -forearmLen, 0);
  rig.forearmL.add(rig.wristL);
  rig.forearmR.add(rig.wristR);

  // Piernas Izquierda (+X) y Derecha (-X)
  rig.hipL.position.set(hipX, hipY, 0);
  rig.hipR.position.set(-hipX, hipY, 0);
  rig.pelvis.add(rig.hipL, rig.hipR);

  rig.hipL.add(rig.thighL);
  rig.hipR.add(rig.thighR);

  rig.kneeL.position.set(0, -thighLen, 0);
  rig.kneeR.position.set(0, -thighLen, 0);
  rig.thighL.add(rig.kneeL);
  rig.thighR.add(rig.kneeR);

  rig.kneeL.add(rig.shinL);
  rig.kneeR.add(rig.shinR);

  rig.ankleL.position.set(0, -shinLen, 0);
  rig.ankleR.position.set(0, -shinLen, 0);
  rig.shinL.add(rig.ankleL);
  rig.shinR.add(rig.ankleR);

  // ==========================================================================
  // 2. ESCULTURA DEL TORSO Y CUELLO (MALLA ORGÁNICA CONTINUA SIN ESFERAS SUELTAS)
  // ==========================================================================
  const torsoGeo = buildSculptedTorsoGeometry(c.torso);
  const torsoMesh = new THREE.Mesh(torsoGeo, MAT.skin);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  rig.torso.add(torsoMesh);

  // Glúteos integrados en la pelvis posterior
  const gluteScale = c.piernas.gluteSize ?? 1.0;
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const glute = new THREE.Mesh(new THREE.SphereGeometry(0.088, 24, 24), MAT.skin);
    glute.scale.set(
      0.92 * (c.torso.hipWidth ?? 1.0) * gluteScale,
      1.04 * gluteScale,
      (0.72 + mDef * 0.18) * gluteScale
    );
    glute.position.set(
      dir * 0.076 * (c.torso.hipWidth ?? 1.0),
      hipY + 0.038,
      -0.062 * c.torso.chestDepth
    );
    glute.castShadow = true;
    glute.receiveShadow = true;
    glute.userData.zone = 'piernas';
    rig.torso.add(glute);
  }

  // Cuello anatómico con extremos cerrados
  const neckGeo = createAnatomicalLathe(
    [
      [0.0, 0.002],
      [0.08, 0.072 * c.torso.neckWidth],
      [0.45, 0.059 * c.torso.neckWidth],
      [0.85, 0.060 * c.torso.neckWidth],
      [0.96, 0.052 * c.torso.neckWidth],
      [1.0, 0.002],
    ],
    neckLen + 0.02,
    {
      radialSegments: 28,
      heightSegments: 16,
      originAtTop: false,
      scaleX: () => 1.02,
      scaleZ: () => 0.96,
    }
  );
  neckGeo.translate(0, -0.01, 0);
  const neckMesh = new THREE.Mesh(neckGeo, MAT.skin);
  neckMesh.castShadow = true;
  neckMesh.receiveShadow = true;
  rig.neck.add(neckMesh);

  assignZone(rig.torso, 'torso');
  assignZone(rig.neck, 'torso');

  // ==========================================================================
  // 3. CABEZA, ROSTRO ESCULPIDO Y CABELLO PROCEDURAL
  // ==========================================================================
  const sculptedHead = buildSculptedHeadGroup(c.cara, MAT);
  sculptedHead.scale.set(c.cara.headWidth, c.cara.headHeight, (c.cara.headWidth + c.cara.headHeight) * 0.5);

  sculptedHead.traverse((o) => {
    if (o.name.startsWith('eye_')) {
      const isLeft = o.name === 'eye_0';
      const dir = isLeft ? 1 : -1;
      o.position.x = dir * 0.042 * c.cara.eyeSpacing;
      o.position.y = 0.125 + (c.cara.eyeY - 1.0) * 0.025;
      o.scale.setScalar(c.cara.eyeSize);
    }
    if (o.name === 'nose') {
      o.scale.set(c.cara.noseWidth, c.cara.noseLength, 0.5 + c.cara.noseLength * 0.5);
    }
    if (o.name === 'mouth') {
      o.scale.set(c.cara.lipWidth, c.cara.lipThickness, c.cara.lipThickness);
    }
    if (o.name === 'philtrum') {
      o.scale.set(c.cara.lipWidth, 1.0, 1.0);
    }
    if (o.name.startsWith('ear_')) {
      o.scale.setScalar(c.cara.earSize);
    }
  });

  assignZone(sculptedHead, 'cara');
  rig.head.add(sculptedHead);

  // Cabello procedural
  const hairGroup = buildProceduralHairGroup(c.pelo, MAT, c.cara, CONFIG.colors);
  hairGroup.scale.set(
    c.cara.headWidth,
    c.cara.headHeight,
    (c.cara.headWidth + c.cara.headHeight) * 0.5
  );
  assignZone(hairGroup, 'pelo');
  rig.head.add(hairGroup);

  // ==========================================================================
  // 4. EXTREMIDADES SUPERIORES (MALLAS CONTINUAS CON HOMBRO, BÍCEPS Y ANTEBRAZO INTEGRADOS)
  // ==========================================================================
  const armThick = c.brazos.thickness;
  const bicepFactor = c.brazos.bicepSize ?? 1.0;
  const forearmFactor = (c.brazos.forearmSize ?? 1.0) * armThick;

  const isCombatOrUltimate =
    c.items.animation &&
    ['punch', 'kick', 'hit', 'dodge', 'ultimate_nova', 'ultimate_slam', 'victory'].includes(
      c.items.animation
    );
  const fistCurlAmt = isCombatOrUltimate ? 0.85 : pose.fistCurl ?? 0.10;

  ['L', 'R'].forEach((side) => {
    const uArmGroup = rig[`upperArm${side}`];
    const fArmGroup = rig[`forearm${side}`];
    const wristGroup = rig[`wrist${side}`];

    // Brazo superior continuo (incluye capuchón deltoideo cerrado, bíceps y tríceps esculpidos)
    const upperArmGeo = buildSculptedUpperArmGeometry(
      side,
      upperArmLen,
      armThick,
      bicepFactor,
      mDef
    );
    const upperArmMesh = new THREE.Mesh(upperArmGeo, MAT.skin);
    upperArmMesh.castShadow = true;
    upperArmMesh.receiveShadow = true;
    uArmGroup.add(upperArmMesh);

    // Antebrazo continuo (incluye codo cerrado, braquiorradial y muñeca ovalada)
    const forearmGeo = buildSculptedForearmGeometry(
      side,
      forearmLen,
      forearmFactor,
      mDef
    );
    const forearmMesh = new THREE.Mesh(forearmGeo, MAT.skin);
    forearmMesh.castShadow = true;
    forearmMesh.receiveShadow = true;
    fArmGroup.add(forearmMesh);

    // Mano articulada con palma cerrada y 5 dedos
    const hand = buildHandGroup(side, MAT.skin, fistCurlAmt);
    const hScale = c.brazos.handSize ?? 1.0;
    hand.scale.setScalar(hScale);
    wristGroup.add(hand);

    assignZone(uArmGroup, 'brazos');
    assignZone(fArmGroup, 'brazos');
    assignZone(wristGroup, 'brazos');
  });

  // ==========================================================================
  // 5. EXTREMIDADES INFERIORES (MUSLO Y PIERNA CONTINUOS CON RODILLA Y PIE)
  // ==========================================================================
  const legThick = c.piernas.thickness;
  const calfFactor = c.piernas.calfSize ?? 1.0;

  ['L', 'R'].forEach((side) => {
    const dir = side === 'L' ? 1 : -1;
    const thighGroup = rig[`thigh${side}`];
    const shinGroup = rig[`shin${side}`];
    const ankleGroup = rig[`ankle${side}`];

    const thighTopCap = 0.045 * legThick;
    const thighBotCap = 0.018 * legThick;
    const thighGeo = createAnatomicalLathe(
      [
        [0.0, 0.002],
        [0.07, 0.086 * legThick],
        [0.26, 0.098 * legThick * (0.95 + mDef * 0.10)],
        [0.58, 0.086 * legThick],
        [0.86, 0.064 * legThick],
        [0.95, 0.056 * legThick],
        [1.0, 0.002],
      ],
      thighLen + thighTopCap + thighBotCap,
      {
        radialSegments: 32,
        heightSegments: 28,
        originAtTop: true,
        scaleX: (t) => THREE.MathUtils.lerp(1.04, 0.94, t),
        scaleZ: (t) => THREE.MathUtils.lerp(1.06, 0.98, t),
        offsetZ: (t) => Math.sin(t * Math.PI) * 0.010,
        sculptFn: (x, y, z, t) => {
          let dx = 0;
          let dz = 0;
          // Relieve suave de cuádriceps (vasto lateral y medial) integrado en el muslo
          if (z > 0 && t > 0.18 && t < 0.85) {
            const quadEnv = Math.sin(((t - 0.18) / 0.67) * Math.PI);
            dz += quadEnv * (0.006 + mDef * 0.012) * legThick;
            if (dir * x > 0) {
              dx += dir * quadEnv * (0.005 + mDef * 0.008) * legThick;
            }
          }
          return [dx, 0, dz];
        },
      }
    );
    thighGeo.translate(0, thighTopCap, 0);
    const thighMesh = new THREE.Mesh(thighGeo, MAT.skin);
    thighMesh.castShadow = true;
    thighMesh.receiveShadow = true;
    thighGroup.add(thighMesh);

    const shinTopCap = 0.032 * legThick;
    const shinBotCap = 0.014 * legThick;
    const shinGeo = createAnatomicalLathe(
      [
        [0.0, 0.002],
        [0.07, 0.055 * legThick],
        [0.18, 0.061 * legThick],
        [0.36, 0.068 * legThick * (0.92 + calfFactor * 0.12)],
        [0.64, 0.050 * legThick],
        [0.86, 0.038 * legThick],
        [0.95, 0.038 * legThick],
        [1.0, 0.002],
      ],
      shinLen + shinTopCap + shinBotCap,
      {
        radialSegments: 32,
        heightSegments: 26,
        originAtTop: true,
        scaleX: () => 0.94,
        scaleZ: () => 1.06,
        offsetZ: (t) => {
          const gastroBulge = Math.exp(-Math.pow((t - 0.34) / 0.18, 2));
          return -gastroBulge * (0.016 + mDef * 0.012) * calfFactor;
        },
      }
    );
    shinGeo.translate(0, shinTopCap, 0);
    const shinMesh = new THREE.Mesh(shinGeo, MAT.skin);
    shinMesh.castShadow = true;
    shinMesh.receiveShadow = true;
    shinGroup.add(shinMesh);

    const foot = buildFootGroup(side, MAT.skin);
    const fScale = c.piernas.footSize ?? 1.0;
    foot.scale.setScalar(fScale);
    ankleGroup.add(foot);

    assignZone(thighGroup, 'piernas');
    assignZone(shinGroup, 'piernas');
    assignZone(ankleGroup, 'piernas');
  });

  // ==========================================================================
  // 6. PRENDAS Y ACCESORIOS PROCEDURALES
  // ==========================================================================
  buildProceduralItems(c, MAT, rig);

  // ==========================================================================
  // 7. APLICAR BIND POSE Y CALCULAR ALTURA BASE AL SUELO
  // ==========================================================================
  applyPoseTransformations(pose);
  alignCharacterToGround();
}

/**
 * Aplica un estado de rotaciones y posición pélvica al rig
 */
export function applyPoseTransformations(poseState) {
  if (poseState.pelvisPos) {
    rig.pelvis.position.set(...poseState.pelvisPos);
  } else {
    rig.pelvis.position.set(0, 0, 0);
  }

  if (poseState.pelvisRot) {
    rig.pelvis.rotation.set(...poseState.pelvisRot);
  } else {
    rig.pelvis.rotation.set(0, 0, 0);
  }

  if (poseState.torsoRot) {
    rig.torso.rotation.set(...poseState.torsoRot);
  } else {
    rig.torso.rotation.set(0, 0, 0);
  }

  if (poseState.neckRot) {
    rig.neck.rotation.set(...poseState.neckRot);
  } else {
    rig.neck.rotation.set(0, 0, 0);
  }

  rig.shoulderL.rotation.set(...poseState.shoulderL);
  rig.shoulderR.rotation.set(...poseState.shoulderR);
  rig.elbowL.rotation.set(...poseState.elbowL);
  rig.elbowR.rotation.set(...poseState.elbowR);
  rig.wristL.rotation.set(...poseState.wristL);
  rig.wristR.rotation.set(...poseState.wristR);
  rig.hipL.rotation.set(...poseState.hipL);
  rig.hipR.rotation.set(...poseState.hipR);
  rig.kneeL.rotation.set(...poseState.kneeL);
  rig.kneeR.rotation.set(...poseState.kneeR);
  rig.head.rotation.set(...poseState.head);

  if (poseState.ankleL) {
    rig.ankleL.rotation.set(...poseState.ankleL);
  } else {
    rig.ankleL.rotation.set(-(poseState.hipL[0] + poseState.kneeL[0]), 0, 0);
  }

  if (poseState.ankleR) {
    rig.ankleR.rotation.set(...poseState.ankleR);
  } else {
    rig.ankleR.rotation.set(-(poseState.hipR[0] + poseState.kneeR[0]), 0, 0);
  }
}

/**
 * Calcula la caja envolvente del personaje en Pose Base y sitúa los pies en y = 0
 */
const _bbox = new THREE.Box3();
export function alignCharacterToGround() {
  characterGroup.position.y = 0;
  characterGroup.updateMatrixWorld(true);
  _bbox.setFromObject(characterGroup);
  if (isFinite(_bbox.min.y)) {
    characterGroup.position.y = -_bbox.min.y;
  }
}

/**
 * Actualiza el esqueleto en cada fotograma cuando hay una animación de juego activa
 */
export function updateCharacterAnimation(dt) {
  const animKey = CONFIG.items.animation;
  if (!animKey || animKey === 'none') {
    return { vfxType: null, vfxProgress: 0 };
  }

  if (CONFIG.items.animPlaying) {
    animAccumulatedTime += dt * (CONFIG.items.animSpeed ?? 1.0);
  }

  const state = evaluateGameAnimation(animKey, animAccumulatedTime, CONFIG.items.pose);
  applyPoseTransformations(state);

  return {
    vfxType: state.vfxType,
    vfxProgress: state.vfxProgress,
  };
}

/**
 * Reinicia el reloj de animación al principio del ciclo (útil al disparar una Skill Definitiva)
 */
export function restartAnimationTimer() {
  animAccumulatedTime = 0;
}

// Paletas cromáticas anatómicas y armónicas
const NATURAL_SKIN_TONES = [
  '#f9dbcd', '#f6d2c0', '#f4c7b2', '#f2c4ad', '#edd0be',
  '#e8b49a', '#ecc0a8', '#dfab94', '#d4a373', '#c98c6b',
  '#b57954', '#a86b4c', '#985838', '#8a5236', '#7c4b33',
  '#683a24', '#593322', '#452618'
];

const ELDER_HAIR_TONES = [
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#d4d4d8', '#a1a1aa', '#94a3b8', '#71717a', '#52525b'
];

const STANDARD_HAIR_TONES = [
  '#171717', '#1c1917', '#262626', '#2c1b12', '#3b2518',
  '#4a2c18', '#542c16', '#78350f', '#9a3412', '#b45309',
  '#ca8a04', '#d97706', '#eab308', '#dfba66'
];

const EYE_TONES = [
  '#3b82f6', '#2563eb', '#1d4ed8', '#0284c7',
  '#10b981', '#059669', '#0d9488', '#047857',
  '#d97706', '#b45309', '#ca8a04', '#854d0e',
  '#713f12', '#451a03', '#2a1104', '#64748b', '#78716c'
];

const FEMININE_LIP_TONES = [
  '#c45a66', '#d9777f', '#db2777', '#be185d', '#e11d48',
  '#e26d7c', '#b91c1c', '#c2410c', '#e07a5f', '#f43f5e'
];

const ELDER_LIP_TONES = [
  '#a8656d', '#9f5860', '#b56d78', '#99505a', '#8a4b52', '#8f5058'
];

const CHILD_LIP_TONES = [
  '#f472b6', '#fb7185', '#fda4af', '#fca5a5', '#f87171', '#e07a5f'
];

const MASCULINE_LIP_TONES = [
  '#c97a7a', '#b36b6b', '#9e5a5a', '#a86565', '#8f5050', '#a36262'
];

const CLOTH_TONES = [
  '#1e293b', '#0f172a', '#1d4ed8', '#2563eb', '#991b1b',
  '#065f46', '#047857', '#374151', '#475569', '#7c3aed',
  '#c026d3', '#ea580c', '#0284c7', '#0369a1', '#15803d'
];

/**
 * Genera un personaje aleatorio pero condicionado de forma realista y coherente
 * según el biotipo / demografía seleccionada (anciano, mujer, niño, hombre, etc.)
 */
export function randomizeArchetype(archetypeKey) {
  const rVal = (min, max) => Number((min + Math.random() * (max - min)).toFixed(2));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const preset = ARCHETYPES[archetypeKey] || ARCHETYPES.hombre;

  // 1. Cargar la estructura base del arquetipo
  Object.keys(preset).forEach((zone) => {
    if (zone === 'colors') {
      Object.assign(CONFIG.colors, preset.colors);
    } else if (CONFIG[zone]) {
      Object.assign(CONFIG[zone], preset[zone]);
    }
  });

  // 2. Modulaciones demográficas y morfológicas condicionales
  if (archetypeKey === 'anciano') {
    // Anciano varón maduro
    CONFIG.cara.headWidth = rVal(0.92, 1.02);
    CONFIG.cara.headHeight = rVal(0.90, 1.00);
    CONFIG.cara.jawWidth = rVal(0.92, 1.06);
    CONFIG.cara.chinLength = rVal(1.06, 1.22);
    CONFIG.cara.chinY = rVal(1.10, 1.24);
    CONFIG.cara.browRidge = rVal(1.10, 1.28);
    CONFIG.cara.noseLength = rVal(1.15, 1.32);
    CONFIG.cara.noseWidth = rVal(1.04, 1.18);
    CONFIG.cara.earSize = rVal(1.18, 1.35);
    CONFIG.cara.lipWidth = rVal(0.88, 0.98);
    CONFIG.cara.lipThickness = rVal(0.35, 0.48);
    CONFIG.cara.eyeType = pick(['caido', 'profundo', 'almendrado']);
    CONFIG.cara.eyeOpen = rVal(0.75, 0.88);
    CONFIG.cara.eyeSlant = rVal(-0.14, -0.02);
    CONFIG.cara.eyeSize = rVal(0.92, 1.02);
    CONFIG.cara.eyeSpacing = rVal(1.04, 1.14);
    CONFIG.cara.eyeSquash = rVal(0.78, 0.88);
    CONFIG.cara.eyeAspect = rVal(0.95, 1.08);
    CONFIG.cara.eyeAngular = rVal(0.0, 0.20);
    CONFIG.cara.poreDetail = rVal(1.4, 2.2);

    CONFIG.cara.beardStyle = pick(['perilla', 'barba_corta', 'candado', 'bigote', 'completa', 'sombra', 'vikingo', 'ninguna']);
    CONFIG.cara.beardLength = rVal(0.85, 1.35);

    CONFIG.pelo.style = pick(['corto', 'rapado', 'medio']);
    CONFIG.pelo.volume = rVal(0.80, 1.02);
    CONFIG.pelo.height = rVal(0.80, 0.98);
    CONFIG.pelo.hairline = rVal(0.72, 0.90);

    CONFIG.colors.hair = pick(ELDER_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(['#64748b', '#475569', '#3b82f6', '#0d9488', '#78716c', '#854d0e', '#57534e']);
    CONFIG.colors.lips = pick(ELDER_LIP_TONES);
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.chestWidth = rVal(0.98, 1.08);
    CONFIG.torso.waistWidth = rVal(0.98, 1.12);
    CONFIG.torso.hipWidth = rVal(0.92, 1.00);
    CONFIG.torso.chestDepth = rVal(0.95, 1.06);
    CONFIG.torso.height = rVal(0.92, 0.98);
    CONFIG.torso.neckWidth = rVal(0.92, 1.04);
    CONFIG.torso.muscleDef = rVal(0.12, 0.28);
    CONFIG.brazos.thickness = rVal(0.86, 0.96);
    CONFIG.brazos.length = rVal(0.94, 1.00);
    CONFIG.brazos.bicepSize = rVal(0.80, 0.92);
    CONFIG.brazos.forearmSize = rVal(0.85, 0.95);
    CONFIG.piernas.thickness = rVal(0.88, 0.96);
    CONFIG.piernas.length = rVal(0.92, 0.98);
    CONFIG.piernas.gluteSize = rVal(0.82, 0.94);

  } else if (archetypeKey === 'anciana') {
    // Anciana mujer madura
    CONFIG.cara.headWidth = rVal(0.88, 0.96);
    CONFIG.cara.headHeight = rVal(0.88, 0.96);
    CONFIG.cara.jawWidth = rVal(0.76, 0.86);
    CONFIG.cara.chinLength = rVal(0.92, 1.04);
    CONFIG.cara.chinY = rVal(1.10, 1.20);
    CONFIG.cara.browRidge = rVal(0.70, 0.85);
    CONFIG.cara.noseLength = rVal(1.06, 1.22);
    CONFIG.cara.noseWidth = rVal(0.92, 1.04);
    CONFIG.cara.earSize = rVal(1.12, 1.26);
    CONFIG.cara.lipWidth = rVal(0.86, 0.96);
    CONFIG.cara.lipThickness = rVal(0.36, 0.48);
    CONFIG.cara.eyeType = pick(['caido', 'profundo', 'almendrado', 'redondo']);
    CONFIG.cara.eyeOpen = rVal(0.78, 0.90);
    CONFIG.cara.eyeSlant = rVal(-0.12, 0.00);
    CONFIG.cara.eyeSize = rVal(0.94, 1.04);
    CONFIG.cara.eyeSpacing = rVal(1.04, 1.12);
    CONFIG.cara.eyeSquash = rVal(0.82, 0.92);
    CONFIG.cara.eyeAspect = rVal(0.95, 1.05);
    CONFIG.cara.poreDetail = rVal(1.3, 2.0);

    CONFIG.cara.beardStyle = 'ninguna';
    CONFIG.cara.beardLength = 0.0;

    CONFIG.pelo.style = pick(['recogido', 'corto', 'medio']);
    CONFIG.pelo.volume = rVal(0.95, 1.15);
    CONFIG.pelo.height = rVal(0.90, 1.05);
    CONFIG.pelo.hairline = rVal(0.85, 1.00);

    CONFIG.colors.hair = pick(ELDER_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.lips = pick(ELDER_LIP_TONES);
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.chestWidth = rVal(0.90, 0.98);
    CONFIG.torso.waistWidth = rVal(0.88, 0.98);
    CONFIG.torso.hipWidth = rVal(1.06, 1.18);
    CONFIG.torso.chestDepth = rVal(0.98, 1.08);
    CONFIG.torso.height = rVal(0.88, 0.95);
    CONFIG.torso.neckWidth = rVal(0.80, 0.88);
    CONFIG.torso.muscleDef = rVal(0.08, 0.20);
    CONFIG.brazos.thickness = rVal(0.80, 0.88);
    CONFIG.brazos.length = rVal(0.90, 0.96);
    CONFIG.piernas.thickness = rVal(0.85, 0.94);
    CONFIG.piernas.length = rVal(0.88, 0.94);
    CONFIG.piernas.gluteSize = rVal(0.98, 1.12);

  } else if (archetypeKey === 'nino') {
    // Niño (~8-10 años)
    CONFIG.cara.headWidth = rVal(1.14, 1.22);
    CONFIG.cara.headHeight = rVal(1.10, 1.18);
    CONFIG.cara.jawWidth = rVal(0.70, 0.80);
    CONFIG.cara.chinLength = rVal(0.78, 0.88);
    CONFIG.cara.chinY = rVal(1.05, 1.15);
    CONFIG.cara.browRidge = rVal(0.55, 0.68);
    CONFIG.cara.noseLength = rVal(0.76, 0.86);
    CONFIG.cara.noseWidth = rVal(0.80, 0.90);
    CONFIG.cara.earSize = rVal(0.92, 1.04);
    CONFIG.cara.lipWidth = rVal(0.88, 0.98);
    CONFIG.cara.lipThickness = rVal(0.55, 0.68);
    CONFIG.cara.eyeType = pick(['redondo', 'almendrado', 'anime']);
    CONFIG.cara.eyeSize = rVal(1.22, 1.34);
    CONFIG.cara.eyeSpacing = rVal(1.08, 1.18);
    CONFIG.cara.eyeOpen = rVal(1.05, 1.18);
    CONFIG.cara.eyeSlant = rVal(-0.04, 0.04);
    CONFIG.cara.eyeSquash = rVal(0.98, 1.10);
    CONFIG.cara.eyeAspect = rVal(0.95, 1.05);
    CONFIG.cara.eyeAngular = 0.0;
    CONFIG.cara.poreDetail = rVal(0.20, 0.50);

    CONFIG.cara.beardStyle = 'ninguna';
    CONFIG.cara.beardLength = 0.0;

    CONFIG.pelo.style = pick(['cresta', 'corto', 'medio']);
    CONFIG.pelo.volume = rVal(1.00, 1.20);
    CONFIG.pelo.height = rVal(0.95, 1.15);
    CONFIG.pelo.hairline = rVal(0.95, 1.05);

    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.lips = pick(CHILD_LIP_TONES);
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.height = rVal(0.72, 0.80);
    CONFIG.torso.chestWidth = rVal(0.78, 0.85);
    CONFIG.torso.waistWidth = rVal(0.78, 0.85);
    CONFIG.torso.hipWidth = rVal(0.80, 0.86);
    CONFIG.torso.chestDepth = rVal(0.80, 0.86);
    CONFIG.torso.neckWidth = rVal(0.76, 0.84);
    CONFIG.torso.muscleDef = rVal(0.02, 0.08);
    CONFIG.brazos.length = rVal(0.78, 0.85);
    CONFIG.brazos.thickness = rVal(0.74, 0.82);
    CONFIG.brazos.bicepSize = rVal(0.72, 0.80);
    CONFIG.brazos.forearmSize = rVal(0.72, 0.80);
    CONFIG.brazos.handSize = rVal(0.78, 0.86);
    CONFIG.piernas.length = rVal(0.74, 0.82);
    CONFIG.piernas.thickness = rVal(0.76, 0.84);
    CONFIG.piernas.calfSize = rVal(0.76, 0.84);
    CONFIG.piernas.gluteSize = rVal(0.80, 0.88);
    CONFIG.piernas.footSize = rVal(0.78, 0.86);

  } else if (archetypeKey === 'nina') {
    // Niña (~8-10 años)
    CONFIG.cara.headWidth = rVal(1.12, 1.20);
    CONFIG.cara.headHeight = rVal(1.08, 1.16);
    CONFIG.cara.jawWidth = rVal(0.68, 0.78);
    CONFIG.cara.chinLength = rVal(0.75, 0.86);
    CONFIG.cara.chinY = rVal(1.06, 1.16);
    CONFIG.cara.browRidge = rVal(0.52, 0.65);
    CONFIG.cara.noseLength = rVal(0.74, 0.84);
    CONFIG.cara.noseWidth = rVal(0.78, 0.88);
    CONFIG.cara.earSize = rVal(0.90, 1.02);
    CONFIG.cara.lipWidth = rVal(0.88, 0.98);
    CONFIG.cara.lipThickness = rVal(0.58, 0.72);
    CONFIG.cara.eyeType = pick(['redondo', 'almendrado', 'anime', 'felino']);
    CONFIG.cara.eyeSize = rVal(1.24, 1.36);
    CONFIG.cara.eyeSpacing = rVal(1.08, 1.18);
    CONFIG.cara.eyeOpen = rVal(1.06, 1.20);
    CONFIG.cara.eyeSlant = rVal(-0.02, 0.08);
    CONFIG.cara.eyeSquash = rVal(0.98, 1.10);
    CONFIG.cara.eyeAspect = rVal(0.95, 1.05);
    CONFIG.cara.poreDetail = rVal(0.20, 0.45);

    CONFIG.cara.beardStyle = 'ninguna';
    CONFIG.cara.beardLength = 0.0;

    CONFIG.pelo.style = pick(['largo', 'recogido', 'medio']);
    CONFIG.pelo.volume = rVal(1.05, 1.22);
    CONFIG.pelo.height = rVal(0.98, 1.15);
    CONFIG.pelo.hairline = rVal(0.95, 1.05);

    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.lips = pick(CHILD_LIP_TONES);
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.height = rVal(0.70, 0.78);
    CONFIG.torso.chestWidth = rVal(0.76, 0.84);
    CONFIG.torso.waistWidth = rVal(0.76, 0.84);
    CONFIG.torso.hipWidth = rVal(0.78, 0.86);
    CONFIG.torso.chestDepth = rVal(0.78, 0.84);
    CONFIG.torso.neckWidth = rVal(0.74, 0.82);
    CONFIG.torso.muscleDef = rVal(0.01, 0.06);
    CONFIG.brazos.length = rVal(0.76, 0.84);
    CONFIG.brazos.thickness = rVal(0.72, 0.80);
    CONFIG.brazos.bicepSize = rVal(0.70, 0.78);
    CONFIG.brazos.forearmSize = rVal(0.70, 0.78);
    CONFIG.brazos.handSize = rVal(0.76, 0.84);
    CONFIG.piernas.length = rVal(0.72, 0.80);
    CONFIG.piernas.thickness = rVal(0.74, 0.82);
    CONFIG.piernas.calfSize = rVal(0.74, 0.82);
    CONFIG.piernas.gluteSize = rVal(0.80, 0.88);
    CONFIG.piernas.footSize = rVal(0.76, 0.84);

  } else if (archetypeKey === 'mujer') {
    // Mujer adulta
    CONFIG.cara.headWidth = rVal(0.88, 0.94);
    CONFIG.cara.headHeight = rVal(0.88, 0.96);
    CONFIG.cara.jawWidth = rVal(0.72, 0.82);
    CONFIG.cara.chinLength = rVal(0.96, 1.08);
    CONFIG.cara.chinY = rVal(1.14, 1.24);
    CONFIG.cara.browRidge = rVal(0.65, 0.78);
    CONFIG.cara.noseLength = rVal(0.88, 1.02);
    CONFIG.cara.noseWidth = rVal(0.82, 0.94);
    CONFIG.cara.earSize = rVal(0.88, 0.98);
    CONFIG.cara.lipWidth = rVal(0.96, 1.10);
    CONFIG.cara.lipThickness = rVal(0.68, 0.84);
    CONFIG.cara.eyeType = pick(['almendrado', 'rasgado', 'felino', 'redondo', 'profundo']);
    CONFIG.cara.eyeSize = rVal(1.08, 1.22);
    CONFIG.cara.eyeOpen = rVal(1.02, 1.15);
    CONFIG.cara.eyeSlant = rVal(0.04, 0.16);
    CONFIG.cara.eyeSpacing = rVal(1.02, 1.12);
    CONFIG.cara.eyeSquash = rVal(0.95, 1.08);
    CONFIG.cara.eyeAspect = rVal(0.96, 1.08);
    CONFIG.cara.eyeAngular = 0.0;
    CONFIG.cara.poreDetail = rVal(0.55, 0.95);

    CONFIG.cara.beardStyle = 'ninguna';
    CONFIG.cara.beardLength = 0.0;

    CONFIG.pelo.style = pick(['largo', 'recogido', 'medio', 'corto']);
    CONFIG.pelo.volume = rVal(1.05, 1.25);
    CONFIG.pelo.height = rVal(1.00, 1.18);
    CONFIG.pelo.hairline = rVal(0.92, 1.08);

    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.lips = pick(FEMININE_LIP_TONES);
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.chestWidth = rVal(0.88, 0.96);
    CONFIG.torso.waistWidth = rVal(0.72, 0.82);
    CONFIG.torso.hipWidth = rVal(1.12, 1.26);
    CONFIG.torso.chestDepth = rVal(1.08, 1.22);
    CONFIG.torso.height = rVal(0.92, 1.00);
    CONFIG.torso.neckWidth = rVal(0.78, 0.88);
    CONFIG.torso.muscleDef = rVal(0.12, 0.32);
    CONFIG.brazos.thickness = rVal(0.82, 0.90);
    CONFIG.brazos.length = rVal(0.94, 1.00);
    CONFIG.brazos.bicepSize = rVal(0.80, 0.90);
    CONFIG.brazos.forearmSize = rVal(0.82, 0.90);
    CONFIG.brazos.handSize = rVal(0.86, 0.94);
    CONFIG.piernas.gluteSize = rVal(1.12, 1.30);
    CONFIG.piernas.thickness = rVal(0.90, 1.02);
    CONFIG.piernas.calfSize = rVal(0.90, 1.00);
    CONFIG.piernas.length = rVal(0.95, 1.02);
    CONFIG.piernas.footSize = rVal(0.88, 0.96);

  } else if (archetypeKey === 'hombre') {
    // Hombre adulto
    CONFIG.cara.headWidth = rVal(0.96, 1.06);
    CONFIG.cara.headHeight = rVal(0.96, 1.06);
    CONFIG.cara.jawWidth = rVal(0.96, 1.12);
    CONFIG.cara.chinLength = rVal(1.04, 1.16);
    CONFIG.cara.chinY = rVal(1.02, 1.14);
    CONFIG.cara.browRidge = rVal(0.95, 1.18);
    CONFIG.cara.noseLength = rVal(1.08, 1.22);
    CONFIG.cara.noseWidth = rVal(0.98, 1.12);
    CONFIG.cara.earSize = rVal(0.96, 1.08);
    CONFIG.cara.lipWidth = rVal(0.94, 1.06);
    CONFIG.cara.lipThickness = rVal(0.46, 0.58);
    CONFIG.cara.eyeType = pick(['almendrado', 'profundo', 'rasgado', 'goku_ssj']);
    CONFIG.cara.eyeSize = rVal(0.96, 1.08);
    CONFIG.cara.eyeOpen = rVal(0.92, 1.05);
    CONFIG.cara.eyeSlant = rVal(-0.04, 0.08);
    CONFIG.cara.eyeSquash = rVal(0.90, 1.02);
    CONFIG.cara.eyeAspect = rVal(0.98, 1.12);
    CONFIG.cara.poreDetail = rVal(0.85, 1.35);

    CONFIG.cara.beardStyle = pick(['sombra', 'barba_corta', 'candado', 'perilla', 'bigote', 'completa', 'ninguna']);
    CONFIG.cara.beardLength = rVal(0.75, 1.35);

    CONFIG.pelo.style = pick(['corto', 'cresta', 'medio', 'rapado']);
    CONFIG.pelo.volume = rVal(0.95, 1.15);
    CONFIG.pelo.height = rVal(0.95, 1.15);
    CONFIG.pelo.hairline = rVal(0.90, 1.06);

    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.lips = pick(MASCULINE_LIP_TONES);
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.chestWidth = rVal(1.02, 1.16);
    CONFIG.torso.waistWidth = rVal(0.86, 0.98);
    CONFIG.torso.hipWidth = rVal(0.92, 1.02);
    CONFIG.torso.chestDepth = rVal(1.00, 1.14);
    CONFIG.torso.height = rVal(0.98, 1.08);
    CONFIG.torso.neckWidth = rVal(0.98, 1.10);
    CONFIG.torso.muscleDef = rVal(0.45, 0.75);
    CONFIG.brazos.thickness = rVal(0.98, 1.12);
    CONFIG.brazos.length = rVal(0.98, 1.06);
    CONFIG.brazos.bicepSize = rVal(1.02, 1.20);
    CONFIG.brazos.forearmSize = rVal(0.98, 1.12);
    CONFIG.piernas.thickness = rVal(0.98, 1.12);
    CONFIG.piernas.length = rVal(0.98, 1.06);
    CONFIG.piernas.calfSize = rVal(1.00, 1.14);

  } else if (archetypeKey === 'proporcional') {
    // "Rostro Humano" - Variación armónica sobre la proporción áurea
    CONFIG.cara.headWidth = rVal(0.91, 0.97);
    CONFIG.cara.headHeight = rVal(0.75, 0.82);
    CONFIG.cara.jawWidth = rVal(0.80, 0.88);
    CONFIG.cara.chinLength = rVal(1.36, 1.48);
    CONFIG.cara.chinY = rVal(1.32, 1.44);
    CONFIG.cara.browRidge = rVal(0.94, 1.06);
    CONFIG.cara.noseLength = rVal(1.28, 1.42);
    CONFIG.cara.noseWidth = rVal(0.94, 1.04);
    CONFIG.cara.lipWidth = rVal(0.95, 1.05);
    CONFIG.cara.lipThickness = rVal(0.50, 0.62);
    CONFIG.cara.earSize = rVal(1.00, 1.10);
    CONFIG.cara.eyeType = pick(['almendrado', 'rasgado', 'profundo', 'redondo', 'felino']);
    CONFIG.cara.eyeSize = rVal(1.08, 1.16);
    CONFIG.cara.eyeSpacing = rVal(1.06, 1.14);
    CONFIG.cara.eyeY = rVal(0.70, 0.75);
    CONFIG.cara.eyeOpen = rVal(0.95, 1.05);
    CONFIG.cara.eyeSlant = rVal(-0.04, 0.06);
    CONFIG.cara.eyeSquash = rVal(0.95, 1.05);
    CONFIG.cara.eyeAspect = rVal(0.96, 1.06);
    CONFIG.cara.eyeAngular = 0.0;
    CONFIG.cara.poreDetail = rVal(0.80, 1.20);

    CONFIG.cara.beardStyle = pick(['ninguna', 'sombra', 'perilla', 'candado', 'barba_corta']);
    CONFIG.cara.beardLength = rVal(0.80, 1.20);

    CONFIG.pelo.style = pick(['medio', 'corto', 'largo', 'recogido', 'cresta']);
    CONFIG.pelo.volume = rVal(0.98, 1.16);
    CONFIG.pelo.height = rVal(0.98, 1.14);
    CONFIG.pelo.hairline = rVal(0.95, 1.05);

    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
    CONFIG.colors.lips = pick(FEMININE_LIP_TONES.concat(MASCULINE_LIP_TONES));
    CONFIG.colors.cloth = pick(CLOTH_TONES);

    CONFIG.torso.chestWidth = rVal(1.00, 1.08);
    CONFIG.torso.waistWidth = rVal(0.88, 0.96);
    CONFIG.torso.hipWidth = rVal(0.92, 1.00);
    CONFIG.torso.chestDepth = rVal(0.96, 1.04);
    CONFIG.torso.height = rVal(0.98, 1.04);
    CONFIG.torso.neckWidth = rVal(0.94, 1.02);
    CONFIG.torso.muscleDef = rVal(0.45, 0.65);
    CONFIG.brazos.thickness = rVal(0.96, 1.05);
    CONFIG.brazos.length = rVal(0.98, 1.04);
    CONFIG.brazos.bicepSize = rVal(1.00, 1.12);
    CONFIG.brazos.forearmSize = rVal(0.96, 1.05);
    CONFIG.piernas.thickness = rVal(0.98, 1.06);
    CONFIG.piernas.length = rVal(0.98, 1.04);
    CONFIG.piernas.calfSize = rVal(0.98, 1.06);

  } else if (archetypeKey === 'atletico') {
    // Físico atlético definido y tonificado
    CONFIG.torso.chestWidth = rVal(1.05, 1.14);
    CONFIG.torso.waistWidth = rVal(0.88, 0.95);
    CONFIG.torso.hipWidth = rVal(0.92, 0.98);
    CONFIG.torso.chestDepth = rVal(1.02, 1.08);
    CONFIG.torso.height = rVal(1.00, 1.06);
    CONFIG.torso.neckWidth = rVal(0.98, 1.06);
    CONFIG.torso.muscleDef = rVal(0.65, 0.82);

    CONFIG.brazos.length = rVal(0.98, 1.04);
    CONFIG.brazos.thickness = rVal(1.02, 1.10);
    CONFIG.brazos.bicepSize = rVal(1.10, 1.25);
    CONFIG.brazos.forearmSize = rVal(1.02, 1.12);

    CONFIG.piernas.length = rVal(1.00, 1.06);
    CONFIG.piernas.thickness = rVal(1.02, 1.10);
    CONFIG.piernas.calfSize = rVal(1.06, 1.18);
    CONFIG.piernas.gluteSize = rVal(1.02, 1.12);

    CONFIG.cara.jawWidth = rVal(1.00, 1.08);
    CONFIG.cara.browRidge = rVal(1.00, 1.12);
    CONFIG.pelo.style = pick(['corto', 'cresta', 'medio', 'rapado']);
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;

  } else if (archetypeKey === 'culturista') {
    // Hipertrofia culturista
    CONFIG.torso.chestWidth = rVal(1.28, 1.42);
    CONFIG.torso.waistWidth = rVal(0.84, 0.94);
    CONFIG.torso.hipWidth = rVal(0.94, 1.02);
    CONFIG.torso.chestDepth = rVal(1.20, 1.35);
    CONFIG.torso.height = rVal(0.98, 1.05);
    CONFIG.torso.neckWidth = rVal(1.18, 1.30);
    CONFIG.torso.muscleDef = rVal(0.90, 1.00);

    CONFIG.brazos.length = rVal(0.96, 1.02);
    CONFIG.brazos.thickness = rVal(1.28, 1.44);
    CONFIG.brazos.bicepSize = rVal(1.38, 1.55);
    CONFIG.brazos.forearmSize = rVal(1.22, 1.34);

    CONFIG.piernas.length = rVal(0.96, 1.02);
    CONFIG.piernas.thickness = rVal(1.25, 1.40);
    CONFIG.piernas.calfSize = rVal(1.30, 1.45);
    CONFIG.piernas.gluteSize = rVal(1.18, 1.30);

    CONFIG.cara.jawWidth = rVal(1.10, 1.20);
    CONFIG.cara.browRidge = rVal(1.10, 1.22);
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;

  } else if (archetypeKey === 'esbelto') {
    // Esbelto, estilizado y longilíneo
    CONFIG.torso.chestWidth = rVal(0.86, 0.94);
    CONFIG.torso.waistWidth = rVal(0.76, 0.86);
    CONFIG.torso.hipWidth = rVal(0.86, 0.94);
    CONFIG.torso.chestDepth = rVal(0.84, 0.92);
    CONFIG.torso.height = rVal(1.04, 1.12);
    CONFIG.torso.neckWidth = rVal(0.84, 0.92);
    CONFIG.torso.muscleDef = rVal(0.24, 0.42);

    CONFIG.brazos.length = rVal(1.04, 1.12);
    CONFIG.brazos.thickness = rVal(0.78, 0.86);
    CONFIG.brazos.bicepSize = rVal(0.80, 0.90);
    CONFIG.brazos.forearmSize = rVal(0.80, 0.88);

    CONFIG.piernas.length = rVal(1.06, 1.14);
    CONFIG.piernas.thickness = rVal(0.82, 0.90);
    CONFIG.piernas.calfSize = rVal(0.84, 0.92);
    CONFIG.piernas.gluteSize = rVal(0.86, 0.96);

    CONFIG.cara.jawWidth = rVal(0.86, 0.94);
    CONFIG.cara.chinLength = rVal(0.92, 1.02);
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.eyes = pick(EYE_TONES);
    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;

  } else if (archetypeKey === 'robusto') {
    // Robusto, corpulento y ancho
    CONFIG.torso.chestWidth = rVal(1.22, 1.34);
    CONFIG.torso.waistWidth = rVal(1.18, 1.30);
    CONFIG.torso.hipWidth = rVal(1.14, 1.25);
    CONFIG.torso.chestDepth = rVal(1.22, 1.32);
    CONFIG.torso.height = rVal(0.94, 1.00);
    CONFIG.torso.neckWidth = rVal(1.16, 1.28);
    CONFIG.torso.muscleDef = rVal(0.40, 0.58);

    CONFIG.brazos.length = rVal(0.92, 0.98);
    CONFIG.brazos.thickness = rVal(1.22, 1.34);
    CONFIG.brazos.bicepSize = rVal(1.16, 1.28);
    CONFIG.brazos.forearmSize = rVal(1.18, 1.30);

    CONFIG.piernas.length = rVal(0.90, 0.96);
    CONFIG.piernas.thickness = rVal(1.22, 1.32);
    CONFIG.piernas.calfSize = rVal(1.18, 1.28);
    CONFIG.piernas.gluteSize = rVal(1.14, 1.26);

    CONFIG.cara.jawWidth = rVal(1.12, 1.22);
    CONFIG.cara.headWidth = rVal(1.05, 1.15);
    CONFIG.colors.skin = pick(NATURAL_SKIN_TONES);
    CONFIG.colors.hair = pick(STANDARD_HAIR_TONES);
    CONFIG.colors.beard = CONFIG.colors.hair;
  }

  // 3. Sincronizar materiales y reconstruir la malla 3D completa
  syncMaterialColors();
  rebuildCharacter();
}

/**
 * Aplica uno de los arquetipos base con generación aleatoria condicional (por defecto)
 * o con los valores preestablecidos estáticos exactos si randomize = false
 */
export function applyArchetype(archetypeKey, options = {}) {
  const { randomize = true } = options;
  if (randomize) {
    randomizeArchetype(archetypeKey);
  } else {
    const preset = ARCHETYPES[archetypeKey];
    if (!preset) return;

    Object.keys(preset).forEach((zone) => {
      if (zone === 'colors') {
        Object.assign(CONFIG.colors, preset.colors);
        syncMaterialColors();
      } else if (CONFIG[zone]) {
        Object.assign(CONFIG[zone], preset[zone]);
      }
    });

    rebuildCharacter();
  }
}

/**
 * Genera una combinación aleatoria pero anatómicamente coherente y proporcional
 */
export function randomizeCharacter() {
  const rRange = (min, max) => min + Math.random() * (max - min);

  const buildFactor = rRange(0.86, 1.28);
  const muscleTone = rRange(0.25, 0.95);

  CONFIG.cara.headWidth = rRange(0.92, 1.08);
  CONFIG.cara.headHeight = rRange(0.94, 1.08);
  CONFIG.cara.jawWidth = rRange(0.88, 1.15);
  CONFIG.cara.chinLength = rRange(0.88, 1.14);
  CONFIG.cara.chinY = rRange(0.85, 1.20);
  CONFIG.cara.browRidge = rRange(0.85, 1.20);
  CONFIG.cara.eyeSize = rRange(0.85, 1.22);
  CONFIG.cara.eyeSpacing = rRange(0.88, 1.15);
  CONFIG.cara.noseLength = rRange(0.85, 1.20);
  CONFIG.cara.noseWidth = rRange(0.85, 1.20);
  CONFIG.cara.lipWidth = rRange(0.88, 1.18);
  CONFIG.cara.lipThickness = rRange(0.82, 1.25);
  CONFIG.cara.earSize = rRange(0.88, 1.16);

  const hairStyles = ['corto', 'medio', 'cresta', 'largo', 'recogido', 'rapado'];
  CONFIG.pelo.style = hairStyles[Math.floor(Math.random() * hairStyles.length)];
  CONFIG.pelo.volume = rRange(0.90, 1.22);
  CONFIG.pelo.height = rRange(0.88, 1.25);

  CONFIG.torso.chestWidth = THREE.MathUtils.clamp(buildFactor * rRange(0.95, 1.12), 0.75, 1.45);
  CONFIG.torso.waistWidth = THREE.MathUtils.clamp(buildFactor * rRange(0.78, 0.98), 0.72, 1.35);
  CONFIG.torso.hipWidth = THREE.MathUtils.clamp(buildFactor * rRange(0.88, 1.04), 0.75, 1.35);
  CONFIG.torso.chestDepth = THREE.MathUtils.clamp(buildFactor * rRange(0.92, 1.08), 0.75, 1.35);
  CONFIG.torso.height = rRange(0.92, 1.10);
  CONFIG.torso.neckWidth = THREE.MathUtils.clamp(buildFactor * rRange(0.92, 1.08), 0.80, 1.30);
  CONFIG.torso.muscleDef = muscleTone;

  const limbLength = rRange(0.92, 1.10);
  CONFIG.brazos.length = limbLength;
  CONFIG.brazos.thickness = THREE.MathUtils.clamp(buildFactor * rRange(0.92, 1.12), 0.70, 1.45);
  CONFIG.brazos.bicepSize = THREE.MathUtils.clamp(0.90 + muscleTone * 0.45, 0.75, 1.50);
  CONFIG.brazos.forearmSize = rRange(0.90, 1.15);
  CONFIG.brazos.handSize = rRange(0.92, 1.08);

  CONFIG.piernas.length = limbLength * rRange(0.96, 1.04);
  CONFIG.piernas.thickness = THREE.MathUtils.clamp(buildFactor * rRange(0.94, 1.12), 0.72, 1.45);
  CONFIG.piernas.calfSize = THREE.MathUtils.clamp(0.90 + muscleTone * 0.38, 0.75, 1.45);
  CONFIG.piernas.gluteSize = rRange(0.90, 1.18);
  CONFIG.piernas.footSize = rRange(0.94, 1.08);

  const skinTones = ['#f6d2c0', '#ecc0a8', '#e0a98b', '#c98c6b', '#a86b4c', '#7c4b33', '#593322'];
  const eyeTones = ['#3b82f6', '#2563eb', '#10b981', '#0d9488', '#854d0e', '#451a03', '#64748b'];
  const hairTones = ['#171717', '#2c1b12', '#4a2c18', '#78350f', '#b45309', '#d97706', '#52525b'];
  const clothTones = ['#1e293b', '#0f172a', '#1d4ed8', '#991b1b', '#065f46', '#374151'];

  const eyeTypes = ['almendrado', 'goku_ssj', 'pescado', 'rasgado', 'redondo', 'felino', 'profundo', 'caido', 'anime'];
  CONFIG.cara.eyeType = eyeTypes[Math.floor(Math.random() * eyeTypes.length)];
  CONFIG.cara.eyeSquash = rRange(0.75, 1.20);
  CONFIG.cara.eyeAspect = rRange(0.85, 1.25);
  CONFIG.cara.eyeAngular = Math.random() > 0.75 ? rRange(0.4, 0.9) : 0.0;
  const beardStyles = ['ninguna', 'ninguna', 'sombra', 'perilla', 'candado', 'bigote', 'barba_corta', 'completa'];
  CONFIG.cara.beardStyle = beardStyles[Math.floor(Math.random() * beardStyles.length)];
  CONFIG.cara.beardLength = rRange(0.7, 1.4);

  CONFIG.colors.skin = skinTones[Math.floor(Math.random() * skinTones.length)];
  CONFIG.colors.eyes = eyeTones[Math.floor(Math.random() * eyeTones.length)];
  CONFIG.colors.hair = hairTones[Math.floor(Math.random() * hairTones.length)];
  CONFIG.colors.beard = CONFIG.colors.hair;
  CONFIG.colors.cloth = clothTones[Math.floor(Math.random() * clothTones.length)];

  rebuildCharacter();
}

/**
 * Restaura todos los parámetros a sus valores por defecto
 */
export function resetCharacter() {
  const fresh = JSON.parse(JSON.stringify(DEFAULTS));
  Object.keys(fresh).forEach((k) => {
    CONFIG[k] = fresh[k];
  });
  rebuildCharacter();
}
