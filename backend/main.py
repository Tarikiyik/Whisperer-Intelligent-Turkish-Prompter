# backend/main.py
import os, asyncio, threading
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from speech_monitor import SpeechMonitor
from tts_service import TurkishTTS

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
TRANSCRIPT_FILE = os.path.join(DATA_DIR, "transcript.txt")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_bridge(ws: WebSocket):
    await ws.accept()
    try:
        first = await asyncio.wait_for(ws.receive_json(), timeout=5)
        if first.get("type") != "init_script":
            await ws.close(1008, "Expected init_script message"); return

        script_text = first["script"];  open(TRANSCRIPT_FILE, "w").close()

        # ─── TTS thread ───────────────────────────────────────
        tts = TurkishTTS("./secrets/google-tts-key.json")
        tts_thread = threading.Thread(
            target=tts.stream_synthesize,
            args=(script_text,),
            kwargs=dict(speaking_rate=1.0, segment_delay=0.0),
            daemon=True,
        )
        tts_thread.start()

        # ─── SpeechMonitor ────────────────────────────────────
        monitor = SpeechMonitor(
            transcript_file=TRANSCRIPT_FILE,
            expected_script=script_text,
            threshold=3.0, # Change this to the desired threshold for silence detection
            similarity_threshold=0.7, # Change this to the desired threshold for similarity detection
        )
        monitor.set_pause_callback(
            lambda: (
                tts.pause_feeding(),
                asyncio.create_task(ws.send_json({"event": "pause"})),
            )
        )
        monitor.set_resume_callback(
            lambda: (
                tts.resume_feeding(),
                asyncio.create_task(ws.send_json({"event": "resume"})),
            )
        )
        monitor.set_sentence_update_callback(
            lambda idx: asyncio.create_task(ws.send_json(
                {"event": "highlight", "index": idx}))
        )

        monitor_task = asyncio.create_task(monitor.run())
        # ─── pump transcripts from frontend ───────────────────
        try:
            while True:
                msg = await ws.receive_json()
                if msg["type"] == "transcript":
                    with open(TRANSCRIPT_FILE, "a", encoding="utf-8") as f:
                        f.write(msg["text"] + "\n")
        except WebSocketDisconnect:
            print("❌ Frontend disconnected")
        finally:
            monitor_task.cancel()
    except (asyncio.TimeoutError, WebSocketDisconnect) as e:
        await ws.close()
