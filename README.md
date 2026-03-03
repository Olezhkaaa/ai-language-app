## AI Language App

Starter web app for language learning with chat, voice input, and handwriting input.

### Features
- Chat practice powered by local Ollama model
- Voice input via Web Speech API in the browser
- Handwriting input canvas with a placeholder OCR route

### Run locally
```bash
npm run dev
```

Open http://127.0.0.1:3000 in your browser.

### API routes
- POST /api/chat — uses local Ollama model
- POST /api/handwriting — placeholder OCR response
- POST /api/stt — placeholder for server-side speech-to-text

### Local AI (Ollama)
1) Install and run Ollama.
2) Pull the model:
	ollama pull qwen2.5
3) Start the dev server:
	npm run dev

Optional environment variables:
- OLLAMA_BASE_URL (default: http://localhost:11434)
- OLLAMA_MODEL (default: qwen2.5)

### Next steps
- Replace handwriting placeholder with OCR or handwriting recognition
- Store user progress in a database
