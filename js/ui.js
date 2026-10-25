import {
  CONFIG,
  rebuildCharacter,
  syncMaterialColors,
  applyArchetype,
  randomizeCharacter,
  resetCharacter,
  restartAnimationTimer,
} from './character.js';
import { POSES, GAME_ANIMATIONS } from './items.js';
import {
  setCameraPreset,
  toggleAutoRotate,
  toggleWireframeMode,
} from './viewer.js';
import { exportCharacterGLB } from './exporter.js';

const $ = (id) => document.getElementById(id);

export const ZONE_LABELS = {
  cara: 'Cara y Cabeza',
  pelo: 'Cabello Procedural',
  torso: 'Torso y Músculos',
  brazos: 'Brazos, Antebrazos y Manos',
  piernas: 'Piernas, Gemelos y Pies',
  items: 'Poses, Animaciones y Ropa',
};

/**
 * Definición exhaustiva de todos los sliders anatómicos por zona con rangos ampliados
 */
export const DEFAULT_ZONE_PARAMS = {
  cara: [
    { key: 'headWidth', min: 0.65, max: 1.45, step: 0.01, label: 'Ancho de Cabeza' },
    { key: 'headHeight', min: 0.55, max: 1.45, step: 0.01, label: 'Alto de Cabeza' },
    { key: 'jawWidth', min: 0.60, max: 1.55, step: 0.01, label: 'Ancho Mandíbula' },
    { key: 'chinY', min: 0.50, max: 1.70, step: 0.01, label: 'Elevación Mentón / Barbilla' },
    { key: 'chinLength', min: 0.50, max: 1.75, step: 0.01, label: 'Proyección Mentón' },
    { key: 'browRidge', min: 0.40, max: 1.80, step: 0.01, label: 'Arco Superciliar' },
    { key: 'eyeSize', min: 0.50, max: 1.80, step: 0.01, label: 'Tamaño de Ojos' },
    { key: 'eyeSpacing', min: 0.60, max: 1.50, step: 0.01, label: 'Separación de Ojos' },
    { key: 'eyeY', min: 0.55, max: 1.45, step: 0.01, label: 'Altura de Ojos' },
    { key: 'eyeOpen', min: 0.35, max: 1.85, step: 0.01, label: 'Apertura de Ojos' },
    { key: 'eyeSlant', min: -0.60, max: 0.60, step: 0.01, label: 'Inclinación de Ojos' },
    { key: 'eyeSquash', min: 0.25, max: 1.65, step: 0.01, label: 'Aplastamiento Ojos (Vertical)' },
    { key: 'eyeAspect', min: 0.50, max: 2.00, step: 0.01, label: 'Ancho / Rectangular Ojos' },
    { key: 'eyeAngular', min: 0.00, max: 1.00, step: 0.01, label: 'Angularidad Rectangular (Goku SSJ)' },
    { key: 'noseLength', min: 0.50, max: 1.70, step: 0.01, label: 'Longitud de Nariz' },
    { key: 'noseWidth', min: 0.50, max: 1.70, step: 0.01, label: 'Ancho de Nariz' },
    { key: 'lipWidth', min: 0.50, max: 1.65, step: 0.01, label: 'Ancho de Labios' },
    { key: 'lipThickness', min: 0.30, max: 1.85, step: 0.01, label: 'Grosor de Labios' },
    { key: 'earSize', min: 0.50, max: 1.75, step: 0.01, label: 'Tamaño de Orejas' },
    { key: 'beardLength', min: 0.40, max: 2.50, step: 0.01, label: 'Longitud / Volumen Barba' },
    { key: 'poreDetail', min: 0.00, max: 2.50, step: 0.05, label: 'Poros y Textura Facial' },
  ],
  pelo: [
    { key: 'volume', min: 0.60, max: 1.65, step: 0.01, label: 'Volumen Capilar' },
    { key: 'height', min: 0.55, max: 1.70, step: 0.01, label: 'Altura de Peinado' },
    { key: 'density', min: 0.50, max: 1.60, step: 0.01, label: 'Densidad de Mechones' },
    { key: 'hairline', min: 0.70, max: 1.30, step: 0.01, label: 'Nacimiento / Frente' },
  ],
  torso: [
    { key: 'chestWidth', min: 0.60, max: 1.80, step: 0.01, label: 'Ancho de Pecho' },
    { key: 'waistWidth', min: 0.50, max: 1.70, step: 0.01, label: 'Ancho de Cintura' },
    { key: 'hipWidth', min: 0.55, max: 1.70, step: 0.01, label: 'Ancho de Cadera' },
    { key: 'chestDepth', min: 0.55, max: 1.75, step: 0.01, label: 'Profundidad Torácica' },
    { key: 'height', min: 0.65, max: 1.45, step: 0.01, label: 'Altura de Torso' },
    { key: 'neckWidth', min: 0.55, max: 1.65, step: 0.01, label: 'Grosor de Cuello' },
    { key: 'muscleDef', min: 0.00, max: 1.25, step: 0.02, label: 'Definición Muscular' },
  ],
  brazos: [
    { key: 'length', min: 0.65, max: 1.45, step: 0.01, label: 'Longitud de Brazos' },
    { key: 'thickness', min: 0.50, max: 1.85, step: 0.01, label: 'Grosor General' },
    { key: 'bicepSize', min: 0.55, max: 2.00, step: 0.01, label: 'Tamaño del Bíceps' },
    { key: 'forearmSize', min: 0.55, max: 1.80, step: 0.01, label: 'Grosor Antebrazo' },
    { key: 'handSize', min: 0.60, max: 1.55, step: 0.01, label: 'Tamaño de Mano' },
  ],
  piernas: [
    { key: 'length', min: 0.65, max: 1.45, step: 0.01, label: 'Longitud de Piernas' },
    { key: 'thickness', min: 0.55, max: 1.85, step: 0.01, label: 'Grosor de Muslo' },
    { key: 'calfSize', min: 0.55, max: 1.95, step: 0.01, label: 'Tamaño del Gemelo' },
    { key: 'gluteSize', min: 0.55, max: 1.80, step: 0.01, label: 'Volumen Glúteo' },
    { key: 'footSize', min: 0.60, max: 1.55, step: 0.01, label: 'Tamaño de Pie' },
  ],
  items: [],
};

