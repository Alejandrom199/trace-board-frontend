# Seguridad

Las credenciales se suministran por entorno o se generan en .local; no se versionan. Los ejemplos .env.example contienen marcadores, nunca valores reales. No publicar documentos de usuarios ni dumps. npm run check:secrets revisa los candidatos Git sin imprimir valores, con límites descritos en docs/GITHUB.md.

El despliegue exige un token compartido de al menos 32 caracteres entre el proxy de Netlify y Railway. El token no usa prefijo NEXT_PUBLIC y no llega al navegador. Si se expone, rotarlo en ambos proveedores y revisar el historial. La API efímera no sustituye autorización por usuario ni persistencia durable.
