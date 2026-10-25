import * as THREE from 'three';

/**
 * Crea una geometría orgánica de revolución (LatheGeometry) con sección transversal elíptica
 * y deformación anatómica frontal/trasera o surcos musculares.
 *
 * @param {Array<[number, number]>} profile - Puntos [t (0..1), radio] de abajo hacia arriba
 * @param {number} height - Altura total del segmento
 * @param {object} opts - Opciones de perfilado anatómico
 */
export function createAnatomicalLathe(profile, height, opts = {}) {
  const {
    radialSegments = 36,
    heightSegments = 32,
    originAtTop = false, // true para extremidades que cuelgan desde la articulación superior
    scaleX = () => 1.0,
    scaleZ = () => 1.0,
    offsetZ = () => 0.0,
    offsetX = () => 0.0,
    sculptFn = null, // (x, y, z, t, angle) => [dx, dy, dz]
  } = opts;

  const curvePts = profile.map(([t, r]) => {
    const y = originAtTop ? -t * height : t * height;
    return new THREE.Vector2(Math.max(0.001, r), y);
  });

  // Si originAtTop es true, LatheGeometry necesita los puntos ordenados para mantener normales hacia afuera
  const orderedPts = originAtTop ? [...curvePts].reverse() : curvePts;
  const spline = new THREE.SplineCurve(orderedPts);
  const sampled = spline.getPoints(heightSegments);

  const geo = new THREE.LatheGeometry(sampled, radialSegments);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const t = originAtTop
      ? THREE.MathUtils.clamp(-y / height, 0, 1)
      : THREE.MathUtils.clamp(y / height, 0, 1);

    const angle = Math.atan2(z, x); // ángulo alrededor del eje Y
    const sx = scaleX(t, angle);
    const sz = scaleZ(t, angle);

    x = x * sx + offsetX(t, angle);
    z = z * sz + offsetZ(t, angle);

    if (sculptFn) {
      const [dx, dy, dz] = sculptFn(x, y, z, t, angle);
      x += dx;
      y += dy;
      z += dz;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Crea un músculo fusiforme orgánico usando LatheGeometry con sección achatada
 */
export function createMuscleBellyGeometry(length, maxRadius, flattenZ = 0.65, peakT = 0.5) {
  const profile = [
    [0.0, 0.002],
    [0.12, maxRadius * 0.48],
    [peakT, maxRadius],
    [0.88, maxRadius * 0.52],
    [1.0, 0.002],
  ];
  const geo = createAnatomicalLathe(profile, length, {
    radialSegments: 24,
    heightSegments: 20,
    originAtTop: false,
    scaleX: () => 1.0,
    scaleZ: () => flattenZ,
  });
  geo.translate(0, -length * 0.5, 0);
  return geo;
}

/**
 * Genera el Torso Humano Esculpido (Pelvis -> Cintura -> Caja Torácica -> Hombros/Clavículas)
 * con surco espinal posterior, línea alba frontal y forma en V dorsal.
 */
export function buildSculptedTorsoGeometry(torsoCfg) {
  const h = 0.62 * torsoCfg.height;
  const cw = torsoCfg.chestWidth;
  const ww = torsoCfg.waistWidth;
  const hw = torsoCfg.hipWidth ?? 1.0;
  const cd = torsoCfg.chestDepth;
  const mDef = torsoCfg.muscleDef;

  // Perfil base cerrado [t de pelvis (0) a base de cuello (1), radio base]
  const profile = [
    [0.0, 0.002],
    [0.05, 0.142 * hw],  // Base pélvica / pubis
    [0.18, 0.168 * hw],  // Caderas / cresta ilíaca
    [0.38, 0.138 * ww],  // Cintura estrecha (umbilical)
    [0.56, 0.162 * ((ww + cw) * 0.5)], // Costillas inferiores / serratos
    [0.76, 0.188 * cw],  // Pecho / dorsal ancho
    [0.88, 0.172 * cw],  // Línea clavicular / hombros
    [0.96, 0.082 * torsoCfg.neckWidth], // Pendiente de trapecios hacia el cuello
    [1.0, 0.002],
  ];

  const geo = createAnatomicalLathe(profile, h, {
    radialSegments: 64,
    heightSegments: 56,
    originAtTop: false,
    // El torso humano es más ancho en X que profundo en Z, con transición suave
    scaleX: (t) => {
      const shoulderFlare = THREE.MathUtils.smoothstep(t, 0.36, 0.84) * 0.12;
      const trapSlope = t > 0.88 ? THREE.MathUtils.smoothstep(t, 0.88, 1.0) * 0.08 : 0;
      return 1.12 + shoulderFlare - trapSlope;
    },
    scaleZ: (t) => {
      // Transición continua (sin escalones bruscos) entre pelvis y caja torácica
      const ribBlend = THREE.MathUtils.smoothstep(t, 0.32, 0.72);
      const lowerDepth = 0.68 * THREE.MathUtils.lerp(1, cd, 0.65);
      const upperDepth = 0.75 * cd;
      return THREE.MathUtils.lerp(lowerDepth, upperDepth, ribBlend);
    },
    offsetZ: (t) => {
      // Curva anatómica natural de la columna humana
      return Math.sin(t * Math.PI) * 0.014;
    },
    sculptFn: (x, y, z, t, angle) => {
      let dx = 0;
      let dy = 0;
      let dz = 0;

      const absX = Math.abs(x);

      // 1. Parte frontal: Esternón, Pectorales integrados, Línea Alba y Abdomen continuo
      if (z > 0 && t > 0.20 && t < 0.90) {
        // Hendidura suave del esternón y línea alba
        const midlineEnv = Math.sin(THREE.MathUtils.clamp((t - 0.22) / 0.64, 0, 1) * Math.PI);
        const midline = Math.exp(-Math.pow(absX / 0.026, 2)) * midlineEnv;
        dz -= midline * (0.005 + mDef * 0.010);

        // Placas pectorales anchas e integradas en la malla del torso
        if (t >= 0.58 && t <= 0.88) {
          const pecU = (t - 0.58) / 0.30;
          const pecVert = Math.sin(pecU * Math.PI) * (1.0 + (1.0 - pecU) * 0.25);
          const pecLat =
            Math.exp(-Math.pow((absX - 0.085 * cw) / (0.072 * cw), 2)) *
            THREE.MathUtils.smoothstep(absX, 0.012, 0.045 * cw);
          dz += pecVert * pecLat * (0.010 + mDef * 0.022) * cd;
        }

        // Recto abdominal (3 filas suaves integradas en la piel sin círculos sueltos)
        if (t >= 0.24 && t <= 0.57) {
          const abU = (t - 0.24) / 0.33;
          const abEnvelope = Math.sin(abU * Math.PI);
          const abRowWave = Math.pow(Math.sin(abU * Math.PI * 3), 2);
          const abLat =
            Math.exp(-Math.pow((absX - 0.044 * ww) / (0.036 * ww), 2)) *
            THREE.MathUtils.smoothstep(absX, 0.008, 0.026 * ww);
          dz += abEnvelope * (0.35 + 0.65 * abRowWave) * abLat * (0.006 + mDef * 0.016) * cd;
        }
      } else if (z < 0 && t > 0.16 && t < 0.92) {
        // Surco espinal en la columna vertebral posterior
        const spineEnv = Math.sin(THREE.MathUtils.clamp((t - 0.16) / 0.76, 0, 1) * Math.PI);
        const spineGroove = Math.exp(-Math.pow(absX / 0.032, 2)) * spineEnv;
        dz += spineGroove * (0.009 + mDef * 0.012);

        // Columnas de los erectores espinales y dorsales a ambos lados
        const erector = Math.exp(-Math.pow((absX - 0.052 * cw) / 0.042, 2)) * spineEnv;
        dz -= erector * (0.006 + mDef * 0.012);
      }

      // 2. Expansión lateral de los dorsales (forma en V atlética)
      if (t > 0.38 && t < 0.84) {
        const latFactor = Math.sin(((t - 0.38) / 0.46) * Math.PI);
        const sideFactor = Math.pow(Math.cos(angle), 2);
        dx += Math.sign(x) * latFactor * sideFactor * (0.006 + mDef * 0.018);
      }

      return [dx, dy, dz];
    },
  });

  // Centrar verticalmente de modo que y=0 sea la cintura/centro del torso
  geo.translate(0, -h * 0.5, 0);
  return geo;
}

/**
 * Definición anatómica y morfología paramétrica de diferentes tipos de ojos
 */
export const EYE_TYPES_DATA = {
  almendrado: {
    label: 'Almendrado',
    scleraScale: [1.0, 0.92, 0.85],
    irisRadius: 0.0095,
    pupilRadius: 0.0045,
    upperLidArc: 0.019,
    upperLidThick: 0.0038,
    upperLidY: 0.002,
    lowerLidY: -0.002,
    baseSlant: 0.0,
    browOffset: 0.0,
  },
  goku_ssj: {
    label: 'Goku SSJ (Angular / Rectangular)',
    scleraScale: [1.34, 0.58, 0.78],
    irisRadius: 0.0078,
    pupilRadius: 0.0035,
    upperLidArc: 0.022,
    upperLidThick: 0.0044,
    upperLidY: 0.0,
    lowerLidY: -0.001,
    baseSlant: 0.12,
    browOffset: -0.005,
    isAngular: true,
    isGoku: true,
  },
  pescado: {
    label: 'Pez / Pescado (Lenticular)',
    scleraScale: [1.30, 0.68, 0.82],
    irisRadius: 0.0088,
    pupilRadius: 0.0042,
    upperLidArc: 0.021,
    upperLidThick: 0.0038,
    upperLidY: 0.001,
    lowerLidY: -0.001,
    baseSlant: 0.02,
    browOffset: 0.0,
    isFish: true,
  },
  rasgado: {
    label: 'Rasgado',
    scleraScale: [1.12, 0.78, 0.82],
    irisRadius: 0.0092,
    pupilRadius: 0.0042,
    upperLidArc: 0.020,
    upperLidThick: 0.0042,
    upperLidY: 0.0005,
    lowerLidY: -0.0008,
    baseSlant: 0.14,
    browOffset: -0.001,
  },
  redondo: {
    label: 'Redondo',
    scleraScale: [1.02, 1.05, 0.88],
    irisRadius: 0.0098,
    pupilRadius: 0.0048,
    upperLidArc: 0.0185,
    upperLidThick: 0.0034,
    upperLidY: 0.004,
    lowerLidY: -0.0035,
    baseSlant: 0.0,
    browOffset: 0.002,
  },
  felino: {
    label: 'Felino',
    scleraScale: [1.14, 0.85, 0.82],
    irisRadius: 0.0096,
    pupilRadius: 0.0044,
    upperLidArc: 0.0195,
    upperLidThick: 0.0039,
    upperLidY: 0.0025,
    lowerLidY: -0.0015,
    baseSlant: 0.22,
    browOffset: 0.003,
  },
  profundo: {
    label: 'Profundo',
    scleraScale: [0.96, 0.88, 0.80],
    irisRadius: 0.0090,
    pupilRadius: 0.0042,
    upperLidArc: 0.0185,
    upperLidThick: 0.0046,
    upperLidY: 0.001,
    lowerLidY: -0.002,
    baseSlant: 0.02,
    browOffset: -0.003,
  },
  caido: {
    label: 'Caído',
    scleraScale: [1.05, 0.94, 0.85],
    irisRadius: 0.0095,
    pupilRadius: 0.0045,
    upperLidArc: 0.019,
    upperLidThick: 0.0036,
    upperLidY: 0.0015,
    lowerLidY: -0.003,
    baseSlant: -0.16,
    browOffset: -0.002,
  },
  anime: {
    label: 'Anime',
    scleraScale: [1.16, 1.18, 0.85],
    irisRadius: 0.0118,
    pupilRadius: 0.0055,
    upperLidArc: 0.021,
    upperLidThick: 0.0042,
    upperLidY: 0.005,
    lowerLidY: -0.004,
    baseSlant: 0.06,
    browOffset: 0.004,
  },
};

/**
 * Crea un material PBR MeshPhysicalMaterial extendido con shaders de ruido procedural
 * para simular microporos de la piel, micro-relieve epidérmico, variación tonal de melanina
 * y ligera calidez capilar (rubor sutil en mejillas y nariz) mejorando el fotorrealismo de la cara.
 */
export function createProceduralFaceSkinMaterial(skinColorHex = '#e8b49a') {
  const material = new THREE.MeshPhysicalMaterial({
    color: skinColorHex,
    roughness: 0.50,
    metalness: 0.02,
    clearcoat: 0.12,
    clearcoatRoughness: 0.52,
    reflectivity: 0.45,
  });

  material.customProgramCacheKey = () => 'proceduralFaceSkin_v2';

  material.userData = {
    uBaseSkinColor: { value: new THREE.Color(skinColorHex) },
    uPoreScale: { value: 210.0 },
    uPoreDepth: { value: 0.85 },
    uMicroRoughness: { value: 0.70 },
    uImperfectionAmount: { value: 0.65 },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBaseSkinColor = material.userData.uBaseSkinColor;
    shader.uniforms.uPoreScale = material.userData.uPoreScale;
    shader.uniforms.uPoreDepth = material.userData.uPoreDepth;
    shader.uniforms.uMicroRoughness = material.userData.uMicroRoughness;
    shader.uniforms.uImperfectionAmount = material.userData.uImperfectionAmount;
    material.userData.shader = shader;

    // 1. Vertex Shader: pasar coordenadas locales del objeto para que el ruido 3D sea continuo
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vFaceLocalPos;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vFaceLocalPos = position;
      `
    );

    // 2. Fragment Shader: Funciones de ruido procedural y perturbación
    const noiseFunctions = `
      varying vec3 vFaceLocalPos;
      uniform vec3 uBaseSkinColor;
      uniform float uPoreScale;
      uniform float uPoreDepth;
      uniform float uMicroRoughness;
      uniform float uImperfectionAmount;

      vec3 skinHash33(vec3 p3) {
        p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yxz + 33.33);
        return fract((p3.xxy + p3.yxx) * p3.zyx);
      }

      float skinWorley(vec3 p) {
        vec3 pi = floor(p);
        vec3 pf = fract(p);
        float minDist = 1.0;
        for (int k = -1; k <= 1; k++) {
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec3 g = vec3(float(i), float(j), float(k));
              vec3 o = skinHash33(pi + g);
              vec3 r = g + o - pf;
              float d = dot(r, r);
              if (d < minDist) minDist = d;
            }
          }
        }
        return sqrt(minDist);
      }

      float skinHash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float skinNoise3D(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = skinHash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = skinHash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = skinHash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = skinHash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = skinHash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = skinHash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = skinHash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = skinHash31(i + vec3(1.0, 1.0, 1.0));
        return mix(
          mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
          mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
          f.z
        );
      }

      float getFaceSkinMask(vec3 pos) {
        float faceZMask = smoothstep(-0.02, 0.04, pos.z);
        float faceYMask = smoothstep(-0.20, -0.06, pos.y);
        return faceZMask * faceYMask;
      }
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      ${noiseFunctions}
      `
    );

    // Color: micro-tonos, rubor capilar y sutil oclusión de poros
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float faceMaskC = getFaceSkinMask(vFaceLocalPos);
      if (faceMaskC > 0.02 && uImperfectionAmount > 0.01) {
        float microTone = skinNoise3D(vFaceLocalPos * 90.0);
        diffuseColor.rgb *= (0.97 + 0.06 * microTone * uImperfectionAmount);

        // Rubor natural suave en pómulos y punta de la nariz
        float cheekL = exp(-pow((vFaceLocalPos.x - 0.052) / 0.028, 2.0));
        float cheekR = exp(-pow((vFaceLocalPos.x + 0.052) / 0.028, 2.0));
        float noseTipBlush = exp(-pow(vFaceLocalPos.x / 0.020, 2.0)) * exp(-pow((vFaceLocalPos.y - 0.01) / 0.025, 2.0));
        float blush = clamp((cheekL + cheekR) * 0.09 + noseTipBlush * 0.11, 0.0, 0.22) * faceMaskC;

        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.10, 0.93, 0.91), blush * uImperfectionAmount);

        if (uPoreDepth > 0.01) {
          vec3 pCoordC = vFaceLocalPos * uPoreScale;
          float cellC = skinWorley(pCoordC);
          float poreOcclusion = smoothstep(0.0, 0.35, cellC);
          diffuseColor.rgb *= (0.93 + 0.07 * poreOcclusion);
        }
      }
      `
    );

    // Rugosidad: mayor rugosidad en depresiones de poros
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      float faceMaskR = getFaceSkinMask(vFaceLocalPos);
      if (faceMaskR > 0.02 && uPoreDepth > 0.01) {
        vec3 pCoordR = vFaceLocalPos * uPoreScale;
        float cellR = skinWorley(pCoordR);
        float poreRough = (1.0 - cellR) * 0.18 * uMicroRoughness * faceMaskR;
        roughnessFactor = clamp(roughnessFactor + poreRough, 0.12, 0.88);
      }
      `
    );

    // Normales: perturbación física mediante derivadas de pantalla estables en view space
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
      float faceMaskN = getFaceSkinMask(vFaceLocalPos);
      if (faceMaskN > 0.02 && uPoreDepth > 0.01) {
        vec3 pCoordN = vFaceLocalPos * uPoreScale;
        float cellN = skinWorley(pCoordN);
        float poreHN = pow(clamp(cellN * 1.25, 0.0, 1.0), 2.2);
        float microBumpN = skinNoise3D(pCoordN * 0.45) * 0.5 + skinNoise3D(pCoordN * 0.95) * 0.25;
        float totalReliefN = (poreHN * 0.70 + microBumpN * 0.30) * uPoreDepth * faceMaskN * 0.003;

        vec3 vSigmaX = dFdx( -vViewPosition );
        vec3 vSigmaY = dFdy( -vViewPosition );
        float lenX = length(vSigmaX);
        float lenY = length(vSigmaY);
        if (lenX > 1e-6 && lenY > 1e-6) {
          vSigmaX /= lenX;
          vSigmaY /= lenY;
          vec3 vN = normal;
          vec3 R1 = cross( vSigmaY, vN );
          vec3 R2 = cross( vN, vSigmaX );
          float fDet = dot( vSigmaX, R1 ) * faceDirection;
          if (abs(fDet) > 1e-6) {
            vec2 dHdxy = vec2( dFdx(totalReliefN), dFdy(totalReliefN) );
            vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
            vec3 perturbedN = abs( fDet ) * normal - vGrad;
            float lenPerturbed = length(perturbedN);
            if (lenPerturbed > 1e-6) {
              normal = perturbedN / lenPerturbed;
            }
          }
        }
      }
      `
    );
  };

  return material;
}

