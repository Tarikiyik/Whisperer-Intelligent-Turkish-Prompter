# backend/main.py

import os
import io
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from speech_monitor import SpeechMonitor
from tts_service import TurkishTTS
from config import settings
from text_segmentation import segment_script, segment_sentences

DATA_DIR   = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
TRANSCRIPT = os.path.join(DATA_DIR, "transcript.txt")

app = FastAPI()

# Allow Next.js front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global segments list
segments: list[str] = []

# Settings model for validation
class SettingsUpdate(BaseModel):
    tts_voice_name: str
    tts_speaking_rate: float
    tts_volume_gain_db: float
    vad_long_ms: int
    sentence_mode: bool
    interrupt_on_speech: bool

# Settings endpoint
settings_router = APIRouter()

@settings_router.get("/api/settings")
async def get_settings():
    return {
        "tts_voice_name": settings.tts_voice_name,
        "tts_speaking_rate": settings.tts_speaking_rate,
        "tts_volume_gain_db": settings.tts_volume_gain_db,
        "vad_long_ms": settings.vad_long_ms,
        "sentence_mode": settings.sentence_mode,
        "interrupt_on_speech": settings.interrupt_on_speech,
    }

@settings_router.post("/api/settings")
async def update_settings(update_data: SettingsUpdate):
    # Update the settings object with new values
    settings.tts_voice_name = update_data.tts_voice_name
    settings.tts_speaking_rate = update_data.tts_speaking_rate
    settings.tts_volume_gain_db = update_data.tts_volume_gain_db
    settings.vad_long_ms = update_data.vad_long_ms  
    settings.sentence_mode = update_data.sentence_mode
    settings.interrupt_on_speech = update_data.interrupt_on_speech
    # This will update the in-memory settings
    
    return {"status": "success", "message": "Settings updated successfully"}

app.include_router(settings_router)

# One-shot TTS endpoint
@app.get("/api/tts")
async def get_tts(seg: int):
    if not segments:
        raise HTTPException(status_code=400, detail="Script not initialized")
    if seg < 0 or seg >= len(segments):
        raise HTTPException(status_code=400, detail="Segment index out of range")

    tts = TurkishTTS("./secrets/google-tts-key.json")
    audio_bytes = await asyncio.to_thread(tts.synthesize_text, segments[seg])
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/wav")

# WebSocket bridge (only for highlights)
@app.websocket("/ws")
async def bridge(ws: WebSocket):
    await ws.accept()
    mon_task = None

    try:
        first = await asyncio.wait_for(ws.receive_json(), timeout=5)
        if first.get("type") != "init_script":
            await ws.close(code=1008, reason="Need init_script")
            return

        script = first["script"]
        open(TRANSCRIPT, "w", encoding="utf-8").close()

        global segments
        if settings.sentence_mode:
            segments = segment_sentences(script)
        else:
            segments = segment_script(script)

        # SpeechMonitor for highlights and completion
        mon = SpeechMonitor(
            transcript_file=TRANSCRIPT,
            expected_script=script,
            similarity_threshold=0.70,
            sentence_mode=settings.sentence_mode
        )
        mon.set_sentence_update_callback(
            lambda idx: asyncio.create_task(
                ws.send_json({"event": "highlight", "index": idx})
            )
        )
        mon.set_completion_callback(
            lambda: asyncio.create_task(
                ws.send_json({"event": "completed"})
            )
        )
        mon_task = asyncio.create_task(mon.run())

        # Receive loop
        while True:
            msg = await ws.receive_json()
            if msg.get("type") == "transcript":
                with open(TRANSCRIPT, "a", encoding="utf-8") as fh:
                    fh.write(msg["text"] + "\n")

    except WebSocketDisconnect:
        pass
    finally:
        if mon_task:
            mon_task.cancel()