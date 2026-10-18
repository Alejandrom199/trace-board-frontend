# PROYECTO: TRACEBOARD — Visual Requirements Intelligence

## 1. Contexto y origen de la idea

Soy ingeniero de software y actualmente realizo levantamientos de requisitos para sistemas informáticos.

He identificado una limitación importante en las herramientas tradicionales de análisis: normalmente trabajamos con documentos Word, hojas Excel, diagramas de flujo, capturas de pantalla, entrevistas, PDFs, notas y documentación dispersa.

Aunque existen herramientas para elaborar diagramas y conectar elementos mediante flechas, la experiencia resulta demasiado simple y fragmentada.

Quiero desarrollar una herramienta que transforme completamente esa experiencia.

**La inspiración principal es el tablero de investigación de un detective o investigador privado.**

Imagina una pared donde un detective coloca fotografías, documentos, anotaciones, evidencias, nombres, acontecimientos y conexiones para comprender un caso.

Quiero trasladar ese concepto al mundo de la ingeniería de software, especialmente al levantamiento de requisitos, análisis de negocio, análisis de sistemas y diseño de soluciones tecnológicas.

No busco simplemente otro editor de diagramas, mapa mental o pizarra digital.

Busco una herramienta donde un ingeniero pueda investigar un sistema, descubrir relaciones entre distintas fuentes de información, detectar inconsistencias, comprender procesos y transformar los descubrimientos en requisitos de software estructurados y trazables.

El nombre provisional del producto es:

**TraceBoard — Visual Requirements Intelligence**

---

## 2. Visión del producto

TraceBoard será un entorno de investigación visual basado en un lienzo infinito donde los usuarios puedan incorporar información heterogénea y relacionarla semánticamente.

El tablero debe permitir colocar:

- Notas y textos enriquecidos.
- Documentos PDF.
- Documentos Word.
- Hojas Excel.
- Imágenes y capturas de pantalla.
- Enlaces a páginas web.
- Fragmentos de código.
- Información de APIs.
- Consultas SQL.
- Entrevistas y transcripciones.
- Procesos de negocio.
- Problemas identificados.
- Reglas de negocio.
- Hallazgos de investigación.
- Requisitos funcionales.
- Requisitos no funcionales.
- Decisiones técnicas.
- Actores y stakeholders.
- Sistemas externos y dependencias.

Los elementos deben poder moverse libremente por el lienzo, agruparse, conectarse, inspeccionarse y editarse.

Cada conexión debe tener significado.

Por ejemplo:

- Una entrevista EVIDENCIA un problema.
- Un Excel CONFIRMA una inconsistencia.
- Un problema ORIGINA un requisito.
- Un requisito DEPENDE DE otro requisito.
- Una regla de negocio AFECTA un proceso.
- Una evidencia CONTRADICE otra evidencia.
- Un mockup REPRESENTA una solución.
- Una decisión técnica IMPLEMENTA una necesidad.

La finalidad es construir un grafo de conocimiento visual sobre el sistema investigado.

**Principio fundamental: el lienzo es una representación visual del conocimiento, no la fuente única de la información.**

Las entidades y sus relaciones deben persistir independientemente de su posición visual.

---

## 3. Productos de referencia

Tomar como inspiración conceptual las siguientes herramientas:

### Heptabase

Por su enfoque de investigación, tarjetas visuales, documentación y organización del conocimiento.

### Obsidian Canvas

Por su lienzo infinito, conexiones entre notas, archivos y su formato JSON Canvas.

### Miro

Por su facilidad de interacción, colaboración y distribución de elementos en una pizarra.

### Milanote

Por su experiencia visual semejante a un tablero de investigación con imágenes, documentos y notas.

### tldraw

Por su SDK de lienzo infinito, herramientas de dibujo, personalización de elementos e interacción.

### React Flow / XYFlow

Como alternativa para implementar relaciones visuales tipificadas y nodos personalizados.

No quiero copiar una herramienta existente.

Quiero combinar lo mejor de estas experiencias y agregar capacidades específicamente diseñadas para ingeniería de requisitos.

---

## 4. Filosofía de diseño

La aplicación debe sentirse como una mezcla entre:

