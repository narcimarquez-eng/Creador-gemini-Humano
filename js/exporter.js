import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { characterGroup } from './character.js';

/**
 * Exporta el personaje 3D procedural actual en formato binario .glb
 * @param {(statusText: string) => void} setStatus
 */
export function exportCharacterGLB(setStatus) {
  if (setStatus) setStatus('Exportando GLB…');

  const exporter = new GLTFExporter();
  exporter.parse(
    characterGroup,
    (buffer) => {
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'humano_procedural_3d.glb';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (setStatus) setStatus('GLB exportado');
    },
    (error) => {
      console.error('Error al exportar GLB:', error);
      if (setStatus) setStatus('Error al exportar');
    },
    { binary: true }
  );
}
