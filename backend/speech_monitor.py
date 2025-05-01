# speech_monitor.py
"""
Monitors live transcripts, compares them against script **segments**
(produced by text_segmentation.segment_script) and fires pause/resume /
highlight callbacks.  Debug output prints the expected segment,
what was actually heard, and the similarity ratio.
"""

import os, time, asyncio, logging, difflib, re
from text_segmentation import segment_script

logging.basicConfig(level=logging.INFO)

# ────────────────────────────────────────────────────────────────────────
def _split_sentences(text: str):
    """Natural-language split that *ignores* decimal dots such as “20.”."""
    SENT_RE = re.compile(r'(?<!\d)(?<=[.!?])\s+')
    return [s.strip() for s in SENT_RE.split(text) if s.strip()]

# ────────────────────────────────────────────────────────────────────────
class SpeechMonitor:
    def __init__(self,
                 transcript_file: str,
                 expected_script: str,
                 threshold: float = 3.0,
                 similarity_threshold: float = 0.70):
        self.file   = transcript_file
        self.idle   = threshold                   # silence → pause (seconds)
        self.thres  = similarity_threshold

        self.segments = segment_script(expected_script)
        self.idx      = 0                         # current segment pointer
        self.last_tx  = ""
        self.paused   = False

        self._on_pause   = None
        self._on_resume  = None
        self._on_update  = None

        logging.info("SpeechMonitor ▶ %d segments ready", len(self.segments))

    # callback setters ----------------------------------------------------------
    def set_pause_callback              (self, fn): self._on_pause  = fn
    def set_resume_callback             (self, fn): self._on_resume = fn
    def set_sentence_update_callback    (self, fn): self._on_update = fn

    # similarity & debug helpers -----------------------------------------------
    def _similarity(self, recent: str) -> float:
        gold = self.segments[self.idx].lower()
        return difflib.SequenceMatcher(None, gold, recent.lower()).ratio()

    def _log_debug(self, recent: str, score: float):
        logging.info("── DBG ───────────────────────────────────────────")
        logging.info("EXPECTED [%02d]: %s", self.idx, self.segments[self.idx])
        logging.info("HEARD              %s", recent)
        logging.info("SIMILARITY         %.2f  (thr %.2f)", score, self.thres)
        logging.info("──────────────────────────────────────────────────")

    # main loop -----------------------------------------------------------------
    async def run(self):
        mtime = os.path.getmtime(self.file) if os.path.exists(self.file) else time.time()
        while True:
            await asyncio.sleep(0.5)

            if not os.path.exists(self.file):
                continue

            new_mtime = os.path.getmtime(self.file)
            if new_mtime > mtime:
                mtime = new_mtime
            idle = time.time() - mtime            # seconds since last write

            with open(self.file, "r", encoding="utf-8") as fh:
                txt = fh.read()

            # silence handling --------------------------------------------------
            if txt == self.last_tx:
                if idle > self.idle and not self.paused:
                    self._on_pause and self._on_pause()
                    self.paused = True
                continue
            self.last_tx = txt

            # analyse most recent sentence --------------------------------------
            recent_sents = _split_sentences(txt)
            if not recent_sents:
                continue
            recent = recent_sents[-1]

            score = self._similarity(recent)
            self._log_debug(recent, score)

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
