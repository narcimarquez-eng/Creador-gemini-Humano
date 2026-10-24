# Generador de Personajes Humanos 3D Procedural (Anatomía Muscular y Facial)

Estudio interactivo de creación y escultura paramétrica de personajes humanos en 3D generado 100% por código matemático en Three.js (sin cargar modelos `.glb` externos), organizado en una arquitectura modular limpia y listo para ejecutarse y exportar modelos en formato `.glb`.

### User Review & Critical Decisions

> [!IMPORTANT]
> Se han consolidado todas tus especificaciones para construir el generador humano 100% procedural siguiendo la organización modular de `estructura.txt` y corrigiendo el entorno de ejecución para que la aplicación inicie sin errores.

- **Decisión Confirmada 1 — Generación 100% Procedural de Alta Fidelidad (Cero `.glb` externos)**: En lugar de usar primitivas básicas aisladas (que parecen un maniquí de madera) o cargar modelos externos, toda la anatomía se generará matemáticamente mediante perfiles curvos orgánicos (`LatheGeometry` con `SplineCurve`), trayectorias tubulares (`TubeGeometry`) y manipulación directa de vértices en `BufferGeometry` con suavizado de normales.
- **Decisión Confirmada 2 — Arquitectura Modular Completa**: El proyecto se estructurará en módulos especializados (Visor 3D, Generador Matemático Procedural, Ensamblaje de Personaje y Esqueleto, Sistema de Prendas/Poses, Exportador GLTF/GLB e Interfaz de Usuario) servidos mediante Vite en el puerto 3000.
- **Decisión Confirmada 3 — Jerarquía Esquelética Conectada y Selección por Raycaster**: Cada segmento corporal (pelvis, torso, pecho, cuello, cabeza, hombros, brazos, codos, antebrazos, manos, muslos, rodillas, pantorrillas, tobillos y pies) estará anclado a pivotes `THREE.Group()` para que ningún miembro flote al escalar grosores o longitudes, permitiendo además seleccionar cualquier zona haciendo clic directamente sobre el cuerpo 3D.

---

### 1. Overview & Core Concept

- **Qué Hace**: Permite esculpir y personalizar en tiempo real un cuerpo humano 3D completo generado íntegramente mediante algoritmos geométricos. El usuario puede ajustar proporciones craneales y rasgos faciales detallados, volumen y estilo de cabello, anchura torácica, definición muscular (pectorales, deltoides, abdominales, oblicuos, dorsales, bíceps, tríceps, cuádriceps, gemelos y glúteos), extremidades con articulaciones anatómicas (rodillas, codos, tobillos, manos y pies), colores, poses y accesorios, y descargar el resultado como archivo `.glb`.
- **Audiencia / Uso**: Artistas técnicos, desarrolladores de videojuegos y diseñadores que buscan generar personajes humanos paramétricos listos para exportar sin depender de librerías de assets externos.
- **Valor Principal**: Combina la flexibilidad de un sistema paramétrico 100% basado en código con curvas anatómicas suaves, articulaciones conectadas sin cortes visuales y una interfaz estilo configurador de estudio.

---

### 2. User Experience & Visual Design

- **Flujos de Usuario Principales**:
  1. **Inspección y Selección por Clic (Raycasting)**: Al iniciar, el usuario visualiza el personaje humano en un estudio 3D iluminado con tres puntos de luz y reflejos de entorno. Al hacer clic sobre cualquier parte del cuerpo (Cabeza/Cara, Cabello, Torso, Brazos o Piernas), el sistema resalta sutilmente la zona seleccionada, enfoca suavemente la cámara si se desea y actualiza el panel izquierdo con los controles específicos de esa región.
  2. **Edición Paramétrica en Tiempo Real**: El usuario desliza controles de precisión para modificar rasgos faciales, masa muscular, definición anatómica, grosores y longitudes. El esqueleto recalcula automáticamente las posiciones de hombros, codos, muñecas, caderas, rodillas y tobillos para mantener el cuerpo perfectamente unido y los pies apoyados sobre el suelo.
  3. **Apariencia, Poses y Equipamiento Procedural**: Desde el panel, el usuario personaliza tonos de piel, iris, cabello y labios, alterna entre estilos de cabello procedurales, aplica poses anatómicas (Pose A, Pose T, Doble Bíceps, Atlética) o activa prendas procedurales opcionales.
  4. **Aleatorización Coherente y Exportación GLB**: Con un clic en *Randomizar Cuerpo*, se generan proporciones humanas coherentes (atlético, corpulento, estilizado, etc.). Con *Exportar GLB*, se empaqueta la jerarquía 3D en un binario `.glb` descargable.