/**
 * Construye una cabeza humana esculpida con cráneo, mandíbula, mentón, arco superciliar,
 * cuencas oculares, ojos con iris/pupila/párpados, cejas, nariz esculpida, labios y orejas.
 */
export function buildSculptedHeadGroup(caraCfg, mats) {
  const headGroup = new THREE.Group();
  headGroup.name = 'headSculpt';

  const faceSkinMat = mats.faceSkin || mats.skin;

  // 1. Cráneo + Máscara Facial mediante deformación matemática de esfera de alta densidad
  const headGeo = new THREE.SphereGeometry(0.125, 48, 48);
  const pos = headGeo.attributes.position;

  const jawW = caraCfg.jawWidth ?? 1.0;
  const chinL = caraCfg.chinLength ?? 1.0;
  const chinY = caraCfg.chinY ?? 1.0;
  const brow = caraCfg.browRidge ?? 1.0;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Normalizar coordenadas aproximadas (-1 a 1)
    const nx = x / 0.125;
    const ny = y / 0.125;
    const nz = z / 0.125;

    // Alargar proporción vertical humana del cráneo
    y *= 1.18;
    // Profundidad craneal anteroposterior
    z *= 1.08;
    // Aplanar ligeramente las sienes laterales
    if (ny > -0.2 && ny < 0.6) {
      x *= 0.90;
    }

    // Parte inferior del rostro: esculpir pómulos, mejillas, mandíbula y mentón con continuidad C1
    if (ny < 0.18) {
      const lowerT = THREE.MathUtils.clamp((0.18 - ny) / 1.18, 0, 1);
      // Máscara suave anteroposterior (evita cortes o roturas en nz = 0 y en el polo inferior)
      const frontBlend = THREE.MathUtils.smoothstep(nz, -0.35, 0.35);

      // Estrechamiento progresivo hacia la rama mandibular y sínfisis mentoniana
      const frontTaperX = THREE.MathUtils.lerp(1.0, 0.56 * jawW, Math.pow(lowerT, 1.12));
      const backTaperX = THREE.MathUtils.lerp(1.0, 0.66, Math.pow(lowerT, 1.2));
      x *= THREE.MathUtils.lerp(backTaperX, frontTaperX, frontBlend);

      // Profundidad craneofacial continua de nuca (-Z) a maxilar/mentón (+Z)
      const backZScale = THREE.MathUtils.lerp(1.0, 0.56, Math.pow(lowerT, 1.2));
      const frontZScale = THREE.MathUtils.lerp(1.02, 0.84, lowerT * 0.65);
      z *= THREE.MathUtils.lerp(backZScale, frontZScale, frontBlend);

      // Recogido occipital suave en la nuca
      const occiputMask = THREE.MathUtils.smoothstep(nz, 0.05, -0.45);
      y += occiputMask * lowerT * 0.018;

      // Deformación acoplada y suave de Mentón (Elevación chinY + Proyección chinLength) y Mandíbula
      const chinElev = chinY - 1.0; // Positivo: sube la barbilla; Negativo: alarga/baja el mentón
      const chinProj = chinL - 1.0; // Positivo: proyecta el mentón hacia adelante

      // 1. Protuberancia mentoniana frontal (punta de la barbilla)
      const chinZMask = THREE.MathUtils.smoothstep(nz, 0.0, 0.52);
      const chinSpot =
        Math.exp(-Math.pow(nx / 0.36, 2)) *
        Math.exp(-Math.pow((ny + 0.78) / 0.28, 2)) *
        chinZMask;

      // Proyección anteroposterior + ligero avance al elevar el mentón
      z += chinSpot * (0.022 * chinL + chinElev * 0.008);

      // Surco mentolabial (hendidura anatómica suave bajo el labio inferior)
      const mentolabial =
        Math.exp(-Math.pow(nx / 0.32, 2)) *
        Math.exp(-Math.pow((ny + 0.48) / 0.11, 2)) *
        chinZMask;
      z -= mentolabial * (0.004 + 0.003 * chinL);

      // 2. Arco mandibular inferior y suelo submentoniano (elevación y proyección sin romper el polo)
      const jawSubmentalMask = THREE.MathUtils.smoothstep(nz, -0.28, 0.35);
      const jawVertMask = THREE.MathUtils.smoothstep(-ny, 0.18, 0.96);
      const jawCenterFocus = 0.42 + 0.58 * Math.exp(-Math.pow(nx / 0.52, 2));
      const jawInfluence = jawSubmentalMask * jawVertMask * jawCenterFocus;

      y += jawInfluence * (chinElev * 0.042 - chinProj * 0.014) - chinSpot * 0.010;
      z += jawInfluence * (chinProj * 0.012 + chinElev * 0.006);

      // 3. Ángulo goníaco de la mandíbula (desvanece suavemente en nx = 0 para no abrir la malla)
      const lateralFade = THREE.MathUtils.smoothstep(Math.abs(nx), 0.05, 0.25);
      const jawCornerZ = THREE.MathUtils.smoothstep(nz, -0.20, 0.28);
      const jawAngle =
        Math.exp(-Math.pow((Math.abs(nx) - 0.55) / 0.25, 2)) *
        Math.exp(-Math.pow((ny + 0.45) / 0.25, 2)) *
        jawCornerZ *
        lateralFade;
      x += Math.sign(x) * jawAngle * 0.013 * jawW;
      y += jawAngle * chinElev * 0.015;
    }

    // Pómulos (cigomáticos) con transición lateral suave
    if (nz > 0.05 && ny > -0.25 && ny < 0.15) {
      const cheekFade = THREE.MathUtils.smoothstep(Math.abs(nx), 0.10, 0.30);
      const cheek =
        Math.exp(-Math.pow((Math.abs(nx) - 0.58) / 0.28, 2)) *
        Math.exp(-Math.pow((ny + 0.04) / 0.18, 2)) *
        cheekFade;
      x += Math.sign(x) * cheek * 0.008;
      z += cheek * 0.010;
    }

    // Arco superciliar (cejas) y cuencas oculares (órbitas)
    if (nz > 0.3) {
      // Hundimiento suave de las cuencas oculares
      const eyeSocketX = Math.exp(-Math.pow((Math.abs(nx) - 0.36) / 0.22, 2));
      const eyeSocketY = Math.exp(-Math.pow((ny - 0.12) / 0.16, 2));
      z -= eyeSocketX * eyeSocketY * 0.016;

      // Prominencia del arco superciliar justo encima de los ojos
      const browY = Math.exp(-Math.pow((ny - 0.30) / 0.11, 2));
      const browX = Math.exp(-Math.pow(nx / 0.65, 2));
      z += browX * browY * 0.012 * brow;
    }

    pos.setXYZ(i, x, y, z);
  }
  headGeo.computeVertexNormals();

  const craniumMesh = new THREE.Mesh(headGeo, faceSkinMat);
  craniumMesh.castShadow = true;
  craniumMesh.receiveShadow = true;
  craniumMesh.position.set(0, 0.11, 0);
  headGroup.add(craniumMesh);

  // 2. Ojos detallados paramétricos según tipo de ojo (Goku SSJ, Pescado/Lenticular, Almendrado, Rasgado, Redondo, etc.)
  const eyeTypeKey = caraCfg.eyeType || 'almendrado';
  const eyeTypeData = EYE_TYPES_DATA[eyeTypeKey] || EYE_TYPES_DATA.almendrado;
  const eyeOpen = caraCfg.eyeOpen ?? 1.0;
  const eyeSlant = caraCfg.eyeSlant ?? 0.0;
  const eyeSquash = caraCfg.eyeSquash ?? 1.0;
  const eyeAspect = caraCfg.eyeAspect ?? 1.0;
  const eyeAngular = caraCfg.eyeAngular ?? (eyeTypeData.isAngular ? 1.0 : 0.0);
  const isGoku = eyeTypeData.isGoku || eyeAngular > 0.45;
  const isFish = eyeTypeData.isFish;

  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const eyePivot = new THREE.Group();
    eyePivot.name = `eye_${i}`;
    eyePivot.position.set(dir * 0.042, 0.125, 0.106);

    // Inclinación canthal combinada (morfología del tipo de ojo + slider libre)
    const totalSlant = dir * (eyeTypeData.baseSlant + eyeSlant * 0.35);
    eyePivot.rotation.z = totalSlant;

    // Globo ocular / Esclerótica adaptada al tipo de ojo con aplastamiento y aspecto rectangular
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.019, 24, 24), mats.eyeWhite);
    sclera.scale.set(
      eyeTypeData.scleraScale[0] * eyeAspect,
      eyeTypeData.scleraScale[1] * (0.45 + 0.55 * eyeOpen) * eyeSquash,
      eyeTypeData.scleraScale[2]
    );
    eyePivot.add(sclera);

    // Iris (con aplastamiento vertical y proporción rectangular en anime/SSJ)
    const iris = new THREE.Mesh(
      new THREE.CircleGeometry(eyeTypeData.irisRadius, isGoku ? 16 : 24),
      mats.eyeIris
    );
    iris.position.set(0, 0, 0.0158);
    iris.scale.set(eyeAspect, eyeSquash * (isGoku ? 0.88 : 1.0), 1.0);
    eyePivot.add(iris);

    // Pupila
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(eyeTypeData.pupilRadius, isGoku ? 12 : 20),
      mats.eyePupil
    );
    pupil.position.set(0, 0, 0.0163);
    pupil.scale.set(eyeAspect, eyeSquash * (isGoku ? 0.88 : 1.0), 1.0);
    eyePivot.add(pupil);

    // Brillo corneal (destello especular blanco)
    const glint = new THREE.Mesh(
      new THREE.CircleGeometry(0.002, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(dir * 0.0028, 0.0028 * eyeSquash, 0.0168);
    eyePivot.add(glint);

    // Párpados y cejas diferenciados: Goku SSJ (angular/rectangular), Pez (lenticular con cúspides) u Orgánico
    if (isGoku) {
      // Párpado superior angular / rectangular Goku SSJ: corte recto trapezoidal
      const upperCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.022 * eyeAspect, -0.003 * eyeSquash, 0.003),
        new THREE.Vector3(-dir * 0.005 * eyeAspect, (0.010 + (eyeOpen - 1.0) * 0.006) * eyeSquash, 0.004),
        new THREE.Vector3(dir * 0.020 * eyeAspect, -0.001 * eyeSquash, 0.003),
      ]);
      const upperLid = new THREE.Mesh(
        new THREE.TubeGeometry(upperCurve, 16, 0.0042, 8, false),
        mats.skin
      );
      upperLid.castShadow = true;
      eyePivot.add(upperLid);

      // Párpado inferior plano y rectangular Goku SSJ
      const lowerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.022 * eyeAspect, -0.003 * eyeSquash, 0.002),
        new THREE.Vector3(0, (-0.008 - (1.0 - eyeOpen) * 0.005) * eyeSquash, 0.0025),
        new THREE.Vector3(dir * 0.020 * eyeAspect, -0.001 * eyeSquash, 0.002),
      ]);
      const lowerLid = new THREE.Mesh(
        new THREE.TubeGeometry(lowerCurve, 16, 0.0034, 8, false),
        mats.skin
      );
      eyePivot.add(lowerLid);

      // Ceja Goku SSJ: angulosa, inclinada hacia el puente nasal, densa y firme
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.025 * eyeAspect, 0.011, 0.012),
        new THREE.Vector3(0, 0.016, 0.017),
        new THREE.Vector3(dir * 0.019 * eyeAspect, 0.003, 0.016),
      ]);
      const browMesh = new THREE.Mesh(
        new THREE.TubeGeometry(browCurve, 16, 0.0046, 8, false),
        mats.hair
      );
      eyePivot.add(browMesh);

    } else if (isFish) {
      // Forma de pez / pescado: lenticular con cúspides puntiagudas en ambas comisuras
      const upperCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.023 * eyeAspect, 0.0, 0.002),
        new THREE.Vector3(0, (0.011 + (eyeOpen - 1.0) * 0.006) * eyeSquash, 0.004),
        new THREE.Vector3(dir * 0.021 * eyeAspect, 0.0, 0.002),
      ]);
      const upperLid = new THREE.Mesh(
        new THREE.TubeGeometry(upperCurve, 16, 0.0038, 8, false),
        faceSkinMat
      );
      eyePivot.add(upperLid);

      const lowerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.023 * eyeAspect, 0.0, 0.002),
        new THREE.Vector3(0, (-0.009 - (1.0 - eyeOpen) * 0.005) * eyeSquash, 0.002),
        new THREE.Vector3(dir * 0.021 * eyeAspect, 0.0, 0.002),
      ]);
      const lowerLid = new THREE.Mesh(
        new THREE.TubeGeometry(lowerCurve, 16, 0.0034, 8, false),
        faceSkinMat
      );
      eyePivot.add(lowerLid);

      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.018 * eyeAspect, 0.018, 0.012),
        new THREE.Vector3(0, 0.023, 0.015),
        new THREE.Vector3(dir * 0.020 * eyeAspect, 0.016, 0.006),
      ]);
      const browMesh = new THREE.Mesh(
        new THREE.TubeGeometry(browCurve, 16, 0.0036, 8, false),
        mats.hair
      );
      eyePivot.add(browMesh);

    } else {
      // Párpados orgánicos suaves (Almendrado, Redondo, Rasgado, Felino, etc.)
      const upperLid = new THREE.Mesh(
        new THREE.TorusGeometry(eyeTypeData.upperLidArc * eyeAspect, eyeTypeData.upperLidThick, 10, 24, Math.PI),
        faceSkinMat
      );
      upperLid.position.set(0, eyeTypeData.upperLidY * (0.35 + 0.65 * eyeOpen) * eyeSquash, 0.003);
      upperLid.rotation.x = -0.22 - (1.0 - eyeOpen) * 0.35;
      upperLid.scale.set(eyeTypeData.scleraScale[0] * eyeAspect, eyeTypeData.scleraScale[1] * eyeSquash, 1.2);
      eyePivot.add(upperLid);

      const lowerLid = new THREE.Mesh(
        new THREE.TorusGeometry(eyeTypeData.upperLidArc * 0.96 * eyeAspect, eyeTypeData.upperLidThick * 0.75, 8, 20, Math.PI),
        faceSkinMat
      );
      lowerLid.position.set(0, eyeTypeData.lowerLidY * (0.35 + 0.65 * eyeOpen) * eyeSquash, 0.002);
      lowerLid.rotation.z = Math.PI;
      lowerLid.rotation.x = 0.25 + (1.0 - eyeOpen) * 0.22;
      lowerLid.scale.set(eyeAspect, eyeSquash, 1.0);
      eyePivot.add(lowerLid);

      const browYOffset = eyeTypeData.browOffset;
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-dir * 0.016 * eyeAspect, 0.018 + browYOffset, 0.012),
        new THREE.Vector3(0, 0.023 + browYOffset * 1.5, 0.015),
        new THREE.Vector3(dir * 0.020 * eyeAspect, 0.016 + browYOffset * 0.6, 0.006),
      ]);
      const browMesh = new THREE.Mesh(
        new THREE.TubeGeometry(browCurve, 16, 0.0036, 8, false),
        mats.hair
      );
      eyePivot.add(browMesh);
    }

    // Conducto y Carúncula Lagrimal Anatómica en el canto medial (hacia el puente nasal)
    const innerCanthusX = -dir * (0.0188 * eyeAspect);
    const innerCanthusY = -0.0012 * eyeSquash;
    const innerCanthusZ = 0.0098;

    const carunculaMat = mats.caruncula || new THREE.MeshPhysicalMaterial({
      color: 0xdf8080,
      roughness: 0.16,
      metalness: 0.0,
      clearcoat: 0.95,
      clearcoatRoughness: 0.10,
      transmission: 0.10,
      ior: 1.38,
    });
    const caruncula = new THREE.Mesh(
      new THREE.SphereGeometry(0.0033, 14, 14),
      carunculaMat
    );
    caruncula.name = `caruncula_${i}`;
    caruncula.position.set(innerCanthusX, innerCanthusY, innerCanthusZ);
    caruncula.scale.set(1.22, 0.88, 0.72);
    caruncula.rotation.y = -dir * 0.22;
    eyePivot.add(caruncula);

    // Micro-reflejo húmedo de película lagrimal (tear film meniscus bead)
    const tearMeniscus = new THREE.Mesh(
      new THREE.SphereGeometry(0.0013, 8, 8),
      mats.eyeWhite
    );
    tearMeniscus.position.set(innerCanthusX + dir * 0.0011, innerCanthusY + 0.0006, innerCanthusZ + 0.0019);
    tearMeniscus.scale.set(1.0, 0.75, 0.5);
    eyePivot.add(tearMeniscus);

    // Pliegue Supratarsal (Eyelid Crease) anatómico natural
    const creaseArcX = 0.0215 * eyeAspect;
    const creaseY = (0.0135 + (eyeOpen - 1.0) * 0.004) * eyeSquash;
    const creaseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-dir * creaseArcX * 0.92, creaseY - 0.0045, 0.0075),
      new THREE.Vector3(-dir * creaseArcX * 0.35, creaseY + 0.0020, 0.0105),
      new THREE.Vector3(dir * creaseArcX * 0.35, creaseY + 0.0015, 0.0100),
      new THREE.Vector3(dir * creaseArcX * 0.92, creaseY - 0.0055, 0.0065),
    ]);
    const creaseMesh = new THREE.Mesh(
      new THREE.TubeGeometry(creaseCurve, 16, 0.0016, 8, false),
      faceSkinMat
    );
    creaseMesh.name = `crease_${i}`;
    creaseMesh.castShadow = true;
    eyePivot.add(creaseMesh);

    headGroup.add(eyePivot);
  }

  // 3. Nariz Anatómica (Puente nasal, Punta globular y Aletas/Narinas)
  const noseGroup = new THREE.Group();
  noseGroup.name = 'nose';
  noseGroup.position.set(0, 0.095, 0.122);

  // Puente de la nariz
  const bridgeProfile = [
    [0.0, 0.014],
    [0.35, 0.012],
    [0.75, 0.009],
    [1.0, 0.007],
  ];
  const bridgeGeo = createAnatomicalLathe(bridgeProfile, 0.048, {
    radialSegments: 20,
    heightSegments: 14,
    scaleX: (t) => THREE.MathUtils.lerp(1.1, 0.75, t),
    scaleZ: (t) => THREE.MathUtils.lerp(1.2, 0.7, t),
    offsetZ: (t) => -t * 0.012,
  });
  const bridgeMesh = new THREE.Mesh(bridgeGeo, faceSkinMat);
  bridgeMesh.position.set(0, -0.008, 0.006);
  bridgeMesh.castShadow = true;
  noseGroup.add(bridgeMesh);

  // Punta de la nariz
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 20, 20), faceSkinMat);
  noseTip.position.set(0, -0.008, 0.014);
  noseTip.scale.set(1.05, 0.9, 1.15);
  noseGroup.add(noseTip);

  // Aletas nasales (izquierda y derecha)
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const nostrilWing = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 16), faceSkinMat);
    nostrilWing.position.set(dir * 0.011, -0.011, 0.006);
    nostrilWing.scale.set(0.95, 0.8, 1.1);
    noseGroup.add(nostrilWing);
  }
  headGroup.add(noseGroup);

  // 3b. Filtrum Nasal y Columnas Philtrales (Philtral columns and sulcus)
  // Conecta anatómicamente la base de la columela nasal con los picos del arco de Cupido
  const philtrumGroup = new THREE.Group();
  philtrumGroup.name = 'philtrum';
  const philtrumBaseY = 0.046 + (chinY - 1.0) * 0.009;

  // Columnas philtrales bilaterales (crestas dérmicas que delimitan el canal)
  for (let c = -1; c <= 1; c += 2) {
    const colSide = c;
    const colCurve = new THREE.CatmullRomCurve3([
      // Inserción subnasal bajo el tabique
      new THREE.Vector3(colSide * 0.0040, 0.0825, 0.1245),
      // Zona media del filtrum
      new THREE.Vector3(colSide * 0.0060, (0.0825 + philtrumBaseY + 0.0045) * 0.52, 0.1235),
      // Inserción inferior en la cresta del arco de Cupido
      new THREE.Vector3(colSide * 0.0088, philtrumBaseY + 0.0048, 0.1215),
    ]);
    const colGeo = new THREE.TubeGeometry(colCurve, 12, 0.0018, 8, false);
    const colMesh = new THREE.Mesh(colGeo, faceSkinMat);
    colMesh.name = `philtralColumn_${colSide > 0 ? 'L' : 'R'}`;
    colMesh.castShadow = true;
    philtrumGroup.add(colMesh);
  }

  // Surco central del filtrum (sulcus philtralis) cóncavo sutil
  const sulcusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0805, 0.1236),
    new THREE.Vector3(0, (0.0805 + philtrumBaseY + 0.0025) * 0.5, 0.1218),
    new THREE.Vector3(0, philtrumBaseY + 0.0028, 0.1205),
  ]);
  const sulcusGeo = new THREE.TubeGeometry(sulcusCurve, 10, 0.0024, 8, false);
  const sulcusMesh = new THREE.Mesh(sulcusGeo, faceSkinMat);
  sulcusMesh.name = 'philtralSulcus';
  sulcusMesh.scale.set(1.35, 1.0, 0.52);
  philtrumGroup.add(sulcusMesh);

  headGroup.add(philtrumGroup);

  // 4. Labios Esculpidos (Arco de Cupido superior y labio inferior carnoso)
  const mouthGroup = new THREE.Group();
  mouthGroup.name = 'mouth';
  mouthGroup.position.set(0, 0.046 + (chinY - 1.0) * 0.009, 0.116);

  const upperLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.026, -0.002, -0.006),
    new THREE.Vector3(-0.009, 0.0045, 0.005),
    new THREE.Vector3(0.0, 0.0025, 0.006),
    new THREE.Vector3(0.009, 0.0045, 0.005),
    new THREE.Vector3(0.026, -0.002, -0.006),
  ]);
  const upperLip = new THREE.Mesh(
    new THREE.TubeGeometry(upperLipCurve, 24, 0.0048, 12, false),
    mats.lips
  );
  upperLip.scale.set(1, 0.9, 1.1);
  mouthGroup.add(upperLip);

  const lowerLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.024, -0.002, -0.006),
    new THREE.Vector3(-0.011, -0.0065, 0.005),
    new THREE.Vector3(0.0, -0.0075, 0.0065),
    new THREE.Vector3(0.011, -0.0065, 0.005),
    new THREE.Vector3(0.024, -0.002, -0.006),
  ]);
  const lowerLip = new THREE.Mesh(
    new THREE.TubeGeometry(lowerLipCurve, 24, 0.0056, 12, false),
    mats.lips
  );
  mouthGroup.add(lowerLip);
  headGroup.add(mouthGroup);

  // 5. Orejas Anatómicas (Pabellón auricular con hélix y lóbulo)
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const earGroup = new THREE.Group();
    earGroup.name = `ear_${i}`;
    earGroup.position.set(dir * 0.114, 0.105, -0.008);
    earGroup.rotation.y = dir * 0.22;
    earGroup.rotation.z = -dir * 0.08;

    // Base del pabellón
    const concha = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 20), faceSkinMat);
    concha.scale.set(0.28, 1.15, 0.72);
    earGroup.add(concha);

    // Reborde del hélix
    const helix = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.0045, 10, 20, Math.PI * 1.35),
      faceSkinMat
    );
    helix.rotation.y = Math.PI / 2;
    helix.rotation.x = dir === 1 ? -0.4 : 0.4;
    helix.scale.set(0.75, 1.25, 0.6);
    earGroup.add(helix);

    headGroup.add(earGroup);
  }

  // 6. Barba Procedural Esculpida (Delimitada estrictamente a mandíbula y mentón anterior, sin invadir la nuca)
  const beardGroup = buildProceduralBeardGroup(caraCfg, mats.beard || mats.hair);
  headGroup.add(beardGroup);

  return headGroup;
}

