# Projeto – Sistema de Controle Patrimonial
Projeto referente a disciplina CSI606 - Sistemas Web.

Projeto desenvolvido para a disciplina de Sistemas Web, com foco na construção de uma aplicação completa utilizando arquitetura cliente-servidor, autenticação segura e banco de dados relacional.

  # SISTEMA DE CONTROLE PATRIMONIAL
### Resumo

O presente trabalho apresenta o desenvolvimento de um Sistema Web de Controle Patrimonial, voltado ao gerenciamento de bens móveis de uma instituição.

O sistema permite o registro, monitoramento e rastreabilidade de cada item desde sua aquisição até sua baixa definitiva, garantindo maior segurança, organização e transparência na gestão patrimonial.

A aplicação foi desenvolvida utilizando:

# Frontend: HTML5, CSS3 e JavaScript puro

# Backend: Node.js com Express

# Banco de Dados: MySQL

# Autenticação: JWT (JSON Web Token)

# Criptografia de senha: bcrypt

O sistema implementa controle de acesso por autenticação, separação entre frontend e backend via API REST e comunicação segura por token.

# Palavras-chave

Patrimônio • Controle • Gestão de Ativos • Sistemas Web • API REST • Node.js • MySQL • JWT

# 1 - Tema

Desenvolvimento de um Sistema Web de Controle Patrimonial destinado ao gerenciamento completo de bens móveis de uma instituição, permitindo o acompanhamento do ciclo de vida do bem desde o cadastro até sua baixa definitiva, incluindo movimentações, empréstimos e geração de relatórios.

# 2 - Tecnologias Utilizadas

## Backend

Node.js

Express.js

MySQL

JWT (jsonwebtoken)

bcryptjs

dotenv

## Frontend

HTML5

CSS3 (layout responsivo + tema claro/escuro)

JavaScript puro (ES6+)

Fetch API

Manipulação dinâmica de DOM

## Arquitetura

API RESTful

Padrão de middleware para autenticação

Separação entre camadas (rotas, middleware, banco)

# 3 - Funcionalidades Implementadas
## Autenticação

Login com email e senha

Senha criptografada com bcrypt

Geração de token JWT com expiração (8h)

Middleware de proteção de rotas

Controle de usuário ativo/inativo

## Gestão de Bens

Cadastro de bens patrimoniais com:

Número de patrimônio (plaqueta)

Descrição

Valor de aquisição

Data de aquisição

Setor

Responsável

Edição de descrição

Status automático:

ATIVO

EMPRESTADO

BAIXADO

# 🔁 Transferências

Transferência de bens entre setores

Alteração de responsável

Registro de motivo

Histórico de movimentação

Validação para impedir destino igual à origem

# 🤝 Empréstimos

Registro de retirada de bens

Registro de devolução

Controle de empréstimos abertos e atrasados

Atualização automática de status do bem

Geração de termo de empréstimo

Geração de termo de devolução

# 🧯 Baixa Patrimonial

Registro de baixa sem exclusão do bem

Tipos de baixa:

Doação

Venda

Sucata

Extravio

Inutilização

Registro de data e motivo

Atualização automática de status para BAIXADO

Histórico preservado

# 📊 Relatórios
## ✔ Total por Status

Quantidade de bens por situação

## ✔ Bens em Empréstimo

Lista de empréstimos abertos

## ✔ Bens por Setor

Filtro por setor

Versão para impressão

Quebra automática por setor (uma folha por setor)

## ✔ Histórico do Bem

Consulta por plaqueta

Exibição completa de eventos:

Cadastro

Transferências

Empréstimos

Devoluções

Baixa

# 4 - Arquitetura da Aplicação
## API REST

A aplicação utiliza padrão REST com os seguintes métodos:

GET – consultas

POST – criação de registros

PUT – atualização

Middleware JWT protegendo rotas privadas

Exemplo de header de autenticação:

Authorization: Bearer <token>
## Banco de Dados (MySQL)

Principais tabelas:

usuarios

bens

setores

colaboradores

emprestimos

transferencias

baixas

historico_eventos

Relacionamentos com chave estrangeira garantem integridade referencial.

# 5 - Escopo do Projeto

O sistema contempla:

