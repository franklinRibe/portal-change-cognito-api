# 🔐 Password Reset Backend – FastAPI + AWS Cognito

Este backend foi criado para permitir que operadores realizem **troca de senha** de usuários em diferentes aplicações integradas ao **AWS Cognito**, de forma segura e rastreável.

Ele expõe uma API REST em **FastAPI** que:

- Consulta dados do usuário no Cognito.
- Gera uma **nova senha numérica de 6 dígitos**.
- Altera a senha do usuário no Cognito.
- Retorna a nova senha para o frontend (para o operador informar ao cliente).
- Registra logs estruturados em **JSON**, incluindo usuário, aplicação, e senha **mascarada** (últimos 2 dígitos ocultos).

---

## 🧱 Arquitetura / Estrutura de pastas

```bash
app/
  api/
    v1/
      controllers/
      routes/
      schemas/
  core/
    config.py
    security.py
  services/
    cognito_service.py
  utils/
    json_logger.py
  main.py
requirements.txt
```

Os arquivos principais para este fluxo são:

- `app/main.py` → Ponto de entrada da API (FastAPI, rotas, CORS, logs).
- `app/services/cognito_service.py` → Integração com AWS Cognito (AdminGetUser, AdminSetUserPassword).
- `app/core/config.py` → Configurações e variáveis de ambiente.
- `app/utils/json_logger.py` → Formatação de logs em JSON.

---

## Pré-requisitos

- **Python 3.9+** (recomendado 3.10 ou 3.11 para futuro)
- **pip** instalado
- Conta AWS com acesso ao Cognito
- Credenciais AWS configuradas para uso local, por exemplo:
  - Via `aws configure` (arquivo `~/.aws/credentials`)
  - Ou variáveis de ambiente:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - (Opcional) `AWS_SESSION_TOKEN`

> Em produção (EKS), o backend utilizará **IRSA** (IAM Roles for Service Accounts), então **NÃO é necessário** definir `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` no pod.

---

## 🌱 Configuração do ambiente local (venv)

Na raiz do backend (onde está o `requirements.txt`):

```bash
# 1. Criar o ambiente virtual
python3 -m venv venv

# 2. Ativar o venv

# Mac / Linux:
source venv/bin/activate

# 3. Atualizar pip e instalar dependências
pip install --upgrade pip
pip install -r requirements.txt
```

Para sair do venv depois:

```bash
deactivate
```

---

## 🔧 Variáveis de ambiente necessárias

O backend utiliza múltiplos **User Pools** no Cognito, um para cada “aplicação”:

- `app` → Aplicativo mobile / app
- `corporativo` ou `corp` → Portal corporativo
- `parcerias` → Portal de parcerias

Defina as seguintes variáveis:

```bash
export AWS_REGION="us-east-1"
export USER_POOL_ID_APP="us-east-1_XXXXXXXXX"
export USER_POOL_ID_CORP="us-east-1_YYYYYYYYY"
export USER_POOL_ID_PARCEIRAS="us-east-1_ZZZZZZZZ"
```

> Ajuste os valores conforme os IDs reais dos seus User Pools no Cognito.

---

## 🚀 Rodando o backend localmente

Com o `venv` ativado e as variáveis exportadas:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API ficará disponível em:

- `http://localhost:8000`

---

## 🌐 CORS (integração com frontend)

O backend já está configurado com CORS para aceitar requisições do Vite em desenvolvimento:

```python
origins = [
    "http://localhost:5173",
]
```

Se o frontend mudar de porta/origem, ajuste a lista `origins` em `app/main.py`.

---

## 📡 Endpoints disponíveis

### 🔍 Healthcheck

**GET** `/health`

**Exemplo:**

```bash
curl http://localhost:8000/health
```

**Resposta:**

```json
{
  "status": "ok"
}
```

---

### 👤 Consultar usuário no Cognito

**GET** `/users/{username}`

- `username` → geralmente o **CPF** do usuário
- `application` (query param) → `app` | `corp` | `parcerias`