/**
 * Construye diferentes estilos de barba procedurales adaptadas dinámicamente
 * al mentón y mandíbula, estrictamente confinadas al área anterior (z > 0.01)
 * para evitar por completo que invadan la nuca o detrás de la cabeza.
 */
export function buildProceduralBeardGroup(caraCfg, beardMat) {
  const beardGroup = new THREE.Group();
  beardGroup.name = 'beardGroup';

  const style = caraCfg.beardStyle || 'ninguna';
  if (style === 'ninguna') return beardGroup;

  const jawW = caraCfg.jawWidth ?? 1.0;
  const chinL = caraCfg.chinLength ?? 1.0;
  const chinY = caraCfg.chinY ?? 1.0;
  const bLen = caraCfg.beardLength ?? 1.0;
  const chinElev = chinY - 1.0;
  const chinProj = chinL - 1.0;

  // Altura y profundidad del mentón adaptadas al slider de elevación
  const chinBaseY = 0.015 + chinElev * 0.038;
  const chinBaseZ = 0.118 + chinProj * 0.020;

  // 1. Sombra de barba (3 días / stubble):
  // Rodea suavemente la mandíbula anterior y mentón. Estrictamente z > 0.018. NUNCA cruza hacia la nuca.
  if (style === 'sombra') {
    const pointsCount = 12;
    const curvePoints = [];
    for (let i = 0; i <= pointsCount; i++) {
      const u = i / pointsCount;
      const angle = (u - 0.5) * Math.PI * 0.70; // Arco estrictamente anterior
      const radX = 0.076 * jawW * Math.sin(angle);
      const radZ = 0.082 * Math.cos(angle) + chinProj * 0.014;
      const yPos = chinBaseY + Math.cos(angle * 1.8) * 0.014 - 0.018;
      curvePoints.push(new THREE.Vector3(radX, yPos, Math.max(0.022, radZ)));
    }
    const jawArcCurve = new THREE.CatmullRomCurve3(curvePoints);
    const jawStubble = new THREE.Mesh(
      new THREE.TubeGeometry(jawArcCurve, 24, 0.012 * Math.min(1.4, bLen), 8, false),
      beardMat
    );
    jawStubble.scale.set(1.02, 1.25, 0.45);
    jawStubble.castShadow = true;
    beardGroup.add(jawStubble);

    // Stubble en el mentón anterior
    const chinPatch = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), beardMat);
    chinPatch.position.set(0, chinBaseY - 0.012, chinBaseZ);
    chinPatch.scale.set(0.95 * jawW, 0.82, 0.42);
    beardGroup.add(chinPatch);

    // Stubble de bigote suave sobre el labio superior
    const upperStubble = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.012, 0.010), beardMat);
    upperStubble.position.set(0, 0.052 + chinElev * 0.009, 0.120);
    beardGroup.add(upperStubble);
  }

  // 2. Bigote (Mustache):
  if (style === 'bigote' || style === 'candado' || style === 'completa' || style === 'vikingo' || style === 'barba_corta') {
    for (let i = 0; i < 2; i++) {
      const dir = i === 0 ? 1 : -1;
      const mustacheCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * 0.002, 0.053 + chinElev * 0.009, 0.122),
        new THREE.Vector3(dir * 0.016, 0.049 + chinElev * 0.009, 0.124),
        new THREE.Vector3(dir * 0.034, 0.039 + chinElev * 0.008, 0.112),
      ]);
      const mustacheHalf = new THREE.Mesh(
        new THREE.TubeGeometry(mustacheCurve, 14, 0.0062 * Math.min(1.4, bLen), 8, false),
        beardMat
      );
      mustacheHalf.castShadow = true;
      beardGroup.add(mustacheHalf);
    }
  }

  // 3. Perilla / Goatee:
  if (style === 'perilla' || style === 'candado') {
    // Mechón sublabial (soul patch)
    const soulPatch = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.016, 8), beardMat);
    soulPatch.position.set(0, 0.030 + chinElev * 0.012, 0.121 + chinProj * 0.012);
    soulPatch.rotation.x = -0.3;
    beardGroup.add(soulPatch);

    // Mechón volumétrico de la perilla en el mentón
    const goateeLen = 0.040 * bLen;
    const goateeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, chinBaseY + 0.005, chinBaseZ + 0.005),
      new THREE.Vector3(0, chinBaseY - goateeLen * 0.5, chinBaseZ + 0.008 + chinProj * 0.01),
      new THREE.Vector3(0, chinBaseY - goateeLen, chinBaseZ - 0.005),
    ]);
    const goateeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(goateeCurve, 16, 0.016 * Math.min(1.3, bLen), 10, false),
      beardMat
    );
    goateeMesh.scale.set(1.35 * jawW, 1.0, 0.9);
    goateeMesh.castShadow = true;
    beardGroup.add(goateeMesh);
  }

  // 4. Conectores laterales para estilo Candado (Circle beard):
  if (style === 'candado') {
    for (let i = 0; i < 2; i++) {
      const dir = i === 0 ? 1 : -1;
      const sideCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * 0.030, 0.042 + chinElev * 0.009, 0.114),
        new THREE.Vector3(dir * 0.026, 0.024 + chinElev * 0.012, 0.118),
        new THREE.Vector3(dir * 0.018, chinBaseY + 0.002, chinBaseZ + 0.002),
      ]);
      const sideBar = new THREE.Mesh(
        new THREE.TubeGeometry(sideCurve, 12, 0.0056, 8, false),
        beardMat
      );
      sideBar.castShadow = true;
      beardGroup.add(sideBar);
    }
  }

  // 5. Barba Corta / Completa / Vikingo:
  if (style === 'barba_corta' || style === 'completa' || style === 'vikingo') {
    for (let i = 0; i < 2; i++) {
      const dir = i === 0 ? 1 : -1;
      // Mandíbula y patillas estrictamente por delante de la oreja (z > 0.012)
      const jawCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * 0.092 * jawW, 0.102, 0.014),
        new THREE.Vector3(dir * 0.086 * jawW, 0.052, 0.046),
        new THREE.Vector3(dir * 0.062 * jawW, chinBaseY - 0.004, 0.092),
        new THREE.Vector3(dir * 0.025 * jawW, chinBaseY - 0.012, chinBaseZ * 0.95),
        new THREE.Vector3(0, chinBaseY - 0.015, chinBaseZ),
      ]);

      const jawRadius = style === 'barba_corta' ? 0.009 : 0.014 * Math.min(1.4, bLen);
      const jawMesh = new THREE.Mesh(
        new THREE.TubeGeometry(jawCurve, 20, jawRadius, 8, false),
        beardMat
      );
      jawMesh.castShadow = true;
      beardGroup.add(jawMesh);
    }

    // Volumen anterior del mentón
    const chinTuftGeo = new THREE.SphereGeometry(0.026 * Math.min(1.4, bLen), 16, 16);
    const chinTuft = new THREE.Mesh(chinTuftGeo, beardMat);
    chinTuft.position.set(0, chinBaseY - 0.014, chinBaseZ + 0.004);
    chinTuft.scale.set(1.2 * jawW, 1.1, 0.85);
    chinTuft.castShadow = true;
    beardGroup.add(chinTuft);
  }

  // 6. Vikingo (Barba larga densa que cuelga del mentón):
  if (style === 'vikingo') {
    const vikingLen = 0.098 * bLen;
    for (let i = -1; i <= 1; i++) {
      const xOffset = i * 0.018 * jawW;
      const vCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOffset * 0.8, chinBaseY - 0.010, chinBaseZ),
        new THREE.Vector3(xOffset * 1.1, chinBaseY - vikingLen * 0.45, chinBaseZ + 0.016 + chinProj * 0.02),
        new THREE.Vector3(xOffset * 0.9, chinBaseY - vikingLen * 0.80, chinBaseZ + 0.008),
        new THREE.Vector3(xOffset * 0.3, chinBaseY - vikingLen, chinBaseZ - 0.005),
      ]);
      const vStrand = new THREE.Mesh(
        new THREE.TubeGeometry(vCurve, 20, 0.016 * (1.1 - Math.abs(i) * 0.25), 8, false),
        beardMat
      );
      vStrand.castShadow = true;
      beardGroup.add(vStrand);
    }
  }

  return beardGroup;
}

