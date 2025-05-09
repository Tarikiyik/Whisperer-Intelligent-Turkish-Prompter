"""
Monitors live transcripts, compares them against script **segments**
(produced by text_segmentation.segment_script) and fires highlight callbacks.
Debug output prints the expected segment, what was actually heard, and the similarity ratio.
"""

import os, time, asyncio, logging, re
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
        similarity_threshold: float = 0.70,
        # Path to the fine-tuned NLP model
        model_path: str = "../turkish_nlp_model"
    ):
        self.file = transcript_file
        self.thres = similarity_threshold

        # Use the same segments from text_segmentation
        self.segments = segment_script(expected_script)
        self.idx = 0
        self.last_tx = ""

        # Only the update callback remains
        self._on_update = None

        # Load the NLP model once
        self.model = SentenceTransformer(model_path)
        logging.info("SpeechMonitor ▶ %d segments ready", len(self.segments))
        logging.info("Model loaded from: %s", model_path)

    def set_sentence_update_callback(self, fn):
        """Register a callback fn(idx: int) to fire when a segment is spoken."""
        self._on_update = fn

    def _similarity(self, recent: str) -> float:
        """Compute cosine similarity between the current segment and recent text."""
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
        # Track last modification time
        mtime = os.path.getmtime(self.file) if os.path.exists(self.file) else time.time()

        while True:
            await asyncio.sleep(0.2)

            if not os.path.exists(self.file):
                continue

            new_mtime = os.path.getmtime(self.file)
            if new_mtime > mtime:
                mtime = new_mtime

            # Asynchronously read the transcript file
            with open(self.file, "r", encoding="utf-8") as fh:
                txt = fh.read()

            # If nothing new, skip
            if txt == self.last_tx:
                continue

            self.last_tx = txt
            recent_sents = _split_sentences(txt)
            if not recent_sents:
                continue

            recent = recent_sents[-1]
            score = self._similarity(recent)

            # Only advance when similarity meets threshold
            if score >= self.thres and self.idx < len(self.segments) - 1:
                self.idx += 1
                if self._on_update:
                    self._on_update(self.idx)