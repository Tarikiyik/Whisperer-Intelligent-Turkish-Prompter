# text_segmentation.py
import re
import logging
from typing import List

logging.basicConfig(level=logging.INFO)

# ── tunable parameters (change here only) ──────────────────────────────
MAX_WORDS = 10      # hard cap size of a sub-segment
MIN_WORDS = 4       # if the *last* fragment is shorter, merge it back
WINDOW     = 3      # how far we can look back for a nicer split point
# ───────────────────────────────────────────────────────────────────────

# negative look-behind avoids “20.”,  “7.”  etc. being treated as EOS
_SENT_BOUNDARY = re.compile(r'(?<!\d)(?<=[.!?])\s+')
# simple clause hints to sound more natural
_CLAUSE_BREAK  = re.compile(r',|;|\s+(?:ve|ama|fakat)\s+', flags=re.I)


def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in _SENT_BOUNDARY.split(text) if s.strip()]


def _yield_chunks(sentence: str) -> List[str]:
    """Smart sliding-window splitter that prefers clause marks."""
    words, i, out = sentence.split(), 0, []
    while i < len(words):
        j = min(i + MAX_WORDS, len(words))
        # look backwards ≤WINDOW tokens for a nicer boundary
        for k in range(j, i, -1):
            if j - k > WINDOW:
                break
            snippet = ' '.join(words[i:k])
            if _CLAUSE_BREAK.search(snippet):
                j = k
                break
        chunk = ' '.join(words[i:j]).strip()
        out.append(chunk)
        i = j
    # merge last short bit, if any
    if len(out) > 1 and len(out[-1].split()) < MIN_WORDS:
        out[-2] = f"{out[-2]} {out[-1]}".strip()
        out.pop()
    # final cleanup
    out = [_clean_final_punctuation(c) for c in out]
    return out


def _clean_final_punctuation(fragment: str) -> str:
    """Ensure only ONE terminal punctuation mark at the end."""
    return re.sub(r'[.!?]+$', '.', fragment) if fragment[-1].isalnum() else fragment


def segment_script(text: str, max_words: int = MAX_WORDS) -> List[str]:
    segments = []
    for sent in _split_sentences(text):
        if len(sent.split()) > max_words:
            segments.extend(_yield_chunks(sent))
        else:
            segments.append(_clean_final_punctuation(sent))
    logging.info("Script segmented into %d segments", len(segments))
    return segments
