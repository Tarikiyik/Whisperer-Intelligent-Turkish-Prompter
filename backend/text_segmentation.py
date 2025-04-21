"""
This module provides a function to segment a text script into smaller units.
It splits the input script using punctuation and further subdivides long sentences
into segments of a maximum number of words. When a sentence is split, every segment
except the final one is ensured to end with a terminal punctuation mark, so that
each segment is processed as a complete utterance by the TTS system.
"""

import re
import logging

logging.basicConfig(level=logging.INFO)

def segment_script(text: str, max_words: int = 40) -> list:
    """
    Splits the input script into smaller segments.

    First, the text is split using punctuation marks (period, exclamation, question marks)
    followed by whitespace. If any sentence is longer than the specified max_words, it is
    further subdivided into segments containing at most max_words.
    For sentences that are split, every segment except the last will have terminal punctuation appended
    if it does not already end with a period, exclamation mark, or question mark.

    Args:
        text (str): The full script as a string.
        max_words (int): Maximum number of words per segment.

    Returns:
        list: A list of text segments.
    """
    # Split the text on punctuation marks followed by whitespace.
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    segments = []
    for sentence in sentences:
        words = sentence.split()
        if len(words) > max_words:
            # Split the sentence into chunks of max_words.
            sentence_segments = [
                " ".join(words[i:i+max_words]) for i in range(0, len(words), max_words)
            ]
            # For all segments except the last, ensure they end with a terminal punctuation.
            for seg in sentence_segments[:-1]:
                if seg[-1] not in ".!?":
                    seg += "."
                segments.append(seg)
            # Append the last segment as is (it may already have terminal punctuation).
            segments.append(sentence_segments[-1])
        else:
            segments.append(sentence)
    logging.info(f"Script segmented into {len(segments)} segments.")
    return segments
