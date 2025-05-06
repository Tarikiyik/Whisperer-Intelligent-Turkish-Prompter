# speech_monitor.py
"""
Monitors live transcripts, compares them against script **segments**
(produced by text_segmentation.segment_script) and fires pause/resume /
highlight callbacks.  Debug output prints the expected segment,
what was actually heard, and the similarity ratio.
"""

import os, time, asyncio, logging, re
from typing import Optional
from text_segmentation import segment_script
from sentence_transformers import SentenceTransformer, util

logging.basicConfig(level=logging.INFO)

def _split_sentences(text: str):
    SENT_RE = re.compile(r'(?<!\d)(?<=[.!?])\s+')
    return [s.strip() for s in SENT_RE.split(text) if s.strip()]

class SpeechMonitor:
    def __init__(
        self,
        transcript_file: str,
        expected_script: str,
        threshold: float = 3.0,
        similarity_threshold: float = 0.70,
        model_path: str = "../labse-stsb-turkish-cls-pooled"  # path to the trained nlp model
    ):
        self.file = transcript_file
        self.idle = threshold
        self.thres = similarity_threshold

        self.segments = segment_script(expected_script)
        self.idx = 0
        self.last_tx = ""
        self.paused = False

        self._on_pause = None
        self._on_resume = None
        self._on_update = None

        # Load the NLP model
        self.model = SentenceTransformer(model_path)
        logging.info("SpeechMonitor ▶ %d segments ready", len(self.segments))
        logging.info("Model loaded from: %s", model_path)

    def set_pause_callback(self, fn): self._on_pause = fn
    def set_resume_callback(self, fn): self._on_resume = fn
    def set_sentence_update_callback(self, fn): self._on_update = fn

    def _similarity(self, recent: str) -> float:
        """Using NLP model to score similarity between recent text and expected segment."""
        gold = self.segments[self.idx]
        embeddings = self.model.encode([gold, recent], convert_to_tensor=True)
        score = util.cos_sim(embeddings[0], embeddings[1]).item()

        self._log_debug(recent, score)
        return score

    def _log_debug(self, recent: str, score: float):
        logging.info("── NLP SIMILARITY DEBUG ───────────────────────────")
        logging.info("EXPECTED [%02d]: %s", self.idx, self.segments[self.idx])
        logging.info("HEARD              %s", recent)
        logging.info("COSINE SIMILARITY  %.3f  (thr %.2f)", score, self.thres)
        logging.info("──────────────────────────────────────────────────")

    async def run(self):
        mtime = os.path.getmtime(self.file) if os.path.exists(self.file) else time.time()
        while True:
            await asyncio.sleep(0.5)

            if not os.path.exists(self.file):
                continue

            new_mtime = os.path.getmtime(self.file)
            if new_mtime > mtime:
                mtime = new_mtime
            idle = time.time() - mtime

            with open(self.file, "r", encoding="utf-8") as fh:
                txt = fh.read()

            if txt == self.last_tx:
                if idle > self.idle and not self.paused:
                    self._on_pause and self._on_pause()
                    self.paused = True
                continue
            self.last_tx = txt

            recent_sents = _split_sentences(txt)
            if not recent_sents:
                continue
            recent = recent_sents[-1]

            score = self._similarity(recent)

            if score >= self.thres:
                if self.paused:
                    self._on_resume and self._on_resume()
                    self.paused = False
                if self.idx < len(self.segments) - 1:
                    self.idx += 1
                    self._on_update and self._on_update(self.idx)
            else:
                if not self.paused:
                    self._on_pause and self._on_pause()
                    self.paused = True