export const ZONE_PARAMS = JSON.parse(JSON.stringify(DEFAULT_ZONE_PARAMS));

/**
 * Estado y almacén de límites personalizados del modo de Edición Avanzada
 */
export let isAdvancedMode = false;
export const customLimits = {};

export function getParamLimits(zone, p) {
  if (!customLimits[zone]) customLimits[zone] = {};
  if (!customLimits[zone][p.key]) {
    customLimits[zone][p.key] = { min: p.min, max: p.max };
  }
  return customLimits[zone][p.key];
}

export function setParamLimits(zone, key, newMin, newMax) {
  if (!customLimits[zone]) customLimits[zone] = {};
  if (!customLimits[zone][key]) {
    const def = (DEFAULT_ZONE_PARAMS[zone] || []).find((p) => p.key === key);
    customLimits[zone][key] = { min: def ? def.min : 0.2, max: def ? def.max : 2.5 };
  }
  if (newMin !== undefined && !isNaN(newMin)) customLimits[zone][key].min = Number(newMin.toFixed(2));
  if (newMax !== undefined && !isNaN(newMax)) customLimits[zone][key].max = Number(newMax.toFixed(2));
}

export function setStatus(text) {
  const el = $('status');
  if (el) el.textContent = text;
}

/**
 * Actualiza los indicadores visuales de los botones de Pose A/T y Animaciones
 */
function syncAnimationButtonsUI() {
  const currentPose = CONFIG.items.pose;
  const currentAnim = CONFIG.items.animation || 'none';

  document.querySelectorAll('#bindPoseButtons .bind-btn').forEach((btn) => {
    const isThisPose = btn.dataset.bindpose === currentPose && currentAnim === 'none';
    btn.classList.toggle('active', isThisPose);
  });

  document.querySelectorAll('#quickAnimButtons .anim-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.anim === currentAnim);
  });

  document.querySelectorAll('#ultimateButtons .ult-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.anim === currentAnim);
  });

  const playPauseBtn = $('btnPlayPauseAnim');
  if (playPauseBtn) {
    if (currentAnim === 'none') {
      playPauseBtn.textContent = 'Modo Pose Fija';
    } else {
      playPauseBtn.textContent = CONFIG.items.animPlaying ? '⏸ Pausar Anim' : '▶ Reanudar Anim';
    }
  }

  const hudAnim = $('activeAnimIndicator');
  if (hudAnim) {
    if (currentAnim === 'none') {
      const pLabel = POSES[currentPose]?.label || currentPose;
      hudAnim.textContent = `Modo: ${pLabel}`;
    } else {
      const aLabel = GAME_ANIMATIONS[currentAnim]?.name || currentAnim;
      hudAnim.textContent = `Animación: ${aLabel}`;
    }
  }
}

