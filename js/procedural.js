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

  // Perfil base [t de pelvis (0) a base de cuello (1), radio base]
  const profile = [
    [0.0, 0.04],
    [0.08, 0.155 * hw],  // Base pélvica / pubis
    [0.20, 0.175 * hw],  // Caderas / cresta ilíaca
    [0.38, 0.142 * ww],  // Cintura estrecha (umbilical)
    [0.56, 0.168 * ((ww + cw) * 0.5)], // Costillas inferiores / serratos
    [0.78, 0.198 * cw],  // Pecho / dorsal ancho (máxima anchura)
    [0.92, 0.175 * cw],  // Zona clavicular superior
    [0.98, 0.085 * torsoCfg.neckWidth], // Transición al cuello
    [1.0, 0.02],
  ];

  const geo = createAnatomicalLathe(profile, h, {
    radialSegments: 48,
    heightSegments: 40,
    originAtTop: false,
    // El torso humano es más ancho en X que profundo en Z
    scaleX: (t) => {
      const shoulderFlare = Math.pow(Math.sin(Math.min(1, Math.max(0, (t - 0.35) / 0.55)) * Math.PI * 0.5), 1.4) * 0.18;
      return 1.15 + shoulderFlare;
    },
    scaleZ: (t) => {
      // Más plano en la pelvis y más profundo en la caja torácica
      const ribDepth = t > 0.5 ? 0.76 * cd : 0.68 * THREE.MathUtils.lerp(1, cd, 0.6);
      return ribDepth;
    },
    offsetZ: (t) => {
      // Curva lordosis/cifosis sutil de la columna humana (pecho ligeramente proyectado hacia delante)
      return Math.sin(t * Math.PI) * 0.015;
    },
    sculptFn: (x, y, z, t, angle) => {
      let dx = 0;
      let dy = 0;
      let dz = 0;

      const absX = Math.abs(x);
      // 1. Surco central frontal (Línea Alba / Esternón) y posterior (Columna vertebral)
      if (z > 0 && t > 0.25 && t < 0.88) {
        // Hendidura del esternón y línea alba
        const midline = Math.exp(-Math.pow(absX / 0.032, 2));
        dz -= midline * (0.008 + mDef * 0.014);
      } else if (z < 0 && t > 0.18 && t < 0.92) {
        // Surco espinal en la espalda
        const spineGroove = Math.exp(-Math.pow(absX / 0.035, 2));
        dz += spineGroove * (0.012 + mDef * 0.014);
      }

      // 2. Expansión de los dorsales (Latissimus Dorsi) en los laterales medios-altos
      if (t > 0.45 && t < 0.85) {
        const latFactor = Math.sin(((t - 0.45) / 0.4) * Math.PI);
        const sideFactor = Math.pow(Math.cos(angle), 2);
        dx += Math.sign(x) * latFactor * sideFactor * (0.01 + mDef * 0.025);
      }

      return [dx, dy, dz];
    },
  });

  // Centrar verticalmente de modo que y=0 sea la cintura/centro del torso
  geo.translate(0, -h * 0.5, 0);
  return geo;
}

/**
 * Construye una cabeza humana esculpida con cráneo, mandíbula, mentón, arco superciliar,
 * cuencas oculares, ojos con iris/pupila/párpados, cejas, nariz esculpida, labios y orejas.
 */
