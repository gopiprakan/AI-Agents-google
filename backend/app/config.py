import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Integrated Smart City Traffic Solutions (ISCTS)"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-iscts-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "iscts")
    
    # Connection URL builder with SQLite fallback for offline development
    @property
    def DATABASE_URL(self) -> str:
        # Check if DATABASE_URL is explicitly set in env
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        
        # Check if we should use PostgreSQL or fallback to sqlite
        use_postgres = os.getenv("USE_POSTGRES", "false").lower() == "true"
        if use_postgres:
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # Fallback to local SQLite inside the workspace
        workspace_db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db_store")
        os.makedirs(workspace_db_dir, exist_ok=True)
        return f"sqlite:///{os.path.join(workspace_db_dir, 'iscts.db')}"

    # Redis settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    USE_REDIS: bool = os.getenv("USE_REDIS", "false").lower() == "true"

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()