/**
 * Conforma un punto 3D a la superficie exterior del cráneo para garantizar
 * que los mechones de cabello NUNCA penetren o atraviesen la cabeza,
 * acoplándose anatómicamente a la curvatura craneofacial.
 * Con snapToSurface = true (anclaje antirrotura en raíz), proyecta y asegura la raíz
 * exactamente en la superficie folicular del cuero cabelludo impidiendo que flote en el aire.
 */
export function conformPointToSkull(p, minClearance = 0.008, snapToSurface = false) {
  const cy = 0.11;
  const dy = p.y - cy;

  // Si está por debajo de la mandíbula y cuello (y < 0.06), protege contra penetración en cuello
  if (p.y < 0.06) {
    const neckRadius = 0.063;
    const horizDist = Math.hypot(p.x, p.z);
    const targetNeckDist = neckRadius + minClearance;
    if (horizDist > 0.001) {
      if (snapToSurface || horizDist < targetNeckDist) {
        const scale = targetNeckDist / horizDist;
        p.x *= scale;
        p.z *= scale;
      }
    }
    return p;
  }

  // Dimensiones anatómicas del elipsoide craneal (radio base 0.1255, factor Y 1.18, factor Z 1.05)
  const rx = 0.1255;
  const ry = 0.1255 * 1.18; // ~0.1481
  const rz = 0.1255 * 1.05; // ~0.1318

  const vx = p.x;
  const vy = dy;
  const vz = p.z;
  const distSq = (vx / rx) ** 2 + (vy / ry) ** 2 + (vz / rz) ** 2;
  const dist = Math.sqrt(distSq);

  let surfaceExtra = 0.0;
  if (vz > 0.02) {
    surfaceExtra += 0.006 * (vz / rz); // Relieve frontal y cejas
  }

  const targetDist = 1.0 + (minClearance + surfaceExtra) / rx;

  if (dist > 0.001) {
    if (snapToSurface) {
      // Anclaje antirrotura absoluto: proyecta y asienta la raíz directamente en la superficie folicular
      const snapRatio = targetDist / dist;
      p.x = vx * snapRatio;
      p.y = cy + vy * snapRatio;
      p.z = vz * snapRatio;
    } else if (dist < targetDist) {
      // Acoplamiento conformal anti-penetración para el resto del mechón
      const pushRatio = targetDist / dist;
      p.x = vx * pushRatio;
      p.y = cy + vy * pushRatio;
      p.z = vz * pushRatio;
    }
  }

  return p;
}

