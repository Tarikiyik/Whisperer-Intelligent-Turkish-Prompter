from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):

    # TTS settings
    tts_voice_name: str = Field("tr-TR-Chirp3-HD-Leda", env="TTS_VOICE_NAME")
    tts_speaking_rate: float = Field(1.15, env="TTS_SPEAKING_RATE")
    tts_volume_gain_db: float = Field(0.0, env="TTS_VOLUME_GAIN_DB")

    # VAD thresholds
    vad_long_ms: int = Field(1500, env="VAD_LONG_MS")

    # Pydantic-settings configuration
    model_config = SettingsConfigDict(
        env_file=".env.backend",
        env_file_encoding="utf-8"
    )

# Initialize settings
settings = Settings()