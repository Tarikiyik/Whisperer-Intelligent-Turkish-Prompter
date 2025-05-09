"""
tts_service.py: Google TTS service for Turkish language synthesis.
This module provides functionality for text-to-speech synthesis using Google Cloud's Text-to-Speech API.
It includes both one-shot synthesis and streaming synthesis capabilities, allowing for real-time audio playback of synthesized speech. 
The module also handles text segmentation and provides methods to pause and resume audio playback.
It is designed to work with Turkish language settings and can be configured through environment variables defined in a separate configuration file.
"""

import os, logging
from google.cloud import texttospeech
from config import settings

logging.basicConfig(level=logging.INFO)

class TurkishTTS:
    def __init__(self, credentials_path: str):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        self.client = texttospeech.TextToSpeechClient()
        self.last_segment_index = 0
        self.pause_feed = False
        self._last_state = False  # Track the previous state

    # ─── external controls ────────────────────────────────────────────────────
    def pause_feeding(self):
        if not self._last_state:  # Only log if changing from unpaused to paused
            self.pause_feed = True
            self._last_state = True
            logging.info("TTS feeding paused.")

    def resume_feeding(self):
        if self._last_state:  # Only log if changing from paused to unpaused
            self.pause_feed = False
            self._last_state = False
            logging.info("TTS feeding resumed.")

    # ─── one-shot synthesis ───────────────────────────────────────
    def synthesize_text(self, text: str) -> bytes:
        """
        Single-shot TTS: returns raw audio bytes (LINEAR16) for the given text,
        using parameters defined in config.py.
        """
        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice_params = texttospeech.VoiceSelectionParams(
            language_code="tr-TR",
            name=settings.tts_voice_name,
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            speaking_rate=settings.tts_speaking_rate,
            volume_gain_db=settings.tts_volume_gain_db,
            effects_profile_id=["headphone-class-device"],
        )

        response = self.client.synthesize_speech(
            input=synthesis_input,
            voice=voice_params,
            audio_config=audio_config,
        )
        return response.audio_content