/**
 * Crea una geometría de mechón de cabello cónico orgánico (tapered lock)
 * a lo largo de una curva 3D con sección acintada/elíptica y punta afilada.
 * Incorpora anclaje folicular antirrotura en la raíz y acoplamiento conformal a la cabeza.
 */
export function createTaperedStrandGeometry(curve, opts = {}) {
  const {
    segments = 14,
    radialSegments = 8,
    rootRadius = 0.012,
    midRadius = 0.015,
    tipRadius = 0.002,
    flattenX = 1.25,
    flattenZ = 0.80,
    midPoint = 0.35,
    conformToHead = true,
  } = opts;

  let points = curve.getPoints(segments);

  if (conformToHead) {
    const maxClearance = Math.max(rootRadius, midRadius) * Math.max(flattenX, flattenZ) + 0.003;
    for (let i = 0; i < points.length; i++) {
      const t = i / segments;
      // Anclaje antirrotura en raíz (t = 0): tolerancia levemente negativa (-0.002) para empotrar
      // las raíces en el cuero cabelludo sin dejar jamás mechones flotando en el aire.
      // Del 0 al 25% del mechón, la holgura se abre gradualmente hacia el radio del mechón.
      const clr = t < 0.25
        ? THREE.MathUtils.lerp(-0.002, maxClearance, t / 0.25)
        : maxClearance;
      const snapRoot = (i === 0);
      conformPointToSkull(points[i], clr, snapRoot);
    }
    const smoothedCurve = new THREE.CatmullRomCurve3(points);
    points = smoothedCurve.getPoints(segments);
    // Re-asegurar anclaje matemático exacto de la raíz tras la interpolación de la curva
    conformPointToSkull(points[0], -0.002, true);
    curve = smoothedCurve;
  }

  const frames = curve.computeFrenetFrames(segments, false);

  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = points[i];
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // Radio cónico adaptativo: suave hinchazón hacia midRadius y afinamiento gradual hacia la punta
    let r;
    if (t < midPoint) {
      const u = t / midPoint;
      r = THREE.MathUtils.lerp(rootRadius, midRadius, Math.sin(u * Math.PI * 0.5));
    } else {
      const u = (t - midPoint) / (1 - midPoint);
      r = THREE.MathUtils.lerp(midRadius, tipRadius, Math.pow(u, 1.25));
    }

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const nx = cos * flattenX;
      const nz = sin * flattenZ;

      const vx = p.x + (N.x * nx + B.x * nz) * r;
      const vy = p.y + (N.y * nx + B.y * nz) * r;
      const vz = p.z + (N.z * nx + B.z * nz) * r;

      vertices.push(vx, vy, vz);

      const normLen = Math.hypot(nx, nz) || 1;
      normals.push((N.x * nx + B.x * nz) / normLen, (N.y * nx + B.y * nz) / normLen, (N.z * nx + B.z * nz) / normLen);
      uvs.push(j / radialSegments, t);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Cierre de punta aerodinámico (apex)
  const tipApex = points[segments].clone().add(frames.tangents[segments].clone().multiplyScalar(tipRadius * 0.5));
  const apexIdx = vertices.length / 3;
  vertices.push(tipApex.x, tipApex.y, tipApex.z);
  normals.push(frames.tangents[segments].x, frames.tangents[segments].y, frames.tangents[segments].z);
  uvs.push(0.5, 1.0);

  const lastRingStart = segments * stride;
  for (let j = 0; j < radialSegments; j++) {
    indices.push(lastRingStart + j, apexIdx, lastRingStart + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return geo;
}

/**
 * Crea la base anatómica de cuero cabelludo adaptada milimétricamente al cráneo,
 * con contorno de nacimiento natural (frente, sienes, patillas y occipital)
 * y degradado por colores de vértice (vertex colors) para fundir la piel con el pelo.
 */
export function createScalpTransitionGeometry(skinHex, hairHex, hairlineAdj = 1.0) {
  const rings = 28;
  const segments = 48;
  const vertices = [];
  const normals = [];
  const colors = [];
  const blendFactors = [];
  const indices = [];

  const skinColor = new THREE.Color(skinHex || '#e8b49a');
  const hairColor = new THREE.Color(hairHex || '#2c1b12');

  const craniumCenterY = 0.11;
  const baseRadius = 0.1264; // Calce exacto sobre el cráneo sin z-fighting

  for (let r = 0; r <= rings; r++) {
    const u = r / rings; // 0 = coronilla, 1 = borde de nacimiento

    for (let s = 0; s <= segments; s++) {
      const v = s / segments;
      const phi = v * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      let thetaRim = 0.44 * Math.PI;

      if (sinPhi > 0) {
        // Región anterior: frente, entradas y sienes
        const frontMid = Math.pow(Math.max(0, sinPhi), 2.0);
        const templeRecess = Math.pow(Math.abs(cosPhi), 1.8) * Math.sin(phi);
        const hairlineYShift = (hairlineAdj - 1.0) * 0.06;
        thetaRim = (0.355 + hairlineYShift) * Math.PI + frontMid * 0.02 - templeRecess * 0.055;
      } else {
        // Región posterior: occipital y nuca (sin descender al cuello)
        const backMid = Math.pow(Math.max(0, -sinPhi), 1.5);
        thetaRim = (0.425 + backMid * 0.035) * Math.PI;
      }

      // Patillas anteriores en frente de las orejas
      if (Math.abs(cosPhi) > 0.82 && sinPhi > -0.15 && sinPhi < 0.35) {
        const sideburnFactor = Math.pow((Math.abs(cosPhi) - 0.82) / 0.18, 1.4);
        thetaRim += sideburnFactor * 0.065 * Math.PI;
      }

      const theta = u * thetaRim;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      let vx = baseRadius * sinTheta * cosPhi * 0.98;
      let vy = craniumCenterY + baseRadius * cosTheta * 1.18;
      let vz = baseRadius * sinTheta * sinPhi * 1.05;

      if (u > 0.15) {
        const wave = Math.sin(vx * 65) * Math.cos(vz * 65) * 0.0012;
        vx += wave;
        vz += wave;
      }

      vertices.push(vx, vy, vz);

      const dx = vx;
      const dy = vy - craniumCenterY;
      const dz = vz;
      const dlen = Math.hypot(dx, dy, dz) || 1;
      normals.push(dx / dlen, dy / dlen, dz / dlen);

      // Transición progresiva: de hairColor (u < 0.60) a skinColor (u = 1.0)
      const blend = THREE.MathUtils.smoothstep(u, 0.60, 1.0);
      blendFactors.push(blend);

      const c = new THREE.Color().copy(hairColor).lerp(skinColor, blend * 0.90);
      colors.push(c.r, c.g, c.b);
    }
  }

  const stride = segments + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * stride + s;
      const b = (r + 1) * stride + s;
      const c = (r + 1) * stride + (s + 1);
      const d = r * stride + (s + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  geo.userData.blendFactors = blendFactors;
  geo.userData.updateColors = (newSkinHex, newHairHex) => {
    const sCol = new THREE.Color(newSkinHex);
    const hCol = new THREE.Color(newHairHex);
    const colAttr = geo.attributes.color;
    const count = colAttr.count;
    const temp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const b = blendFactors[i];
      temp.copy(hCol).lerp(sCol, b * 0.90);
      colAttr.setXYZ(i, temp.r, temp.g, temp.b);
    }
    colAttr.needsUpdate = true;
  };

  return geo;
}

/**
 * Genera el cabello procedural completo con el doble de densidad de mechones orgánicos,
 * capas volumétricas ricas y acoplamiento conformal que impide que los mechones atraviesen la cabeza.
 */
export function buildProceduralHairGroup(peloCfg, mats, caraCfg = {}, colors = {}) {
  const hairGroup = new THREE.Group();
  hairGroup.name = 'hairGroup';

  const style = peloCfg.style || 'corto';
  const volume = peloCfg.volume ?? 1.0;
  const height = peloCfg.height ?? 1.0;
  const density = peloCfg.density ?? 1.0;
  const hairline = peloCfg.hairline ?? 1.0;

  const hairMat = mats.hair || mats;
  const scalpMat = mats.scalpTransition || mats.hair || mats;
  const skinColor = colors.skin || '#e8b49a';
  const hairColor = colors.hair || '#2c1b12';

  // 1. Casquete anatómico de transición con difuminado suave hacia el tono de piel
  const scalpGeo = createScalpTransitionGeometry(skinColor, hairColor, hairline);
  const scalpMesh = new THREE.Mesh(scalpGeo, scalpMat);
  scalpMesh.name = 'hairScalpTransition';
  scalpMesh.castShadow = true;
  scalpMesh.receiveShadow = true;
  hairGroup.add(scalpMesh);

  // Micro-stubble para peinado rapado (Fade barbershop duplicado en densidad)
  if (style === 'rapado') {
    const fadeStubbleCount = Math.round(72 * density);
    for (let i = 0; i < fadeStubbleCount; i++) {
      const u = (i / fadeStubbleCount) * Math.PI * 2;
      const rx = Math.cos(u) * 0.108;
      const rz = Math.sin(u) * 0.114;
      if (rz < -0.09) continue; // no invadir la nuca
      const stubbleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx, 0.19 + Math.sin(u * 2) * 0.02, rz),
        new THREE.Vector3(rx * 1.025, 0.20 + Math.sin(u * 2) * 0.02, rz * 1.025),
      ]);
      const stubGeo = createTaperedStrandGeometry(stubbleCurve, {
        segments: 4,
        radialSegments: 6,
        rootRadius: 0.003,
        midRadius: 0.0035,
        tipRadius: 0.001,
      });
      const stubMesh = new THREE.Mesh(stubGeo, hairMat);
      hairGroup.add(stubMesh);
    }
    return hairGroup;
  }

  // 2. Mechones de nacimiento de patillas y sienes duplicados (baby hairs / hairline integrators)
  const templeStrandsCount = Math.round(20 * density);
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < templeStrandsCount; i++) {
      const t = i / (templeStrandsCount - 1);
      const startX = side * THREE.MathUtils.lerp(0.062, 0.112, t);
      const startY = THREE.MathUtils.lerp(0.188 - (hairline - 1.0) * 0.015, 0.104, t);
      const startZ = THREE.MathUtils.lerp(0.094, 0.012, t);
      const layerOffset = (i % 2) * 0.004;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, startY, startZ),
        new THREE.Vector3(startX * (1.02 + layerOffset), startY - 0.012 * height, startZ + 0.006 * volume),
        new THREE.Vector3(startX * (1.04 + layerOffset) + side * 0.004, startY - 0.028 * height, startZ + 0.002),
      ]);

      const strandGeo = createTaperedStrandGeometry(curve, {
        segments: 10,
        radialSegments: 6,
        rootRadius: 0.0045,
        midRadius: 0.0065 * volume,
        tipRadius: 0.0015,
        flattenX: 1.3,
        flattenZ: 0.7,
      });
      const strandMesh = new THREE.Mesh(strandGeo, hairMat);
      strandMesh.castShadow = true;
      hairGroup.add(strandMesh);
    }
  }

  // 3. Generación especializada con el doble de mechones por estilo
  if (style === 'corto') {
    // A) Flequillo y frontal texturizado (32 mechones en múltiples capas dinámicas)
    const fringeCount = Math.round(32 * density);
    for (let i = 0; i < fringeCount; i++) {
      const u = (i / (fringeCount - 1)) * 2 - 1; // -1 a 1
      const tier = i % 2; // Capa exterior (0) o interior (1)
      const xSpread = u * 0.082;
      const sag = Math.cos(u * Math.PI * 0.5);
      const wave = Math.sin(i * 1.5) * 0.014;
      const tierZ = tier === 0 ? 0.010 : 0.0;
      const tierY = tier === 0 ? 0.008 : 0.0;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xSpread * 0.65, 0.235 + tierY, 0.045),
        new THREE.Vector3(xSpread * 0.88 + wave, (0.225 + tierY) * height, (0.088 + tierZ) * volume),
        new THREE.Vector3(xSpread + wave * 0.8, (0.185 + tierY) * height + sag * 0.012, (0.118 + tierZ) * volume),
        new THREE.Vector3(xSpread * 1.02 + wave * 0.5, (0.155 + tierY) * height, (0.124 + tierZ) * volume),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 12,
        radialSegments: 8,
        rootRadius: 0.0075,
        midRadius: 0.013 * volume,
        tipRadius: 0.002,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);
    }

    // B) Coronilla y bóveda craneal (44 mechones en vórtice concéntrico)
    const crownCount = Math.round(44 * density);
    for (let i = 0; i < crownCount; i++) {
      const angle = (i / crownCount) * Math.PI * 2;
      const ringTier = i % 3;
      const rad = 0.028 + ringTier * 0.026;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad * 0.88;
      const lift = (0.012 + ringTier * 0.006) * height * (1.0 + Math.sin(angle * 4) * 0.25);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx * 0.35, 0.248, rz * 0.35),
        new THREE.Vector3(rx * 0.85, 0.256 * height + lift, rz * 0.85 + 0.01),
        new THREE.Vector3(rx * 1.38, 0.236 * height, rz * 1.38),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 10,
        radialSegments: 8,
        rootRadius: 0.0085,
        midRadius: 0.015 * volume,
        tipRadius: 0.0025,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);
    }

    // C) Laterales y parte posterior (28 mechones abrazando el cráneo sobre la nuca)
    const backCount = Math.round(28 * density);
    for (let i = 0; i < backCount; i++) {
      const u = (i / (backCount - 1)) * Math.PI * 1.15 + Math.PI * 0.92;
      const tier = i % 2;
      const rx = Math.cos(u) * (0.108 + tier * 0.008);
      const rz = Math.sin(u) * (0.118 + tier * 0.008);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx * 0.6, 0.235, rz * 0.6),
        new THREE.Vector3(rx * 0.95, 0.180 * height, rz * 0.95),
        new THREE.Vector3(rx * 1.05, 0.125 * height, rz * 1.02),
        new THREE.Vector3(rx * 1.08, 0.086 * height, rz * 1.00),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 12,
        radialSegments: 8,
        rootRadius: 0.0085,
        midRadius: 0.014 * volume,
        tipRadius: 0.002,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);
    }
  } else if (style === 'cresta') {
    // Cresta / Spikes dinámicos (44 espinas centrales + 44 de refuerzo lateral)
    const crestSpikes = Math.round(44 * density);
    for (let i = 0; i < crestSpikes; i++) {
      const t = i / (crestSpikes - 1);
      const zPos = THREE.MathUtils.lerp(0.098, -0.098, t);
      const envelope = Math.sin(t * Math.PI);
      const spikeH = (0.022 + envelope * 0.056) * height;
      const lean = (0.5 - t) * 0.020;
      const jitter = ((i % 3) - 1) * 0.004;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(jitter, 0.235, zPos),
        new THREE.Vector3(jitter * 0.5, 0.255 * height + spikeH * 0.6, zPos + lean),
        new THREE.Vector3(0, 0.258 * height + spikeH, zPos + lean * 1.6),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 12,
        radialSegments: 8,
        rootRadius: 0.011,
        midRadius: 0.017 * volume,
        tipRadius: 0.0015,
        flattenX: 0.75,
        flattenZ: 1.35,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);

      // Refuerzo lateral duplicado (44 espinas laterales)
      for (let s = -1; s <= 1; s += 2) {
        const sideCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(s * 0.026, 0.228, zPos),
          new THREE.Vector3(s * 0.018, 0.245 * height + spikeH * 0.45, zPos + lean * 0.8),
          new THREE.Vector3(s * 0.006, 0.255 * height + spikeH * 0.82, zPos + lean * 1.2),
        ]);
        const sideGeo = createTaperedStrandGeometry(sideCurve, {
          segments: 10,
          radialSegments: 6,
          rootRadius: 0.0075,
          midRadius: 0.011 * volume,
          tipRadius: 0.0015,
        });
        const sideMesh = new THREE.Mesh(sideGeo, hairMat);
        sideMesh.castShadow = true;
        hairGroup.add(sideMesh);
      }
    }
  } else if (style === 'medio') {
    // Media Melena Ondulada (72 mechones envolventes + 24 flequillos ondulados)
    const strandCount = Math.round(72 * density);
    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 1.75 + Math.PI * 0.62;
      const tier = i % 2;
      const radScale = tier === 0 ? 1.0 : 1.08;
      const rx = Math.cos(angle) * 0.114 * radScale;
      const rz = Math.sin(angle) * 0.124 * radScale;
      const waveFreq = 2.4 + (i % 4) * 0.4;
      const waveAmp = (0.014 + tier * 0.006) * volume;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx * 0.60, 0.245, rz * 0.60),
        new THREE.Vector3(rx * 0.95 + Math.sin(i * 1.2) * waveAmp, 0.190 * height, rz * 0.95),
        new THREE.Vector3(rx * 1.12 - Math.cos(i * 1.2) * waveAmp, 0.115 * height, rz * 1.05),
        new THREE.Vector3(rx * 1.16 + Math.sin(i * waveFreq) * waveAmp, 0.035 * height, rz * 1.02),
        new THREE.Vector3(rx * 1.08, -0.028 * height, rz * 0.96),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 16,
        radialSegments: 8,
        rootRadius: 0.010,
        midRadius: 0.018 * volume,
        tipRadius: 0.002,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);
    }

    // 24 mechones de flequillo lateral ondulado en capas
    const bangsCount = Math.round(24 * density);
    for (let i = 0; i < bangsCount; i++) {
      const u = (i / (bangsCount - 1)) * 2 - 1;
      const tier = i % 2;
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(u * 0.055, 0.245 + tier * 0.006, 0.045),
        new THREE.Vector3(u * 0.075 + 0.018, (0.205 + tier * 0.006) * height, (0.098 + tier * 0.008) * volume),
        new THREE.Vector3(u * 0.088 + 0.035, (0.155 + tier * 0.006) * height, (0.118 + tier * 0.008) * volume),
        new THREE.Vector3(u * 0.095 + 0.048, 0.108 * height, 0.105 * volume),
      ]);
      const bGeo = createTaperedStrandGeometry(bCurve, {
        segments: 12,
        radialSegments: 8,
        rootRadius: 0.008,
        midRadius: 0.014 * volume,
        tipRadius: 0.002,
      });
      const bMesh = new THREE.Mesh(bGeo, hairMat);
      bMesh.castShadow = true;
      hairGroup.add(bMesh);
    }
  } else if (style === 'largo') {
    // Melena Larga (88 mechones en cascada + 20 frontales envolventes)
    const longCount = Math.round(88 * density);
    for (let i = 0; i < longCount; i++) {
      const angle = (i / longCount) * Math.PI * 1.78 + Math.PI * 0.61;
      const isFront = Math.sin(angle) > 0.08;
      const tier = i % 2;
      const radScale = tier === 0 ? 1.0 : 1.09;
      const rx = Math.cos(angle) * 0.115 * radScale;
      const rz = Math.sin(angle) * 0.125 * radScale;
      const wave = Math.sin(i * 1.4) * (0.014 + tier * 0.005) * volume;

      const dropY = isFront ? -0.165 : -0.190;
      const flare = (isFront ? 1.25 : 1.15) * (tier === 0 ? 1.0 : 1.08);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx * 0.55, 0.245, rz * 0.55),
        new THREE.Vector3(rx * 0.92 + wave, 0.185 * height, rz * 0.92),
        new THREE.Vector3(rx * 1.10 - wave, 0.095 * height, rz * 1.05),
        new THREE.Vector3(rx * flare + wave * 0.8, -0.025 * height, rz * 1.02),
        new THREE.Vector3(rx * (flare + 0.05), dropY * 0.65 * height, rz * 0.98),
        new THREE.Vector3(rx * flare, dropY * height, rz * 0.92),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 18,
        radialSegments: 8,
        rootRadius: 0.010,
        midRadius: 0.019 * volume,
        tipRadius: 0.002,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);
    }

    // 20 mechones delanteros envolventes (face-framing locks)
    for (let side = -1; side <= 1; side += 2) {
      for (let j = 0; j < 10; j++) {
        const xOff = side * (0.048 + j * 0.008);
        const fCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xOff * 0.7, 0.240, 0.055),
          new THREE.Vector3(xOff * 0.95, 0.175 * height, 0.105 * volume),
          new THREE.Vector3(xOff * 1.12, 0.075 * height, 0.118 * volume),
          new THREE.Vector3(xOff * 1.18, -0.045 * height, 0.095 * volume),
          new THREE.Vector3(xOff * 1.14, -0.145 * height, 0.075 * volume),
        ]);
        const fGeo = createTaperedStrandGeometry(fCurve, {
          segments: 16,
          radialSegments: 8,
          rootRadius: 0.008,
          midRadius: 0.015 * volume,
          tipRadius: 0.002,
        });
        const fMesh = new THREE.Mesh(fGeo, hairMat);
        fMesh.castShadow = true;
        hairGroup.add(fMesh);
      }
    }
  } else if (style === 'recogido') {
    // Moño Superior Esculpido (56 mechones tensados hacia el recogido + 16 zarcillos sueltos)
    const sweepCount = Math.round(56 * density);
    const bunCenter = new THREE.Vector3(0, (0.262 + (height - 1.0) * 0.025) * height, -0.065);

    for (let i = 0; i < sweepCount; i++) {
      const angle = (i / sweepCount) * Math.PI * 2;
      const tier = i % 2;
      const rx = Math.cos(angle) * (0.114 + tier * 0.006);
      const rz = Math.sin(angle) * (0.122 + tier * 0.006);
      const isBack = rz < 0;
      const startY = isBack ? 0.102 : 0.162;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx, startY, rz),
        new THREE.Vector3(rx * 0.75, (0.215 + tier * 0.008) * height, rz * 0.75),
        new THREE.Vector3(bunCenter.x + Math.cos(angle) * 0.025, bunCenter.y - 0.008, bunCenter.z + Math.sin(angle) * 0.025),
      ]);

      const geo = createTaperedStrandGeometry(curve, {
        segments: 12,
        radialSegments: 8,
        rootRadius: 0.0075,
        midRadius: 0.012 * volume,
        tipRadius: 0.003,
      });
      const m = new THREE.Mesh(geo, hairMat);
      m.castShadow = true;
      hairGroup.add(m);
    }

    // Moño entrelazado con 4 toros espirales concéntricos
    for (let b = 0; b < 4; b++) {
      const bunTorus = new THREE.Mesh(
        new THREE.TorusGeometry((0.026 + b * 0.010) * volume, 0.010 * volume, 12, 28),
        hairMat
      );
      bunTorus.position.copy(bunCenter);
      bunTorus.position.y += b * 0.007 * height;
      bunTorus.rotation.x = Math.PI * 0.35 + b * 0.22;
      bunTorus.rotation.y = b * 0.75;
      bunTorus.castShadow = true;
      hairGroup.add(bunTorus);
    }

    // 16 mechones sueltos decorativos en sienes y nuca
    for (let side = -1; side <= 1; side += 2) {
      for (let w = 0; w < 8; w++) {
        const wOff = (w - 3.5) * 0.008;
        const wispCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * (0.104 + Math.abs(wOff)), (0.148 + wOff) * height, 0.035),
          new THREE.Vector3(side * 0.116, 0.092 * height, 0.045),
          new THREE.Vector3(side * 0.106, 0.032 * height, 0.030),
        ]);
        const wGeo = createTaperedStrandGeometry(wispCurve, {
          segments: 10,
          radialSegments: 6,
          rootRadius: 0.0038,
          midRadius: 0.0055 * volume,
          tipRadius: 0.0015,
        });
        const wMesh = new THREE.Mesh(wGeo, hairMat);
        wMesh.castShadow = true;
        hairGroup.add(wMesh);
      }
    }
  }

  return hairGroup;
}

