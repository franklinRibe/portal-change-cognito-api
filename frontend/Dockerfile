# ============================
# Stage 1: Build do frontend
# ============================
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependência
COPY frontend/package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Variável de ambiente para URL da API (pode sobrescrever no build)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Gera o build de produção
RUN npm run build

# ============================
# Stage 2: Nginx para servir o app
# ============================
FROM nginx:alpine

# Remove HTML default
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos do Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copia config básica opcional (se quiser customizar)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
