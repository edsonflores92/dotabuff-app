# Dotabuff App

## Próximos pasos
- Backend con Express y axios para consultar Dotabuff
- Frontend con React para mostrar héroes
- Conexión entre ambos

Proyecto inicial para consultar datos de Dotabuff desde un frontend estático y un backend Node.js.

## Estructura

- `src/server/` - servidor Express y módulo Dotabuff
- `public/` - frontend estático
- `tests/` - pruebas futuras

## Scripts

- `npm install`
- `npm start` - inicia el servidor
- `npm run dev` - inicia el servidor con `nodemon`

## Descripción

Actualmente el backend expone una ruta:

- `GET /api/dotabuff` - devuelve datos de ejemplo o placeholder.

El frontend carga la página en `public/index.html` y llama al backend desde `public/app.js`.

## Personalizar conexión a Dotabuff

Modifica `src/server/dotabuff.js` para integrar la API real de Dotabuff o un scraper según la disponibilidad de datos.