export function buildSculptedHeadGroup(caraCfg, mats) {
  const headGroup = new THREE.Group();
  headGroup.name = 'headSculpt';

  // 1. Cráneo + Máscara Facial mediante deformación matemática de esfera de alta densidad
  const headGeo = new THREE.SphereGeometry(0.125, 48, 48);
  const pos = headGeo.attributes.position;

  const jawW = caraCfg.jawWidth ?? 1.0;
  const chinL = caraCfg.chinLength ?? 1.0;
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

    // Parte inferior del rostro: esculpir pómulos, mejillas, mandíbula y mentón
    if (ny < 0.15) {
      const lowerT = THREE.MathUtils.clamp((0.15 - ny) / 1.15, 0, 1);
      // Estrechamiento hacia la mandíbula y barbilla
      const taperX = THREE.MathUtils.lerp(1.0, 0.58 * jawW, Math.pow(lowerT, 1.15));
      x *= taperX;

      // En la parte trasera inferior (nuca/occipital), recoger hacia el cuello
      if (nz < 0) {
        z *= THREE.MathUtils.lerp(1.0, 0.55, Math.pow(lowerT, 1.2));
        y += lowerT * 0.018;
      } else {
        // Proyección facial frontal (maxilar y mentón)
        z *= THREE.MathUtils.lerp(1.02, 0.82, lowerT * 0.7);
        // Proyección del mentón en el centro inferior frontal
        const chinCenter = Math.exp(-Math.pow(nx / 0.38, 2)) * Math.exp(-Math.pow((ny + 0.82) / 0.28, 2));
        z += chinCenter * 0.022 * chinL;
        y -= chinCenter * 0.016 * chinL;

        // Ángulo goníaco de la mandíbula a los lados
        const jawAngle = Math.exp(-Math.pow((Math.abs(nx) - 0.55) / 0.25, 2)) * Math.exp(-Math.pow((ny + 0.45) / 0.25, 2));
        x += Math.sign(x) * jawAngle * 0.012 * jawW;
      }
    }

    // Pómulos (cigomáticos)
    if (nz > 0.1 && ny > -0.25 && ny < 0.15) {
      const cheek = Math.exp(-Math.pow((Math.abs(nx) - 0.58) / 0.28, 2)) * Math.exp(-Math.pow((ny + 0.04) / 0.18, 2));
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

  const craniumMesh = new THREE.Mesh(headGeo, mats.skin);
  craniumMesh.castShadow = true;
  craniumMesh.receiveShadow = true;
  craniumMesh.position.set(0, 0.11, 0);
  headGroup.add(craniumMesh);

  // 2. Ojos detallados (Esclerótica, Iris, Pupila, Reflejo Corneal, Párpados y Cejas)
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const eyePivot = new THREE.Group();
    eyePivot.name = `eye_${i}`;
    eyePivot.position.set(dir * 0.042, 0.125, 0.106);

    // Globo ocular
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.019, 24, 24), mats.eyeWhite);
    sclera.scale.set(1.0, 0.92, 0.85);
    eyePivot.add(sclera);

    // Iris
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.0095, 24), mats.eyeIris);
    iris.position.set(0, 0, 0.0158);
    eyePivot.add(iris);

    // Pupila
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 20), mats.eyePupil);
    pupil.position.set(0, 0, 0.0163);
    eyePivot.add(pupil);

    // Brillo corneal
    const glint = new THREE.Mesh(
      new THREE.CircleGeometry(0.002, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(dir * 0.0028, 0.0028, 0.0168);
    eyePivot.add(glint);

    // Párpado superior esculpido
    const upperLid = new THREE.Mesh(
      new THREE.TorusGeometry(0.019, 0.0038, 10, 24, Math.PI),
      mats.skin
    );
    upperLid.position.set(0, 0.002, 0.003);
    upperLid.rotation.x = -0.22;
    upperLid.scale.set(1.05, 0.9, 1.2);
    eyePivot.add(upperLid);

    // Párpado inferior
    const lowerLid = new THREE.Mesh(
      new THREE.TorusGeometry(0.0185, 0.0026, 8, 20, Math.PI),
      mats.skin
    );
    lowerLid.position.set(0, -0.002, 0.002);
    lowerLid.rotation.z = Math.PI;
    lowerLid.rotation.x = 0.25;
    eyePivot.add(lowerLid);

    // Ceja procedural con TubeGeometry
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-dir * 0.016, 0.018, 0.012),
      new THREE.Vector3(0, 0.023, 0.015),
      new THREE.Vector3(dir * 0.020, 0.016, 0.006),
    ]);
    const browMesh = new THREE.Mesh(
      new THREE.TubeGeometry(browCurve, 16, 0.0036, 8, false),
      mats.hair
    );
    eyePivot.add(browMesh);

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
  const bridgeMesh = new THREE.Mesh(bridgeGeo, mats.skin);
  bridgeMesh.position.set(0, -0.008, 0.006);
  bridgeMesh.castShadow = true;
  noseGroup.add(bridgeMesh);

  // Punta de la nariz
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 20, 20), mats.skin);
  noseTip.position.set(0, -0.008, 0.014);
  noseTip.scale.set(1.05, 0.9, 1.15);
  noseGroup.add(noseTip);

  // Aletas nasales (izquierda y derecha)
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? 1 : -1;
    const nostrilWing = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 16), mats.skin);
    nostrilWing.position.set(dir * 0.011, -0.011, 0.006);
    nostrilWing.scale.set(0.95, 0.8, 1.1);
    noseGroup.add(nostrilWing);
  }
  headGroup.add(noseGroup);

  // 4. Labios Esculpidos (Arco de Cupido superior y labio inferior carnoso)
  const mouthGroup = new THREE.Group();
  mouthGroup.name = 'mouth';
  mouthGroup.position.set(0, 0.046, 0.116);

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
    const concha = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 20), mats.skin);
    concha.scale.set(0.28, 1.15, 0.72);
    earGroup.add(concha);

    // Reborde del hélix
    const helix = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.0045, 10, 20, Math.PI * 1.35),
      mats.skin
    );
    helix.rotation.y = Math.PI / 2;
    helix.rotation.x = dir === 1 ? -0.4 : 0.4;
    helix.scale.set(0.75, 1.25, 0.6);
    earGroup.add(helix);

    headGroup.add(earGroup);
  }

  return headGroup;
}