✔ Cadastro completo de bens
✔ Controle de movimentações
✔ Controle de empréstimos
✔ Registro de baixa patrimonial
✔ Relatórios detalhados
✔ Autenticação segura
✔ Interface web responsiva
✔ Impressão em PDF

# 6 - Restrições

Não contempla:

Integração com sistemas governamentais

Integração financeira/contábil

Controle de manutenção técnica

Gestão de patrimônio imobiliário

Infraestrutura em nuvem

Integração com IoT ou IA

# 7 - Protótipo e Telas Implementadas

Tela de Login

Dashboard (menu principal)

Cadastro de Bens

Listagem e Filtro de Bens

Transferências

Empréstimos

Baixa Patrimonial

Relatórios

Relatório de impressão por setor

# 8 - Segurança Implementada

Senhas criptografadas com bcrypt

Token JWT com expiração

Middleware de autenticação

Proteção de rotas privadas

Validação de dados no backend

Escape de HTML em relatórios dinâmicos

# 9 - Conclusão

O Sistema de Controle Patrimonial desenvolvido atende ao objetivo proposto na disciplina de Sistemas Web, implementando:

Arquitetura cliente-servidor

API REST funcional

Autenticação segura

Banco de dados relacional

Interface dinâmica e responsiva

Separação clara entre frontend e backend

O projeto demonstra aplicação prática dos conceitos de desenvolvimento web, segurança, integração com banco de dados e organização estrutural de aplicações modernas.

 # 🚀 Instalação e Execução
Este guia explica como executar o Sistema de Controle Patrimonial em qualquer computador.

 ## ✅ Pré-requisitos
Antes de iniciar, certifique-se de ter instalado:
Node.js 18+
MySQL 8+ (ou MariaDB compatível)
Git (Opcional) MySQL Workbench ou phpMyAdmin

 ## 📥 1. Clonar o Repositório
Abra o terminal e execute:
git clone https://github.com/LucasDL27/Projeto_Sistema_Controle_Patrimonial.git
cd Projeto_Sistema_Controle_Patrimonial


## 📦 2. Instalar Dependências do Backend
Entre na pasta do backend:
cd server
npm install
Esse comando instalará todas as dependências do projeto (Express, MySQL, JWT, Bcrypt, etc.).

## ⚙️ 3. Configurar Variáveis de Ambiente (.env)
Dentro da pasta server, crie um arquivo chamado:
.env
Adicione o seguinte conteúdo:
PORT=3000
JWT_SECRET=coloque_uma_chave_super_secreta_aqui

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql_aqui
DB_NAME=controle_patrimonial
DB_PORT=3306
###🔐 Importante:
Substitua sua_senha_mysql pela senha do seu MySQL.

Utilize uma chave forte no JWT_SECRET (mínimo 32 caracteres).

Exemplo:
JWT_SECRET=83hd83hfd83hfd83hfd83hfd83hfd83hf

## 🗄️ 4. Configurar o Banco de Dados
Abra o MySQL (Workbench, terminal ou phpMyAdmin).
4.1 Criar o banco:
CREATE DATABASE controle_patrimonial;
4.2 Executar o Script SQL
Se houver um arquivo como:
database.sql
ou
schema.sql
Execute no terminal:
mysql -u root -p controle_patrimonial < database.sql
Ou copie e cole o conteúdo do arquivo SQL no MySQL Workbench.

## 👤 5. Criar Usuário Administrador
Execute no MySQL:
INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
VALUES (
 'Administrador',
 'admin@patrimonio.com',
 '$2a$10$COLE_AQUI_UM_HASH_BCRYPT_VALIDO',
 'ADMIN',
 1
);

## 🔑 Gerar Hash da Senha (bcrypt)
No terminal, dentro da pasta server, execute:
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('123456',10).then(console.log)"
Copie o hash gerado e substitua no comando SQL acima.

## ▶️ 6. Executar o Backend
Ainda dentro da pasta server, execute:
npm start
Ou, se utilizar nodemon:
npm run dev
A API estará disponível em:
http://localhost:3000/api

## 🌐 7. Acessar o Sistema
Se o frontend estiver configurado dentro do backend:
Abra no navegador:
http://localhost:3000

## 🔐 Primeiro Login
Utilize:
Email: admin@patrimonio.com
Senha: 123456/
(ou a senha que você definiu ao gerar o hash)



