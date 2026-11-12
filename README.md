# React + TypeScript + Vite

## Music channel

The grid includes a virtual YouTube music video channel. Its default playlist is
`PLTtOBDiB_ofJdQMh8VzO41feB_v06vFPF` (New Music 2026 & Best Songs 2026 Playlist).
It starts when the application opens, advances when each video ends, and loops
indefinitely. Unavailable videos are skipped. If the entire list fails, playback
stops and displays a message to prevent endless retries.

Open Controls → Music source to enter a complete public YouTube playlist. The channel
plays every available video and starts over when it reaches the end. You can also use
a manual list of links or IDs, one per line. The selected source is stored in this
browser. Next changes tracks, and Open video opens the current video on YouTube.
Global, audio, and focus controls include the music channel. Live synchronization
excludes it because it plays recorded videos.

Playlists are resolved into individual videos so the player can skip entries whose
owners disable embedded playback. When a YouTube API key is configured, the playlist
is refreshed through the YouTube Data API and cached locally. The default playlist
also includes an initial snapshot so it works without an API key.

The Music channel does not require an API key. Select Continue with Music only on the
setup screen. Live channels still use the existing key. Playback starts muted; select
Music under Single Video and press Unmute to hear it. If the browser blocks autoplay,
press Play inside the video. Switching between grid and focus views recreates the
players and restarts the playlist.

The application uses the official YouTube IFrame API without downloading or
rebroadcasting videos.

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