- **Identidad Visual y Tema**:
  - *Dirección Estética*: Configurador de estudio anatómico y automotriz de alta precisión, limpio y luminoso, donde el modelo 3D ocupa el protagonismo absoluto.
  - *Paleta de Colores*: Lienzo de estudio neutro (`--background: #eef2f6` con gradiente radial suave), panel de control claro de alto contraste (`#ffffff` con bordes `#e2e8f0`), tipografía principal en pizarra oscura (`#0f172a`), textos secundarios en `#475569` y acento interactivo azul cobalto (`#0055ff` / `#2563eb`).
  - *Tipografía y Jerarquía*: Tipografía geométrica limpia (`Plus Jakarta Sans` / `DM Sans`) para encabezados y etiquetas de controles, combinada con numerales tabulares (`tabular-nums`) para los valores exactos de cada proporción.
  - *Diseño del Panel y Controles*: Panel lateral izquierdo organizado por pestañas/zonas claras, deslizadores de respuesta inmediata, selectores de color integrados, botones de cámara rápida (Cuerpo Completo, Rostro, Torso, Perfil) y barra de estado limpia.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Escultura Matemática con `LatheGeometry`, `TubeGeometry` y Deformación de Vértices**
  - *Enfoque Elegido*: Construir cada segmento anatómico mediante perfiles 2D interpolados con `SplineCurve` revolucionados con `LatheGeometry` y deformados asimétricamente en X/Z (por ejemplo, el torso es más ancho que profundo y se estrecha en la cintura; el muslo y la pantorrilla tienen curvatura de cuádriceps y gemelo), complementados con volúmenes musculares esculpidos que emergen según el parámetro `muscleDef`.
  - *Por Qué*: Las primitivas simples (`CylinderGeometry`, `BoxGeometry`) producen un aspecto robótico o de maniquí rígido. Las geometrías de revolución deformadas por vértices logran siluetas humanas orgánicas 100% en código.
  - *Alternativas Descartadas*: Cargar un archivo `.glb` externo (descartado por restricción explícita) o usar `MarchingCubes` puros (descartado porque pierde definición nítida en rasgos faciales como ojos, nariz, labios y orejas).

- **Decisión 2: Sistema de Esqueleto Jerárquico (`THREE.Group` Rig) con Cinemática Directa**
  - *Enfoque Elegido*: Organizar el cuerpo en un árbol de nodos articulados donde cada articulación (`shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`, `neck`) es hija del segmento superior y actualiza su posición local en función de la longitud real del hueso padre.
  - *Por Qué*: Garantiza que al estirar brazos, piernas o torso, o al rotar articulaciones en distintas poses, las extremidades nunca se separen ni floten, y los pies siempre descansen a nivel `y = 0`.

- **Decisión 3: Entorno Vite + ES Modules sin Dependencias Pesadas**
  - *Enfoque Elegido*: Configurar `package.json` con Vite y `three` para servir la aplicación en el puerto 3000, manteniendo el código modular en JavaScript/ES Modules.
  - *Por Qué*: Soluciona de raíz el error de empaquetado (`Bun could not find a package.json file`) y permite recarga instantánea y exportación limpia con `GLTFExporter`.

---

### 4. Technical Architecture & Data Strategy

