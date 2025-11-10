# Backend Setup

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Architecture

The backend is organized into modular components:

- **`agent/core/`** - Core agent implementation
  - `agent.ts` - Main agent class with message processing
  - `tools.ts` - Tool definitions and execution
  - `memory.ts` - User progress and conversation memory
  - `planning.ts` - Tutorial sequence planning
  - `prompts.ts` - System prompts for Hestia
  - `types.ts` - TypeScript interfaces and enums

- **`api/`** - Express API routes
- **`config/`** - Configuration (environment variables)
- **`translations/`** - Tool descriptions in JSON

## API Endpoints

- `POST /api/chat` - Send a message to Hestia
  - Body: `{ message: string, userId: string, appState: object }`
  - Returns: `{ message: string, toolCalls?: array, reasoning?: string }`

- `GET /api/progress/:userId` - Get user's learning progress
  - Returns: `{ featuresLearned: array, featuresMastered: array, struggles: array }`

- `GET /health` - Health check endpoint

## Features

- **Type-safe**: All types and enums centralized in `types.ts`
- **Modular**: Separated concerns (prompts, tools, memory, planning)
- **Translatable**: Tool descriptions loaded from JSON
- **Clean code**: ES6 syntax, implicit returns, early returns, promise chains