/**
 * Renderiza controles desplegables adicionales según la zona activa
 */
function renderZoneExtraControls(zone) {
  const extraContainer = $('zoneExtraControls');
  if (!extraContainer) return;
  extraContainer.innerHTML = '';

  if (zone === 'cara') {
    const row = document.createElement('div');
    row.className = 'extra-row-column';
    const currentEyeType = CONFIG.cara.eyeType || 'almendrado';
    const currentBeard = CONFIG.cara.beardStyle || 'ninguna';
    row.innerHTML = `
      <div class="extra-subhead">
        <span class="subhead-title">Tipo y Forma de Ojos</span>
        <span class="subhead-hint">Morfología angular, rectangular, pez u orgánica</span>
      </div>
      <div class="eye-type-grid" id="eyeTypeButtons">
        <button type="button" data-eyetype="almendrado" class="eye-type-chip ${currentEyeType === 'almendrado' ? 'active' : ''}" title="Ojo almendrado clásico humano con equilibrio anatómico">Almendrado</button>
        <button type="button" data-eyetype="goku_ssj" class="eye-type-chip ${currentEyeType === 'goku_ssj' ? 'active' : ''}" title="Ojo angular rectangular estilo Goku Super Saiyan">Goku SSJ</button>
        <button type="button" data-eyetype="pescado" class="eye-type-chip ${currentEyeType === 'pescado' ? 'active' : ''}" title="Ojo en forma de pez/pescado con comisuras afiladas y silueta lenticular">Pez / Pescado</button>
        <button type="button" data-eyetype="rasgado" class="eye-type-chip ${currentEyeType === 'rasgado' ? 'active' : ''}" title="Ojo rasgado con pliegue epicántico y ángulo canthal ascendente">Rasgado</button>
        <button type="button" data-eyetype="redondo" class="eye-type-chip ${currentEyeType === 'redondo' ? 'active' : ''}" title="Ojo redondo amplio, expresivo y juvenil">Redondo</button>
        <button type="button" data-eyetype="felino" class="eye-type-chip ${currentEyeType === 'felino' ? 'active' : ''}" title="Ojo felino con marcado ángulo ascendente y ceja arqueada">Felino</button>
        <button type="button" data-eyetype="profundo" class="eye-type-chip ${currentEyeType === 'profundo' ? 'active' : ''}" title="Ojo profundo con cuenca orbital hundida y sombra supraorbital">Profundo</button>
        <button type="button" data-eyetype="caido" class="eye-type-chip ${currentEyeType === 'caido' ? 'active' : ''}" title="Ojo caído con canto lateral descendente y mirada serena">Caído</button>
        <button type="button" data-eyetype="anime" class="eye-type-chip ${currentEyeType === 'anime' ? 'active' : ''}" title="Ojo estilizado anime con iris y apertura ampliados">Anime</button>
      </div>

      <div class="extra-subhead" style="margin-top: 10px;">
        <span class="subhead-title">Estilo de Barba</span>
        <span class="subhead-hint">Confinada a la mandíbula y mentón anterior (sin envolver la nuca)</span>
      </div>
      <div class="beard-style-grid" id="beardStyleButtons">
        <button type="button" data-beardstyle="ninguna" class="beard-chip ${currentBeard === 'ninguna' ? 'active' : ''}" title="Afeitado limpio sin barba">Sin Barba</button>
        <button type="button" data-beardstyle="sombra" class="beard-chip ${currentBeard === 'sombra' ? 'active' : ''}" title="Barba de 3 días / sombra corta anterior">3 Días (Sombra)</button>
        <button type="button" data-beardstyle="perilla" class="beard-chip ${currentBeard === 'perilla' ? 'active' : ''}" title="Perilla definida en el mentón">Perilla</button>
        <button type="button" data-beardstyle="candado" class="beard-chip ${currentBeard === 'candado' ? 'active' : ''}" title="Candado cerrado (bigote y perilla unidos)">Candado</button>
        <button type="button" data-beardstyle="bigote" class="beard-chip ${currentBeard === 'bigote' ? 'active' : ''}" title="Bigote anatómico sobre labio superior">Bigote</button>
        <button type="button" data-beardstyle="barba_corta" class="beard-chip ${currentBeard === 'barba_corta' ? 'active' : ''}" title="Barba corta perfilada moderna">Barba Corta</button>
        <button type="button" data-beardstyle="completa" class="beard-chip ${currentBeard === 'completa' ? 'active' : ''}" title="Barba completa recortada">Completa</button>
        <button type="button" data-beardstyle="vikingo" class="beard-chip ${currentBeard === 'vikingo' ? 'active' : ''}" title="Barba larga y densa estilo vikingo">Vikingo</button>
      </div>
    `;
    extraContainer.appendChild(row);

    row.querySelectorAll('.eye-type-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        CONFIG.cara.eyeType = btn.dataset.eyetype;
        if (btn.dataset.eyetype === 'goku_ssj') {
          CONFIG.cara.eyeAngular = 1.0;
          CONFIG.cara.eyeSquash = 0.65;
          CONFIG.cara.eyeAspect = 1.35;
        } else if (btn.dataset.eyetype === 'pescado') {
          CONFIG.cara.eyeAngular = 0.0;
          CONFIG.cara.eyeSquash = 0.75;
          CONFIG.cara.eyeAspect = 1.25;
        }
        row.querySelectorAll('.eye-type-chip').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        rebuildCharacter();
        renderZoneSliders();
        setStatus(`Tipo de ojos: ${btn.textContent.trim()}`);
      });
    });

    row.querySelectorAll('.beard-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        CONFIG.cara.beardStyle = btn.dataset.beardstyle;
        row.querySelectorAll('.beard-chip').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        rebuildCharacter();
        setStatus(`Estilo de barba: ${btn.textContent.trim()}`);
      });
    });
  } else if (zone === 'pelo') {
    const row = document.createElement('div');
    row.className = 'extra-row-column';
    const currentStyle = CONFIG.pelo.style || 'corto';
    row.innerHTML = `
      <div class="extra-subhead">
        <span class="subhead-title">Estilo y Corte de Cabello</span>
        <span class="subhead-hint">Mechones volumétricos orgánicos y nacimiento integrado con la piel</span>
      </div>
      <div class="hair-style-grid" id="hairStyleButtons">
        <button type="button" data-hairstyle="corto" class="hair-chip ${currentStyle === 'corto' ? 'active' : ''}" title="Corto texturizado con flequillo y múltiples capas de mechones">Corto Texturizado</button>
        <button type="button" data-hairstyle="medio" class="hair-chip ${currentStyle === 'medio' ? 'active' : ''}" title="Media melena ondulada con mechones en capas y movimiento fluido">Media Melena</button>
        <button type="button" data-hairstyle="cresta" class="hair-chip ${currentStyle === 'cresta' ? 'active' : ''}" title="Cresta atlética / spiky con mechones afilados y laterales difuminados">Cresta / Spikes</button>
        <button type="button" data-hairstyle="largo" class="hair-chip ${currentStyle === 'largo' ? 'active' : ''}" title="Melena larga con mechones en cascada orgánica">Melena Larga</button>
        <button type="button" data-hairstyle="recogido" class="hair-chip ${currentStyle === 'recogido' ? 'active' : ''}" title="Moño superior con mechones tensados y zarcillos sueltos">Moño / Recogido</button>
        <button type="button" data-hairstyle="rapado" class="hair-chip ${currentStyle === 'rapado' ? 'active' : ''}" title="Rapado con degradado suave (skin fade) que funde con la piel">Rapado / Fade</button>
      </div>
    `;
    extraContainer.appendChild(row);

    row.querySelectorAll('.hair-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        CONFIG.pelo.style = btn.dataset.hairstyle;
        row.querySelectorAll('.hair-chip').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        rebuildCharacter();
        setStatus(`Estilo de cabello: ${btn.textContent.trim()}`);
      });
    });
  } else if (zone === 'items') {
    const poseOptions = Object.entries(POSES)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
      .join('');

    const animOptions = Object.entries(GAME_ANIMATIONS)
      .map(([k, v]) => `<option value="${k}">[${v.category}] ${v.name}</option>`)
      .join('');

    extraContainer.innerHTML = `
      <div class="extra-row">
        <span>Pose Base</span>
        <select id="poseSelect">${poseOptions}</select>
      </div>
      <div class="extra-row">
        <span>Animación</span>
        <select id="animSelect">${animOptions}</select>
      </div>
      <div class="extra-row">
        <span>Vestimenta</span>
        <select id="outfitSelect">
          <option value="shorts">Pantalón Corto Deportivo</option>
          <option value="conjunto">Conjunto Deportivo Completo</option>
          <option value="ninguno">Sin Prenda (Maniquí Anatómico)</option>
        </select>
      </div>
      <div class="extra-row">
        <span>Accesorios</span>
        <select id="accessorySelect">
          <option value="ninguno">Ninguno</option>
          <option value="munequeras">Muñequeras Deportivas</option>
          <option value="gafas">Visor Deportivo</option>
          <option value="ambos">Visor + Muñequeras</option>
        </select>
      </div>
    `;

    const poseSel = extraContainer.querySelector('#poseSelect');
    const animSel = extraContainer.querySelector('#animSelect');
    const outfitSel = extraContainer.querySelector('#outfitSelect');
    const accSel = extraContainer.querySelector('#accessorySelect');

    poseSel.value = CONFIG.items.pose;
    animSel.value = CONFIG.items.animation || 'none';
    outfitSel.value = CONFIG.items.outfit;
    accSel.value = CONFIG.items.accessory;

    poseSel.addEventListener('change', (e) => {
      CONFIG.items.pose = e.target.value;
      CONFIG.items.animation = 'none';
      rebuildCharacter();
      syncAnimationButtonsUI();
      setStatus('Pose base actualizada');
    });

    animSel.addEventListener('change', (e) => {
      CONFIG.items.animation = e.target.value;
      CONFIG.items.animPlaying = true;
      restartAnimationTimer();
      rebuildCharacter();
      syncAnimationButtonsUI();
      setStatus(`Anim: ${GAME_ANIMATIONS[e.target.value]?.name || e.target.value}`);
    });

    outfitSel.addEventListener('change', (e) => {
      CONFIG.items.outfit = e.target.value;
      rebuildCharacter();
      setStatus('Vestimenta actualizada');
    });

    accSel.addEventListener('change', (e) => {
      CONFIG.items.accessory = e.target.value;
      rebuildCharacter();
      setStatus('Accesorio actualizado');
    });
  }
}

