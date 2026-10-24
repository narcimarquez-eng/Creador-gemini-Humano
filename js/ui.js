import {
  CONFIG,
  rebuildCharacter,
  syncMaterialColors,
  applyArchetype,
  randomizeCharacter,
  resetCharacter,
} from './character.js';
import { POSES } from './items.js';
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
  items: 'Poses y Equipamiento',
};

/**
 * Definición exhaustiva de todos los sliders anatómicos por zona
 */
export const ZONE_PARAMS = {
  cara: [
    { key: 'headWidth', min: 0.80, max: 1.25, step: 0.01, label: 'Ancho de Cabeza' },
    { key: 'headHeight', min: 0.80, max: 1.25, step: 0.01, label: 'Alto de Cabeza' },
    { key: 'jawWidth', min: 0.75, max: 1.35, step: 0.01, label: 'Ancho Mandíbula' },
    { key: 'chinLength', min: 0.70, max: 1.40, step: 0.01, label: 'Proyección Mentón' },
    { key: 'browRidge', min: 0.60, max: 1.50, step: 0.01, label: 'Arco Superciliar' },
    { key: 'eyeSize', min: 0.65, max: 1.50, step: 0.01, label: 'Tamaño de Ojos' },
    { key: 'eyeSpacing', min: 0.75, max: 1.35, step: 0.01, label: 'Separación de Ojos' },
    { key: 'eyeY', min: 0.75, max: 1.25, step: 0.01, label: 'Altura de Ojos' },
    { key: 'noseLength', min: 0.65, max: 1.45, step: 0.01, label: 'Longitud de Nariz' },
    { key: 'noseWidth', min: 0.65, max: 1.45, step: 0.01, label: 'Ancho de Nariz' },
    { key: 'lipWidth', min: 0.70, max: 1.40, step: 0.01, label: 'Ancho de Labios' },
    { key: 'lipThickness', min: 0.60, max: 1.60, step: 0.01, label: 'Grosor de Labios' },
    { key: 'earSize', min: 0.65, max: 1.45, step: 0.01, label: 'Tamaño de Orejas' },
  ],
  pelo: [
    { key: 'volume', min: 0.80, max: 1.40, step: 0.01, label: 'Volumen Capilar' },
    { key: 'height', min: 0.70, max: 1.45, step: 0.01, label: 'Altura de Peinado' },
  ],
  torso: [
    { key: 'chestWidth', min: 0.75, max: 1.50, step: 0.01, label: 'Ancho de Pecho' },
    { key: 'waistWidth', min: 0.70, max: 1.45, step: 0.01, label: 'Ancho de Cintura' },
    { key: 'hipWidth', min: 0.75, max: 1.40, step: 0.01, label: 'Ancho de Cadera' },
    { key: 'chestDepth', min: 0.75, max: 1.45, step: 0.01, label: 'Profundidad Torácica' },
    { key: 'height', min: 0.80, max: 1.25, step: 0.01, label: 'Altura de Torso' },
    { key: 'neckWidth', min: 0.75, max: 1.40, step: 0.01, label: 'Grosor de Cuello' },
    { key: 'muscleDef', min: 0.00, max: 1.00, step: 0.02, label: 'Definición Muscular' },
  ],
  brazos: [
    { key: 'length', min: 0.75, max: 1.28, step: 0.01, label: 'Longitud de Brazos' },
    { key: 'thickness', min: 0.65, max: 1.55, step: 0.01, label: 'Grosor General' },
    { key: 'bicepSize', min: 0.70, max: 1.65, step: 0.01, label: 'Tamaño del Bíceps' },
    { key: 'forearmSize', min: 0.70, max: 1.45, step: 0.01, label: 'Grosor Antebrazo' },
    { key: 'handSize', min: 0.75, max: 1.30, step: 0.01, label: 'Tamaño de Mano' },
  ],
  piernas: [
    { key: 'length', min: 0.75, max: 1.28, step: 0.01, label: 'Longitud de Piernas' },
    { key: 'thickness', min: 0.68, max: 1.55, step: 0.01, label: 'Grosor de Muslo' },
    { key: 'calfSize', min: 0.70, max: 1.60, step: 0.01, label: 'Tamaño del Gemelo' },
    { key: 'gluteSize', min: 0.75, max: 1.45, step: 0.01, label: 'Volumen Glúteo' },
    { key: 'footSize', min: 0.75, max: 1.30, step: 0.01, label: 'Tamaño de Pie' },
  ],
  items: [],
};

export function setStatus(text) {
  const el = $('status');
  if (el) el.textContent = text;
}

/**
 * Renderiza controles desplegables adicionales según la zona activa (ej. Estilo de pelo o Poses/Ropa)
 */
function renderZoneExtraControls(zone) {
  const extraContainer = $('zoneExtraControls');
  if (!extraContainer) return;
  extraContainer.innerHTML = '';

  if (zone === 'pelo') {
    const row = document.createElement('div');
    row.className = 'extra-row';
    row.innerHTML = `
      <span>Estilo de Cabello</span>
      <select id="hairStyleSelect">
        <option value="corto">Corto Texturizado</option>
        <option value="cresta">Cresta / Tupé Atlético</option>
        <option value="medio">Media Melena Ondulada</option>
        <option value="largo">Melena Larga</option>
        <option value="recogido">Moño Superior</option>
        <option value="rapado">Rapado / Sin Pelo</option>
      </select>
    `;
    extraContainer.appendChild(row);
    const sel = row.querySelector('#hairStyleSelect');
    sel.value = CONFIG.pelo.style;
    sel.addEventListener('change', (e) => {
      CONFIG.pelo.style = e.target.value;
      rebuildCharacter();
      setStatus('Estilo de cabello actualizado');
    });
  } else if (zone === 'items') {
    const poseOptions = Object.entries(POSES)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
      .join('');

    extraContainer.innerHTML = `
      <div class="extra-row">
        <span>Pose Corporal</span>
        <select id="poseSelect">${poseOptions}</select>
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
    const outfitSel = extraContainer.querySelector('#outfitSelect');
    const accSel = extraContainer.querySelector('#accessorySelect');

    poseSel.value = CONFIG.items.pose;
    outfitSel.value = CONFIG.items.outfit;
    accSel.value = CONFIG.items.accessory;

    poseSel.addEventListener('change', (e) => {
      CONFIG.items.pose = e.target.value;
      rebuildCharacter();
      setStatus('Pose actualizada');
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
    const row = document.createElement('div');
    row.className = 'sl';
    const val = CONFIG[zone][p.key];
    row.innerHTML = `
      <span title="${p.label}">${p.label}</span>
      <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}" data-zone="${zone}" data-key="${p.key}" />
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
  }

  // Actualizar pestañas y etiqueta HUD inferior
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
  if ($('lipColor')) $('lipColor').value = CONFIG.colors.lips;
  if ($('clothColor')) $('clothColor').value = CONFIG.colors.cloth;
  renderZoneSliders();
}

/**
 * Enlaza todos los eventos de botones, pestañas y selectores de color
 */
export function bindUI() {
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

  // Botones de biotipo / arquetipo
  document.querySelectorAll('#archetypeButtons .preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#archetypeButtons .preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyArchetype(btn.dataset.archetype);
      syncUI();
      setStatus(`Biotipo: ${btn.textContent}`);
    });
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
    setStatus('Valores restaurados');
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

  // Contraer / Expandir panel lateral para ver el modelo 3D sin obstrucciones
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
