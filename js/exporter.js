import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  characterGroup,
  CONFIG,
  applyPoseTransformations,
  alignCharacterToGround,
} from './character.js';
import { POSES, bakeAllGameAnimationClips } from './items.js';

/**
 * Exporta el personaje 3D procedural actual en formato binario .glb
 * situándolo en Pose A / Pose T de Rigging e incluyendo todas las pistas de animación
 * (Andar, Correr, Saltar, Nadar, Golpear, Patada, Skills Definitivas, etc.) embebidas en el GLB.
 *
 * @param {(statusText: string) => void} setStatus
 */
export function exportCharacterGLB(setStatus) {
  if (setStatus) setStatus('Horneando animaciones y exportando GLB…');

  // Colocar en la Pose de Rigging elegida (Pose A o Pose T) antes de serializar la malla
  const bindPoseKey = CONFIG.items.pose === 'tpose' ? 'tpose' : 'apose';
  applyPoseTransformations(POSES[bindPoseKey]);
  alignCharacterToGround();

  // Hornear los 14 clips de animación de juego para incluirlos en el archivo .glb
  const clips = bakeAllGameAnimationClips(30);

  const exporter = new GLTFExporter();
  exporter.parse(
    characterGroup,
    (buffer) => {
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `humano_${bindPoseKey}_con_animaciones.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (setStatus) setStatus(`GLB exportado (${clips.length} animaciones)`);
    },
    (error) => {
      console.error('Error al exportar GLB:', error);
      if (setStatus) setStatus('Error al exportar');
    },
    { binary: true, animations: clips }
  );
}