1. Un tablero de detective.
2. Un espacio de investigación técnica.
3. Un gestor de conocimiento.
4. Una herramienta de ingeniería de requisitos.
5. Un sistema de trazabilidad.

La experiencia debe permitir dos modos de trabajo complementarios.

### Modo A: Investigación libre

El usuario comienza sin una estructura obligatoria.

Puede colocar documentos, notas, imágenes y evidencias en cualquier lugar.

Puede agrupar información, añadir anotaciones y conectar elementos mientras descubre cómo funciona el sistema.

Debe preservar la sensación de libertad de una investigación.

### Modo B: Ingeniería estructurada

Una vez que la investigación avanza, el usuario puede transformar hallazgos en:

- Requisitos funcionales.
- Requisitos no funcionales.
- Reglas de negocio.
- Procesos.
- Historias de usuario.
- Criterios de aceptación.
- Dependencias.
- Decisiones arquitectónicas.

Ambos modos trabajan sobre las mismas entidades y relaciones.

No deben existir copias separadas de la información.

---

## 5. Ejemplo de uso

Imagina que estoy realizando el levantamiento de requisitos para un sistema de inventario.

Tengo los siguientes materiales:

**Documento A: entrevista.pdf**

Contiene una entrevista con el encargado de bodega.

En la entrevista se menciona que los registros del inventario no coinciden con las existencias físicas.

**Documento B: inventario.xlsx**

Contiene movimientos de inventario con registros potencialmente duplicados.

**Documento C: captura.png**

Muestra la interfaz del sistema actual.

**Hallazgo H-001**

No existe suficiente trazabilidad sobre los movimientos de inventario.

**Requisito RF-001**

El sistema debe registrar cada movimiento de inventario con fecha, usuario, producto, cantidad y tipo de movimiento.

En el tablero quiero poder:

1. Arrastrar los tres archivos al lienzo.
2. Previsualizar sus contenidos.
3. Crear una tarjeta con el hallazgo H-001.
4. Conectar la entrevista y el Excel al hallazgo.
5. Crear RF-001 a partir del hallazgo.
6. Conectar el requisito con las evidencias que lo justifican.
7. Abrir RF-001 y visualizar su contexto, relaciones y fuentes.
8. Identificar qué otros procesos o requisitos podrían verse afectados.

En el futuro, quiero poder preguntarle a una IA:

"¿Qué evidencias justifican el requisito RF-001?"

O:

"¿Qué inconsistencias encontraste entre la entrevista y el archivo Excel?"

La IA deberá responder utilizando fuentes identificables, evitando inventar información.

---

## 6. Diseño de la interfaz

Quiero una aplicación web moderna, profesional, atractiva y altamente interactiva.

La interfaz inicial tendrá cinco zonas principales.

### A. Barra superior

Debe mostrar:

- Nombre de la aplicación.
- Nombre de la investigación activa.
- Estado de guardado.
- Controles generales.
- Acceso a configuraciones.

### B. Barra lateral izquierda

Debe ofrecer herramientas para crear:

- Nota.
- Documento.
- Imagen.
- Hallazgo.
- Problema.
- Proceso.
- Requisito.
- Regla de negocio.
- Actor.
- Grupo visual.

También debe mostrar una lista de recursos asociados con la investigación.

### C. Lienzo principal

Será el centro de la experiencia.

Características:

- Lienzo infinito.
- Zoom.
- Paneo.
- Selección múltiple.
- Arrastrar y soltar.
- Conectores visuales.
- Flechas con etiquetas.
- Tarjetas de diferentes tipos.
- Agrupación.
- Colores por categoría.
- Diseño visual libre.
- Atajos de teclado.
- Menús contextuales.
- Interacciones fluidas.
- Persistencia del estado.

Quiero una estética inspirada en herramientas profesionales como Linear, Figma, Obsidian y tldraw.

No quiero una interfaz infantil ni un tablero sobrecargado de colores.

Usar una estética limpia, refinada, con jerarquía visual clara, tipografía moderna, bordes sutiles y modo oscuro.

### D. Panel lateral derecho

Al seleccionar un elemento, debe abrirse un inspector con:

- Título.
- Tipo de entidad.
- Descripción.
- Propiedades.
- Estado.
- Relaciones entrantes.
- Relaciones salientes.
- Evidencias asociadas.
- Archivos adjuntos.
- Acciones disponibles.

