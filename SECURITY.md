# Seguridad

Las credenciales se suministran por entorno o se generan en .local; no se versionan. Los ejemplos .env.example contienen marcadores, nunca valores reales. No publicar documentos de usuarios ni dumps. npm run check:secrets revisa los candidatos Git sin imprimir valores, con límites descritos en docs/GITHUB.md.

La API no incluye autenticación/autorización y escucha solo en loopback. No desplegarla públicamente hasta implementar acceso y políticas de datos. Si se expone una credencial, revocarla y revisar el historial. No pegar secretos en issues públicos.