**Exemplo:**

```bash
curl "http://localhost:8000/users/00062716506?application=app"
```

**Resposta (exemplo):**

```json
{
  "username": "00062716506",
  "enabled": true,
  "user_status": "CONFIRMED",
  "user_attributes": {
    "sub": "xxxx-xxxx-xxxx",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário"
  }
}
```

Esse endpoint é usado pelo frontend para **preencher a tela** e permitir que o operador confira que está alterando o usuário correto.

---

### 🔑 Trocar senha do usuário no Cognito

**POST** `/users/{username}`

- `username` → CPF do usuário (deve bater com `cpf` do body)
- Body (JSON):

```json
{
  "cpf": "00062716506",
  "change_pass": "yes",
  "application": "app"
}
```

**Exemplo com `curl`:**

```bash
curl -X POST "http://localhost:8000/users/00062716506"   -H "Content-Type: application/json"   -d '{
    "cpf": "00062716506",
    "change_pass": "yes",
    "application": "app"
  }'
```

**Resposta (exemplo):**

```json
{
  "username": "00062716506",
  "new_password": "202156",
  "message": "Senha alterada com sucesso no Cognito."
}
```

> ⚠️ A senha retornada (`new_password`) é uma **senha numérica de 6 dígitos** gerada automaticamente.  
> Essa senha deve ser enviada ao usuário pelo operador, orientando-o a alterar para uma senha pessoal assim que fizer login.

---

## 📜 Logs (JSON + senha mascarada)

Os logs são emitidos em formato **JSON**, com campos estruturados, por exemplo:

```json
{
  "timestamp": "2025-12-08T23:22:11.843000",
  "level": "INFO",
  "logger": "password-reset-cognito",
  "message": "Senha alterada no Cognito com sucesso",
  "event": "password_reset_success",
  "username": "00062716506",
  "application": "app",
  "new_password_masked": "2021**",
  "user_pool_id": "sa-east-1_XXXXXXXXX",
  "cognito_response": {
    "HTTPStatusCode": 200
  }
}
```

### 🔐 Proteção da senha nos logs

- A senha **completa** é usada apenas para:
  - chamar o Cognito (`AdminSetUserPassword`)
  - retornar ao frontend (`new_password` na resposta da API)
- Nos logs, a senha é **mascarada**:
  - `123456` → `1234**`

Isso é feito por uma função auxiliar:

```python
def mask_password(pwd: str) -> str:
    # 123456 -> 1234**
    ...
```

---

## 🧪 Fluxo típico de uso

1. Usuário final tenta trocar a senha por e-mail, mas não recebe o código.
2. Ele entra em contato com o suporte.
3. O operador abre o **frontend interno** que usa este backend.
4. O operador:
   - Busca o usuário por CPF e aplicação:
     - `GET /users/{cpf}?application=app`
   - Confere se é o usuário correto.
   - Solicita a troca de senha:
     - `POST /users/{cpf}` com `{ cpf, change_pass: "yes", application }`
5. O backend:
   - Gera uma senha numérica de 6 dígitos.
   - Atualiza a senha no Cognito (`AdminSetUserPassword` com `Permanent=True`).
   - Retorna a nova senha ao frontend.
   - Registra logs JSON com senha **mascarada**.
6. O operador informa a nova senha ao usuário e orienta a **alterar a senha** no próximo login.

---

## 🛠 Próximos passos / melhorias possíveis

- Adicionar autenticação/controle de acesso ao backend (ex.: JWT, API Key, IAM).
- Adicionar tracing / correlation ID nos logs.
- Persistir um histórico de resets (ex.: DynamoDB) para auditoria.
- Embalar tudo em Docker + Helm Chart para deploy em EKS com IRSA.

---

Se tiver qualquer mudança de fluxo no frontend (novos campos, novas aplicações, etc.), é só atualizar os mapeamentos de `application` e os User Pools no `config.py` e nas variáveis de ambiente. 😊
