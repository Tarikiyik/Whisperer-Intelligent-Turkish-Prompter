"""
tts_service.py – Google Cloud bidirectional streaming TTS helper
Now logs “TTS feed paused. Waiting…” only once per pause cycle.
"""

import os, logging, itertools, time
from google.cloud import texttospeech
import pyaudio
from text_segmentation import segment_script

logging.basicConfig(level=logging.INFO)

class TurkishTTS:
    def __init__(self, credentials_path: str):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        self.client = texttospeech.TextToSpeechClient()
        self.last_segment_index = 0
        self.pause_feed  = False
        self._pause_noticed = False   # internal flag

    # ─── external controls ────────────────────────────────────────────────────
    def pause_feeding(self):
        self.pause_feed = True
        self._pause_noticed = False   # reset so we log once
        logging.info("TTS feeding paused.")

    def resume_feeding(self):
        self.pause_feed = False
        logging.info("TTS feeding resumed.")

    # ─── one-shot synthesis (unchanged) ───────────────────────────────────────
    def synthesize(self, text, output_file=None, speaking_rate=1.0,
                   effects_profile=["headphone-class-device"], ssml=False):
        pass  # omit for brevity – your existing implementation is fine

    # ─── streaming synthesis ─────────────────────────────────────────────────
    def stream_synthesize(self, text, speaking_rate=1.2,
                          effects_profile=["headphone-class-device"],
                          segment_delay=1.0, start_segment=0):
        segments = segment_script(text)
        logging.info("Total segments: %d", len(segments))
        self.last_segment_index = start_segment

        pa = pyaudio.PyAudio()
        stream = pa.open(format=pyaudio.paInt16, channels=1, rate=24000, output=True)
        logging.info("PyAudio stream opened for playback.")

        for idx in range(start_segment, len(segments)):
            # handle pause ------------------------------------------------------
            while self.pause_feed:
                if not self._pause_noticed:
                    logging.info("TTS feed paused. Waiting…")
                    self._pause_noticed = True
                time.sleep(0.1)
            self._pause_noticed = False  # we’re live again

            # stream current segment ------------------------------------------
            seg_text = segments[idx]
            cfg = texttospeech.StreamingSynthesizeConfig(
                voice=texttospeech.VoiceSelectionParams(
                    language_code="tr-TR", name="tr-TR-Chirp3-HD-Leda"))
            requests = itertools.chain(
                [texttospeech.StreamingSynthesizeRequest(streaming_config=cfg)],
                [texttospeech.StreamingSynthesizeRequest(
                    input=texttospeech.StreamingSynthesisInput(text=seg_text))]
            )
            for resp in self.client.streaming_synthesize(requests):
                if resp.audio_content:
                    stream.write(resp.audio_content)

            self.last_segment_index = idx
            # simple pacing heuristic
            delay = len(seg_text.split()) * 0.2
            time.sleep(delay)

        stream.stop_stream(); stream.close(); pa.terminate()
        logging.info("TTS playback finished.")
