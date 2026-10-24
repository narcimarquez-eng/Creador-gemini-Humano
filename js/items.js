import * as THREE from 'three';
import { createAnatomicalLathe } from './procedural.js';

/**
 * Catálogo de poses anatómicas (rotaciones en radianes de las articulaciones jerárquicas)
 */
export const POSES = {
  neutral: {
    label: 'Pose Anatómica A (Natural)',
    shoulderL: [0.02, 0, -0.18],
    shoulderR: [0.02, 0, 0.18],
    elbowL: [-0.22, 0, 0.04],
    elbowR: [-0.22, 0, -0.04],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [0.02, 0, -0.04],
    hipR: [0.02, 0, 0.04],
    kneeL: [0.06, 0, 0],
    kneeR: [0.06, 0, 0],
    head: [0, 0, 0],
    fistCurl: 0.2,
  },
  doble_biceps: {
    label: 'Doble Bíceps Frontal (Culturismo)',
    shoulderL: [0.1, 0.15, -1.42],
    shoulderR: [0.1, -0.15, 1.42],
    elbowL: [-0.2, 0, -1.85],
    elbowR: [-0.2, 0, 1.85],
    wristL: [0, 0, -0.25],
    wristR: [0, 0, 0.25],
    hipL: [-0.04, 0.08, -0.10],
    hipR: [0.04, -0.08, 0.10],
    kneeL: [0.12, 0, 0],
    kneeR: [0.08, 0, 0],
    head: [0.04, 0, 0],
    fistCurl: 0.85,
  },
  tpose: {
    label: 'Pose T (Rigging Estándar)',
    shoulderL: [0, 0, -Math.PI / 2 + 0.05],
    shoulderR: [0, 0, Math.PI / 2 - 0.05],
    elbowL: [0, 0, 0],
    elbowR: [0, 0, 0],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [0, 0, -0.03],
    hipR: [0, 0, 0.03],
    kneeL: [0, 0, 0],
    kneeR: [0, 0, 0],
    head: [0, 0, 0],
    fistCurl: 0.05,
  },
  atletica: {
    label: 'Guardia Atlética Dinámica',
    shoulderL: [-0.45, 0.25, -0.35],
    shoulderR: [0.25, -0.2, 0.35],
    elbowL: [-1.45, 0.2, 0.15],
    elbowR: [-1.15, -0.2, -0.15],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [-0.22, 0.1, -0.08],
    hipR: [0.18, -0.1, 0.08],
    kneeL: [0.32, 0, 0],
    kneeR: [0.22, 0, 0],
    head: [0.05, -0.12, 0],
    fistCurl: 0.75,
  },
  caminando: {
    label: 'Paso en Movimiento',
    shoulderL: [0.28, 0, -0.14],
    shoulderR: [-0.28, 0, 0.14],
    elbowL: [-0.35, 0, 0],
    elbowR: [-0.48, 0, 0],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [-0.28, 0, -0.02],
    hipR: [0.24, 0, 0.02],
    kneeL: [0.12, 0, 0],
    kneeR: [0.38, 0, 0],
    head: [0, 0.06, 0],
    fistCurl: 0.25,
  },
};

/**
 * Construye prendas y accesorios procedurales que se adaptan a las proporciones del cuerpo
 */
export function buildProceduralItems(config, mats, rigRefs) {
  const outfit = config.items?.outfit || 'shorts';
  const accessory = config.items?.accessory || 'ninguno';

  // 1. Pantalón corto deportivo / Mallas sobre la pelvis y parte alta de muslos
  if (outfit === 'shorts' || outfit === 'conjunto') {
    const hw = config.torso.hipWidth ?? 1.0;
    const ww = config.torso.waistWidth ?? 1.0;

    // Cinturilla y cadera del short en el torso inferior
    const briefGeo = createAnatomicalLathe(
      [
        [0.0, 0.158 * hw],
        [0.45, 0.182 * hw],
        [0.85, 0.152 * ww],
        [1.0, 0.146 * ww],
      ],
      0.19 * config.torso.height,
      {
        radialSegments: 36,
        heightSegments: 16,
        originAtTop: false,
        scaleX: () => 1.16,
        scaleZ: () => 0.71 * THREE.MathUtils.lerp(1, config.torso.chestDepth, 0.6),
        offsetZ: () => 0.005,
      }
    );
    briefGeo.translate(0, -0.305 * config.torso.height, 0);
    const briefMesh = new THREE.Mesh(briefGeo, mats.cloth);
    briefMesh.castShadow = true;
    briefMesh.receiveShadow = true;
    briefMesh.userData.zone = 'items';
    rigRefs.torso.add(briefMesh);

    // Perniles del short en cada muslo
    ['thighL', 'thighR'].forEach((thighKey) => {
      const legShortGeo = createAnatomicalLathe(
        [
          [0.0, 0.095],
          [0.35, 0.098],
          [1.0, 0.086],
        ],
        0.16,
        {
          radialSegments: 28,
          heightSegments: 12,
          originAtTop: true,
          scaleX: () => 1.04,
          scaleZ: () => 1.08,
        }
      );
      const legShortMesh = new THREE.Mesh(legShortGeo, mats.cloth);
      legShortMesh.castShadow = true;
      legShortMesh.userData.zone = 'items';
      rigRefs[thighKey].add(legShortMesh);
    });
  }

  // 2. Camiseta / Top técnico de compresión sobre el torso
  if (outfit === 'conjunto') {
    const h = 0.44 * config.torso.height;
    const cw = config.torso.chestWidth;
    const ww = config.torso.waistWidth;
    const cd = config.torso.chestDepth;

    const topGeo = createAnatomicalLathe(
      [
        [0.0, 0.148 * ww],
        [0.35, 0.174 * ((ww + cw) * 0.5)],
        [0.75, 0.205 * cw],
        [1.0, 0.178 * cw],
      ],
      h,
      {
        radialSegments: 36,
        heightSegments: 20,
        originAtTop: false,
        scaleX: (t) => 1.17 + t * 0.12,
        scaleZ: () => 0.78 * cd,
        offsetZ: () => 0.012,
      }
    );
    topGeo.translate(0, -0.10 * config.torso.height, 0);
    const topMesh = new THREE.Mesh(topGeo, mats.cloth);
    topMesh.castShadow = true;
    topMesh.userData.zone = 'items';
    rigRefs.torso.add(topMesh);
  }

  // 3. Accesorios opcionales (Muñequeras deportivas o Visor/Gafas)
  if (accessory === 'munequeras' || accessory === 'ambos') {
    ['forearmL', 'forearmR'].forEach((fKey) => {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.034, 0.045, 24),
        mats.cloth
      );
      band.position.set(0, -0.22, 0);
      band.castShadow = true;
      band.userData.zone = 'items';
      rigRefs[fKey].add(band);
    });
  }

  if (accessory === 'gafas' || accessory === 'ambos') {
    const visorCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.095, 0.132, 0.075),
      new THREE.Vector3(-0.045, 0.132, 0.128),
      new THREE.Vector3(0.0, 0.134, 0.134),
      new THREE.Vector3(0.045, 0.132, 0.128),
      new THREE.Vector3(0.095, 0.132, 0.075),
    ]);
    const visorMesh = new THREE.Mesh(
      new THREE.TubeGeometry(visorCurve, 24, 0.015, 10, false),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.15,
        metalness: 0.85,
      })
    );
    visorMesh.scale.set(1.0, 1.15, 0.45);
    visorMesh.userData.zone = 'items';
    rigRefs.head.add(visorMesh);
  }
}
