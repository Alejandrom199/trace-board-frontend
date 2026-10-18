# Dependencias: revisión previa a GitHub

Fecha: 2026-10-13. Lockfiles independientes y dependencias directas fijadas. No se ejecutó npm audit fix --force ni se degradó Next.js.

- Backend: npm audit informó cero vulnerabilidades conocidas.
- Frontend: npm audit --omit=dev informó cero vulnerabilidades conocidas de producción.
- Frontend completo: cinco avisos altos corresponden a una misma cadena de herramientas de desarrollo: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. GHSA-vfj7-8cjw-p6xm afecta braces hasta 3.0.3; el registro npm y el aviso no ofrecen parche al verificar. El downgrade automático sugerido cambiaría Next lint a la serie 14 y no se aplicó.

Riesgo pendiente P2: patrones de llaves profundamente anidados pueden agotar la pila de braces durante las herramientas de lint. En este proyecto esas rutas/patrones proceden de configuración/código del repositorio; no se usan para procesar entradas del usuario en la app de producción. No se afirma que la instalación de desarrollo esté libre de avisos. Vigilar actualización compatible, actualizar el lockfile y repetir lint/build cuando exista corrección.

Fuente primaria: [aviso de GitHub](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Un audit sin avisos indica únicamente ausencia de vulnerabilidades conocidas en esa consulta, no garantía de seguridad.
