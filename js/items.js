import * as THREE from 'three';
import { createAnatomicalLathe } from './procedural.js';

/**
 * Poses base de Rigging y Escultura
 * Pose A (45°) es la más recomendada en motores de videojuegos (Unreal/Unity)
 * porque evita el pellizco extremo del deltoides al animar hombros hacia abajo o arriba.
 */
export const POSES = {
  apose: {
    label: 'Pose A (55° · Óptima para Animar)',
    pelvisPos: [0, 0, 0],
    pelvisRot: [0, 0, 0],
    torsoRot: [0, 0, 0],
    neckRot: [0, 0, 0],
    head: [0, 0, 0],
    shoulderL: [0.0, 0.0, 0.64], // Abducción hacia afuera (+Z para brazo izquierdo en +X)
    shoulderR: [0.0, 0.0, -0.64], // Abducción hacia afuera (-Z para brazo derecho en -X)
    elbowL: [-0.10, 0, -0.05],
    elbowR: [-0.10, 0, 0.05],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [0.0, 0, 0.04],
    hipR: [0.0, 0, -0.04],
    kneeL: [0.04, 0, 0],
    kneeR: [0.04, 0, 0],
    ankleL: [-0.04, 0, 0],
    ankleR: [-0.04, 0, 0],
    fistCurl: 0.10,
  },
  tpose: {
    label: 'Pose T (90° · Estándar Rigging)',
    pelvisPos: [0, 0, 0],
    pelvisRot: [0, 0, 0],
    torsoRot: [0, 0, 0],
    neckRot: [0, 0, 0],
    head: [0, 0, 0],
    shoulderL: [0, 0, Math.PI / 2 - 0.03],
    shoulderR: [0, 0, -Math.PI / 2 + 0.03],
    elbowL: [0, 0, 0],
    elbowR: [0, 0, 0],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [0, 0, 0.03],
    hipR: [0, 0, -0.03],
    kneeL: [0, 0, 0],
    kneeR: [0, 0, 0],
    ankleL: [0, 0, 0],
    ankleR: [0, 0, 0],
    fistCurl: 0.02,
  },
  neutral: {
    label: 'Pose Relajada de Estudio',
    pelvisPos: [0, 0, 0],
    pelvisRot: [0, 0, 0],
    torsoRot: [0, 0, 0],
    neckRot: [0, 0, 0],
    head: [0, 0, 0],
    shoulderL: [0.02, 0, 0.28],
    shoulderR: [0.02, 0, -0.28],
    elbowL: [-0.18, 0, -0.04],
    elbowR: [-0.18, 0, 0.04],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [0.02, 0, 0.04],
    hipR: [0.02, 0, -0.04],
    kneeL: [0.06, 0, 0],
    kneeR: [0.06, 0, 0],
    ankleL: [-0.06, 0, 0],
    ankleR: [-0.06, 0, 0],
    fistCurl: 0.16,
  },
  doble_biceps: {
    label: 'Doble Bíceps Frontal (Culturismo)',
    pelvisPos: [0, 0, 0],
    pelvisRot: [0, 0, 0],
    torsoRot: [-0.04, 0, 0],
    neckRot: [0, 0, 0],
    head: [0.04, 0, 0],
    shoulderL: [0.08, 0.12, 1.48],
    shoulderR: [0.08, -0.12, -1.48],
    elbowL: [-0.15, 0, 1.82],
    elbowR: [-0.15, 0, -1.82],
    wristL: [0, 0, 0.22],
    wristR: [0, 0, -0.22],
    hipL: [-0.04, 0.08, 0.08],
    hipR: [0.04, -0.08, -0.08],
    kneeL: [0.10, 0, 0],
    kneeR: [0.08, 0, 0],
    ankleL: [-0.08, 0, 0],
    ankleR: [-0.10, 0, 0],
    fistCurl: 0.88,
  },
};

/**
 * Catálogo completo de Animaciones de Videojuegos (Locomoción, Combate, Natación y Skills Definitivas)
 */
