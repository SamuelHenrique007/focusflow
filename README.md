# FocusFlow

Aplicação web desenvolvida para auxiliar usuários no gerenciamento de tarefas, organização da rotina e aumento da produtividade por meio da Técnica Pomodoro, gamificação e acompanhamento de desempenho.

## Sobre o projeto

O FocusFlow foi desenvolvido com o objetivo de oferecer uma experiência simples, moderna e intuitiva para organização de estudos, trabalho e atividades do dia a dia. A aplicação combina gerenciamento de tarefas com sessões de foco baseadas na Técnica Pomodoro, permitindo ao usuário acompanhar sua produtividade de maneira visual e motivadora.

Além das funcionalidades tradicionais de produtividade, o sistema utiliza elementos de gamificação, como conquistas, recompensas e progresso do usuário, tornando a experiência mais interativa e estimulante.

---

# Funcionalidades principais

## Autenticação de usuários

- Cadastro de usuários
- Login com autenticação JWT
- Recuperação de senha por e-mail
- Redefinição de senha
- Rotas protegidas

## Dashboard

- Resumo geral de produtividade
- Informações rápidas sobre tarefas
- Sessões Pomodoro concluídas
- Estatísticas de desempenho
- Visualização do progresso do usuário

## Gerenciamento de tarefas

- Criar tarefas
- Editar tarefas
- Excluir tarefas
- Marcar tarefas como concluídas
- Organização das atividades

## Técnica Pomodoro

- Temporizador Pomodoro funcional
- Sessões de foco
- Controle de pausas
- Registro das sessões realizadas
- Histórico de produtividade

## Estatísticas

- Acompanhamento do desempenho
- Histórico de sessões
- Dados de produtividade
- Indicadores visuais

## Sistema de conquistas

- Conquistas desbloqueáveis
- Recompensas simbólicas
- Feedback visual ao usuário
- Sistema de progressão

## Loja virtual interna

- Sistema de recompensas
- Desbloqueio de itens
- Integração com gamificação

## Notificações

- Sistema de notificações em tempo real
- Feedback visual das ações do usuário
- Atualizações instantâneas

## Configurações

- Personalização da aplicação
- Alteração de tema
- Configurações do usuário

---

# Tecnologias utilizadas

## Front-end

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- Zustand
- Lucide React

## Back-end

- Python
- Django
- Django REST Framework
- JWT Authentication
- Django Channels
- Redis
- PostgreSQL

## Outras ferramentas

- Git e GitHub
- Render
- APScheduler

---

# Estrutura do projeto

```bash
focusflow/
├── backend/
│   ├── accounts/
│   ├── notifications/
│   ├── pomodoro/
│   ├── tasks/
│   ├── achievements/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── store/
│   └── ...
│
└── README.md
```

---

# Instalação do projeto

## Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- Node.js
- Python 3
- PostgreSQL
- Git

---

# Configuração do Back-end

## 1. Acesse a pasta do backend

```bash
cd backend
```

## 2. Crie e ative um ambiente virtual

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

## 3. Instale as dependências

```bash
pip install -r requirements.txt
```

## 4. Configure as variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.production.example`.

Exemplo:

```env
SECRET_KEY=sua_secret_key
DEBUG=True
DATABASE_URL=postgresql://usuario:senha@localhost:5432/focusflow
```

## 5. Execute as migrações

```bash
python manage.py migrate
```

## 6. Inicie o servidor

```bash
python manage.py runserver
```

O backend estará disponível em:

```bash
http://127.0.0.1:8000/
```

---

# Configuração do Front-end

## 1. Acesse a pasta do frontend

```bash
cd frontend
```

## 2. Instale as dependências

```bash
npm install
```

## 3. Inicie o projeto

```bash
npm run dev
```

O frontend estará disponível em:

```bash
http://localhost:5173/
```

---

# Rotas principais da aplicação

| Rota             | Descrição                |
| ---------------- | ------------------------ |
| `/`              | Landing Page             |
| `/login`         | Login                    |
| `/register`      | Cadastro                 |
| `/dashboard`     | Dashboard                |
| `/tasks`         | Gerenciamento de tarefas |
| `/pomodoro`      | Temporizador Pomodoro    |
| `/stats`         | Estatísticas             |
| `/achievements`  | Conquistas               |
| `/store`         | Loja                     |
| `/notifications` | Notificações             |
| `/settings`      | Configurações            |

---

# Arquitetura da aplicação

A aplicação segue uma arquitetura baseada em separação entre frontend e backend.

- O frontend é responsável pela interface do usuário e comunicação com a API.
- O backend gerencia autenticação, regras de negócio, persistência de dados e notificações.
- A comunicação ocorre através de APIs REST.
- Notificações em tempo real utilizam WebSockets com Django Channels.

---

# Funcionalidades de gamificação

O sistema possui recursos de gamificação para incentivar a produtividade dos usuários:

- Sistema de conquistas
- Recompensas simbólicas
- Progressão do usuário
- Feedback visual
- Estatísticas motivacionais

Esses elementos tornam a experiência mais interativa e ajudam na manutenção do foco durante o uso da aplicação.

---

# Segurança

O sistema utiliza:

- Autenticação JWT
- Rotas protegidas
- Controle de acesso
- Validação de dados
- Recuperação segura de senha

---

# Deploy

A aplicação encontra-se implantada na plataforma Render.

## Acesso à aplicação

Acesse a aplicação através do link:

```bash
https://focusflow02.onrender.com
```

## Serviços utilizados no deploy

- Render
- PostgreSQL
- Redis

---

# Melhorias futuras

- Aplicativo mobile
- Integração com calendário
- Sincronização entre dispositivos
- Novos elementos de gamificação
- Relatórios avançados
- Sistema de metas personalizadas

---

# Autor

Desenvolvido por Samuel Henrique.

---

# Licença

Este projeto foi desenvolvido para fins acadêmicos e educacionais.
