# Project Context - jordis-grid

## Purpose
This project is a React + TypeScript app that renders a live YouTube channel grid.
It shows each channel's live stream when available, or a channel thumbnail when there is no live video.

## Tech Stack
- Vite 7
- React 19
- TypeScript 5
- ESLint 9

## Main Runtime Behavior
- The app asks for a YouTube API key if none exists in localStorage.
- API key storage key: `apiKey`
- Channel/live cache key: `channels`
- On startup:
  1. Reads `apiKey` from localStorage.
  2. If key exists, loads channel data from cached `channels`.
  3. If cache does not exist, fetches live data from YouTube API.
- Force refresh clears cache and fetches live data again.

## Core Data Model
In `src/App.tsx`, each channel has:
- `channelId: string`
- `title: string`
- `videoIds: string[]`
- `thumbnail?: string`
- `description?: string`

`initialChannels` defines the default monitored channels.

## UI / Interaction Summary
- Grid mode toggles between 2x3 and 3x3 layouts.
- Buttons available:
  - Play all iframes
  - Pause all iframes
  - Stop all iframes
  - Force refresh
  - Grid size toggle
- If a channel has no live video, the channel thumbnail is shown.

## Important Files
- `src/App.tsx`: main app logic, fetch, cache, controls, rendering
- `src/App.css`: grid and component styles
- `src/main.tsx`: app bootstrap
- `package.json`: scripts and dependencies

## NPM Scripts
- `npm run dev` -> Start local dev server
- `npm run build` -> TypeScript check + production build
- `npm run preview` -> Preview production build
- `npm run lint` -> Run ESLint
- `npm run deploy` -> Build + publish `dist` with `gh-pages`

## External Integrations
- YouTube Data API v3 (`search` endpoint, `eventType=live`, `type=video`)
- YouTube embed player API via iframe postMessage commands (`playVideo`, `pauseVideo`, `stopVideo`)

## Current Implementation Notes
- A retry helper (`fetchWithRetries`) is used for API calls.
- Cached data can become stale until force refresh is used.
- API key is currently persisted in browser localStorage (client-side).

## Known Risks / Follow-up Ideas
- API key in localStorage is convenient but not secure for public deployments.
- Consider moving YouTube API calls behind a small backend proxy.
- Consider TTL-based cache invalidation to reduce stale channel state.
- Consider stronger runtime validation for API response shape.