export const GAME_ANIMATIONS = {
  none: {
    name: 'Sin Animación (Pose Fija A/T)',
    category: 'Bind Pose',
    duration: 1.0,
  },
  idle: {
    name: 'Idle / Respiración Activa',
    category: 'Locomoción',
    duration: 2.4,
  },
  walk: {
    name: 'Andar (Walk Cycle)',
    category: 'Locomoción',
    duration: 1.1,
  },
  run: {
    name: 'Correr / Sprint (Run Cycle)',
    category: 'Locomoción',
    duration: 0.68,
  },
  jump: {
    name: 'Saltar y Aterrizar (Jump)',
    category: 'Locomoción',
    duration: 1.35,
  },
  crouch: {
    name: 'Sigilo / Agachado (Stealth)',
    category: 'Locomoción',
    duration: 1.25,
  },
  swim: {
    name: 'Nadar (Estilo Crol)',
    category: 'Acuático',
    duration: 1.5,
  },
  punch: {
    name: 'Golpear: Combo (Jab + Cross + Gancho)',
    category: 'Combate',
    duration: 1.5,
  },
  kick: {
    name: 'Patada de Combate (High Kick)',
    category: 'Combate',
    duration: 1.2,
  },
  dodge: {
    name: 'Esquiva / Evasión Rápida',
    category: 'Combate',
    duration: 1.0,
  },
  hit: {
    name: 'Bloqueo e Impacto (Block & Hit)',
    category: 'Combate',
    duration: 1.1,
  },
  ultimate_nova: {
    name: 'Skill Definitiva: Explosión Supernova',
    category: 'Ultimate Skill',
    duration: 2.6,
  },
  ultimate_slam: {
    name: 'Skill Definitiva: Impacto Sísmico',
    category: 'Ultimate Skill',
    duration: 2.1,
  },
  ultimate_beam: {
    name: 'Skill Definitiva: Cañón de Energía',
    category: 'Ultimate Skill',
    duration: 2.4,
  },
  victory: {
    name: 'Celebración de Victoria (Emote)',
    category: 'Emote',
    duration: 2.0,
  },
};

/**
 * Evalúa matemáticamente las rotaciones y desplazamientos de todo el esqueleto
 * para cualquier animación de juego en el instante `time` (en segundos).
 */
