# Copilot Instructions for jordis-grid

## Project Overview
- Stack: React 19 + TypeScript + Vite.
- Main objective: render a live-stream grid from selected YouTube channels.
- Main file today: `src/App.tsx`.

## Coding Style
- Use TypeScript strict-friendly code (avoid `any` and `@ts-ignore` unless there is no practical alternative).
- Prefer small, focused functions and early returns.
- Keep component logic readable; extract helpers when blocks grow.
- Preserve existing naming and structure unless a refactor is explicitly requested.

## React Guidelines
- Prefer functional components and hooks.
- Keep side effects inside `useEffect` with clear dependency handling.
- Avoid unnecessary re-renders and avoid creating complex inline logic in JSX.
- Derive UI state from data when possible instead of duplicating state.

## Data and API Rules
- YouTube API integration currently runs client-side.
- Never hardcode API keys in source code.
- If keys are needed, prefer environment variables for dev and backend proxy for production.
- Validate remote response shape before consuming nested fields.
- Handle empty, loading, and error states explicitly.

## Local Storage Conventions
- Existing keys:
  - `apiKey`
  - `channels`
- If adding new keys, keep names short and document them in `CONTEXT.md`.
- Add defensive parsing for JSON reads.

## UI and Layout
- Keep the grid behavior stable for 2x3 and 3x3 modes.
- Maintain responsive behavior for desktop and laptop screens.
- Do not remove control buttons unless requested.

## Performance and Reliability
- Minimize redundant API requests.
- Favor deterministic cache refresh behavior.
- Keep retry logic bounded and predictable.

## Tooling
- Use existing npm scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run preview`
- After meaningful edits, run `npm run build` and/or `npm run lint` when feasible.

## Change Discipline
- Make the smallest safe change that solves the requested task.
- Avoid unrelated formatting or broad refactors.
- When changing behavior, add a short note in `CONTEXT.md` if it affects project workflow.