/**
 * Construye el Brazo Superior (Deltoides + Bíceps + Tríceps + Húmero) en una sola malla cerrada y continua
 */
export function buildSculptedUpperArmGeometry(side, length, armThick, bicepFactor = 1.0, mDef = 0.6) {
  const dir = side === 'L' ? 1 : -1;
  const topCap = 0.040 * armThick;
  const botCap = 0.016 * armThick;
  const totalH = length + topCap + botCap;

  const profile = [
    [0.0, 0.002],
    [0.06, 0.048 * armThick],
    [0.18, 0.064 * armThick * (0.95 + mDef * 0.12)], // Masa del deltoides
    [0.38, 0.053 * armThick], // Inserción deltoidea
    [0.58, 0.056 * armThick * (0.92 + bicepFactor * 0.10)], // Vientre bicipital/tricipital
    [0.84, 0.045 * armThick], // Tercio distal del brazo
    [0.95, 0.041 * armThick], // Cóndilos del codo
    [1.0, 0.002],
  ];

  const geo = createAnatomicalLathe(profile, totalH, {
    radialSegments: 32,
    heightSegments: 28,
    originAtTop: true,
    scaleX: (t) => THREE.MathUtils.lerp(1.04, 0.94, t),
    scaleZ: (t) => THREE.MathUtils.lerp(0.98, 1.06, t),
    sculptFn: (x, y, z, t, angle) => {
      let dx = 0;
      let dz = 0;

      // 1. Capuchón lateral del Deltoides (hombro redondeado y natural)
      if (t > 0.04 && t < 0.44) {
        const deltEnv = Math.sin(((t - 0.04) / 0.40) * Math.PI);
        if (dir * x > 0) {
          dx += dir * deltEnv * (0.012 + mDef * 0.012) * armThick;
        }
      }

      // 2. Relieve anterior del Bíceps Braquial integrado en la malla
      if (z > 0 && t > 0.30 && t < 0.84) {
        const bicEnv = Math.sin(((t - 0.30) / 0.54) * Math.PI);
        const frontFactor = Math.pow(Math.max(0, Math.sin(angle)), 1.5);
        dz += bicEnv * frontFactor * (0.007 + (bicepFactor - 0.85) * 0.018 + mDef * 0.014) * armThick;
      }

      // 3. Relieve posterior del Tríceps Braquial
      if (z < 0 && t > 0.24 && t < 0.74) {
        const triEnv = Math.sin(((t - 0.24) / 0.50) * Math.PI);
        const backFactor = Math.pow(Math.max(0, -Math.sin(angle)), 1.4);
        dz -= triEnv * backFactor * (0.006 + mDef * 0.012) * armThick;
      }

      return [dx, 0, dz];
    },
  });

  // Desplazar para que y = 0 coincida exactamente con el pivote de rotación del hombro
  geo.translate(0, topCap, 0);
  return geo;
}

