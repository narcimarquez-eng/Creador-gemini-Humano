import * as THREE from 'three';
import {
  createAnatomicalLathe,
  createMuscleBellyGeometry,
  buildSculptedTorsoGeometry,
  buildSculptedHeadGroup,
  buildProceduralHairGroup,
  buildHandGroup,
  buildFootGroup,
} from './procedural.js';
import { POSES, buildProceduralItems } from './items.js';

/**
 * Estado global de configuración anatómica del personaje
 */
export const CONFIG = {
  selectedZone: 'cara',
  colors: {
    skin: '#e8b49a',
    eyes: '#3b82f6',
    hair: '#2c1b12',
    lips: '#c26d68',
    cloth: '#1e293b',
  },
  cara: {
    headWidth: 1.0,
    headHeight: 1.0,
    jawWidth: 1.0,
    chinLength: 1.0,
    browRidge: 1.0,
    eyeSize: 1.0,
    eyeSpacing: 1.0,
    eyeY: 1.0,
    noseLength: 1.0,
    noseWidth: 1.0,
    lipWidth: 1.0,
    lipThickness: 1.0,
    earSize: 1.0,
  },
  pelo: {
    style: 'corto',
    volume: 1.0,
    height: 1.0,
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
    pose: 'neutral',
    outfit: 'shorts',
    accessory: 'ninguno',
  },
};

export const DEFAULTS = JSON.parse(JSON.stringify(CONFIG));

/**
 * Arquetipos anatómicos predefinidos
 */
