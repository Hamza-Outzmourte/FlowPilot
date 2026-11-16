from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "FlowPilot"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-this-to-a-random-secret-key"

    database_url: str = "postgresql+asyncpg://flowpilot:flowpilot@localhost:5432/flowpilot"
    redis_url: str = "redis://localhost:6379/0"

    # Telegram - you add your bot token in .env
    telegram_bot_token: str | None = None

    # Google Gemini - you add your API key in .env
    google_api_key: str | None = None

    # Gmail - app password for SMTP sending
    gmail_address: str | None = None
    gmail_app_password: str | None = None

    cors_origins: str = "http://localhost:5173"
    webhook_base_url: str = "http://localhost:8000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": False}


settings = Settings()