/**
 * Genera el cabello procedural según el estilo seleccionado ('corto', 'medio', 'cresta', 'largo', 'recogido', 'rapado')
 */
export function buildProceduralHairGroup(peloCfg, hairMat) {
  const hairGroup = new THREE.Group();
  hairGroup.name = 'hairGroup';

  const style = peloCfg.style || 'corto';
  if (style === 'rapado') {
    return hairGroup;
  }

  // Casquete craneal base esculpido
  const capGeo = new THREE.SphereGeometry(0.131, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const pos = capGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    y *= 1.18;
    z *= 1.10;
    x *= 0.94;

    // Recorte frontal para despejar la frente y las patillas
    if (z > 0.03 && y < 0.065) {
      y += (0.065 - y) * 0.75;
    }
    // Ondulación orgánica de mechones
    const wave = Math.sin(x * 45) * Math.cos(z * 45) * 0.003;
    x += wave;
    z += wave;
    pos.setXYZ(i, x, y, z);
  }
  capGeo.computeVertexNormals();

  const capMesh = new THREE.Mesh(capGeo, hairMat);
  capMesh.position.set(0, 0.114, -0.006);
  capMesh.castShadow = true;
  hairGroup.add(capMesh);

  // Mechones superiores / flequillo según el estilo
  if (style === 'corto' || style === 'cresta') {
    const crestCount = style === 'cresta' ? 9 : 7;
    const crestHeight = style === 'cresta' ? 0.048 : 0.022;
    for (let i = 0; i < crestCount; i++) {
      const u = (i / (crestCount - 1)) * 2 - 1; // -1 a 1
      const isCrest = style === 'cresta';
      const xSpread = isCrest ? u * 0.028 : u * 0.065;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xSpread * 0.7, 0.24, -0.02),
        new THREE.Vector3(xSpread * 0.9, 0.255 + crestHeight * (1 - Math.abs(u) * 0.4), 0.05),
        new THREE.Vector3(xSpread, 0.225 + crestHeight * 0.5, 0.115),
      ]);
      const strand = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 16, isCrest ? 0.018 : 0.015, 10, false),
        hairMat
      );
      strand.scale.set(1.2, 0.85, 1.0);
      strand.castShadow = true;
      hairGroup.add(strand);
    }
  } else if (style === 'medio' || style === 'largo') {
    const isLong = style === 'largo';
    const strandCount = 18;
    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 1.45 + Math.PI * 0.78; // rodea laterales y nuca
      const rx = Math.cos(angle) * 0.112;
      const rz = Math.sin(angle) * 0.125;
      const dropY = isLong ? -0.14 : -0.02;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx * 0.65, 0.24, rz * 0.65),
        new THREE.Vector3(rx * 1.05, 0.16, rz * 1.02),
        new THREE.Vector3(rx * 1.12, 0.06 + dropY * 0.4, rz * 1.05),
        new THREE.Vector3(rx * (isLong ? 1.18 : 1.02), dropY, rz * 0.98),
      ]);
      const strand = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 20, isLong ? 0.022 : 0.019, 10, false),
        hairMat
      );
      strand.castShadow = true;
      hairGroup.add(strand);
    }
  } else if (style === 'recogido') {
    // Moño superior esculpido
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.048, 24, 24), hairMat);
    bun.position.set(0, 0.255, -0.085);
    bun.scale.set(1.0, 0.9, 1.1);
    bun.castShadow = true;
    hairGroup.add(bun);
  }

  return hairGroup;
}