/**
 * Construye el Antebrazo (Codo/Olécranon + Braquiorradial + Flexores + Muñeca) en una sola malla continua
 */
export function buildSculptedForearmGeometry(side, length, forearmFactor = 1.0, mDef = 0.6) {
  const dir = side === 'L' ? 1 : -1;
  const topCap = 0.022 * forearmFactor;
  const botCap = 0.010 * forearmFactor;
  const totalH = length + topCap + botCap;

  const profile = [
    [0.0, 0.002],
    [0.07, 0.041 * forearmFactor], // Articulación del codo cerrada
    [0.26, 0.050 * forearmFactor * (0.95 + mDef * 0.12)], // Músculos braquiorradial y pronador
    [0.56, 0.040 * forearmFactor], // Zona media del antebrazo
    [0.86, 0.030 * forearmFactor], // Transición hacia la muñeca
    [0.95, 0.028 * forearmFactor], // Muñeca
    [1.0, 0.002],
  ];

  const geo = createAnatomicalLathe(profile, totalH, {
    radialSegments: 28,
    heightSegments: 24,
    originAtTop: true,
    // Transición suave de sección elíptica para casar con la palma de la mano en la muñeca
    scaleX: (t) => THREE.MathUtils.lerp(0.95, 0.68, t),
    scaleZ: (t) => THREE.MathUtils.lerp(1.04, 1.06, t),
    sculptFn: (x, y, z, t) => {
      let dx = 0;
      let dz = 0;
      if (t > 0.10 && t < 0.58) {
        const forearmEnv = Math.sin(((t - 0.10) / 0.48) * Math.PI);
        if (dir * x > 0) {
          dx += dir * forearmEnv * (0.004 + mDef * 0.006) * forearmFactor;
        }
        if (z < 0) {
          dz -= forearmEnv * 0.004 * forearmFactor;
        }
      }
      return [dx, 0, dz];
    },
  });

  geo.translate(0, topCap, 0);
  return geo;
}