Para requisitos, mostrar adicionalmente:

- Identificador.
- Prioridad.
- Estado de validación.
- Criterios de aceptación.
- Fuente de origen.
- Dependencias.

### E. Explorador de investigaciones

Debe ser posible crear y abrir proyectos de investigación.

Cada investigación tendrá:

- Nombre.
- Descripción.
- Fecha de creación.
- Tableros.
- Recursos.
- Entidades.
- Relaciones.

---

## 7. Tipos de tarjetas

Diseñar un sistema extensible de tarjetas personalizadas.

Inicialmente implementar:

### NoteCard

Tarjeta de texto para anotaciones libres.

### DocumentCard

Representa un PDF, Word o Excel.

Debe incluir nombre, extensión, tamaño, icono y acción para abrir una previsualización.

### ImageCard

Presenta una imagen directamente en el tablero.

### FindingCard

Representa un descubrimiento o hallazgo durante la investigación.

### RequirementCard

Representa un requisito con identificador, título, prioridad y estado.

### ProcessCard

Representa un proceso de negocio.

Cada tipo de tarjeta debe tener diseño visual consistente, pero fácilmente distinguible.

Implementar una estructura que permita agregar tipos nuevos sin reescribir el motor principal.

---

## 8. Relaciones semánticas

Las conexiones entre tarjetas no deben ser simples líneas decorativas.

Cada relación deberá tener:

- Identificador.
- Nodo de origen.
- Nodo de destino.
- Tipo de relación.
- Etiqueta visible.
- Descripción opcional.
- Metadatos.
- Fecha de creación.

Tipos iniciales:

- EVIDENCES
- DEPENDS_ON
- CONTRADICTS
- ORIGINATES
- AFFECTS
- IMPLEMENTS
- REFERENCES
- RELATED_TO

En el lienzo deben mostrarse etiquetas legibles.

Las relaciones podrán modificarse y eliminarse.

El sistema deberá validar que los nodos referenciados existan.

---

## 9. Arquitectura tecnológica

Propuesta inicial:

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- tldraw como primera opción para el lienzo.
- Zustand si se necesita gestión de estado adicional.
- Componentes accesibles y reutilizables.

Antes de adoptar tldraw, revisar su API, compatibilidad y condiciones de licencia vigentes.

Compararlo brevemente con React Flow.

Para el prototipo, elegir el motor que mejor resuelva el lienzo infinito, las tarjetas multimedia y las conexiones semánticas sin introducir complejidad innecesaria.

### Backend

- NestJS.
- TypeScript.
- API REST.
- Validación de entradas.
- Arquitectura modular.

### Base de datos

- PostgreSQL.
- Prisma ORM.

Entidades principales:

- Investigation.
- Board.
- Node.
- Edge.
- Asset.
- Requirement.
- EvidenceReference.

Inicialmente almacenar las relaciones en PostgreSQL.

No introducir Neo4j hasta tener una necesidad real que justifique una base de datos de grafos.

### Almacenamiento

Para desarrollo local, usar un sistema de archivos o almacenamiento local controlado.

Diseñar una interfaz de almacenamiento que permita migrar posteriormente a S3 o Cloudflare R2.

### Inteligencia artificial

No incorporar IA en la primera versión.

La arquitectura debe permitir agregar posteriormente:

- Extracción de contenido.
- Indexación.
- Búsqueda semántica.
- RAG.
- Identificación de contradicciones.
- Generación asistida de requisitos.
- Consultas sobre evidencias.

Toda sugerencia de IA debe conservar la referencia a su fuente y requerir validación humana antes de convertirse en un requisito aprobado.

---

## 10. Modelo de datos conceptual

Considerar un modelo como punto de partida:

```typescript
type NodeType =
  | "note"
  | "document"
  | "image"
  | "finding"
  | "problem"
  | "process"
  | "requirement"
  | "business_rule"
  | "actor";

type RelationType =
  | "evidences"
  | "depends_on"
  | "contradicts"
  | "originates"
  | "affects"
  | "implements"
  | "references"
  | "related_to";

interface Investigation {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvestigationNode {
  id: string;
  investigationId: string;
  type: NodeType;
  title: string;
  description?: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface InvestigationEdge {
  id: string;
  investigationId: string;
  sourceId: string;
  targetId: string;
  relation: RelationType;
  label?: string;
  description?: string;
}

interface BoardElement {
  id: string;
  boardId: string;
  nodeId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface Requirement {
  nodeId: string;
  code: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "review" | "approved" | "rejected";
  acceptanceCriteria: string[];
}
```