export function evaluateGameAnimation(animKey, time, fallbackPoseKey = 'apose') {
  const base = POSES[fallbackPoseKey] || POSES.apose;

  const state = {
    pelvisPos: [0, 0, 0],
    pelvisRot: [0, 0, 0],
    torsoRot: [0, 0, 0],
    neckRot: [0, 0, 0],
    head: [0, 0, 0],
    shoulderL: [...base.shoulderL],
    shoulderR: [...base.shoulderR],
    elbowL: [...base.elbowL],
    elbowR: [...base.elbowR],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [...base.hipL],
    hipR: [...base.hipR],
    kneeL: [...base.kneeL],
    kneeR: [...base.kneeR],
    ankleL: [...base.ankleL],
    ankleR: [...base.ankleR],
    vfxType: null,
    vfxProgress: 0,
  };

  if (!animKey || animKey === 'none') {
    return state;
  }

  const dur = GAME_ANIMATIONS[animKey]?.duration || 1.0;
  const phase = ((time % dur) / dur) * Math.PI * 2;
  const u = (time % dur) / dur;

  switch (animKey) {
    case 'idle': {
      const breath = Math.sin(phase);
      const sway = Math.cos(phase * 0.5);
      state.pelvisPos = [sway * 0.012, breath * 0.008, 0];
      state.pelvisRot = [0, sway * 0.04, 0];
      state.torsoRot = [-breath * 0.025, -sway * 0.03, 0];
      state.head = [breath * 0.03, sway * 0.05, 0];
      state.shoulderL = [0.05 + breath * 0.03, 0, 0.30 + breath * 0.03];
      state.shoulderR = [0.05 + breath * 0.03, 0, -0.30 - breath * 0.03];
      state.elbowL = [-0.28 - breath * 0.04, 0, -0.05];
      state.elbowR = [-0.28 - breath * 0.04, 0, 0.05];
      state.hipL = [0.02, 0, 0.05];
      state.hipR = [-0.02, 0, -0.05];
      state.kneeL = [0.08 - breath * 0.02, 0, 0];
      state.kneeR = [0.08 - breath * 0.02, 0, 0];
      state.ankleL = [-0.06, 0, 0];
      state.ankleR = [-0.06, 0, 0];
      break;
    }

    case 'walk': {
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      const bounce = Math.abs(Math.sin(phase)) * 0.026;

      state.pelvisPos = [c * 0.018, bounce - 0.01, 0];
      state.pelvisRot = [0.03, -s * 0.10, c * 0.04];
      state.torsoRot = [0.05, s * 0.11, -c * 0.03];
      state.head = [-0.02, -s * 0.05, 0];

      state.shoulderL = [s * 0.42, 0, 0.24];
      state.shoulderR = [-s * 0.42, 0, -0.24];
      state.elbowL = [-0.28 - Math.max(0, -s) * 0.25, 0, -0.04];
      state.elbowR = [-0.28 - Math.max(0, s) * 0.25, 0, 0.04];

      state.hipL = [-s * 0.52, 0, 0.04];
      state.hipR = [s * 0.52, 0, -0.04];

      const kneeL = Math.max(0, c) * 0.62 + 0.06;
      const kneeR = Math.max(0, -c) * 0.62 + 0.06;
      state.kneeL = [kneeL, 0, 0];
      state.kneeR = [kneeR, 0, 0];

      state.ankleL = [-(state.hipL[0] + kneeL) * 0.65, 0, 0];
      state.ankleR = [-(state.hipR[0] + kneeR) * 0.65, 0, 0];
      break;
    }

    case 'run': {
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      const flight = Math.sin(phase * 2 - Math.PI * 0.35) * 0.048;

      state.pelvisPos = [c * 0.015, flight + 0.01, 0];
      state.pelvisRot = [0.18, -s * 0.18, c * 0.05];
      state.torsoRot = [0.22 + Math.cos(phase * 2) * 0.04, s * 0.22, -c * 0.04];
      state.head = [-0.16, -s * 0.10, 0];

      state.shoulderL = [s * 0.85 + 0.1, 0, 0.26];
      state.shoulderR = [-s * 0.85 + 0.1, 0, -0.26];
      state.elbowL = [-1.35 - s * 0.22, 0, -0.10];
      state.elbowR = [-1.35 + s * 0.22, 0, 0.10];

      state.hipL = [-s * 0.92 - 0.08, 0, 0.04];
      state.hipR = [s * 0.92 - 0.08, 0, -0.04];

      const kneeL = Math.max(0.12, (c + 0.35) * 1.15);
      const kneeR = Math.max(0.12, (-c + 0.35) * 1.15);
      state.kneeL = [kneeL, 0, 0];
      state.kneeR = [kneeR, 0, 0];

      state.ankleL = [-s * 0.35 - 0.15, 0, 0];
      state.ankleR = [s * 0.35 - 0.15, 0, 0];
      break;
    }

    case 'jump': {
      let crouchAmt = 0;
      let airHeight = 0;
      let armLift = 0;

      if (u < 0.25) {
        const t = Math.sin((u / 0.25) * Math.PI * 0.5);
        crouchAmt = t;
        armLift = -t * 0.5;
      } else if (u < 0.75) {
        const airT = (u - 0.25) / 0.5;
        airHeight = Math.sin(airT * Math.PI) * 0.42;
        crouchAmt = -Math.sin(airT * Math.PI) * 0.35;
        armLift = Math.sin(airT * Math.PI);
      } else {
        const landT = (u - 0.75) / 0.25;
        crouchAmt = Math.sin(landT * Math.PI) * 0.75;
        armLift = -Math.sin(landT * Math.PI) * 0.25;
      }

      const kneeBend = Math.max(0.08, crouchAmt * 1.15 + (airHeight > 0.2 ? 0.45 : 0));
      state.pelvisPos = [0, airHeight - Math.max(0, crouchAmt) * 0.18, 0];
      state.torsoRot = [Math.max(0, crouchAmt) * 0.32 - armLift * 0.12, 0, 0];
      state.head = [-state.torsoRot[0] * 0.7, 0, 0];

      state.shoulderL = [-armLift * 1.85 + 0.2, 0, 0.32 + Math.max(0, armLift) * 0.35];
      state.shoulderR = [-armLift * 1.85 + 0.2, 0, -0.32 - Math.max(0, armLift) * 0.35];
      state.elbowL = [-0.45 - Math.abs(armLift) * 0.3, 0, 0];
      state.elbowR = [-0.45 - Math.abs(armLift) * 0.3, 0, 0];

      state.hipL = [-kneeBend * 0.55, 0, 0.05];
      state.hipR = [-kneeBend * 0.55, 0, -0.05];
      state.kneeL = [kneeBend, 0, 0];
      state.kneeR = [kneeBend, 0, 0];
      state.ankleL = [airHeight > 0.05 ? 0.35 : -kneeBend * 0.45, 0, 0];
      state.ankleR = [airHeight > 0.05 ? 0.35 : -kneeBend * 0.45, 0, 0];
      break;
    }

    case 'crouch': {
      const s = Math.sin(phase);
      const c = Math.cos(phase);

      state.pelvisPos = [c * 0.02, -0.18 + Math.abs(s) * 0.015, 0];
      state.pelvisRot = [0.15, -s * 0.12, 0];
      state.torsoRot = [0.38, s * 0.14, 0];
      state.head = [-0.32, -s * 0.08, 0];

      state.shoulderL = [s * 0.35 - 0.15, 0, 0.34];
      state.shoulderR = [-s * 0.35 - 0.15, 0, -0.34];
      state.elbowL = [-1.05, 0, -0.12];
      state.elbowR = [-1.05, 0, 0.12];

      state.hipL = [-0.65 - s * 0.38, 0, 0.08];
      state.hipR = [-0.65 + s * 0.38, 0, -0.08];
      state.kneeL = [1.05 + Math.max(0, c) * 0.35, 0, 0];
      state.kneeR = [1.05 + Math.max(0, -c) * 0.35, 0, 0];
      state.ankleL = [-0.42, 0, 0];
      state.ankleR = [-0.42, 0, 0];
      break;
    }

    case 'swim': {
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      const kick = Math.sin(phase * 3);

      state.pelvisPos = [c * 0.02, 0.35 + Math.sin(phase * 2) * 0.03, 0];
      state.pelvisRot = [Math.PI * 0.44, 0, s * 0.16];
      state.torsoRot = [0.06, s * 0.22, -s * 0.12];
      state.head = [-0.48, Math.max(0, s) * 0.55, 0];

      state.shoulderL = [-Math.PI * 0.5 + Math.sin(phase) * 1.35, 0, 0.38 + Math.max(0, c) * 0.42];
      state.shoulderR = [-Math.PI * 0.5 - Math.sin(phase) * 1.35, 0, -0.38 - Math.max(0, -c) * 0.42];
      state.elbowL = [-0.35 - Math.max(0, c) * 0.65, 0, 0];
      state.elbowR = [-0.35 - Math.max(0, -c) * 0.65, 0, 0];

      state.hipL = [kick * 0.28, 0, 0.04];
      state.hipR = [-kick * 0.28, 0, -0.04];
      state.kneeL = [0.18 + Math.max(0, -kick) * 0.25, 0, 0];
      state.kneeR = [0.18 + Math.max(0, kick) * 0.25, 0, 0];
      state.ankleL = [0.45, 0, 0];
      state.ankleR = [0.45, 0, 0];

      state.vfxType = 'swim';
      state.vfxProgress = u;
      break;
    }

    case 'punch': {
      let jab = 0;
      let cross = 0;
      let upper = 0;

      if (u < 0.32) {
        jab = Math.sin((u / 0.32) * Math.PI);
      } else if (u < 0.68) {
        cross = Math.sin(((u - 0.32) / 0.36) * Math.PI);
      } else {
        upper = Math.sin(((u - 0.68) / 0.32) * Math.PI);
      }

      state.pelvisPos = [0, -0.04 - upper * 0.04, jab * 0.04 + cross * 0.08];
      state.pelvisRot = [0.06, -jab * 0.28 + cross * 0.42 + upper * 0.32, 0];
      state.torsoRot = [0.12 - upper * 0.18, -jab * 0.38 + cross * 0.58 + upper * 0.45, 0];
      state.head = [-0.08, jab * 0.25 - cross * 0.35, 0];

      state.shoulderL = [-0.65 - jab * 0.92, jab * 0.20, 0.32 - jab * 0.18];
      state.elbowL = [-1.85 + jab * 1.65, 0, -0.18 * (1 - jab)];

      state.shoulderR = [-0.55 - cross * 1.05 - upper * 1.25, -cross * 0.25, -0.32 + cross * 0.18 + upper * 0.12];
      state.elbowR = [-1.90 + cross * 1.72 - upper * 0.15, 0, 0.18 * (1 - cross)];

      state.hipL = [-0.24 - jab * 0.08, 0.08, 0.10];
      state.hipR = [0.18 + cross * 0.12, -0.12, -0.10];
      state.kneeL = [0.32, 0, 0];
      state.kneeR = [0.28 + cross * 0.15, 0, 0];
      state.ankleL = [-0.12, 0, 0];
      state.ankleR = [-0.22, 0, 0];

      if (cross > 0.6 || upper > 0.6) {
        state.vfxType = 'punch';
        state.vfxProgress = Math.max(cross, upper);
      }
      break;
    }

    case 'kick': {
      const kickArc = Math.sin(u * Math.PI);
      const snap = u > 0.2 && u < 0.65 ? Math.sin(((u - 0.2) / 0.45) * Math.PI) : 0;

      state.pelvisPos = [0, -0.02 + snap * 0.03, 0];
      state.pelvisRot = [-kickArc * 0.28, kickArc * 0.38, kickArc * 0.18];
      state.torsoRot = [-kickArc * 0.22, -kickArc * 0.28, -kickArc * 0.12];
      state.head = [kickArc * 0.15, kickArc * 0.15, 0];

      state.shoulderL = [-0.55 + snap * 0.45, 0, 0.40];
      state.shoulderR = [-0.65 - snap * 0.25, 0, -0.44];
      state.elbowL = [-1.55, 0, -0.18];
      state.elbowR = [-1.45, 0, 0.18];

      state.hipL = [0.10, 0.12, 0.08];
      state.kneeL = [0.22, 0, 0];
      state.ankleL = [-0.22, 0, 0];

      state.hipR = [-kickArc * 1.75, -kickArc * 0.18, -0.08 - kickArc * 0.22];
      state.kneeR = [Math.max(0.05, kickArc * 1.35 * (1 - snap * 0.92)), 0, 0];
      state.ankleR = [snap * 0.45, 0, 0];
      break;
    }

    case 'dodge': {
      const weave = Math.sin(phase);
      const duck = Math.pow(Math.sin(phase), 2);

      state.pelvisPos = [weave * 0.22, -duck * 0.16, 0];
      state.pelvisRot = [duck * 0.18, -weave * 0.25, -weave * 0.12];
      state.torsoRot = [duck * 0.35, weave * 0.32, weave * 0.22];
      state.head = [-duck * 0.28, -weave * 0.20, 0];

      state.shoulderL = [-0.55, 0, 0.32];
      state.shoulderR = [-0.55, 0, -0.32];
      state.elbowL = [-1.85, 0, -0.22];
      state.elbowR = [-1.85, 0, 0.22];

      state.hipL = [-duck * 0.55, 0, 0.12 + Math.max(0, -weave) * 0.15];
      state.hipR = [-duck * 0.55, 0, -0.12 - Math.max(0, weave) * 0.15];
      state.kneeL = [0.22 + duck * 0.65, 0, 0];
      state.kneeR = [0.22 + duck * 0.65, 0, 0];
      state.ankleL = [-0.25, 0, 0];
      state.ankleR = [-0.25, 0, 0];
      break;
    }

    case 'hit': {
      const impact = Math.pow(Math.sin(u * Math.PI), 1.6);

      state.pelvisPos = [0, -impact * 0.06, -impact * 0.10];
      state.pelvisRot = [-impact * 0.12, impact * 0.15, 0];
      state.torsoRot = [-impact * 0.28, impact * 0.22, 0];
      state.head = [-impact * 0.25, -impact * 0.18, 0];

      state.shoulderL = [-1.05 - impact * 0.35, -0.25, 0.28];
      state.shoulderR = [-1.05 - impact * 0.35, 0.25, -0.28];
      state.elbowL = [-1.95, 0, -0.32];
      state.elbowR = [-1.95, 0, 0.32];

      state.hipL = [-0.22 - impact * 0.15, 0, 0.08];
      state.hipR = [0.18 + impact * 0.15, 0, -0.08];
      state.kneeL = [0.35 + impact * 0.22, 0, 0];
      state.kneeR = [0.28 + impact * 0.18, 0, 0];
      break;
    }

    case 'ultimate_nova': {
      if (u < 0.42) {
        const t = u / 0.42;
        const ease = Math.sin(t * Math.PI * 0.5);
        state.pelvisPos = [0, ease * 0.26, 0];
        state.torsoRot = [ease * 0.38, 0, 0];
        state.head = [ease * 0.32, 0, 0];

        state.shoulderL = [-0.85 * ease, -0.35 * ease, 0.45 - 0.15 * ease];
        state.shoulderR = [-0.85 * ease, 0.35 * ease, -0.45 + 0.15 * ease];
        state.elbowL = [-1.85 * ease, 0, -0.35 * ease];
        state.elbowR = [-1.85 * ease, 0, 0.35 * ease];

        state.hipL = [-0.45 * ease, 0, 0.06];
        state.hipR = [-0.25 * ease, 0, -0.06];
        state.kneeL = [0.85 * ease, 0, 0];
        state.kneeR = [0.55 * ease, 0, 0];
        state.ankleL = [0.35 * ease, 0, 0];
        state.ankleR = [0.35 * ease, 0, 0];
      } else if (u < 0.80) {
        const burstT = (u - 0.42) / 0.38;
        const burst = Math.sin(burstT * Math.PI * 0.65);

        state.pelvisPos = [0, 0.26 + burst * 0.14, 0];
        state.torsoRot = [0.38 - burst * 0.78, 0, 0];
        state.head = [0.32 - burst * 0.75, 0, 0];

        state.shoulderL = [-0.85 + burst * 1.15, -0.35 * (1 - burst), 0.30 + burst * 1.15];
        state.shoulderR = [-0.85 + burst * 1.15, 0.35 * (1 - burst), -0.30 - burst * 1.15];
        state.elbowL = [-1.85 * (1 - burst * 0.85), 0, 0];
        state.elbowR = [-1.85 * (1 - burst * 0.85), 0, 0];

        state.hipL = [-0.45 * (1 - burst) + burst * 0.22, 0, 0.06 + burst * 0.16];
        state.hipR = [-0.25 * (1 - burst) + burst * 0.22, 0, -0.06 - burst * 0.16];
        state.kneeL = [0.85 * (1 - burst * 0.75), 0, 0];
        state.kneeR = [0.55 * (1 - burst * 0.75), 0, 0];
        state.ankleL = [0.45, 0, 0];
        state.ankleR = [0.45, 0, 0];
      } else {
        const endT = (u - 0.80) / 0.20;
        const k = 1 - endT;
        state.pelvisPos = [0, 0.40 * k, 0];
        state.torsoRot = [-0.40 * k, 0, 0];
        state.head = [-0.43 * k, 0, 0];
        state.shoulderL = [0.30 * k, 0, 0.64 + 0.81 * k];
        state.shoulderR = [0.30 * k, 0, -0.64 - 0.81 * k];
      }

      state.vfxType = 'nova';
      state.vfxProgress = u;
      break;
    }

    case 'ultimate_slam': {
      if (u < 0.45) {
        const t = u / 0.45;
        const arc = Math.sin(t * Math.PI * 0.85);
        state.pelvisPos = [0, arc * 0.52, 0];
        state.torsoRot = [-t * 0.28, 0, 0];
        state.head = [-t * 0.22, 0, 0];

        state.shoulderL = [-t * 2.45, 0.20 * t, 0.38];
        state.shoulderR = [-t * 2.45, -0.20 * t, -0.38];
        state.elbowL = [-0.55 * t, 0, -0.20 * t];
        state.elbowR = [-0.55 * t, 0, 0.20 * t];

        state.hipL = [-arc * 0.75, 0, 0.08];
        state.hipR = [-arc * 0.45, 0, -0.08];
        state.kneeL = [arc * 1.15, 0, 0];
        state.kneeR = [arc * 0.85, 0, 0];
      } else if (u < 0.62) {
        const dropT = (u - 0.45) / 0.17;
        state.pelvisPos = [0, (1 - dropT) * 0.35 - dropT * 0.24, 0];
        state.torsoRot = [-0.28 + dropT * 0.95, 0, 0];
        state.head = [-0.22 + dropT * 0.55, 0, 0];

        state.shoulderL = [-2.45 + dropT * 1.55, 0.15, 0.32];
        state.shoulderR = [-2.45 + dropT * 1.55, -0.15, -0.32];
        state.elbowL = [-0.35, 0, 0];
        state.elbowR = [-0.35, 0, 0];

        state.hipL = [-0.85 * dropT, 0, 0.10];
        state.hipR = [-0.45 * dropT, 0, -0.10];
        state.kneeL = [1.25 * dropT, 0, 0];
        state.kneeR = [1.15 * dropT, 0, 0];
      } else {
        const recT = (u - 0.62) / 0.38;
        const hold = 1 - Math.pow(recT, 1.8);
        state.pelvisPos = [0, -0.24 * hold, 0];
        state.torsoRot = [0.67 * hold, 0, 0];
        state.head = [-0.45 * hold, 0, 0];

        state.shoulderL = [-0.90 * hold, 0.15 * hold, 0.32 + (1 - hold) * 0.32];
        state.shoulderR = [-0.90 * hold, -0.15 * hold, -0.32 - (1 - hold) * 0.32];
        state.elbowL = [-0.35 * hold, 0, 0];
        state.elbowR = [-0.35 * hold, 0, 0];

        state.hipL = [-0.85 * hold, 0, 0.10];
        state.hipR = [-0.45 * hold, 0, -0.10];
        state.kneeL = [1.25 * hold, 0, 0];
        state.kneeR = [1.15 * hold, 0, 0];
      }

      state.vfxType = 'slam';
      state.vfxProgress = u;
      break;
    }

    case 'ultimate_beam': {
      if (u < 0.42) {
        const t = Math.sin((u / 0.42) * Math.PI * 0.5);
        state.pelvisPos = [0, -0.09 * t, 0];
        state.pelvisRot = [0, -0.55 * t, 0];
        state.torsoRot = [0.12 * t, -0.65 * t, 0];
        state.head = [-0.08 * t, 0.62 * t, 0];

        state.shoulderL = [-0.45 * t, -0.45 * t, 0.32];
        state.shoulderR = [0.35 * t, -0.25 * t, -0.32];
        state.elbowL = [-1.45 * t, 0, -0.25 * t];
        state.elbowR = [-1.65 * t, 0, 0.25 * t];

        state.hipL = [-0.35 * t, 0.15 * t, 0.12 * t];
        state.hipR = [-0.25 * t, -0.15 * t, -0.12 * t];
        state.kneeL = [0.55 * t, 0, 0];
        state.kneeR = [0.48 * t, 0, 0];
      } else if (u < 0.86) {
        const fireT = (u - 0.42) / 0.44;
        const thrust = Math.min(1, fireT * 4.5);
        const tremor = Math.sin(fireT * Math.PI * 10) * 0.015;

        state.pelvisPos = [0, -0.09, -thrust * 0.05];
        state.pelvisRot = [0.08 * thrust, -0.55 * (1 - thrust), 0];
        state.torsoRot = [0.18 * thrust, -0.65 * (1 - thrust), 0];
        state.head = [-0.14 * thrust, 0, 0];

        state.shoulderL = [-1.48 * thrust + tremor, -0.22 * thrust, 0.22];
        state.shoulderR = [-1.48 * thrust - tremor, 0.22 * thrust, -0.22];
        state.elbowL = [-0.18, 0, -0.12];
        state.elbowR = [-0.18, 0, 0.12];
        state.wristL = [-0.65 * thrust, 0, 0];
        state.wristR = [-0.65 * thrust, 0, 0];

        state.hipL = [-0.42, 0, 0.12];
        state.hipR = [0.22, 0, -0.12];
        state.kneeL = [0.65, 0, 0];
        state.kneeR = [0.32, 0, 0];
      } else {
        const endT = 1 - (u - 0.86) / 0.14;
        state.pelvisPos = [0, -0.09 * endT, 0];
        state.shoulderL = [-1.48 * endT, 0, 0.48];
        state.shoulderR = [-1.48 * endT, 0, -0.48];
      }

      state.vfxType = 'beam';
      state.vfxProgress = u;
      break;
    }

    case 'victory': {
      const pump = Math.sin(phase * 2);
      state.pelvisPos = [0, Math.abs(pump) * 0.025, 0];
      state.torsoRot = [-0.08 - Math.abs(pump) * 0.05, Math.sin(phase) * 0.15, 0];
      state.head = [-0.08, Math.sin(phase) * 0.12, 0];

      state.shoulderL = [-0.15, 0.15, 1.52 + pump * 0.18];
      state.shoulderR = [-0.15, -0.15, -1.52 - pump * 0.18];
      state.elbowL = [-0.25, 0, 1.65 + pump * 0.25];
      state.elbowR = [-0.25, 0, -1.65 - pump * 0.25];

      state.hipL = [0, 0.08, 0.08];
      state.hipR = [0, -0.08, -0.08];
      state.kneeL = [0.08, 0, 0];
      state.kneeR = [0.08, 0, 0];
      break;
    }

    default:
      break;
  }

  return state;
}