- **Diagrama de Arquitectura y Jerarquía de Componentes**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        APLICACIÓN WEB (Puerto 3000)                        │
├───────────────────────────────┬────────────────────────────────────────────┤
│     INTERFAZ DE CONTROL       │             MOTOR 3D (Three.js)            │
│                               │                                            │
│  ┌─────────────────────────┐  │  ┌──────────────────────────────────────┐  │
│  │ Selector de Zona / Clic │◄─┼──┤ Raycaster (Selección en Cuerpo 3D)   │  │
│  │ (Cara, Pelo, Torso,     │  │  └──────────────────┬───────────────────┘  │
│  │  Brazos, Piernas, Pose) │  │                     ▼                      │
│  └────────────┬────────────┘  │  ┌──────────────────────────────────────┐  │
│               ▼               │  │ Escena, Luces Estudio, OrbitControls │  │
│  ┌─────────────────────────┐  │  └──────────────────┬───────────────────┘  │
│  │ Sliders Dinámicos y     │  │                     ▼                      │
│  │ Selectores de Color     ├──┼─►┌──────────────────────────────────────┐  │
│  └────────────┬────────────┘  │  │ Jerarquía Anatómica (Character Rig)  │  │
│               ▼               │  │  ├─ Pelvis & Glúteos                 │  │
│  ┌─────────────────────────┐  │  │  ├─ Torso (Pecho, Abs, Dorsales)     │  │
│  │ Acciones:               │  │  │  │   ├─ Cuello ► Cabeza (Cara, Pelo) │  │
│  │ • Randomizar Coherente  ├──┼─►│  │   └─ Hombros L/R ► Brazos ►       │  │
│  │ • Restaurar Valores     │  │  │  │      Codos ► Antebrazos ► Manos   │  │
│  │ • Poses y Cámara        │  │  │  └─ Caderas L/R ► Muslos ► Rodillas  │  │
│  │ • Exportar Archivo .GLB ├──┼─►│     ► Pantorrillas ► Tobillos ► Pies │  │
│  └─────────────────────────┘  │  └──────────────────┬───────────────────┘  │
│                               │                     ▼                      │
│                               │  ┌──────────────────────────────────────┐  │
│                               │  │ Generador Procedural Matemático      │  │
│                               │  │ (LatheGeometry, TubeGeometry,        │  │
│                               │  │  Deformación BufferGeometry, PBR)    │  │
│                               │  └──────────────────────────────────────┘  │
└───────────────────────────────┴────────────────────────────────────────────┘
```

- **Modelo de Datos y Estado (`CONFIG`)**:
  - `selectedZone`: Zona activa (`'cara'`, `'pelo'`, `'torso'`, `'brazos'`, `'piernas'`, `'items'`).
  - `colors`: `{ skin, eyes, hair, lips, clothes }`.
  - `cara`: `{ headWidth, headHeight, jawWidth, chinLength, browRidge, eyeSize, eyeSpacing, eyeY, noseLength, noseWidth, lipWidth, lipThickness, earSize }`.
  - `pelo`: `{ style, volume, height, length }`.
  - `torso`: `{ chestWidth, waistWidth, hipWidth, chestDepth, height, neckWidth, shoulderWidth, muscleDef }`.
  - `brazos`: `{ length, thickness, bicepSize, forearmSize, handSize }`.
  - `piernas`: `{ length, thighThickness, calfSize, gluteSize, footSize }`.
  - `pose`: Pose activa (`'neutral'`, `'tpose'`, `'flex'`, `'athletic'`, `'walk'`) y equipamiento opcional.

- **Mapeo de Interacción y Actualización de Estado**:
  - **Al mover cualquier slider anatómico**: Se actualiza el estado `CONFIG`, se recalculan las escalas no uniformes, perfiles de músculos (`muscleDef`) y posiciones de articulaciones en la jerarquía `THREE.Group`, y se ajusta la altura de la raíz (`characterGroup.position.y`) para que las plantas de los pies permanezcan siempre en contacto exacto con el suelo (`y = 0`).
  - **Al hacer clic en el lienzo 3D**: `THREE.Raycaster` intersecta las mallas del personaje, sube por el árbol hasta encontrar `userData.zone`, selecciona esa zona en el panel lateral, regenera los sliders correspondientes y emite un breve destello/resaltado visual en la zona seleccionada.
  - **Al pulsar Exportar GLB**: `GLTFExporter` serializa el `characterGroup` completo en modo binario (`binary: true`) y descarga el archivo `.glb` listo para usarse en Blender, Unity, Unreal o cualquier visor 3D.