Este modelo es una referencia inicial, no un contrato definitivo.

Revisar su coherencia, normalización, integridad referencial y compatibilidad con el editor elegido.

Mantener separados:

1. El modelo de dominio.
2. El estado visual del tablero.
3. Los metadatos de archivos.
4. Las referencias a evidencias.

No acoplar los identificadores internos del motor de canvas con las entidades permanentes del dominio.

---

## 11. MVP — Primera versión funcional

No desarrollar el producto completo inmediatamente.

Quiero comenzar con un MVP pequeño, estable y extensible.

### Objetivo del MVP

Demostrar que es posible investigar visualmente un sistema conectando documentos, hallazgos y requisitos.

### Funcionalidades obligatorias

**F1. Investigaciones**

Crear, listar y abrir investigaciones.

**F2. Lienzo**

Visualizar un tablero infinito donde el usuario pueda crear, mover y organizar tarjetas.

**F3. Tarjetas**

Crear, editar y eliminar notas, hallazgos y requisitos.

**F4. Recursos**

Subir imágenes, PDF y Excel.

Permitir una previsualización razonable dentro de la aplicación mediante un panel o visor.

No es obligatorio renderizar hojas Excel completas dentro de las tarjetas del tablero.

**F5. Relaciones**

Conectar tarjetas y establecer relaciones semánticas.

**F6. Inspector**

Seleccionar una tarjeta y ver sus propiedades y relaciones.

**F7. Persistencia**

Guardar y recuperar investigaciones y tableros.

**F8. Trazabilidad básica**

Seleccionar un requisito y visualizar las evidencias que lo sustentan.

### Fuera del alcance del MVP

- IA generativa.
- Colaboración en tiempo real.
- Gestión empresarial de permisos.
- Integración con Jira.
- Integración con Azure DevOps.
- Generación automática de documentos SRS.
- Diagramación BPMN avanzada.
- Neo4j.
- Microservicios.
- Procesamiento inteligente de entrevistas.
- Versionado avanzado de documentos.

Estas características se considerarán posteriormente.

---

## 12. Estrategia de implementación

Trabajar de forma incremental y con entregables ejecutables.

### Etapa 1: Prototipo visual

Construir la aplicación frontend con:

- Interfaz principal.
- Lienzo interactivo.
- Barra de herramientas.
- Tarjetas personalizadas.
- Conexiones semánticas.
- Inspector de propiedades.
- Datos de demostración.

En esta etapa se permite usar almacenamiento local temporal.

Priorizar la validación de la experiencia de usuario.

### Etapa 2: Persistencia real

Implementar:

- Backend.
- Base de datos.
- Investigaciones.
- Tableros.
- Persistencia de nodos.
- Persistencia de conexiones.

### Etapa 3: Archivos y evidencias

Implementar:

- Subida de documentos.
- Almacenamiento.
- Metadatos.
- Previsualización.
- Asociación de archivos con entidades.

### Etapa 4: Requisitos estructurados

Implementar:

- Códigos de requisitos.
- Prioridades.
- Estados.
- Criterios de aceptación.
- Relaciones de trazabilidad.
- Navegación entre evidencias y requisitos.

### Etapa 5: Calidad

Incluir:

- Validaciones.
- Manejo de errores.
- Pruebas unitarias relevantes.
- Pruebas de integración.
- Verificación del build.
- Documentación técnica.
- README de instalación y ejecución.

---

## 13. Experiencia de usuario esperada

Quiero que el producto resulte agradable de utilizar durante sesiones extensas de análisis.

Evitar interfaces rígidas con formularios permanentes que ocupen demasiado espacio.

Priorizar acciones rápidas.

Ejemplos:

