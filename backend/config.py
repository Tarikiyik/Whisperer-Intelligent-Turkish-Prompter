from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):

    # TTS settings
    tts_voice_name: str = Field("tr-TR-Chirp3-HD-Charon", env="TTS_VOICE_NAME")
    tts_speaking_rate: float = Field(1.15, env="TTS_SPEAKING_RATE")
    tts_volume_gain_db: float = Field(0.0, env="TTS_VOLUME_GAIN_DB")
    interrupt_on_speech: bool = Field(True, env="INTERRUPT_ON_SPEECH")

    # VAD thresholds
    vad_long_ms: int = Field(1500, env="VAD_LONG_MS")

    # Segmentation mode
    sentence_mode: bool = Field(True, env="SENTENCE_MODE")

    # Pydantic-settings configuration
    model_config = SettingsConfigDict(
        env_file=".env.backend",
        env_file_encoding="utf-8"
    )

# Initialize settings
settings = Settings()