/**
 * Construye una mano articulada procedural (Palma, 4 dedos segmentados y pulgar oponible)
 */
export function buildHandGroup(side, skinMat, fistCurl = 0.2) {
  const dir = side === 'L' ? 1 : -1;
  const handGroup = new THREE.Group();
  handGroup.name = `hand_${side}`;

  // Palma esculpida (metacarpo)
  const palmProfile = [
    [0.0, 0.026],
    [0.3, 0.036],
    [0.8, 0.038],
    [1.0, 0.032],
  ];
  const palmGeo = createAnatomicalLathe(palmProfile, 0.075, {
    radialSegments: 20,
    heightSegments: 12,
    originAtTop: true,
    scaleX: () => 0.48,
    scaleZ: () => 1.12,
  });
  const palmMesh = new THREE.Mesh(palmGeo, skinMat);
  palmMesh.castShadow = true;
  handGroup.add(palmMesh);

  // 4 Dedos (Índice, Medio, Anular, Meñique)
  const fingerConfigs = [
    { zOffset: 0.024, len: 0.058, r: 0.0072 },
    { zOffset: 0.008, len: 0.064, r: 0.0076 },
    { zOffset: -0.008, len: 0.059, r: 0.0072 },
    { zOffset: -0.023, len: 0.048, r: 0.0064 },
  ];

  fingerConfigs.forEach((f) => {
    const fingerPivot = new THREE.Group();
    fingerPivot.position.set(0, -0.072, f.zOffset);
    fingerPivot.rotation.z = -dir * (0.22 + fistCurl * 0.95);

    const phalanx1 = new THREE.Mesh(
      new THREE.CapsuleGeometry(f.r, f.len * 0.45, 6, 12),
      skinMat
    );
    phalanx1.position.y = -f.len * 0.25;
    fingerPivot.add(phalanx1);

    const distalPivot = new THREE.Group();
    distalPivot.position.set(0, -f.len * 0.5, 0);
    distalPivot.rotation.z = -dir * (0.28 + fistCurl * 1.1);

    const phalanx2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(f.r * 0.85, f.len * 0.4, 6, 12),
      skinMat
    );
    phalanx2.position.y = -f.len * 0.22;
    distalPivot.add(phalanx2);

    fingerPivot.add(distalPivot);
    handGroup.add(fingerPivot);
  });

  // Pulgar oponible
  const thumbPivot = new THREE.Group();
  thumbPivot.position.set(-dir * 0.012, -0.032, 0.034);
  thumbPivot.rotation.x = 0.55;
  thumbPivot.rotation.z = -dir * (0.35 + fistCurl * 0.6);

  const thumbMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0085, 0.038, 6, 12),
    skinMat
  );
  thumbMesh.position.y = -0.022;
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