/**
 * Renderiza los sliders dinámicos de la zona anatómica seleccionada
 */
export function renderZoneSliders() {
  const container = $('zoneSliders');
  if (!container) return;
  container.innerHTML = '';

  const zone = CONFIG.selectedZone;
  renderZoneExtraControls(zone);

  const params = ZONE_PARAMS[zone] || [];
  for (const p of params) {
    const limits = getParamLimits(zone, p);
    const val = CONFIG[zone][p.key];

    if (!isAdvancedMode) {
      // Modo Normal: slider ergonómico con rangos ampliados activos
      const row = document.createElement('div');
      row.className = 'sl';
      row.innerHTML = `
        <span title="${p.label}">${p.label}</span>
        <input type="range" min="${limits.min}" max="${limits.max}" step="${p.step}" value="${val}" data-zone="${zone}" data-key="${p.key}" />
        <b>${val.toFixed(2)}</b>
      `;
      container.appendChild(row);

      const input = row.querySelector('input');
      const out = row.querySelector('b');

      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        CONFIG[zone][p.key] = v;
        out.textContent = v.toFixed(2);
        rebuildCharacter();
      });
    } else {
      // Modo Edición Avanzada: Muestra casillas editables de Mínimo, Máximo y Valor Numérico
      const row = document.createElement('div');
      row.className = 'sl sl-advanced';
      row.innerHTML = `
        <div class="sl-adv-header">
          <span class="sl-adv-title" title="${p.label}">${p.label}</span>
          <div class="sl-adv-val-box">
            <span class="val-label">Valor</span>
            <input type="number" class="val-num-input" min="${limits.min}" max="${limits.max}" step="${p.step}" value="${val.toFixed(2)}" title="Escribe un valor directo o ajusta los extremos" />
          </div>
        </div>
        <div class="sl-adv-row">
          <div class="limit-box min-limit-box" title="Haz clic para modificar el límite MÍNIMO">
            <span class="limit-tag">Mín</span>
            <input type="number" class="limit-num-input min-input" step="0.05" value="${limits.min.toFixed(2)}" />
          </div>
          <input type="range" class="adv-slider-range" min="${limits.min}" max="${limits.max}" step="${p.step}" value="${val}" data-zone="${zone}" data-key="${p.key}" />
          <div class="limit-box max-limit-box" title="Haz clic para modificar el límite MÁXIMO">
            <span class="limit-tag">Máx</span>
            <input type="number" class="limit-num-input max-input" step="0.05" value="${limits.max.toFixed(2)}" />
          </div>
        </div>
      `;
      container.appendChild(row);

      const rangeInput = row.querySelector('.adv-slider-range');
      const valInput = row.querySelector('.val-num-input');
      const minInput = row.querySelector('.min-input');
      const maxInput = row.querySelector('.max-input');

      // Modificación mediante arrastre del Slider
      rangeInput.addEventListener('input', () => {
        const v = parseFloat(rangeInput.value);
        CONFIG[zone][p.key] = v;
        valInput.value = v.toFixed(2);
        rebuildCharacter();
      });

      // Modificación directa del Valor numérico (autoexpande límites si excede)
      valInput.addEventListener('change', () => {
        let v = parseFloat(valInput.value);
        if (isNaN(v)) return;
        if (v < limits.min) {
          limits.min = Number((Math.floor(v * 20) / 20).toFixed(2));
          minInput.value = limits.min.toFixed(2);
          rangeInput.min = limits.min;
        }
        if (v > limits.max) {
          limits.max = Number((Math.ceil(v * 20) / 20).toFixed(2));
          maxInput.value = limits.max.toFixed(2);
          rangeInput.max = limits.max;
        }
        CONFIG[zone][p.key] = v;
        rangeInput.value = v;
        rebuildCharacter();
      });

      // Modificación interactiva del límite Mínimo
      minInput.addEventListener('change', () => {
        let newMin = parseFloat(minInput.value);
        if (isNaN(newMin)) return;
        if (newMin >= limits.max) newMin = limits.max - 0.05;
        limits.min = Number(newMin.toFixed(2));
        minInput.value = limits.min.toFixed(2);
        rangeInput.min = limits.min;
        valInput.min = limits.min;
        if (CONFIG[zone][p.key] < limits.min) {
          CONFIG[zone][p.key] = limits.min;
          rangeInput.value = limits.min;
          valInput.value = limits.min.toFixed(2);
          rebuildCharacter();
        }
        setStatus(`Mínimo de ${p.label}: ${limits.min.toFixed(2)}`);
      });

      // Modificación interactiva del límite Máximo
      maxInput.addEventListener('change', () => {
        let newMax = parseFloat(maxInput.value);
        if (isNaN(newMax)) return;
        if (newMax <= limits.min) newMax = limits.min + 0.05;
        limits.max = Number(newMax.toFixed(2));
        maxInput.value = limits.max.toFixed(2);
        rangeInput.max = limits.max;
        valInput.max = limits.max;
        if (CONFIG[zone][p.key] > limits.max) {
          CONFIG[zone][p.key] = limits.max;
          rangeInput.value = limits.max;
          valInput.value = limits.max.toFixed(2);
          rebuildCharacter();
        }
        setStatus(`Máximo de ${p.label}: ${limits.max.toFixed(2)}`);
      });
    }
  }

  const tabs = document.querySelectorAll('#zoneTabs .zone-tab');
  tabs.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.zone === zone);
  });

  const hudZone = $('activeZoneIndicator');
  if (hudZone) {
    hudZone.textContent = `Zona activa: ${ZONE_LABELS[zone] || zone}`;
  }
}