/**
 * Construye una mano articulada procedural (Palma cerrada, 4 dedos segmentados y pulgar oponible)
 */
export function buildHandGroup(side, skinMat, fistCurl = 0.12) {
  const dir = side === 'L' ? 1 : -1;
  const handGroup = new THREE.Group();
  handGroup.name = `hand_${side}`;

  // Palma esculpida (metacarpo) con extremos redondeados cerrados
  const palmProfile = [
    [0.0, 0.002],
    [0.08, 0.027],
    [0.35, 0.035],
    [0.82, 0.037],
    [0.95, 0.031],
    [1.0, 0.002],
  ];
  const palmGeo = createAnatomicalLathe(palmProfile, 0.082, {
    radialSegments: 22,
    heightSegments: 14,
    originAtTop: true,
    scaleX: () => 0.56,
    scaleZ: () => 1.08,
  });
  palmGeo.translate(0, 0.008, 0);
  const palmMesh = new THREE.Mesh(palmGeo, skinMat);
  palmMesh.castShadow = true;
  palmMesh.receiveShadow = true;
  handGroup.add(palmMesh);

  // 4 Dedos (Índice, Medio, Anular, Meñique) orientados naturalmente hacia la palma interior (-dir * X)
  const fingerConfigs = [
    { zOffset: 0.023, len: 0.056, r: 0.0070 },
    { zOffset: 0.008, len: 0.062, r: 0.0074 },
    { zOffset: -0.008, len: 0.057, r: 0.0070 },
    { zOffset: -0.022, len: 0.046, r: 0.0062 },
  ];

  fingerConfigs.forEach((f) => {
    const fingerPivot = new THREE.Group();
    fingerPivot.position.set(0, -0.068, f.zOffset);
    fingerPivot.rotation.z = -dir * (0.08 + fistCurl * 0.92);

    const phalanx1 = new THREE.Mesh(
      new THREE.CapsuleGeometry(f.r, f.len * 0.45, 6, 12),
      skinMat
    );
    phalanx1.position.y = -f.len * 0.24;
    phalanx1.castShadow = true;
    fingerPivot.add(phalanx1);

    const distalPivot = new THREE.Group();
    distalPivot.position.set(0, -f.len * 0.48, 0);
    distalPivot.rotation.z = -dir * (0.10 + fistCurl * 1.05);

    const phalanx2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(f.r * 0.85, f.len * 0.40, 6, 12),
      skinMat
    );
    phalanx2.position.y = -f.len * 0.21;
    phalanx2.castShadow = true;
    distalPivot.add(phalanx2);

    fingerPivot.add(distalPivot);
    handGroup.add(fingerPivot);
  });

  // Pulgar oponible en el borde radial anterior (+Z)
  const thumbPivot = new THREE.Group();
  thumbPivot.position.set(-dir * 0.008, -0.028, 0.032);
  thumbPivot.rotation.x = 0.48;
  thumbPivot.rotation.z = -dir * (0.18 + fistCurl * 0.55);

  const thumbMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0082, 0.036, 6, 12),
    skinMat
  );
  thumbMesh.position.y = -0.020;
  thumbMesh.castShadow = true;
  thumbPivot.add(thumbMesh);
  handGroup.add(thumbPivot);

  return handGroup;
}

/**
 * Construye un pie anatómico procedural (Tobillo/Maléolos, Talón, Empeine/Arco plantar y Dedos)
 * Su planta descansa exactamente en y = -0.068 respecto al pivote del tobillo
 */
export function buildFootGroup(side, skinMat) {
  const dir = side === 'L' ? 1 : -1;
  const footGroup = new THREE.Group();
  footGroup.name = `foot_${side}`;

  // Maléolos del tobillo
  const ankleJoint = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 20), skinMat);
  ankleJoint.scale.set(1.05, 0.85, 1.0);
  footGroup.add(ankleJoint);

  // Cuerpo del pie esculpido desde el talón hasta el metatarso
  const footLen = 0.21;
  const footProfile = [
    [0.0, 0.015],
    [0.12, 0.038], // Talón (calcáneo)
    [0.45, 0.036], // Arco medio
    [0.78, 0.046], // Metatarso / bola del pie
    [0.95, 0.038], // Punta de dedos
    [1.0, 0.012],
  ];

  const footGeo = createAnatomicalLathe(footProfile, footLen, {
    radialSegments: 28,
    heightSegments: 20,
    originAtTop: false,
    scaleX: (t) => THREE.MathUtils.lerp(0.85, 1.18, t),
    scaleZ: (t) => THREE.MathUtils.lerp(0.95, 0.52, t),
    sculptFn: (x, y, z, t) => {
      // Aplanar la planta del pie (z < 0 tras rotar)
      let dz = 0;
      if (z < -0.018) {
        dz = -0.018 - z;
      }
      // Arco plantar interno
      if (t > 0.3 && t < 0.65 && dir * x < 0 && z < 0) {
        dz += 0.006;
      }
      return [0, 0, dz];
    },
  });

  // Orientar el pie hacia adelante (+Z) y con la planta plana abajo (-Y)
  footGeo.rotateX(Math.PI / 2);
  const footMesh = new THREE.Mesh(footGeo, skinMat);
  footMesh.position.set(0, -0.044, -0.045);
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  footGroup.add(footMesh);

  // 5 Dedos del pie (del dedo gordo al quinto dedo)
  for (let i = 0; i < 5; i++) {
    const u = i / 4; // 0 = dedo gordo interno, 1 = dedo pequeño externo
    const toeX = -dir * 0.026 + dir * u * 0.054;
    const toeZ = 0.158 - u * 0.022;
    const toeR = THREE.MathUtils.lerp(0.0105, 0.006, u);

    const toe = new THREE.Mesh(new THREE.SphereGeometry(toeR, 14, 14), skinMat);
    toe.scale.set(0.92, 0.72, 1.35);
    toe.position.set(toeX, -0.054, toeZ);
    toe.castShadow = true;
    footGroup.add(toe);
  }

  return footGroup;
}
