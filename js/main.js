import { rebuildCharacter } from './character.js';
import { initViewer } from './viewer.js';
import { bindUI, syncUI, setStatus, ZONE_LABELS } from './ui.js';

/**
 * Punto de entrada principal del Generador de Personajes Humanos 3D Procedural
 */
function bootstrap() {
  const container = document.getElementById('viewport-container');

  // Inicializar escena Three.js y conectar el callback de selección por Raycaster
  initViewer(container, (pickedZone) => {
    syncUI();
    setStatus(`Seleccionado: ${ZONE_LABELS[pickedZone] || pickedZone}`);
  });

  // Construir el modelo anatómico 100% por código matemático
  rebuildCharacter();

  // Enlazar y sincronizar el panel de control
  bindUI();
  syncUI();
}

bootstrap();