/**
 * Sincroniza todos los controles de la interfaz con el estado actual de CONFIG
 */
export function syncUI() {
  if ($('zoneSelect')) $('zoneSelect').value = CONFIG.selectedZone;
  if ($('skinColor')) $('skinColor').value = CONFIG.colors.skin;
  if ($('eyeColor')) $('eyeColor').value = CONFIG.colors.eyes;
  if ($('hairColor')) $('hairColor').value = CONFIG.colors.hair;
  if ($('beardColor')) $('beardColor').value = CONFIG.colors.beard || CONFIG.colors.hair;
  if ($('lipColor')) $('lipColor').value = CONFIG.colors.lips;
  if ($('clothColor')) $('clothColor').value = CONFIG.colors.cloth;
  if ($('animSpeedSlider')) $('animSpeedSlider').value = CONFIG.items.animSpeed ?? 1.0;
  if ($('animSpeedVal')) $('animSpeedVal').textContent = `${(CONFIG.items.animSpeed ?? 1.0).toFixed(2)}x`;
  syncAnimationButtonsUI();
  renderZoneSliders();
}

/**
 * Activa una animación de juego específica desde cualquier botón rápido o Ultimate
 */
function selectGameAnimation(animKey) {
  CONFIG.items.animation = animKey;
  CONFIG.items.animPlaying = true;
  restartAnimationTimer();
  rebuildCharacter();
  syncUI();

  if (animKey === 'none') {
    setStatus(`Pose Fija (${CONFIG.items.pose.toUpperCase()})`);
  } else {
    setStatus(`Anim: ${GAME_ANIMATIONS[animKey]?.name || animKey}`);
  }
}

