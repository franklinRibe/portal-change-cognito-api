# ================================
#   Stage 1 — Build environment
# ================================
FROM python:3.11-slim AS builder

WORKDIR /backend/app

# Instala dependências básicas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements
COPY requirements.txt .

# Cria venv isolado dentro da imagem (melhor prática p/ produção)
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instala dependências sem cache
RUN pip install --no-cache-dir -r requirements.txt


# ================================
#   Stage 2 — Runtime (final image)
# ================================
FROM python:3.11-slim AS runtime

WORKDIR /backend/app

# Copia o venv do builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copia o código da aplicação
COPY app/ ./app/
COPY requirements.txt .

# Usuário não-root para segurança no Kubernetes
RUN useradd -m appuser
USER appuser

# Porta exposta
EXPOSE 8000

# Comando de entrada — Gunicorn + Uvicorn workers
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000", "--timeout", "120", "--workers", "4"]