export const ARCHETYPES = {
  atletico: {
    torso: { chestWidth: 1.08, waistWidth: 0.92, hipWidth: 0.96, chestDepth: 1.04, height: 1.02, neckWidth: 1.02, muscleDef: 0.68 },
    brazos: { length: 1.0, thickness: 1.05, bicepSize: 1.12, forearmSize: 1.04, handSize: 1.0 },
    piernas: { length: 1.02, thickness: 1.06, calfSize: 1.08, gluteSize: 1.04, footSize: 1.0 },
    cara: { jawWidth: 1.04, browRidge: 1.05, headWidth: 1.0, headHeight: 1.0 },
  },
  culturista: {
    torso: { chestWidth: 1.32, waistWidth: 0.88, hipWidth: 0.98, chestDepth: 1.24, height: 1.0, neckWidth: 1.22, muscleDef: 0.96 },
    brazos: { length: 1.0, thickness: 1.32, bicepSize: 1.42, forearmSize: 1.25, handSize: 1.05 },
    piernas: { length: 1.0, thickness: 1.30, calfSize: 1.34, gluteSize: 1.22, footSize: 1.04 },
    cara: { jawWidth: 1.14, browRidge: 1.15, headWidth: 1.04, headHeight: 0.98 },
  },
  esbelto: {
    torso: { chestWidth: 0.90, waistWidth: 0.82, hipWidth: 0.90, chestDepth: 0.88, height: 1.06, neckWidth: 0.88, muscleDef: 0.32 },
    brazos: { length: 1.05, thickness: 0.82, bicepSize: 0.85, forearmSize: 0.84, handSize: 0.95 },
    piernas: { length: 1.08, thickness: 0.86, calfSize: 0.88, gluteSize: 0.90, footSize: 0.96 },
    cara: { jawWidth: 0.90, browRidge: 0.85, headWidth: 0.95, headHeight: 1.04 },
  },
  robusto: {
    torso: { chestWidth: 1.26, waistWidth: 1.22, hipWidth: 1.18, chestDepth: 1.26, height: 0.96, neckWidth: 1.20, muscleDef: 0.48 },
    brazos: { length: 0.95, thickness: 1.26, bicepSize: 1.20, forearmSize: 1.22, handSize: 1.08 },
    piernas: { length: 0.94, thickness: 1.25, calfSize: 1.22, gluteSize: 1.18, footSize: 1.06 },
    cara: { jawWidth: 1.16, browRidge: 1.10, headWidth: 1.08, headHeight: 0.96 },
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
  hair: new THREE.MeshStandardMaterial({
    color: CONFIG.colors.hair,
    roughness: 0.82,
    metalness: 0.05,
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
 * Grupo raíz del personaje y diccionario de pivotes jerárquicos
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

  // El relieve muscular tiene un matiz cálido sutilmente más intenso según la definición muscular
  const muscleCol = skinCol.clone().offsetHSL(-0.004, 0.04 * CONFIG.torso.muscleDef, -0.015 * CONFIG.torso.muscleDef);
  MAT.muscle.color.copy(muscleCol);

  MAT.eyeIris.color.set(CONFIG.colors.eyes);
  MAT.hair.color.set(CONFIG.colors.hair);
  MAT.lips.color.set(CONFIG.colors.lips);
  MAT.cloth.color.set(CONFIG.colors.cloth);
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
  const pose = POSES[c.items.pose] || POSES.neutral;

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

  // El torso tiene su origen en el centro (y=0); la parte superior está en +torsoH/2 y la inferior en -torsoH/2
  const shoulderY = torsoH * 0.41;
  const shoulderX = 0.215 * c.torso.chestWidth;
  const neckY = torsoH * 0.48;
  const hipY = -torsoH * 0.46;
  const hipX = 0.105 * (c.torso.hipWidth ?? 1.0);

  // Cuello y Cabeza
  rig.neck.position.set(0, neckY, -0.005);
  rig.torso.add(rig.neck);

  const neckLen = 0.105;
  rig.head.position.set(0, neckLen * 0.72, 0.008);
  rig.neck.add(rig.head);

  // Brazos Izquierdo y Derecho (Hombro -> Brazo -> Codo -> Antebrazo -> Muñeca -> Mano)
  rig.shoulderL.position.set(shoulderX, shoulderY, -0.01);
  rig.shoulderR.position.set(-shoulderX, shoulderY, -0.01);
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

  // Piernas Izquierda y Derecha (Cadera -> Muslo -> Rodilla -> Pantorrilla -> Tobillo -> Pie)
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
  // 2. ESCULTURA DEL TORSO, CUELLO Y GRUPOS MUSCULARES DEL TRONCO
  // ==========================================================================
  const torsoGeo = buildSculptedTorsoGeometry(c.torso);
  const torsoMesh = new THREE.Mesh(torsoGeo, MAT.skin);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  rig.torso.add(torsoMesh);

  // Trapecios (unión suave entre cuello y hombros)
  const trapGeo = new THREE.SphereGeometry(0.11 * c.torso.neckWidth, 24, 20);
  const trapMesh = new THREE.Mesh(trapGeo, MAT.muscle);
  trapMesh.scale.set(1.55 * c.torso.chestWidth, 0.55 + mDef * 0.25, 0.78 * c.torso.chestDepth);
  trapMesh.position.set(0, neckY - 0.015, -0.018);
  trapMesh.castShadow = true;
  rig.torso.add(trapMesh);

  // Pectorales mayores esculpidos (Izquierdo y Derecho)
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const pecGeo = new THREE.SphereGeometry(0.095, 28, 24);
    const pos = pecGeo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      let x = pos.getX(v);
      let y = pos.getY(v);
      let z = pos.getZ(v);
      // Aplanar borde inferior del pectoral y estirar inserción hacia el hombro
      if (y < 0) y *= 0.72;
      if (dir * x > 0) {
        y += Math.abs(x) * 0.28;
        z -= Math.abs(x) * 0.18;
      }
      pos.setXYZ(v, x, y, z);
    }
    pecGeo.computeVertexNormals();

    const pec = new THREE.Mesh(pecGeo, MAT.muscle);
    const pDepth = 0.42 + mDef * 0.42;
    pec.scale.set(1.18 * c.torso.chestWidth, (0.82 + mDef * 0.18) * c.torso.height, pDepth * c.torso.chestDepth);
    pec.position.set(
      dir * 0.096 * c.torso.chestWidth,
      torsoH * 0.24,
      (0.118 + mDef * 0.016) * c.torso.chestDepth
    );
    pec.rotation.z = -dir * 0.08;
    pec.rotation.y = dir * 0.16;
    pec.castShadow = true;
     pec.receiveShadow = true;
    rig.torso.add(pec);
  }

  // Recto Abdominal (6-Pack + Oblicuos Externos)
  const absGroup = new THREE.Group();
  absGroup.position.set(0, torsoH * 0.06, 0.112 * c.torso.chestDepth);
  for (let row = 0; row < 3; row++) {
    const rowY = -row * 0.068 * c.torso.height;
    const rowTaper = 1.0 - row * 0.08;
    for (let col = 0; col < 2; col++) {
      const dir = col === 0 ? 1 : -1;
      const abGeo = new THREE.SphereGeometry(0.036, 18, 16);
      const ab = new THREE.Mesh(abGeo, MAT.muscle);
      const abRelief = 0.25 + mDef * 0.58;
      ab.scale.set(1.15 * rowTaper * c.torso.waistWidth, 0.85 * c.torso.height, abRelief);
      ab.position.set(
        dir * 0.038 * rowTaper * c.torso.waistWidth,
        rowY,
        (0.015 - row * 0.004) * c.torso.chestDepth
      );
      ab.rotation.z = dir * 0.05;
      ab.castShadow = true;
      absGroup.add(ab);
    }
  }

  // Oblicuos externos / Serratos laterales
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const obGeo = createMuscleBellyGeometry(0.22 * c.torso.height, 0.042, 0.68, 0.5);
    const obMesh = new THREE.Mesh(obGeo, MAT.muscle);
    obMesh.position.set(
      dir * 0.135 * c.torso.waistWidth,
      -0.06 * c.torso.height,
      0.03 * c.torso.chestDepth
    );
    obMesh.rotation.z = -dir * 0.14;
    obMesh.scale.set(0.75 + mDef * 0.45, 1.0, 0.85 + mDef * 0.35);
    rig.torso.add(obMesh);
  }
  rig.torso.add(absGroup);

  // Músculos Dorsales y Erectores Espinales (Espalda)
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const backLatGeo = createMuscleBellyGeometry(0.32 * c.torso.height, 0.068, 0.55, 0.65);
    const backLat = new THREE.Mesh(backLatGeo, MAT.muscle);
    backLat.position.set(
      dir * 0.105 * c.torso.chestWidth,
      torsoH * 0.10,
      -0.102 * c.torso.chestDepth
    );
    backLat.rotation.z = dir * 0.22;
    backLat.scale.set(1.0 + mDef * 0.35, 1.0, 0.7 + mDef * 0.45);
    rig.torso.add(backLat);
  }

  // Glúteos (Gluteus Maximus Izquierdo y Derecho en la pelvis posterior)
  const gluteScale = c.piernas.gluteSize ?? 1.0;
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const glute = new THREE.Mesh(new THREE.SphereGeometry(0.092, 24, 24), MAT.muscle);
    glute.scale.set(
      0.95 * (c.torso.hipWidth ?? 1.0) * gluteScale,
      1.08 * gluteScale,
      (0.78 + mDef * 0.22) * gluteScale
    );
    glute.position.set(
      dir * 0.078 * (c.torso.hipWidth ?? 1.0),
      hipY + 0.035,
      -0.068 * c.torso.chestDepth
    );
    glute.castShadow = true;
    glute.receiveShadow = true;
    glute.userData.zone = 'piernas';
    rig.torso.add(glute);
  }

  // Cuello anatómico con músculos esternocleidomastoideos
  const neckGeo = createAnatomicalLathe(
    [
      [0.0, 0.072 * c.torso.neckWidth],
      [0.45, 0.060 * c.torso.neckWidth],
      [0.85, 0.062 * c.torso.neckWidth],
      [1.0, 0.052 * c.torso.neckWidth],
    ],
    neckLen,
    {
      radialSegments: 28,
      heightSegments: 14,
      originAtTop: false,
      scaleX: () => 1.02,
      scaleZ: () => 0.96,
    }
  );
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

  // Aplicar sliders específicos de rasgos faciales
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
    if (o.name.startsWith('ear_')) {
      o.scale.setScalar(c.cara.earSize);
    }
  });

  assignZone(sculptedHead, 'cara');
  rig.head.add(sculptedHead);

  // Cabello procedural
  const hairGroup = buildProceduralHairGroup(c.pelo, MAT.hair);
  hairGroup.scale.set(
    c.cara.headWidth * c.pelo.volume,
    c.cara.headHeight * c.pelo.height,
    ((c.cara.headWidth + c.cara.headHeight) * 0.5) * c.pelo.volume
  );
  assignZone(hairGroup, 'pelo');
  rig.head.add(hairGroup);

  // ==========================================================================
  // 4. EXTREMIDADES SUPERIORES (DELTOIDES, BRAZOS, BÍCEPS, TRÍCEPS, ANTEBRAZOS, MANOS)
  // ==========================================================================
  const armThick = c.brazos.thickness;
  const bicepFactor = c.brazos.bicepSize ?? 1.0;
  const forearmFactor = (c.brazos.forearmSize ?? 1.0) * armThick;

  ['L', 'R'].forEach((side) => {
    const dir = side === 'L' ? 1 : -1;
    const uArmGroup = rig[`upperArm${side}`];
    const fArmGroup = rig[`forearm${side}`];
    const wristGroup = rig[`wrist${side}`];

    // Deltoides (Hombro esculpido en forma de gota invertida)
    const deltGeo = createAnatomicalLathe(
      [
        [0.0, 0.055 * armThick],
        [0.25, 0.078 * armThick * (0.9 + mDef * 0.22)],
        [0.65, 0.058 * armThick],
        [1.0, 0.025 * armThick],
      ],
      0.145,
      {
        radialSegments: 24,
        heightSegments: 16,
        originAtTop: true,
        scaleX: () => 1.08,
        scaleZ: () => 0.96,
      }
    );
    const deltMesh = new THREE.Mesh(deltGeo, MAT.muscle);
    deltMesh.position.set(dir * 0.012, 0.032, 0);
    deltMesh.castShadow = true;
    uArmGroup.add(deltMesh);

    // Brazo superior (Húmero con curva de bíceps y tríceps)
    const upperArmGeo = createAnatomicalLathe(
      [
        [0.0, 0.052 * armThick],
        [0.18, 0.058 * armThick],
        [0.48, 0.062 * armThick * (0.92 + bicepFactor * 0.12)],
        [0.82, 0.048 * armThick],
        [1.0, 0.044 * armThick],
      ],
      upperArmLen,
      {
        radialSegments: 28,
        heightSegments: 20,
        originAtTop: true,
        scaleX: () => 0.94,
        scaleZ: () => 1.06,
      }
    );
    const upperArmMesh = new THREE.Mesh(upperArmGeo, MAT.skin);
    upperArmMesh.castShadow = true;
    upperArmMesh.receiveShadow = true;
    uArmGroup.add(upperArmMesh);

    // Vientre muscular del Bíceps Braquial (frontal)
    const bicepBellyGeo = createMuscleBellyGeometry(
      upperArmLen * 0.68,
      0.038 * armThick * bicepFactor * (0.85 + mDef * 0.42),
      0.85,
      0.48
    );
    const bicepMesh = new THREE.Mesh(bicepBellyGeo, MAT.muscle);
    bicepMesh.position.set(-dir * 0.005, -upperArmLen * 0.50, 0.026 * armThick);
    bicepMesh.castShadow = true;
    uArmGroup.add(bicepMesh);

    // Vientre muscular del Tríceps (posterior)
    const tricepBellyGeo = createMuscleBellyGeometry(
      upperArmLen * 0.62,
      0.036 * armThick * (0.85 + mDef * 0.38),
      0.82,
      0.42
    );
    const tricepMesh = new THREE.Mesh(tricepBellyGeo, MAT.muscle);
    tricepMesh.position.set(dir * 0.006, -upperArmLen * 0.44, -0.025 * armThick);
    tricepMesh.castShadow = true;
    uArmGroup.add(tricepMesh);

    // Esfera de unión del Codo (olécranon)
    const elbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.043 * armThick, 18, 18),
      MAT.skin
    );
    elbowJoint.scale.set(0.95, 0.9, 1.02);
    fArmGroup.add(elbowJoint);

    // Antebrazo (Cúbito/Radio + Braquiorradial cónico hacia la muñeca)
    const forearmGeo = createAnatomicalLathe(
      [
        [0.0, 0.042 * forearmFactor],
        [0.24, 0.052 * forearmFactor * (0.94 + mDef * 0.16)], // Masa del braquiorradial
        [0.58, 0.041 * forearmFactor],
        [0.88, 0.031 * forearmFactor], // Muñeca estilizada
        [1.0, 0.028 * forearmFactor],
      ],
      forearmLen,
      {
        radialSegments: 28,
        heightSegments: 20,
        originAtTop: true,
        scaleX: (t) => THREE.MathUtils.lerp(0.96, 1.08, t),
        scaleZ: (t) => THREE.MathUtils.lerp(1.06, 0.78, t),
      }
    );
    const forearmMesh = new THREE.Mesh(forearmGeo, MAT.skin);
    forearmMesh.castShadow = true;
    forearmMesh.receiveShadow = true;
    fArmGroup.add(forearmMesh);

    // Mano articulada con dedos y pulgar
    const hand = buildHandGroup(side, MAT.skin, pose.fistCurl ?? 0.2);
    const hScale = c.brazos.handSize ?? 1.0;
    hand.scale.setScalar(hScale);
    wristGroup.add(hand);

    assignZone(uArmGroup, 'brazos');
    assignZone(fArmGroup, 'brazos');
    assignZone(wristGroup, 'brazos');
  });

  // ==========================================================================
  // 5. EXTREMIDADES INFERIORES (MUSLOS, CUÁDRICEPS, RODILLAS, PANTORRILLAS, GEMELOS, PIES)
  // ==========================================================================
  const legThick = c.piernas.thickness;
  const calfFactor = c.piernas.calfSize ?? 1.0;

  ['L', 'R'].forEach((side) => {
    const dir = side === 'L' ? 1 : -1;
    const thighGroup = rig[`thigh${side}`];
    const shinGroup = rig[`shin${side}`];
    const ankleGroup = rig[`ankle${side}`];

    // Esfera de articulación de la cadera
    const hipBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.088 * legThick, 20, 20),
      MAT.skin
    );
    thighGroup.add(hipBall);

    // Muslo Anatómico (Fémur + barrido orgánico hacia la rodilla)
    const thighGeo = createAnatomicalLathe(
      [
        [0.0, 0.086 * legThick],
        [0.22, 0.098 * legThick * (0.94 + mDef * 0.12)],
        [0.55, 0.088 * legThick],
        [0.85, 0.066 * legThick],
        [1.0, 0.058 * legThick],
      ],
      thighLen,
      {
        radialSegments: 32,
        heightSegments: 24,
        originAtTop: true,
        scaleX: (t) => THREE.MathUtils.lerp(1.04, 0.94, t),
        scaleZ: (t) => THREE.MathUtils.lerp(1.08, 0.98, t),
        offsetZ: (t) => Math.sin(t * Math.PI) * 0.012, // Curva frontal del cuádriceps
      }
    );
    const thighMesh = new THREE.Mesh(thighGeo, MAT.skin);
    thighMesh.castShadow = true;
    thighMesh.receiveShadow = true;
    thighGroup.add(thighMesh);

    // Cuádriceps Esculpidos (Recto Femoral, Vasto Lateral y Vasto Medial "gota")
    const vastusLatGeo = createMuscleBellyGeometry(
      thighLen * 0.72,
      0.048 * legThick * (0.85 + mDef * 0.38),
      0.78,
      0.45
    );
    const vastusLat = new THREE.Mesh(vastusLatGeo, MAT.muscle);
    vastusLat.position.set(dir * 0.036 * legThick, -thighLen * 0.44, 0.032 * legThick);
    vastusLat.rotation.z = -dir * 0.06;
    vastusLat.castShadow = true;
    thighGroup.add(vastusLat);

    // Vasto Medial (Gota interna justo encima de la rodilla)
    const vastusMedGeo = createMuscleBellyGeometry(
      thighLen * 0.42,
      0.038 * legThick * (0.85 + mDef * 0.42),
      0.82,
      0.62
    );
    const vastusMed = new THREE.Mesh(vastusMedGeo, MAT.muscle);
    vastusMed.position.set(-dir * 0.028 * legThick, -thighLen * 0.68, 0.036 * legThick);
    vastusMed.rotation.z = dir * 0.12;
    vastusMed.castShadow = true;
    thighGroup.add(vastusMed);

    // Articulación de la Rodilla y Rótula (Patella)
    const kneeJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.056 * legThick, 22, 22),
      MAT.skin
    );
    kneeJoint.scale.set(0.96, 0.92, 1.02);
    shinGroup.add(kneeJoint);

    const patella = new THREE.Mesh(
      new THREE.SphereGeometry(0.028 * legThick, 16, 16),
      MAT.skin
    );
    patella.scale.set(0.95, 1.15, 0.65);
    patella.position.set(0, 0.005, 0.045 * legThick);
    shinGroup.add(patella);

    // Pantorrilla / Tibia con forma orgánica de gemelo y sóleo hacia el tendón de Aquiles
    const shinGeo = createAnatomicalLathe(
      [
        [0.0, 0.054 * legThick],
        [0.14, 0.062 * legThick],
        [0.34, 0.068 * legThick * (0.90 + calfFactor * 0.14)], // Parte alta del gemelo
        [0.62, 0.052 * legThick],
        [0.86, 0.038 * legThick], // Estrechamiento del tobillo / Aquiles
        [1.0, 0.039 * legThick],
      ],
      shinLen,
      {
        radialSegments: 32,
        heightSegments: 24,
        originAtTop: true,
        scaleX: () => 0.94,
        scaleZ: () => 1.06,
        offsetZ: (t) => {
          // Proyección trasera del gemelo en el tercio superior
          const gastroBulge = Math.exp(-Math.pow((t - 0.30) / 0.18, 2));
          return -gastroBulge * 0.018 * calfFactor;
        },
      }
    );
    const shinMesh = new THREE.Mesh(shinGeo, MAT.skin);
    shinMesh.castShadow = true;
    shinMesh.receiveShadow = true;
    shinGroup.add(shinMesh);

    // Gemelos Esculpidos (Cabezas Medial y Lateral del Gastrocnemio)
    for (let h = 0; h < 2; h++) {
      const hDir = h === 0 ? 1 : -1;
      const calfBellyGeo = createMuscleBellyGeometry(
        shinLen * 0.52,
        0.034 * legThick * calfFactor * (0.82 + mDef * 0.45),
        0.85,
        0.42
      );
      const calfBelly = new THREE.Mesh(calfBellyGeo, MAT.muscle);
      calfBelly.position.set(
        hDir * 0.018 * legThick,
        -shinLen * 0.32,
        -0.038 * legThick * calfFactor
      );
      calfBelly.castShadow = true;
      shinGroup.add(calfBelly);
    }

    // Pie anatómico completo con talón, arco y 5 dedos
    const foot = buildFootGroup(side, MAT.skin);
    const fScale = c.piernas.footSize ?? 1.0;
    foot.scale.setScalar(fScale);
    ankleGroup.add(foot);

    assignZone(thighGroup, 'piernas');
    assignZone(shinGroup, 'piernas');
    assignZone(ankleGroup, 'piernas');
  });

  // ==========================================================================
  // 6. PRENDAS Y ACCESORIOS PROCEDURALES (ITEMS.JS)
  // ==========================================================================
  buildProceduralItems(c, MAT, rig);

  // ==========================================================================
  // 7. APLICAR ROTACIONES DE POSE Y ALINEAR LOS PIES EXACTAMENTE AL SUELO (Y=0)
  // ==========================================================================
  applyPoseTransformations(pose);
  alignCharacterToGround();
}

