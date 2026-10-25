# Especificación Técnica: Anclaje Antirrotura, Material de Queratina y Anatomía Facial Avanzada

Implementación completa de las tres mejoras clave solicitadas para el realismo del generador de personajes 3D:
1. **Anclaje antirrotura de raíces del cabello** para eliminar cualquier desprendimiento o pelo flotante.
2. **Material de queratina física con brillo sedoso**, doble reflexión especular y clearcoat.
3. **Facciones humanas realistas**: Filtrum nasal con columnas del arco de Cupido, carúncula lagrimal en el canto medial y pliegue supratarsal.

---

### 1. Anclaje Antirrotura del Cabello (Eliminación del Pelo Flotante)

- **Causa raíz diagnosticada**: 
  - La función de acoplamiento conformal `conformPointToSkull` empujaba todos los puntos de la curva hacia afuera basándose en una holgura fija (`clearance ~ 2.2 cm`). Esto expulsaba la raíz ($t = 0$) lejos del cráneo, dejándola suspendida en el aire.
  - Además, las coordenadas iniciales de las raíces estaban vinculadas al slider `height` (`(0.235 + tierY) * height`), lo que provocaba que al aumentar la altura del pelo o modificar proporciones craneales, las raíces se levantaran verticalmente fuera de la cabeza.
- **Solución implementada**:
  - **Holgura dependiente de $t$ (`t-dependent clearance`)**:
    - En la raíz ($t = 0$), la holgura se establece en `-0.002` m (empotramiento folicular limpio dentro del cuero cabelludo).
    - Entre $t = 0$ y $t = 0.25$, la holgura transiciona suavemente mediante interpolación cúbica hacia el radio completo del mechón (`maxClearance`).
    - En el cuerpo y puntas ($t \ge 0.25$), se mantiene la protección completa contra penetración craneal.
  - **Proyección directa en superficie (`snapToSurface: true`)**:
    - Al conformar la raíz ($i = 0$), el punto se proyecta y clampa radialmente con precisión milimétrica sobre la elipsoide craneal.
    - Se garantiza el anclaje post-interpolación tras el cálculo de `CatmullRomCurve3`.
  - **Independencia de altura en la base**:
    - Las raíces de todos los peinados (`corto`, `medio`, `largo`, `cresta`, `recogido`, etc.) ahora nacen directamente a cota craneal fija; el multiplicador `height` y `volume` se aplica a la cresta, cuerpo y puntas del mechón, asegurando que las raíces permanezcan ancladas sin importar los valores de los deslizadores.

---

### 2. Material PBR de Queratina con Brillo Sedoso

- **Actualización de materiales (`MAT.hair`, `MAT.beard`, `MAT.scalpTransition`)**:
  - Migración de `MeshStandardMaterial` plano a `MeshPhysicalMaterial` con física de cutícula de queratina:
    - **Brillo sedoso (*Sheen*)**: `sheen: 0.88`, `sheenRoughness: 0.35`, simulando la dispersión de luz secundaria interna característica de las fibras capilares sedosas.
    - **Capa lipídica protectora (*Clearcoat*)**: `clearcoat: 0.48`, `clearcoatRoughness: 0.28`, recreando el reflejo especular primario nítido de la cutícula capilar.
    - **Reflectividad y aspereza equilibrada**: `roughness: 0.42`, `reflectivity: 0.60`.
  - **Sincronización cromática dinámica (`syncMaterialColors`)**:
    - Al cambiar el color de cabello o barba en la interfaz, se recalculan automáticamente los tintes de brillo especular mediante traslación armónica HSL (`offsetHSL(0, 0.08, 0.16)`), manteniendo un brillo vivo y sedoso en cabellos negros, castaños, rubios, pelirrojos o teñidos.

---

### 3. Facciones Humanas Realistas: Filtrum Nasal y Conducto Lagrimal

- **Filtrum Nasal y Arco de Cupido**:
  - Ubicado entre la columela de la nariz ($y \approx 0.082$) y el labio superior ($y \approx 0.051$):
    - **Columnas philtrales bilaterales**: Dos crestas dérmicas anatómicas que nacen estrechas bajo el tabique nasal ($x = \pm 0.0040$) y divergen hacia los dos vértices del arco de Cupido ($x = \pm 0.0088$).
    - **Surco philtral central (*sulcus philtralis*)**: Depresión cóncava sutil esculpida entre ambas columnas que genera la sombra y el relieve natural característico del rostro humano.
    - Se integra con `faceSkinMat`, heredando automáticamente el tono de piel, rubor facial y shader de microporos procedurales.
- **Conducto Lagrimal, Carúncula y Menisco**:
  - **Carúncula lagrimal en el canto medial**: Nódulo elipsoidal de tejido mucoso suave ubicado en la comisura nasal interna de cada ojo.
  - **Material mucoso físico (`MAT.caruncula`)**: `roughness: 0.15`, `clearcoat: 0.95`, `transmission: 0.10`, `ior: 1.38`.
  - **Menisco lagrimal**: Micro-reflejo especular blanco de película húmeda sobre la carúncula.
  - **Adaptación al tono de piel**: `syncMaterialColors` modula armónicamente el tono salmón-mucoso según la melanina del biotipo.
- **Pliegue Supratarsal (*Eyelid Crease*)**:
  - Pliegue superior del párpado que otorga profundidad tridimensional a la mirada y delimita la órbita ocular.
