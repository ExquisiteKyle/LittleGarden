# Agent NERV - Tutorial Master NPC

An AI Agent NPC that acts as an intelligent tutorial master, teaching users how to play a miniature RPG through natural conversation. Meet **Hestia**, your guide who demonstrates core AI agent capabilities: **Tool Use**, **Planning**, **Memory**, and **Reasoning**.

## Overview

Agent NERV features Hestia, a specialized AI agent designed to guide adventurers through learning a miniature RPG. Unlike static tutorials, Hestia:

- **Adapts** to each user's learning pace and style
- **Remembers** what you've already learned
- **Plans** the optimal teaching sequence (movement → interaction → looting → combat)
- **Explains** the reasoning behind game mechanics and tactics

## Core Features

### Tool Use
Hestia can interact with the game to check player progress, monitor game state, highlight tiles, and guide users through actions. Tools include checking game state, highlighting UI elements, and tracking objectives.

### Planning
Intelligently plans tutorial sequences (movement → NPC interaction → looting → combat) based on player progress, adapting the teaching pace in real-time.

### Memory
Remembers what players have learned, tracks mastery levels, and builds a personalized teaching history across sessions.

### Reasoning
Explains why game mechanics work the way they do, shows connections between actions, and provides tactical context for better understanding.

## Tech Stack

- **Backend**: Node.js 18+, TypeScript, Express.js, direct OpenAI API integration
- **Frontend**: HTML/JavaScript
- **AI**: OpenAI GPT-4 with function calling
- **Architecture**: Modular design with separated types, enums, prompts, and translation system

## Project Status

Currently in development - MVP phase

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the development roadmap.

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Frontend Setup

1. Open `frontend/index.html` in your browser
2. Ensure the backend server is running
3. Start chatting with Hestia!

## Project Structure

```
backend/
├── src/
│   ├── agent/
│   │   ├── core/
│   │   │   ├── agent.ts      # Main agent orchestration
│   │   │   ├── tools.ts      # Tool definitions and execution
│   │   │   ├── memory.ts     # Memory system
│   │   │   ├── planning.ts   # Tutorial planning logic
│   │   │   ├── prompts.ts    # System prompts
│   │   │   └── types.ts      # TypeScript types and enums
│   │   └── knowledge/
│   │       └── tutorialDb.ts # Tutorial knowledge base
│   ├── api/
│   │   └── routes.ts         # Express API routes
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   └── translations/
│       └── en.json           # Tool descriptions
└── package.json

frontend/
├── index.html
├── app.js                    # Demo app logic
├── tutorial.js              # Agent integration
├── constants.js             # Constants and action enums
├── locales/
│   └── en.json              # UI translations
└── styles.css
```

## License

MIT

