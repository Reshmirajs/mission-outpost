# MISSION: OUTPOST 🚀🔴

> A cooperative multiplayer Mars survival simulation game developed for the **NASA Space Apps Challenge 2026**.

---

## 📖 Overview

**MISSION: OUTPOST** puts players into the boots of an astronaut expedition stationed on the harsh surface of Mars. Working in coordinated multiplayer squads, players must maintain vital outpost infrastructure, balance critical life-support resources (Oxygen, Power, Food, Radiation), resolve emergency Martian environmental events, and survive the Sol cycle.

---

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language:** JavaScript (ESNext / JSX)
- **Styling:** Modular CSS with Space/Mars dark theme design system
- **Multiplayer State (Upcoming):** Firebase Realtime Database
- **Space Data (Upcoming):** NASA Open APIs (Mars InSight, APOD, Rovers)

---

## 📂 Project Structure

```text
mission-outpost/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons, and visual media
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/      # Telemetry, gauges, and resource monitoring
│   │   ├── events/         # Random events and emergency hazard prompts
│   │   ├── lobby/          # Room creation, code join, and player readiness
│   │   └── mission-report/ # Sol summary and post-mission analytics
│   ├── firebase/           # Firebase initialization and database references
│   ├── game/               # Core game loop and state management logic
│   ├── services/
│   │   ├── multiplayer/    # Room synchronization and real-time messaging
│   │   └── nasa/           # NASA API integrations and telemetry fetchers
│   ├── types/
│   │   └── game.js         # Shared data models, defaults, and type definitions
│   ├── App.css             # Main application layout styling
│   ├── App.jsx             # Welcome screen and root component
│   ├── index.css           # Global CSS variables and base reset
│   └── main.jsx            # Application entry point
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── index.html              # HTML entry template
├── package.json            # Project dependencies and npm scripts
├── README.md               # Project documentation
└── vite.config.js          # Vite build configuration
```

---

## 📊 Shared Data Models (`src/types/game.js`)

The project uses consistent shared data structures across the application and multiplayer state:

### 1. Resources
Tracks habitat life-support parameters:
- `oxygen`: Number (0–100%)
- `power`: Number (0–100%)
- `food`: Number (0–100%)
- `radiation`: Number (0–100%)

### 2. Player
Represents an astronaut crew member:
- `id`: Unique identifier (string)
- `name`: Display name (string)
- `role`: Specialist role (`Mission Commander`, `Power Engineer`, `Botanist`, `Life Support Officer`, `Science & Safety Officer`, `Unassigned`)
- `ready`: Boolean readiness indicator

### 3. Mission
Represents a multiplayer expedition session:
- `roomCode`: 6-character room access code
- `players`: Array of connected `Player` objects
- `resources`: Shared base `Resources` state
- `round`: Current Sol (solar day) number
- `status`: Lifecycle phase (`lobby`, `in_progress`, `completed`, `failed`)
- `votes`: Voting records for emergency events and crew decisions

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended; v24 supported)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Reshmirajs/mission-outpost.git
   cd mission-outpost
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` to provide your Firebase and NASA API keys (when available).

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🛰️ Multiplayer & Firebase Architecture (Person 5 Module)

The multiplayer system provides synchronized room state for lobby formation, crew readiness, shared Outpost telemetry, and voting decisions.

### 1. Dual-Mode Architecture (Live Firebase + Mock Fallback)
The service automatically detects if valid Firebase credentials exist in `.env.local`:
- **Live Mode (`firebase`):** Connects to Firebase Realtime Database using REST endpoints and Server-Sent Events (SSE) `EventSource` streaming for real-time room sync.
- **Mock Fallback Mode (`mock`):** Active when `.env.local` is missing or uses placeholder keys. Keeps room states synchronized locally across multiple browser tabs via the browser's `BroadcastChannel` API and `sessionStorage`. **No live network sync is claimed until credentials are confirmed.**

### 2. Firebase Setup Instructions
To connect a live Firebase Realtime Database instance:
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In the sidebar, select **Build > Realtime Database**, then click **Create Database** (select any nearby region, e.g. `us-central1`).
3. Under the **Rules** tab, set temporary read/write rules for development:
   ```json
   {
     "rules": {
       "rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
4. In **Project Settings** (gear icon) > **General**, scroll to **Your apps** and click the Web icon (`</>`) to register a web app.
5. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
6. Populate the variables in `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-app-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```
> **Security Reminder:** Never commit `.env.local`, API tokens, or service account keys to source control.

### 3. API Reference for Teammates (`src/services/multiplayer`)

#### For Person 1 (Lobby Component):
- **Create a Room:**
  ```javascript
  import { createRoom } from './services/multiplayer';
  
  // Creates a room with 6-character code (e.g., 'W5N86T') and registers the host:
  const { roomCode, mission, player } = await createRoom({
    name: 'Commander Alex',
    role: 'Mission Commander',
  });
  ```
- **Join a Room:**
  ```javascript
  import { joinRoom } from './services/multiplayer';
  
  const { roomCode, mission, player } = await joinRoom('W5N86T', {
    name: 'Dr. Jane',
    role: 'Life Support Officer',
  });
  ```
- **Subscribe to Real-Time Updates:**
  ```javascript
  import { subscribeToRoom } from './services/multiplayer';
  
  // In a React useEffect:
  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomCode, (updatedMission) => {
      console.log('Crew updated:', updatedMission.players);
      setMission(updatedMission);
    }, (error) => {
      console.error('Subscription error:', error);
    });
    return () => unsubscribe();
  }, [roomCode]);
  ```
- **Update Player Details & Readiness:**
  ```javascript
  import { updatePlayer, setPlayerReady } from './services/multiplayer';
  
  // Update role or name:
  await updatePlayer(roomCode, player.id, { role: 'Botanist' });
  
  // Toggle ready status:
  await setPlayerReady(roomCode, player.id, true);
  ```
- **Leave Room:**
  ```javascript
  import { leaveRoom } from './services/multiplayer';
  
  await leaveRoom(roomCode, player.id);
  ```

#### For Person 4 (Voting & Events):
- **Submit a Decision or Event Vote:**
  ```javascript
  import { submitVote } from './services/multiplayer';
  
  // Positional syntax:
  await submitVote(roomCode, 'solar_flare_hazard', player.id, 'ENGAGE_MAGNETIC_SHIELD');
  
  // Or structured object syntax:
  await submitVote(roomCode, {
    voteId: 'solar_flare_hazard',
    playerId: player.id,
    choice: 'ENGAGE_MAGNETIC_SHIELD',
  });
  ```

### 4. Room Code Standard
Outpost room codes are strictly **6-character uppercase alphanumeric strings** (e.g. `X7K2M9`).
Utility helpers are available:
```javascript
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from './services/multiplayer';
```

### 5. Coordination Note (Team Lead Approval)
- Currently implemented using standard browser REST/SSE and local `BroadcastChannel` fallback with **zero added npm dependencies**, keeping `package.json` and `package-lock.json` clean.
- If the official `firebase` modular npm package (`^11.x` or `^10.x`) is preferred by the team lead, please approve package installation before adding it to `package.json`.

---

## 🎯 Next Steps

- [x] Complete Firebase Realtime Database setup and multiplayer room sync (Person 5)
- [ ] Connect NASA Mars Weather / InSight telemetry service (Person 3)
- [ ] Implement Sol round progression and event decision system (Person 2 / 4)
- [ ] Connect specialized crew role abilities (Person 1 / 2)

---

## 📜 License

Created for the **NASA Space Apps Challenge 2026**.