/**
 * Aplica las rotaciones articulares de la pose seleccionada manteniendo las articulaciones soldadas
 */
function applyPoseTransformations(pose) {
  rig.shoulderL.rotation.set(...pose.shoulderL);
  rig.shoulderR.rotation.set(...pose.shoulderR);
  rig.elbowL.rotation.set(...pose.elbowL);
  rig.elbowR.rotation.set(...pose.elbowR);
  rig.wristL.rotation.set(...pose.wristL);
  rig.wristR.rotation.set(...pose.wristR);
  rig.hipL.rotation.set(...pose.hipL);
  rig.hipR.rotation.set(...pose.hipR);
  rig.kneeL.rotation.set(...pose.kneeL);
  rig.kneeR.rotation.set(...pose.kneeR);
  rig.head.rotation.set(...pose.head);

  // Compensar rotación del tobillo para que el pie se mantenga horizontal respecto al suelo
  rig.ankleL.rotation.x = -(pose.hipL[0] + pose.kneeL[0]);
  rig.ankleR.rotation.x = -(pose.hipR[0] + pose.kneeR[0]);
}

/**
 * Calcula la caja envolvente real del personaje y ajusta characterGroup.position.y
 * para que las plantas de los pies siempre descansen sobre el suelo (y = 0) sin flotar ni hundirse.
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
 * Aplica uno de los arquetipos base y reconstruye el personaje
 */
