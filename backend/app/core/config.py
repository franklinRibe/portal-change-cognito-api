from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    aws_region: str = "us-east-1"
    
    user_pool_id_app: str
    user_pool_id_corp: str
    user_pool_id_parcerias: str

    class Config:
        env_prefix = ""  # usa as variáveis exatamente como estão
        case_sensitive = False


settings = Settings()
