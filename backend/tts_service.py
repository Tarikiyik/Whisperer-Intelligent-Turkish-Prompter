"""
This module provides classes and functions to synthesize Turkish text to speech using the Google Cloud Text-to-Speech API.
In addition to the synchronous synthesis (which saves audio to a file), a new streaming synthesis method is provided.
The streaming method uses the external text_segmentation module to split the input script into smaller units,
and then feeds these segments (with a dynamic delay based on sentence word count) to the bidirectional streaming API.
It plays the audio directly via PyAudio.
"""

import os
import logging
import itertools
import time
from google.cloud import texttospeech
import pyaudio
from text_segmentation import segment_script

logging.basicConfig(level=logging.INFO)

class TurkishTTS:
    def __init__(self, credentials_path: str):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        self.client = texttospeech.TextToSpeechClient()
        self.last_segment_index = 0  # Tracks last segment sent
        self.pause_feed = False      # Flag to control pause/resume

    def pause_feeding(self):
        """Pause feeding new segments. """
        self.pause_feed = True
        logging.info("TTS feeding paused.")

    def resume_feeding(self):
        """Resume feeding new segments."""
        self.pause_feed = False
        logging.info("TTS feeding resumed.")   

    def synthesize(self, text: str, output_file: str = None, speaking_rate: float = 1.0,
                   effects_profile: list = ["headphone-class-device"], ssml: bool = False) -> str:
        try:
            if not output_file:
                output_dir = "./audio"
                os.makedirs(output_dir, exist_ok=True)
                output_file = os.path.join(output_dir, "speech.mp3")
            else:
                output_dir = os.path.dirname(output_file)
                if output_dir:
                    os.makedirs(output_dir, exist_ok=True)
            synthesis_input = (texttospeech.SynthesisInput(ssml=text)
                               if ssml else texttospeech.SynthesisInput(text=text))
            voice = texttospeech.VoiceSelectionParams(
                language_code="tr-TR",
                name="tr-TR-Wavenet-D",
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                effects_profile_id=effects_profile
            )
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            with open(output_file, "wb") as f:
                f.write(response.audio_content)
            logging.info(f"Audio synthesized and saved to: {output_file}")
            return output_file
        except Exception as e:
            logging.error(f"TTS Error: {e}")
            return None

    def stream_synthesize(self, text: str, speaking_rate: float = 1.2,
                          effects_profile: list = ["headphone-class-device"],
                          segment_delay: float = 1.0, start_segment: int = 0) -> int:
        """
        Streams TTS output for the given text, starting from start_segment.
        The text is segmented using the external segmentation module.
        The method feeds segments one by one, waiting a dynamic delay based on the number of words in the segment.
        If pause_feed is True, it waits until resumed.
        Returns the index of the last segment sent.
        """
        segments = segment_script(text)
        logging.info(f"Total segments: {len(segments)}")
        self.last_segment_index = start_segment
        p = pyaudio.PyAudio()
        stream = p.open(format=pyaudio.paInt16, channels=1, rate=24000, output=True)
        logging.info("PyAudio stream opened for playback.")
        for idx in range(start_segment, len(segments)):
            # Wait while paused.
            while self.pause_feed:
                logging.info("TTS feed paused. Waiting...")
                time.sleep(0.1)
            # Create configuration and send current segment.
            streaming_config = texttospeech.StreamingSynthesizeConfig(
                voice=texttospeech.VoiceSelectionParams(
                    language_code="tr-TR",
                    name="tr-TR-Chirp3-HD-Leda"
                )
            )
            config_request = texttospeech.StreamingSynthesizeRequest(streaming_config=streaming_config)
            seg_request = texttospeech.StreamingSynthesizeRequest(
                input=texttospeech.StreamingSynthesisInput(text=segments[idx])
            )
            combined_requests = itertools.chain([config_request, seg_request])
            responses = self.client.streaming_synthesize(combined_requests)
            for response in responses:
                if response.audio_content:
                    stream.write(response.audio_content)
                    logging.info(f"Played audio for segment {idx} (chunk size: {len(response.audio_content)} bytes).")
            self.last_segment_index = idx
            # Compute dynamic delay: assume average utterance time is 0.3 sec per word at 1.0 rate.
            word_count = len(segments[idx].split())
            delay = word_count * 0.2
            logging.info(f"Segment {idx} sent. Waiting {delay:.1f} seconds before next segment...")
            time.sleep(delay)
        logging.info("All segments processed. Closing playback stream.")
        stream.stop_stream()
        stream.close()
        p.terminate()
        return self.last_segment_index
        

def get_text_from_directory(directory: str) -> str:
    if not os.path.exists(directory):
        logging.error(f"Directory {directory} does not exist.")
        return None
    files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
    if not files:
        logging.info(f"No files found in {directory}.")
        return None
    file_path = os.path.join(directory, files[0])
    logging.info(f"Processing file: {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    elif ext == ".docx":
        import docx
        doc = docx.Document(file_path)
        full_text = [para.text for para in doc.paragraphs]
        return "\n".join(full_text)
    elif ext == ".pdf":
        text = ""
        from pypdf import PdfReader
        with open(file_path, "rb") as f:
            pdf_reader = PdfReader(f)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    else:
        logging.error(f"Unsupported file type: {ext}")
        return None

if __name__ == "__main__":
    tts = TurkishTTS("./secrets/google-tts-key.json")
    sample_text = (
        "Merhaba, bu bir testtir. Bu örnek metin, gerçek zamanlı TTS akışı için segmentlere ayrılacak. "
        "Her segment, doğal bir duraklama sağlayacak şekilde gönderilecek."
    )
    last_index = tts.stream_synthesize(sample_text, speaking_rate=1.0, effects_profile=["headphone-class-device"], segment_delay=1.0, start_segment=0)
    logging.info(f"Playback complete. Last segment sent was index: {last_index}")