- Doble clic sobre el canvas para añadir una nota.
- Arrastrar un archivo al tablero para crear una tarjeta.
- Seleccionar dos entidades para conectarlas.
- Clic sobre una conexión para cambiar su significado.
- Clic sobre un requisito para inspeccionar sus evidencias.
- Menú contextual para crear elementos relacionados.
- Atajos para navegar por el lienzo.
- Guardado automático con indicación visible.

La experiencia debe transmitir la sensación de construir una investigación, no de llenar formularios.

---

## 14. Posicionamiento futuro

TraceBoard podría evolucionar hasta convertirse en una plataforma especializada en:

- Business Analysis.
- Requirements Engineering.
- Systems Analysis.
- Software Discovery.
- Knowledge Mapping.
- Architecture Discovery.
- Impact Analysis.
- Technical Investigation.

Su propuesta de valor sería:

"Investiga visualmente sistemas, conecta evidencias y convierte descubrimientos en requisitos trazables."

El producto podría ser utilizado por:

- Ingenieros de software.
- Analistas funcionales.
- Analistas de negocio.
- Arquitectos de software.
- Product Owners.
- Consultores tecnológicos.
- Equipos de transformación digital.

No asumir todavía que existe una oportunidad comercial validada.

Primero demostrar utilidad real mediante un MVP y casos de uso.

---

## 15. Instrucciones para Codex

Quiero que trabajes como **arquitecto de software senior, ingeniero full-stack y diseñador de producto**.

Tu responsabilidad no es simplemente escribir código, sino tomar decisiones técnicas que permitan construir una aplicación funcional y mantenible.

Sigue estas reglas:

1. Inspecciona primero el repositorio actual. Si está vacío, inicializa el proyecto.
2. Define una estructura clara de carpetas y componentes.
3. Utiliza TypeScript estricto.
4. Prefiere soluciones existentes y probadas antes de implementar infraestructura innecesaria.
5. Evita la sobreingeniería.
6. Prioriza el funcionamiento del prototipo antes de introducir características avanzadas.
7. Separa el dominio de requisitos del motor visual.
8. Mantén componentes pequeños, reutilizables y bien tipados.
9. Implementa estados de carga, vacío y error.
10. Utiliza datos de demostración realistas.
11. Ejecuta comprobaciones de tipos, lint y build cuando sea posible.
12. No afirmes que una funcionalidad está implementada si solamente existe como un elemento decorativo.
13. Documenta las decisiones arquitectónicas relevantes.
14. Si una biblioteca presenta incompatibilidades o restricciones, explica el problema y adopta una alternativa razonable.
15. No agregues funcionalidades fuera del alcance de la etapa actual sin justificación.

## 16. Primera tarea que debes realizar

**Comienza a construir la Etapa 1: prototipo visual funcional de TraceBoard.**

No quiero que te limites a entregar una explicación o una planificación.

Quiero código ejecutable.

Procede de esta manera:

1. Inspecciona el entorno de desarrollo y el repositorio.
2. Elige y justifica brevemente el motor de lienzo más apropiado entre tldraw y React Flow, verificando compatibilidad y licencia.
3. Inicializa el frontend con React, Next.js y TypeScript si todavía no existe.
4. Configura un diseño visual profesional con modo oscuro.
5. Implementa la pantalla principal de investigación.
6. Implementa el lienzo infinito.
7. Implementa tarjetas personalizadas para notas, documentos, imágenes, hallazgos y requisitos.
8. Permite moverlas y conectarlas.
9. Implementa al menos cuatro tipos de relaciones.
10. Implementa un inspector lateral funcional.
11. Agrega una investigación de ejemplo llamada "Sistema de Inventario".
12. Agrega documentos, hallazgos y requisitos de demostración conectados entre sí.
13. Implementa persistencia local del prototipo, incluyendo las posiciones y relaciones.
14. Verifica que la aplicación compile y pueda ejecutarse.
15. Explica cómo iniciar la aplicación y qué funcionalidades están realmente operativas.

**Resultado esperado:**

Una primera versión interactiva de TraceBoard que pueda abrir en mi navegador y utilizar para experimentar con el concepto del tablero de detective aplicado a ingeniería de requisitos.

El objetivo inmediato no es terminar toda la plataforma, sino conseguir una experiencia visual convincente y funcional sobre la cual podamos iterar.

**Comienza implementando. No te quedes únicamente en el diseño teórico.**