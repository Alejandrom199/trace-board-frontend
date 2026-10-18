# Verificación de las entregas GitHub

Fecha de preparación: 2026-10-13. Verificación previa a publicación repetida el 2026-10-17 (America/Guayaquil). Destinos: Alejandrom199/trace-board-frontend y Alejandrom199/trace-board-backend, encontrados vacíos y confirmados sin ramas antes de publicar. El workspace de origen y sus investigaciones se conservaron.

| Comprobación | Resultado local real |
| --- | --- |
| Instalación independiente | npm ci aprobado en ambas entregas; lockfiles propios, sin la entrada de la aplicación ajena. Repetido después de depurar las entradas extraneous. |
| TypeScript / lint / build | Aprobados en workspace de origen, frontend y backend; salida 0. |
| Unitarias | 46 frontend y 16 backend aprobadas; 62 en origen. |
| Arquitectura | Origen: 49 fuentes; frontend: 30; backend: 20. Diez autocomprobaciones por ejecución, sin imports prohibidos. Los contratos cuentan en ambas entregas. |
| Contratos | Misma versión y huella SHA-256 en ambos repositorios; check:contracts aprobado. |
| Integración backend | 14 aprobadas, HTTP y PostgreSQL real exclusivamente en traceboard_test. Credencial ficticia del escenario de error generada dinámicamente. |
| E2E frontend | 18 aprobadas en Chrome, 48.2 s, puerto temporal aislado y contextos independientes. La prueba de flujo usa datos ficticios autocontenidos. |
| Audit de producción | Cero avisos conocidos en ambas entregas; backend completo también cero. Frontend completo tiene cinco avisos de desarrollo sin parche compatible; véase DEPENDENCY-SECURITY.md. |
| YAML y lockfile | Workflows parseados con js-yaml y workspaces del lockfile comparados con package.json; aprobado. |
| Secretos / inventario | check:secrets aprobado en candidatos publicables; antes del push se repite sobre archivos indexados y se revisa el inventario. Claves locales, .env, bases, documentos y capturas no se incluyen. |
| CI remoto | Configurado; su ejecución real debe comprobarse después del push. No equivale a aprobación por tener un YAML. |

El build de la copia frontend anidada dentro del workspace avisó que ignoraba el package.json del directorio padre, externo al repositorio Git. La compilación terminó correctamente usando su entrega. ESLint 9.39.5 advierte fin de soporte; se conserva la versión fijada compatible con la configuración actual. Una validación inicial de YAML no encontró el paquete yaml; se usó js-yaml ya instalado y la validación real pasó. No se hicieron cambios de versión destructivos ni se ejecutó npm audit fix --force.

## Criterios de calidad

- Independencia del dominio: aprobado mediante AST y builds independientes.
- Responsabilidad de módulos: aprobado; cada repositorio contiene solo una app y contratos puros.
- Patrones justificados: aprobado; sin servicios/DI nuevos, solo preparación reproducible de entregas.
- Comportamiento: aprobado en pruebas unitarias, integración y E2E locales del alcance. Los E2E remotos completos no se repitieron; la prueba adicional de edición durante subida sigue aplazada por el usuario.
- Calidad automatizada: aprobado localmente; CI remoto pendiente de resultado.
- Mantenibilidad: contratos con huella común y ADR-006; su actualización coordinada sigue siendo responsabilidad del desarrollo.
- Seguridad/datos: sin coincidencias de secretos en la revisión publicable, con límites del escáner documentados. Aviso de desarrollo pendiente; API local sin autenticación, no apta para exposición pública.

No se afirma ausencia absoluta de secretos mediante un escáner por patrones. Los dos remotos estaban vacíos, por lo que esta entrega no hereda un historial previo que auditar. No se publica el contenido de las investigaciones ni se cambia la visibilidad de los repositorios.
