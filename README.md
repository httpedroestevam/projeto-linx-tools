# Linxtools V1.3 — Portal da Operação / Backoffice

Aplicação web **full stack Node.js**, com frontend e backend na mesma pasta, sem dependências externas no MVP. Evolução da V1.2, mantendo o Mural, o Aprendizado e as oito Webee Tools e adicionando um painel de gestão completo para usuários autorizados.

> **Protótipo independente, não oficial**, para validação de conceito. Os dois comunicados padrão são **fictícios e identificados como demonstração**. Não exponha dados corporativos reais sem autorização e revisão de segurança.

## Executar em seu computador

**Pré-requisito:** Node.js 20 ou superior (recomendado 22).

1. Extraia o ZIP.
2. Abra a pasta `linxtools-v1.3` no terminal ou VS Code.
3. Execute `npm start`.
4. Acesse `http://localhost:3000`.

A instalação não exige `npm install`, pois a versão atual utiliza somente módulos nativos do Node.js.

### Criar o primeiro administrador

Abra um segundo terminal, dentro da pasta do projeto, e execute:

```bash
npm run create:admin
```

Informe nome, email e **uma senha com 12 a 128 caracteres**. Durante esse comando, a senha digitada fica visível no terminal; utilize ambiente privado. Não há senha padrão.

Em seguida:

1. Entre em `http://localhost:3000/login` com o email e a senha criados.
2. Clique em **Portal da Operação** no cabeçalho ou acesse `/operacao`.
3. Abra **Usuários** → **Novo usuário** para cadastrar a equipe.
4. Selecione perfil, marque **Conta habilitada** e conceda as permissões correspondentes às publicações desejadas.
5. Acesse **Comunicados**, **Vídeos**, **Releases**, **Links úteis** ou **Configurações** conforme seu perfil.

## O que pode ser feito no painel

| Área | Funcionalidades |
|---|---|
| **Visão geral** | Resumo de comunicados, vídeos, releases e links; atalhos editoriais |
| **Comunicados** | Criar, editar, agendar, fixar, exigir ciência, salvar rascunhos e arquivar avisos |
| **Vídeos** | Cadastrar, editar e remover vídeos do YouTube/Vimeo por links HTTPS |
| **Releases** | Cadastrar produto, versão, resumo, data e referência; salvar rascunhos, publicar, editar e arquivar |
| **Links úteis** | Cadastrar URLs HTTPS, descrições, categorias; salvar rascunhos, publicar e arquivar |
| **Usuários** | Criar contas, editar nome, mudar perfil, redefinir senha, ativar/desativar conta e permissões |
| **Configurações** | Personalizar título e descrição da página inicial e ativar/desativar banner de aviso |

**Perfis e permissões:** o administrador tem acesso integral. Os demais usuários podem receber permissões separadas para `notices`, `videos`, `releases` e `links`, independentemente de serem `lideranca` ou `analista`. Contas desabilitadas não conseguem fazer login, e a alteração de um usuário revoga suas sessões ativas. Somente administradores podem cadastrar e administrar contas ou mudar as configurações gerais do portal.

**Os analistas sem permissão editorial** podem acessar o mural e as publicações internas, confirmar leitura, assistir vídeos e usar as Webee Tools. As Webee Tools e as releases permanecem públicas no MVP; mural, biblioteca de vídeos e links úteis exigem login.

### Como publicar

- Em **Comunicados**, clique em **Novo comunicado** e selecione `Publicar` ou `Salvar rascunho`. Uma data futura em **Publicar em** agenda a disponibilização.
- Em **Releases** e **Links úteis**, novos registros começam como `Rascunho`; selecione `Publicar` ao concluir.
- Em **Vídeos**, o cadastro fica visível imediatamente aos usuários autenticados (não há rascunho nem agendamento nesta versão).
- Em **Configurações**, o banner de aviso aparece na página inicial somente quando `Exibir aviso` estiver marcado e houver texto.

## Estrutura

