# React + TypeScript + Vite

## Canal Música

La grilla incluye un canal virtual de videoclips de YouTube. La playlist inicial es
`PLTtOBDiB_ofJdQMh8VzO41feB_v06vFPF` (New Music 2026 & Best Songs 2026 Playlist).
Empieza desde el primer video al abrir la aplicación, avanza al finalizar cada video
y repite la lista indefinidamente. Los videos no disponibles se saltan; si falla toda
la lista, se detiene y muestra un aviso para evitar reintentos infinitos.

En Controls → Fuente de Música podés pegar una playlist pública completa de YouTube.
El canal recorre todos sus videos y vuelve a empezar al terminar. También podés usar
una lista manual de enlaces o IDs, uno por línea. La fuente elegida queda guardada en
este navegador. Siguiente permite cambiar de tema y Ver tema abre el video actual en
YouTube. Los controles generales, de audio y de foco incluyen este canal; la
sincronización al vivo lo excluye porque reproduce videos grabados.

Las playlists se resuelven a videos individuales para saltar los temas cuyo
propietario no permite reproducción embebida. Con una clave de YouTube configurada,
la lista se actualiza mediante YouTube Data API y queda en caché. La playlist
predeterminada incluye una instantánea inicial para funcionar sin clave.

No requiere clave de API para Música: en la pantalla inicial elegí Continuar solo
con Música. Los canales en vivo siguen usando la clave existente. La reproducción
comienza silenciada; seleccioná Música en Single Video y presioná Unmute para oírla.
Si el navegador bloquea el inicio automático, presioná Play dentro del video.
Cambiar entre grilla y foco recrea los reproductores y reinicia la playlist.

Se usa la API oficial IFrame de YouTube, sin descargar ni retransmitir videos.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
