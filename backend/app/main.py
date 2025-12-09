from typing import Dict, Optional, Literal
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr

from app.services.cognito_service import admin_get_user, set_user_password, mask_password
from app.utils.json_logger import JsonFormatter
from app.core.config import settings

import boto3
from botocore.exceptions import ClientError
import logging
from fastapi import FastAPI, HTTPException, Query


app = FastAPI(
    title="User Management API",
    version="1.0.0",
    description="API para consultar e alterar usuários no Cognito",
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # ou ["*"] para liberar geral em dev
    allow_credentials=True,
    allow_methods=["*"],            # GET, POST, PUT, DELETE, OPTIONS...
    allow_headers=["*"],            # Headers customizados
)
ApplicationType = Literal["app", "corp", "parcerias"]

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logger = logging.getLogger("password-reset-api")
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.propagate = False 
logger = logging.getLogger("password-reset-api")

def get_cognito_client():
    """
    Cria o client do Cognito usando as credenciais padrão da AWS.
    Dentro do EKS, o IRSA assume o papel automaticamente.
    """
    return boto3.client("cognito-idp", region_name=settings.aws_region)


class UserResponse(BaseModel):
    username: str
    enabled: bool
    user_status: str
    user_attributes: Dict[str, str]


class ChangePasswordRequest(BaseModel):
    cpf: constr(min_length=11, max_length=11)
    change_pass: str  # "yes" / "no"
    application: ApplicationType

class ChangePasswordResponse(BaseModel):
    username: str
    new_password: str
    message: str


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/users/{username}", response_model=UserResponse)
def get_user(
    username: str,
    application: ApplicationType = Query(...),
):
    """
    Consulta o usuário no Cognito pelo username.

    O front deve chamar isso primeiro para preencher a tela com
    os dados atuais do usuário.
    """
    client = get_cognito_client()

    try:
        resp = admin_get_user(username=username, application=application)
    except ClientError as e:
        logger.exception("Erro do Cognito ao buscar usuário")
        raise HTTPException(
            status_code=500,
            detail=f"Erro do Cognito ao buscar usuário: {e}",
        )
    except Exception as e:
        logger.exception("Erro inesperado ao buscar usuário")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar usuário: {e}",
        )

    # Converte a lista de atributos do Cognito para um dict
    attrs_dict = {
        attr["Name"]: attr.get("Value", "")
        for attr in resp.get("UserAttributes", [])
    }

    return UserResponse(
        username=resp["Username"],
        enabled=resp.get("Enabled", True),
        user_status=resp.get("UserStatus", "UNKNOWN"),
        user_attributes=attrs_dict,
    )


@app.post("/api/users/{username}", response_model=ChangePasswordResponse)
def change_user_password(username: str, payload: ChangePasswordRequest):
    """
    Altera a senha do usuário no Cognito.

    Body esperado:
    {
      "cpf": "00062716506",
      "change_pass": "yes",
      "application": "app" | "corp" | "parcerias"
    }
    """
    if username != payload.cpf:
        raise HTTPException(
            status_code=400,
            detail="CPF do corpo da requisição não corresponde ao username da URL.",
        )

    if payload.change_pass.lower() not in ("yes", "y", "true", "1"):
        raise HTTPException(
            status_code=400,
            detail="Alteração de senha não foi solicitada (change_pass != 'yes').",
        )
    # log de entrada do backend
    logger.info(
        "Requisição de troca de senha recebida",
        extra={
            "extra_data": {
                "event": "request_received",
                "username": payload.cpf,
                "application": payload.application,
                "payload": payload.dict(),
            }
        }
    )

    try:
        new_password = set_user_password(
            cpf=payload.cpf,
            application=payload.application,
        )
    except ValueError as ve:
        # aplicação inválida
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao alterar senha do usuário no Cognito: {e}",
        )
    logger.info(
        "Senha alterada e retornada ao frontend",
        extra={
            "extra_data": {
                "event": "password_returned_to_frontend",
                "username": payload.cpf,
                "application": payload.application,
                "new_password_masked": mask_password(new_password),
            }
        }
    )

    return ChangePasswordResponse(
        username=payload.cpf,
        new_password=new_password,
        message="Senha alterada com sucesso no Cognito.",
    )