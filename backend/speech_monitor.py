"""
SpeechMonitor is a class that monitors live transcripts, compares them against script **segments**
(produced by text_segmentation.segment_script) and fires highlight callbacks.
Debug output prints the expected segment, what was actually heard, and the similarity ratio.
"""

import os, time, asyncio, logging, re
from text_segmentation import segment_script, segment_sentences
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
        model_path: str = "../turkish_nlp_model",
        lookahead_segments: int = 2, # Number of future segments to check
        sentence_mode: bool = False  # Segmentation mode
    ):
        self.file = transcript_file
        self.thres = similarity_threshold
        self.lookahead_segments = lookahead_segments

        # Use the same segments from text_segmentation
        if sentence_mode:
            self.segments = segment_sentences(expected_script)
        else:
            self.segments = segment_script(expected_script)

        self.current_expected_idx = 0
        self.last_tx = ""
        self.is_completed = False  # Track completion state

        # Callbacks
        self._on_update = None
        self._on_completion = None

        # Load the NLP model once
        self.model = SentenceTransformer(model_path)
        logging.info("SpeechMonitor ▶ %d segments ready", len(self.segments))
        logging.info("Model loaded from: %s", model_path)

    def set_sentence_update_callback(self, fn):
        """Register a callback fn(idx: int) to fire when a segment is spoken."""
        self._on_update = fn

    def set_completion_callback(self, fn):
        """Register a callback fn() to fire when all segments are completed."""
        self._on_completion = fn

    def _similarity(self, recent_text: str, target_segment_text: str, target_segment_idx_for_logging: int) -> float:
        """Compute cosine similarity between a target segment and recent text."""
        embeddings = self.model.encode([target_segment_text, recent_text], convert_to_tensor=True)
        score = util.cos_sim(embeddings[0], embeddings[1]).item()
        self._log_debug(recent_text, score, target_segment_text, target_segment_idx_for_logging)
        return score

    def _log_debug(self, recent_text: str, score: float, expected_segment_text: str, expected_segment_idx: int):
        logging.info("── NLP SIMILARITY DEBUG ───────────────────────────")
        logging.info("TRYING MATCH FOR [%02d]: %s", expected_segment_idx, expected_segment_text)
        logging.info("HEARD                 %s", recent_text)
        logging.info("COSINE SIMILARITY     %.3f  (thr %.2f)", score, self.thres)
        logging.info("──────────────────────────────────────────────────")

    async def run(self):
        # Track last modification time
        mtime = os.path.getmtime(self.file) if os.path.exists(self.file) else time.time()

        while True:
            await asyncio.sleep(0.2)

            if not os.path.exists(self.file):
                continue

            # If already completed, stop processing
            if self.is_completed:
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

            recent_spoken_text = recent_sents[-1]
            
            # Determine the range of segments to check (current + lookahead)
            # Start from the furthest lookahead and work backwards
            # e.g. if lookahead is 2, check: current+2, current+1, current
            best_idx      = None
            best_score    = self.thres
            best_offset   = 0
            for lookahead_offset in range(self.lookahead_segments, -1, -1):
                prospective_match_idx = self.current_expected_idx + lookahead_offset
                
                # Ensure prospective_match_idx is a valid segment index
                if 0 <= prospective_match_idx < len(self.segments):
                    target_segment_text = self.segments[prospective_match_idx]
                    score = self._similarity(recent_spoken_text, target_segment_text, prospective_match_idx)
                    # If the score is better than the current best, update the best match
                    if score >= best_score:
                        best_score = score
                        best_idx = prospective_match_idx
                        best_offset = lookahead_offset

            # If a match was found, update the expected index
            if best_idx is not None:
                # Check if this is the last segment
                if best_idx == len(self.segments) - 1:
                    logging.info(f"COMPLETED! Last segment [{best_idx}] was matched.")
                    self.is_completed = True
                    if self._on_completion:
                        self._on_completion()
                else:
                    new_expected_idx = best_idx + 1
                    if new_expected_idx > self.current_expected_idx:
                        logging.info(f"MATCHED segment [{best_idx}] (jumped {best_offset}). New expected index: {new_expected_idx}")
                        self.current_expected_idx = new_expected_idx
                        if self._on_update:
                            self._on_update(self.current_expected_idx)
                    