```text
linxtools-v1.3/
├── public/                  # Frontend SPA: app.js, styles.css, assets/
├── server/
│   ├── app.js               # API REST e autorização de acesso
│   ├── services/
│   │   ├── auth.js          # Sessões e senha com scrypt
│   │   ├── portal.js        # Permissões e validação de publicações
│   │   ├── content.js       # Comunicados e vídeos
│   │   └── tools.js, xml.js
│   └── repositories/
│       ├── local.js, portal-local.js
│       └── supabase.js, portal-supabase.js
├── storage/                 # data.json criado automaticamente (privado)
├── scripts/                 # Inicialização admin + migração de dados
├── supabase/schema.sql      # Criação / atualização SQL para V1.3
├── tests/                   # 22 testes automatizados
└── package.json
```

`npm test` executa as 22 verificações automatizadas. `npm run dev` inicia o modo watch do Node.js.

### API administrativa

| Método | Endpoint | Acesso |
|---|---|---|
| GET | `/api/admin/overview` | Perfil com alguma permissão editorial |
| GET/POST | `/api/admin/notices` | Permissão `notices` |
| PATCH/DELETE | `/api/admin/notices/:id` | Permissão `notices` |
| POST | `/api/admin/videos` | Permissão `videos` |
| PATCH/DELETE | `/api/admin/videos/:id` | Permissão `videos` |
| GET/POST | `/api/admin/releases` | Permissão `releases` |
| PATCH/DELETE | `/api/admin/releases/:id` | Permissão `releases` |
| GET/POST | `/api/admin/links` | Permissão `links` |
| PATCH/DELETE | `/api/admin/links/:id` | Permissão `links` |
| GET/POST | `/api/admin/users` | Administrador |
| PATCH | `/api/admin/users/:id` | Administrador |
| PATCH | `/api/admin/portal` | Administrador |
| GET | `/api/portal`, `/api/releases` | Público |
| GET | `/api/links`, `/api/notices`, `/api/videos` | Autenticado |

A API não é um acesso direto ao banco de dados: todas as alterações passam pela autorização do servidor Node. Não exponha a camada de persistência ou uma chave de serviço Supabase ao navegador.

## Preparação para Supabase (etapa futura)

O projeto já oferece um adaptador PostgREST para Supabase, porém **continua usando armazenamento JSON local por padrão**. Não é obrigatório criar conta Supabase agora.

Para usar o banco futuramente:

1. Crie um projeto Supabase e execute **todo** o `supabase/schema.sql` no SQL Editor. Se já utilizou o schema V1.2, execute a versão V1.3 para adicionar as novas colunas e tabelas.
2. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` **apenas no backend**.
3. Faça backup de `storage/data.json` e crie o primeiro administrador se ainda não tiver criado.
4. Execute `npm run migrate:supabase` com `DATA_PROVIDER=local` para importar os dados.
5. Configure `DATA_PROVIDER=supabase`, reinicie o servidor e faça login novamente.

O adaptador **não utiliza Supabase Auth** e não hospeda o Node no Supabase: por enquanto usa a tabela `app_users` e sessões geridas pelo backend. Migrar o login para Supabase Auth requer uma mudança de autenticação e políticas RLS, ainda não implementada. O script de migração não importa sessões e não faz deploy. Faça backup antes de migrar e teste o schema em projeto separado.

## Segurança e limitações

Esta versão é **um MVP local**, não uma solução auditada e homologada para uso corporativo. Antes de expor em rede ou publicar avisos internos reais, providencie HTTPS, proxy seguro, políticas de rede, autenticação corporativa ou recuperação de senha, política de senhas, logs de auditoria das publicações, rate limits centralizados, defesa CSRF reforçada e banco transacional com backup e controle de concorrência. O repositório JSON suporta apenas um processo Node e não substitui banco de produção.

**NUNCA** publique `storage/data.json` nem `.env`, que podem conter dados privados, hashes de senhas ou credenciais. Esses arquivos estão no `.gitignore`.

A edição de conteúdo é em texto simples; não há upload de anexos ou de vídeos, público segmentado por equipe, notificações push nem versionamento editorial nesta versão. O validador XML é sintático, não realiza certificação fiscal. A verificação visual do painel foi feita com dados locais de teste; a implantação em Supabase real não foi executada.
