# MISSION: OUTPOST

**A cooperative Mars survival mission game and space-science learning experience.**

MISSION: OUTPOST puts a crew in a simulated Mars habitat. Explore the outpost, take on station tasks, respond to events, and monitor the systems a crew would depend on during a mission. NASA observations are presented as science context; game resources and events are simulations.

> **Project status:** This is an actively developed project. Some experiences run as previews or local simulations. Live multiplayer requires Firebase configuration, and the final mission report only contains history that its configured history provider can supply.

## Try the project

The hosted build is intended to be available at [reshmirajs.github.io/mission-outpost](https://reshmirajs.github.io/mission-outpost/). The site is published from the `main` branch with GitHub Actions.

To run it locally, use the instructions below.

## What is included

- **Welcome and lobby:** Create or join a mission room and assemble a crew.
- **Mars habitat:** A Phaser map with five connected facility areas, local astronaut movement, collision, task stations, environmental clues, and a compact mission HUD.
- **Mission systems:** Sol progression, resource changes, task handling, and simulated events are implemented in the game modules. The exact experience depends on whether a local preview or configured multiplayer session is being used.
- **NASA Science Terminal:** NASA DONKI solar-flare and coronal-mass-ejection observations, plus Mars rover imagery from NASA's Image and Video Library. NASA feeds are separate from simulated game state.
- **Final Mission Report:** A report UI that distinguishes complete, partial, and unavailable history. Demo fixtures are clearly labelled and are not real missions.
- **Dashboard and event previews:** Standalone views for habitat status and crew decisions.

### Data boundaries

- Oxygen, power, food, radiation, mission events, and task effects shown in gameplay are simulated game values. DONKI does not measure radiation inside the habitat.
- DONKI and Mars imagery are fetched from NASA APIs. If an API cannot provide data, the UI indicates unavailable or clearly labelled demo content.
- The report uses its history service/provider. It does not fabricate missing historical records or infer previous Sol values from current resources. Persistent retrieval across multiplayer sessions depends on a compatible history provider being connected.
- Firebase-backed rooms require valid project configuration. Without it, the multiplayer service uses its local mock mode; local mock mode is not internet multiplayer.

## Run locally

### Requirements

- Node.js 20.19+ or 22.12+ (required by the current Vite version)
- npm
- Git

### Setup

```bash
git clone https://github.com/Reshmirajs/mission-outpost.git
cd mission-outpost
npm ci
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

### Available commands

```bash
npm run dev      # Start the local development server
npm run lint     # Check JavaScript and JSX with Oxlint
npm run build    # Create the production site in dist/
npm run preview  # Preview the production build locally
```

## Optional services

### NASA data

NASA imagery uses the public NASA Image and Video Library API. DONKI uses NASA's API and reads `VITE_NASA_API_KEY`; if it is unset, the app uses NASA's public `DEMO_KEY`, which has stricter rate limits. Add a personal key to `.env.local` if needed:

```env
VITE_NASA_API_KEY=your_nasa_api_key
```

The app handles NASA observations as science information only. They do not directly set habitat radiation, mission risks, or emergency consequences.

### Firebase multiplayer

To enable Firebase Realtime Database mode, copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values from your Firebase web-app configuration. At minimum, the app checks for an API key, database URL, and project ID before selecting the Firebase adapter. Without valid configuration, it selects local mock mode.

Configure database rules for your development and production needs in the Firebase console. Do not use open read/write rules for a public deployment. Never commit `.env.local`, private credentials, or service-account files. Values prefixed with `VITE_` are included in browser code and must not contain private server secrets.

## Project map

```text
src/
├── components/
│   ├── dashboard/       # Habitat dashboard and NASA panels
│   ├── events/          # Event presentation and voting UI
│   ├── game/            # React game view, HUD, and task interface
│   ├── lobby/           # Create/join and crew assembly screens
│   ├── report/          # Final Mission Report
│   └── science/         # NASA Science Terminal
├── game/
│   ├── maps/            # Habitat layout, facilities, stations, and clues
│   ├── scenes/          # Phaser scenes and facility rendering
│   ├── tasks/           # Task definitions and assignments
│   └── *Engine.js       # Mission, resource, event, and task logic
├── services/
│   ├── multiplayer/     # Firebase and local mock adapters
│   ├── nasa/            # DONKI and NASA image-library services
│   └── missionHistory/  # Report history adapter, normalizer, and fixtures
└── firebase/            # Firebase configuration and authentication
```

## GitHub Pages deployment

The Pages workflow builds the Vite app with the `/mission-outpost/` base path and publishes the generated `dist/` site. It runs when changes are pushed to `main` and can also be started manually from the repository's **Actions** tab. The repository's Pages publishing source should be set to **GitHub Actions**.

## Contributing

1. Create a feature branch from the current `main` branch.
2. Keep changes focused and avoid committing `.env.local` or generated build output.
3. Run `npm run lint` and `npm run build` before opening a pull request.
4. Describe which behavior is live, local-only, simulated, or demo data in the pull request.

## Acknowledgements

NASA data is provided by [NASA Open APIs](https://api.nasa.gov/) and the [NASA Image and Video Library](https://images.nasa.gov/). MISSION: OUTPOST is an independently developed educational game project and is not an official NASA product.
