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


