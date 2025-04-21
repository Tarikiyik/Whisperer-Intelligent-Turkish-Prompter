# backend/main.py
import os, asyncio, json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from speech_monitor import SpeechMonitor   # existing file

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
        
        # Verify message type
        if first.get("type") != "init_script":
            print(f"❌ Unexpected message type: {first.get('type')}")
            await ws.close(1008, "Expected init_script message")
            return
            
        script_text = first["script"]
        print(f"✅ Received script: {len(script_text)} characters")
        
        open(TRANSCRIPT_FILE, "w").close()  # reset file
        
        # set up SpeechMonitor ---------------------------------
        monitor = SpeechMonitor(
            transcript_file=TRANSCRIPT_FILE,
            expected_script=script_text,
            threshold=2.0,
            similarity_threshold=0.75,
        )

        monitor.set_pause_callback(
            lambda: asyncio.create_task(ws.send_json({"event": "pause"}))
        )
        monitor.set_resume_callback(
            lambda: asyncio.create_task(ws.send_json({"event": "resume"}))
        )
        monitor.set_sentence_update_callback(
            lambda idx: asyncio.create_task(ws.send_json(
                {"event": "highlight", "index": idx}))
        )

        monitor_task = asyncio.create_task(monitor.run())

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
        print(f"👻 Connection error: {e}")
        await ws.close()
        return
