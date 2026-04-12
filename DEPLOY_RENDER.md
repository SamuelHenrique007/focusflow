# Deploy no Render

## Estrutura preparada
- `render.yaml`: cria backend Django, frontend estático, Postgres e Redis.
- `backend/.env.production.example`: modelo de variáveis do backend.
- `frontend/.env.production.example`: modelo de variável do frontend.
- `backend/build.sh`: instala dependências e executa `collectstatic`.

## Variáveis que exigem preenchimento manual
### Backend
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

### Frontend
- `VITE_API_URL`

## Valores esperados no Render
### Serviço `focusflow-api`
- `FRONTEND_URL=https://SEU-FRONTEND.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://SEU-FRONTEND.onrender.com`
- `CSRF_TRUSTED_ORIGINS=https://SEU-BACKEND.onrender.com,https://SEU-FRONTEND.onrender.com`

### Serviço `focusflow-web`
- `VITE_API_URL=https://SEU-BACKEND.onrender.com/api`

## Observações técnicas
- O backend foi preparado para usar `DATABASE_URL` e `REDIS_URL` em produção.
- O servidor configurado para produção é o `daphne`, adequado ao uso de HTTP + WebSockets com Django Channels.
- O `WhiteNoise` foi configurado para servir arquivos estáticos do Django.
- A rota `/health/` foi adicionada para health checks do Render.
- O frontend usa rewrite para `/index.html`, permitindo rotas SPA no Render Static Site.
- O agendador interno de notificações ficou protegido por `RUN_NOTIFICATION_SCHEDULER`. Em produção, ele só inicia se essa variável for definida como `True`.