export function applyArchetype(archetypeKey) {
  const preset = ARCHETYPES[archetypeKey];
  if (!preset) return;

  Object.keys(preset).forEach((zone) => {
    if (CONFIG[zone]) {
      Object.assign(CONFIG[zone], preset[zone]);
    }
  });

  rebuildCharacter();
}

/**
 * Genera una combinación aleatoria pero anatómicamente coherente y proporcional
 */
export function randomizeCharacter() {
  const rRange = (min, max) => min + Math.random() * (max - min);

  // Elegir tendencia corporal coherente
  const buildFactor = rRange(0.86, 1.28);
  const muscleTone = rRange(0.25, 0.95);

  CONFIG.cara.headWidth = rRange(0.92, 1.08);
  CONFIG.cara.headHeight = rRange(0.94, 1.08);
  CONFIG.cara.jawWidth = rRange(0.88, 1.15);
  CONFIG.cara.chinLength = rRange(0.88, 1.14);
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

  // Paletas humanas naturales para piel, ojos y cabello
  const skinTones = ['#f6d2c0', '#ecc0a8', '#e0a98b', '#c98c6b', '#a86b4c', '#7c4b33', '#593322'];
  const eyeTones = ['#3b82f6', '#2563eb', '#10b981', '#0d9488', '#854d0e', '#451a03', '#64748b'];
  const hairTones = ['#171717', '#2c1b12', '#4a2c18', '#78350f', '#b45309', '#d97706', '#52525b'];
  const clothTones = ['#1e293b', '#0f172a', '#1d4ed8', '#991b1b', '#065f46', '#374151'];

  CONFIG.colors.skin = skinTones[Math.floor(Math.random() * skinTones.length)];
  CONFIG.colors.eyes = eyeTones[Math.floor(Math.random() * eyeTones.length)];
  CONFIG.colors.hair = hairTones[Math.floor(Math.random() * hairTones.length)];
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
