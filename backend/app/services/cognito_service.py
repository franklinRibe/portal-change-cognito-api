import random
import string
from typing import Dict, Optional
import logging

import boto3

from app.core.config import settings
from app.utils.json_logger import JsonFormatter
from botocore.exceptions import ClientError


handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logger = logging.getLogger("password-reset-cognito")
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.propagate = False

def get_cognito_client():
    return boto3.client("cognito-idp", region_name=settings.aws_region)

def mask_password(pwd: str) -> str:
    """Oculta os dois últimos dígitos: 123456 → 1234**"""
    if len(pwd) <= 2:
        return "**"
    return pwd[:-2] + "**"

def resolve_user_pool_id(application: str) -> str:
    normalized = application.strip().lower()

    mapping: Dict[str, str] = {
        "app": settings.user_pool_id_app,
        "corporativo": settings.user_pool_id_corp,
        "corp": settings.user_pool_id_corp,
        "parcerias": settings.user_pool_id_parcerias,
        "parceria": settings.user_pool_id_parcerias,
    }

    if normalized not in mapping:
        raise ValueError(f"Aplicação inválida: {application!r}")

    return mapping[normalized]


def generate_numeric_password(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def admin_get_user(username: str, application: str):
    client = get_cognito_client()
    user_pool_id = resolve_user_pool_id(application)

    logger.info(
        "Buscando usuário no Cognito",
        extra={
            "extra_data": {
                "event": "admin_get_user_start",
                "username": username,
                "application": application,
                "user_pool_id": user_pool_id,
            }
        },
    )

    try:
        resp = client.admin_get_user(
            UserPoolId=user_pool_id,
            Username=username,
        )
    except client.exceptions.UserNotFoundException:
        logger.warning(
            "Usuário não encontrado no Cognito",
            extra={
                "extra_data": {
                    "event": "admin_get_user_not_found",
                    "username": username,
                    "application": application,
                    "user_pool_id": user_pool_id,
                }
            },
        )
        raise

    except ClientError as e:
        logger.exception(
            "Erro do Cognito ao buscar usuário",
            extra={
                "extra_data": {
                    "event": "admin_get_user_client_error",
                    "username": username,
                    "application": application,
                    "user_pool_id": user_pool_id,
                    "aws_error": str(e),
                }
            },
        )
        raise

    except Exception as e:
        logger.exception(
            "Erro inesperado ao buscar usuário no Cognito",
            extra={
                "extra_data": {
                    "event": "admin_get_user_unexpected_error",
                    "username": username,
                    "application": application,
                    "user_pool_id": user_pool_id,
                    "error": str(e),
                }
            },
        )
        raise

    logger.info(
        "Usuário encontrado no Cognito",
        extra={
            "extra_data": {
                "event": "admin_get_user_success",
                "username": username,
                "application": application,
                "user_pool_id": user_pool_id,
                "cognito_status": resp.get("UserStatus"),
            }
        },
    )

    return resp


def set_user_password(
    username: str,
    application: str,
    password: Optional[str] = None,
) -> str:
    """
    Define a senha do usuário no Cognito usando admin_set_user_password
    no pool escolhido pela aplicação.
    """
    client = get_cognito_client()
    user_pool_id = resolve_user_pool_id(application)

    if password is None:
        password = generate_numeric_password(6)

    masked = mask_password(password)
    logger.info(
        "Iniciando troca de senha no Cognito",
        extra={
            "extra_data": {
                "event": "password_reset_start",
                "username": username,
                "application": application,
                "new_password_masked": masked,
                "user_pool_id": user_pool_id,
            }
        }
    )

    response = client.admin_set_user_password(
        UserPoolId=user_pool_id,
        Username=username,
        Password=password,
        Permanent=True,
    )

    # 👉 Log de saída, incluindo metadata do Cognito
    logger.info(
        "Senha alterada no Cognito com sucesso",
        extra={
            "extra_data": {
                "event": "password_reset_success",
                "username": username,
                "application": application,
                "new_password_masked": masked,
                "user_pool_id": user_pool_id,
                "cognito_response": response.get("ResponseMetadata", {}),
            }
        }
    )

    return password