/**
 * Enlaza todos los eventos de botones, pestañas, poses A/T, animaciones y selectores de color
 */
export function bindUI() {
  // Botones de Pose Base de Rigging (Pose A 45° y Pose T 90°)
  document.querySelectorAll('#bindPoseButtons .bind-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      CONFIG.items.pose = btn.dataset.bindpose;
      CONFIG.items.animation = 'none';
      rebuildCharacter();
      syncUI();
      setStatus(btn.dataset.bindpose === 'apose' ? 'Pose A (45° Rigging)' : 'Pose T (90° Rigging)');
    });
  });

  // Botones rápidos de Animaciones de Juego (Idle, Andar, Correr, Saltar, Nadar, Golpear, Patada...)
  document.querySelectorAll('#quickAnimButtons .anim-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectGameAnimation(btn.dataset.anim);
    });
  });

  // Botones de Skills Definitivas (Ultimates)
  document.querySelectorAll('#ultimateButtons .ult-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectGameAnimation(btn.dataset.anim);
    });
  });

  // Pausar / Reanudar animación en curso
  $('btnPlayPauseAnim')?.addEventListener('click', () => {
    if (!CONFIG.items.animation || CONFIG.items.animation === 'none') {
      selectGameAnimation('idle');
      return;
    }
    CONFIG.items.animPlaying = !CONFIG.items.animPlaying;
    syncAnimationButtonsUI();
    setStatus(CONFIG.items.animPlaying ? 'Animación en curso' : 'Animación en pausa');
  });

  // Slider de velocidad de animación
  $('animSpeedSlider')?.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    CONFIG.items.animSpeed = v;
    if ($('animSpeedVal')) $('animSpeedVal').textContent = `${v.toFixed(2)}x`;
  });

  // Selector desplegable de zona
  $('zoneSelect')?.addEventListener('change', (e) => {
    CONFIG.selectedZone = e.target.value;
    renderZoneSliders();
  });

  // Pestañas rápidas de zona
  document.querySelectorAll('#zoneTabs .zone-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      CONFIG.selectedZone = btn.dataset.zone;
      syncUI();
    });
  });

  // Botón enfocar cámara en zona activa
  $('btnFocusZone')?.addEventListener('click', () => {
    const z = CONFIG.selectedZone;
    if (z === 'cara' || z === 'pelo') setCameraPreset('face');
    else if (z === 'torso') setCameraPreset('torso');
    else if (z === 'brazos') setCameraPreset('brazos');
    else if (z === 'piernas') setCameraPreset('piernas');
    else setCameraPreset('full');
  });

  // Botones de biotipo / arquetipo con generación aleatoria condicional
  document.querySelectorAll('#archetypeButtons .preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#archetypeButtons .preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyArchetype(btn.dataset.archetype, { randomize: true });
      if (btn.dataset.archetype === 'proporcional') {
        CONFIG.selectedZone = 'cara';
        setCameraPreset('face');
      }
      syncUI();
      setStatus(`Biotipo ${btn.textContent.trim()}: Nueva variación aleatoria generada`);
    });
  });

  // Modo Edición Avanzada (Límites Extensibles)
  $('advModeToggle')?.addEventListener('change', (e) => {
    isAdvancedMode = e.target.checked;
    const actions = $('advActions');
    if (actions) actions.style.display = isAdvancedMode ? 'flex' : 'none';
    const badge = $('advModeBadge');
    if (badge) {
      badge.textContent = isAdvancedMode ? 'Activo' : 'Básico';
      badge.classList.toggle('active', isAdvancedMode);
    }
    renderZoneSliders();
    setStatus(isAdvancedMode ? 'Modo Avanzado: Límites personalizables activos' : 'Modo Básico');
  });

  // Botón expandir límites +50%
  $('btnExpandLimits')?.addEventListener('click', () => {
    const zone = CONFIG.selectedZone;
    const params = ZONE_PARAMS[zone] || [];
    params.forEach((p) => {
      const lim = getParamLimits(zone, p);
      const span = lim.max - lim.min;
      const newMin = Math.max(0.05, Number((lim.min - span * 0.25).toFixed(2)));
      const newMax = Number((lim.max + span * 0.25).toFixed(2));
      setParamLimits(zone, p.key, newMin, newMax);
    });
    renderZoneSliders();
    setStatus(`Límites ampliados +50% en ${ZONE_LABELS[zone] || zone}`);
  });

  // Botón Modo Extremo
  $('btnExtremeLimits')?.addEventListener('click', () => {
    const zone = CONFIG.selectedZone;
    const params = ZONE_PARAMS[zone] || [];
    params.forEach((p) => {
      setParamLimits(zone, p.key, 0.10, 2.50);
    });
    renderZoneSliders();
    setStatus(`Límites Extremos (0.10 a 2.50) habilitados en ${ZONE_LABELS[zone] || zone}`);
  });

  // Botón Restaurar Límites
  $('btnResetLimits')?.addEventListener('click', () => {
    const zone = CONFIG.selectedZone;
    const params = DEFAULT_ZONE_PARAMS[zone] || [];
    params.forEach((p) => {
      setParamLimits(zone, p.key, p.min, p.max);
      if (CONFIG[zone][p.key] < p.min) CONFIG[zone][p.key] = p.min;
      if (CONFIG[zone][p.key] > p.max) CONFIG[zone][p.key] = p.max;
    });
    rebuildCharacter();
    renderZoneSliders();
    setStatus(`Límites restaurados en ${ZONE_LABELS[zone] || zone}`);
  });

  // Selectores de color en tiempo real
  $('skinColor')?.addEventListener('input', (e) => {
    CONFIG.colors.skin = e.target.value;
    syncMaterialColors();
  });
  $('eyeColor')?.addEventListener('input', (e) => {
    CONFIG.colors.eyes = e.target.value;
    syncMaterialColors();
  });
  $('hairColor')?.addEventListener('input', (e) => {
    CONFIG.colors.hair = e.target.value;
    syncMaterialColors();
  });
  $('beardColor')?.addEventListener('input', (e) => {
    CONFIG.colors.beard = e.target.value;
    syncMaterialColors();
  });
  $('lipColor')?.addEventListener('input', (e) => {
    CONFIG.colors.lips = e.target.value;
    syncMaterialColors();
  });
  $('clothColor')?.addEventListener('input', (e) => {
    CONFIG.colors.cloth = e.target.value;
    syncMaterialColors();
  });

  // Botones de ángulo de cámara
  document.querySelectorAll('[data-cam]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCameraPreset(btn.dataset.cam);
      setStatus(`Vista: ${btn.textContent}`);
    });
  });

  // Aleatorizar cuerpo
  $('btnRandom')?.addEventListener('click', () => {
    document.querySelectorAll('#archetypeButtons .preset-btn').forEach((b) => b.classList.remove('active'));
    randomizeCharacter();
    syncUI();
    setStatus('Cuerpo aleatorizado');
  });

  // Restaurar valores originales
  $('btnReset')?.addEventListener('click', () => {
    resetCharacter();
    syncUI();
    setCameraPreset('full');
    setStatus('Pose A restaurada');
  });

  // Girar cámara
  $('btnRotate')?.addEventListener('click', (e) => {
    const active = toggleAutoRotate();
    e.currentTarget.classList.toggle('active', active);
    e.currentTarget.textContent = active ? 'Detener Giro' : 'Girar Cámara';
    setStatus(active ? 'Giro automático activo' : 'Giro detenido');
  });

  // Alternar vista malla / sólido
  $('btnWireframe')?.addEventListener('click', (e) => {
    const active = toggleWireframeMode();
    e.currentTarget.classList.toggle('active', active);
    e.currentTarget.textContent = active ? 'Vista Sólida' : 'Malla / Sólido';
    setStatus(active ? 'Modo malla (Wireframe)' : 'Modo sólido PBR');
  });

  // Exportar archivo .GLB
  $('btnExport')?.addEventListener('click', () => {
    exportCharacterGLB(setStatus);
  });

  // Contraer / Expandir panel lateral
  const togglePanel = () => {
    const collapsed = document.body.classList.toggle('panel-collapsed');
    const btn = $('btnTogglePanel');
    if (btn) {
      btn.innerHTML = collapsed ? '<span>▶ Panel</span>' : '<span>◀ Panel</span>';
    }
  };

  $('btnTogglePanel')?.addEventListener('click', togglePanel);

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'h' || e.key === 'H') && document.activeElement?.tagName !== 'INPUT') {
      togglePanel();
    }
  });
}
