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
- `role`: Specialist role (`Commander`, `Engineer`, `Botanist`, `Medic`, `Scientist`, `Unassigned`)
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

## 🎯 Next Steps

- [ ] Complete Firebase Realtime Database setup and multiplayer room sync
- [ ] Connect NASA Mars Weather / InSight telemetry service
- [ ] Implement Sol round progression and event decision system
- [ ] Connect specialized crew role abilities

---

## 📜 License

Created for the **NASA Space Apps Challenge 2026**.
