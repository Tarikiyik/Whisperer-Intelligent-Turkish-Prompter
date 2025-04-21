# speech_monitor.py

"""
This module defines the SpeechMonitor class that monitors a transcript file for updates.
It compares the most recent transcript (based on complete sentence boundaries) against the expected script,
ensuring that the script does not advance when off-script speech is detected.
This version is now aligned to work with the new bidirectional streaming TTS system where text is fed in segments.
Note that the expected script used for similarity analysis is kept as complete sentences,
while the TTS service uses a different segmentation (e.g. fixed word count) with delays.
"""

import asyncio
import time
import os
import logging
import difflib
import re

logging.basicConfig(level=logging.INFO)

class SpeechMonitor:
    """
    Monitors a transcript file for both silence and deviations from the expected script.
    It tracks progress through the expected script using a pointer (current_sentence_idx).

    For every update, it computes:
      - A sentence-based similarity by comparing the most recent transcript sentence (as split naturally by punctuation)
        with the expected sentence from the full script.
        
    When the similarity meets or exceeds the threshold, it advances the pointer,
    triggers the resume callback, and calls the sentence update callback (if set);
    otherwise, it triggers a pause.

    This module is now intended to work in coordination with a bidirectional streaming TTS system that feeds
    text segments (possibly using a fixed word count) while the SpeechMonitor uses complete sentences for comparison.
    """
    def __init__(self, transcript_file: str, expected_script: str, threshold: float = 2.0, similarity_threshold: float = 0.8):
        self.transcript_file = transcript_file
        self.expected_script = expected_script
        self.threshold = threshold
        self.similarity_threshold = similarity_threshold
        self.paused = False
        self.pause_callback = None
        self.resume_callback = None
        self.sentence_update_callback = None  # Callback to update external components (e.g., UI)

        # Split the expected script into complete sentences using natural punctuation.
        self.script_sentences = self._split_into_sentences(expected_script)
        self.current_sentence_idx = 0
        self.last_transcript = ""

        logging.info(f"Expected script split into {len(self.script_sentences)} sentences.")

    def _split_into_sentences(self, text):
        """
        Split text into complete sentences using punctuation.
        This function is kept separate so that the similarity analysis is based on natural language sentences.
        """
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        return [s.strip() for s in sentences if s.strip()]

    def set_pause_callback(self, callback):
        """Set the function to call when playback should be paused."""
        self.pause_callback = callback

    def set_resume_callback(self, callback):
        """Set the function to call when playback should be resumed."""
        self.resume_callback = callback

    def set_sentence_update_callback(self, callback):
        """Set the callback to be called when the current sentence index is updated."""
        self.sentence_update_callback = callback

    def combined_similarity(self, transcript: str) -> tuple:
        """
        Compare the most recent sentence from the transcript (split by natural punctuation)
        with the current expected sentence from the full script.
        
        Returns:
            tuple: (similarity ratio, current_sentence_idx)
        """
        transcript = transcript.lower().strip()
        if not transcript:
            return 0.0, self.current_sentence_idx

        # Split transcript into sentences (using natural punctuation) to focus on the latest one.
        transcript_sentences = self._split_into_sentences(transcript)
        if not transcript_sentences:
            return 0.0, self.current_sentence_idx

        recent_sentence = transcript_sentences[-1].lower()

        if self.current_sentence_idx < len(self.script_sentences):
            current_sentence = self.script_sentences[self.current_sentence_idx].lower()
        else:
            return 0.0, self.current_sentence_idx

        similarity = difflib.SequenceMatcher(None, current_sentence, recent_sentence).ratio()

        logging.info("=== SIMILARITY DETAILS ===")
        logging.info(f"RECENT SENTENCE FROM TRANSCRIPT: '{recent_sentence}'")
        logging.info(f"CURRENT EXPECTED SENTENCE ({self.current_sentence_idx}): '{current_sentence}'")
        if self.current_sentence_idx < len(self.script_sentences) - 1:
            next_sentence = self.script_sentences[self.current_sentence_idx + 1].lower()
            logging.info(f"NEXT SENTENCE ({self.current_sentence_idx + 1}): '{next_sentence}'")
        logging.info(f"MATCH RATIO: {similarity:.2f} (threshold: {self.similarity_threshold})")

        return similarity, self.current_sentence_idx

    async def run(self):
        """
        Continuously monitors the transcript file for updates.
        If no update occurs for longer than `threshold` seconds or if the combined similarity
        for the new transcript is below `similarity_threshold`, triggers the pause callback.
        When the similarity meets/exceeds the threshold, it advances the pointer,
        triggers the resume callback, and calls the sentence update callback (if set).
        """
        last_update = os.path.getmtime(self.transcript_file) if os.path.exists(self.transcript_file) else time.time()

        while True:
            await asyncio.sleep(1)  # Check every second

            if not os.path.exists(self.transcript_file):
                continue

            current_mtime = os.path.getmtime(self.transcript_file)
            if current_mtime > last_update:
                last_update = current_mtime

            time_diff = time.time() - last_update

            with open(self.transcript_file, "r", encoding="utf-8") as f:
                transcript = f.read()

            if transcript == self.last_transcript:
                if time_diff > self.threshold and not self.paused:
                    logging.info("Silence detected. Triggering pause callback.")
                    if self.pause_callback:
                        self.pause_callback()
                    self.paused = True
                continue

            self.last_transcript = transcript

            similarity, _ = self.combined_similarity(transcript)
            logging.info(f"Current sentence similarity: {similarity:.2f}")

            if similarity >= self.similarity_threshold:
                if self.current_sentence_idx < len(self.script_sentences) - 1:
                    self.current_sentence_idx += 1
                    logging.info(f"ADVANCING to next sentence (index {self.current_sentence_idx}): '{self.script_sentences[self.current_sentence_idx][:50]}...'")
                    if self.sentence_update_callback:
                        self.sentence_update_callback(self.current_sentence_idx)
                if self.paused:
                    logging.info("Similarity acceptable. Triggering resume callback.")
                    if self.resume_callback:
                        self.resume_callback()
                    self.paused = False
            else:
                if not self.paused:
                    logging.info("Low similarity detected. Triggering pause callback.")
                    if self.pause_callback:
                        self.pause_callback()
                    self.paused = True

            if time_diff > self.threshold and not self.paused:
                logging.info("Silence detected. Triggering pause callback.")
                if self.pause_callback:
                    self.pause_callback()
                self.paused = True
