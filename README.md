# Whisperer: Real-Time Speech Synchronization and Intelligent Prompter System for Turkish

Whisperer is a real-time intelligent teleprompter system designed for Turkish speakers. It combines real-time speech-to-text (STT), text-to-speech (TTS), and semantic similarity analysis to deliver flexible, responsive script following and live presentation support. The system highlights script segments as you speak, and uses audio prompts to assist if you pause or lose your place.

---

## Key Features

- **Real-Time Speech Recognition**: Deepgram API for low-latency Turkish STT.
- **Voice Activity Detection (VAD) & TTS Fallback**: Detects long silences and automatically plays the next script line using Google Cloud TTS.
- **Semantic Script Alignment**: Fine-tuned LaBSE model enables matching spoken sentences to script segments, even if you paraphrase.
- **Segmented Script Progression**: Sentence or sub-sentence script segmentation and highlighting.
- **Live Synchronization**: Uses WebSockets for real-time, bi-directional communication between frontend and backend.
- **User-Configurable Parameters**: Adjust voice, speed, volume, and silence threshold in the UI.

---

## Tech Stack

- **Frontend**: Next.js (React, TypeScript), Tailwind CSS, Deepgram JS SDK, @ricky0123/vad-web (browser VAD)
- **Backend**: [Whisperer Backend (Python/FastAPI)](https://github.com/CagatayKahramann/whisperer)
  - Python 3.10+, FastAPI, SentenceTransformer (fine-tuned LaBSE), Google Cloud Text-to-Speech, WebSockets, REST API for settings

---

## Installation and Setup

**Prerequisites:**
- Node.js v18+ and npm (or Yarn)
- Python 3.10+
- Deepgram API Key
- Google Cloud TTS Service Account JSON

**Important:**  
The backend is managed in a separate repository:  
👉 [https://github.com/CagatayKahramann/whisperer](https://github.com/CagatayKahramann/whisperer)  
Follow the backend repo's README for more detailed setup and API requirements for backend. The frontend assumes the backend requirements already met.

### 1. Clone the Repository

```bash
git clone https://github.com/Tarikiyik/Whisperer-Intelligent-Turkish-Prompter.git
cd Whisperer-Intelligent-Turkish-Prompter
```

### 2. Frontend Setup

Install all the required packages

```bash
npm install
```

Create a `.env` file in the root and put your Deepgram key as below:
```bash
NEXT_PUBLIC_DEEPGRAM_KEY=your_deepgram_api_key
```

### 3. Running the Application

- **First, run the development server:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

- **Second, run the backend server on a second terminal in the backend directory:**

```bash
cd backend
uvicorn main:app --reload --port 8000
# or if you are already on backend directory
uvicorn main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Usage

1. **Script Input**: Paste your script or upload a `.txt`/`.docx` file on the homepage.
2. **Settings**: Configure TTS voice, speaking rate, volume, and VAD silence threshold as needed.
3. **Start Prompter**: Click “Start Prompter” and allow microphone access.
4. **Speak**: As you speak, the app highlights your position in the script in real time.
5. **Pauses**: If you pause for long (configurable threshold), the next segment will be read aloud using TTS.
6. **Semantic Matching**: The system advances even if you paraphrase; exact word order is not required.
7. **End/Restart**: Refresh the page or use UI controls to end or restart your session.

---

## Troubleshooting

- **"Microphone not detected"**: Make sure you allow microphone access in your browser.
- **"No transcription" or "TTS not working"**: Check your Deepgram and Google Cloud API keys, and that your backend is running.
- **"Cannot connect to backend"**: Ensure the backend FastAPI server is running on port 8000 and accessible at `http://localhost:8000`.
- **Other issues**: See frontend or backend terminal for error details.

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

