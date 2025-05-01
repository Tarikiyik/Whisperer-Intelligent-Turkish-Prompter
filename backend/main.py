# backend/main.py
import os, asyncio, threading
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from speech_monitor import SpeechMonitor
from tts_service    import TurkishTTS

DATA_DIR   = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
TRANSCRIPT = os.path.join(DATA_DIR, "transcript.txt")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def bridge(ws: WebSocket):
    await ws.accept()
    mon_task = None
    try:
        # ─── initial handshake ──────────────────────────────────────────
        first = await asyncio.wait_for(ws.receive_json(), timeout=5)
        if first.get("type") != "init_script":
            await ws.close(1008, "Need init_script")
            return
        script = first["script"]
        open(TRANSCRIPT, "w").close()          # truncate log file

        # ─── launch Google TTS thread ───────────────────────────────────
        tts = TurkishTTS("./secrets/google-tts-key.json")
        threading.Thread(
            target=tts.stream_synthesize,
            args=(script,),
            kwargs=dict(segment_delay=0.0),
            daemon=True
        ).start()

        # ─── launch SpeechMonitor (drives highlight / resume) ───────────
        mon = SpeechMonitor(TRANSCRIPT, script,
                            threshold=3.0,
                            similarity_threshold=0.70)

        mon.set_pause_callback(
            lambda: (
                tts.pause_feeding(),
                asyncio.create_task(ws.send_json({"event": "pause"}))
            )
        )
        mon.set_resume_callback(
            lambda: (
                tts.resume_feeding(),
                asyncio.create_task(ws.send_json({"event": "resume"}))
            )
        )
        mon.set_sentence_update_callback(
            lambda idx: asyncio.create_task(
                ws.send_json({"event": "highlight", "index": idx})
            )
        )
        mon_task = asyncio.create_task(mon.run())

        # ─── main receive loop ──────────────────────────────────────────
        while True:
            msg = await ws.receive_json()
            typ = msg.get("type")

            if typ == "transcript":
                with open(TRANSCRIPT, "a", encoding="utf-8") as fh:
                    fh.write(msg["text"] + "\n")

            elif typ == "vad":
                status = msg.get("status")
                if status == "silence_start":
                    tts.pause_feeding()          # quick mute
                elif status == "speech_start":
                    tts.resume_feeding()         # resume instantly

    except WebSocketDisconnect:
        pass
    finally:
        mon_task and mon_task.cancel()