/**
 * Hornea todas las animaciones de juego en objetos THREE.AnimationClip estándar
 * para que al exportar a .GLB el modelo lleve embebidas todas las pistas de animación.
 */
export function bakeAllGameAnimationClips(fps = 30) {
  const clips = [];
  const euler = new THREE.Euler();
  const quat = new THREE.Quaternion();

  const boneMap = [
    { key: 'pelvisRot', nodeName: 'Pelvis' },
    { key: 'torsoRot', nodeName: 'Torso' },
    { key: 'neckRot', nodeName: 'Neck' },
    { key: 'head', nodeName: 'Head' },
    { key: 'shoulderL', nodeName: 'Shoulder_L' },
    { key: 'shoulderR', nodeName: 'Shoulder_R' },
    { key: 'elbowL', nodeName: 'Elbow_L' },
    { key: 'elbowR', nodeName: 'Elbow_R' },
    { key: 'wristL', nodeName: 'Wrist_L' },
    { key: 'wristR', nodeName: 'Wrist_R' },
    { key: 'hipL', nodeName: 'Hip_L' },
    { key: 'hipR', nodeName: 'Hip_R' },
    { key: 'kneeL', nodeName: 'Knee_L' },
    { key: 'kneeR', nodeName: 'Knee_R' },
    { key: 'ankleL', nodeName: 'Ankle_L' },
    { key: 'ankleR', nodeName: 'Ankle_R' },
  ];

  Object.entries(GAME_ANIMATIONS).forEach(([animKey, meta]) => {
    if (animKey === 'none') return;

    const duration = meta.duration;
    const steps = Math.max(12, Math.round(duration * fps));
    const times = [];
    const pelvisPositions = [];
    const quatDataByBone = {};

    boneMap.forEach((b) => {
      quatDataByBone[b.nodeName] = [];
    });

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * duration;
      times.push(t);
      const st = evaluateGameAnimation(animKey, t, 'apose');

      pelvisPositions.push(st.pelvisPos[0], st.pelvisPos[1], st.pelvisPos[2]);

      boneMap.forEach(({ key, nodeName }) => {
        const rot = st[key] || [0, 0, 0];
        euler.set(rot[0], rot[1], rot[2]);
        quat.setFromEuler(euler);
        quatDataByBone[nodeName].push(quat.x, quat.y, quat.z, quat.w);
      });
    }

    const tracks = [
      new THREE.VectorKeyframeTrack('Pelvis.position', times, pelvisPositions),
    ];

    boneMap.forEach(({ nodeName }) => {
      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${nodeName}.quaternion`,
          times,
          quatDataByBone[nodeName]
        )
      );
    });

    clips.push(new THREE.AnimationClip(animKey, duration, tracks));
  });

  return clips;
}

/**
 * Construye prendas y accesorios procedurales que se adaptan a las proporciones del cuerpo
 */
export function buildProceduralItems(config, mats, rigRefs) {
  const outfit = config.items?.outfit || 'shorts';
  const accessory = config.items?.accessory || 'ninguno';

  if (outfit === 'shorts' || outfit === 'conjunto') {
    const hw = config.torso.hipWidth ?? 1.0;
    const ww = config.torso.waistWidth ?? 1.0;

    const briefGeo = createAnatomicalLathe(
      [
        [0.0, 0.002],
        [0.08, 0.148 * hw],
        [0.45, 0.175 * hw],
        [0.88, 0.148 * ww],
        [1.0, 0.002],
      ],
      0.165 * config.torso.height,
      {
        radialSegments: 36,
        heightSegments: 16,
        originAtTop: false,
        scaleX: () => 1.14,
        scaleZ: () => 0.72 * THREE.MathUtils.lerp(1, config.torso.chestDepth, 0.65),
        offsetZ: () => 0.006,
      }
    );
    briefGeo.translate(0, -0.308 * config.torso.height, 0);
    const briefMesh = new THREE.Mesh(briefGeo, mats.cloth);
    briefMesh.castShadow = true;
    briefMesh.receiveShadow = true;
    briefMesh.userData.zone = 'items';
    rigRefs.torso.add(briefMesh);

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
    topMesh.receiveShadow = true;
    topMesh.userData.zone = 'items';
    rigRefs.torso.add(topMesh);
  }

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
