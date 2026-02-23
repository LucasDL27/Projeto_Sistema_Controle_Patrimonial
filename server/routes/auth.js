/**
 * Rotas de Autenticação (Auth)
 * --------------------------------
 * Responsável por:
 * -> Validar login do usuário (email/senha)
 * -> Verificar senha com bcrypt
 * -> Gerar JWT com payload básico do usuário
 */
const express = require("express");
const router = express.Router();
const db = require("../db");    // Conexão com o banco (MySQL)
const bcrypt = require("bcryptjs");   // Conexão com o banco (MySQL)
const jwt = require("jsonwebtoken");  // Lib para assinar/gerar token JWT
require("dotenv").config();

/**
 * POST /api/auth/login
 * body: { email, senha }
 * * Regras:
 * -> email e senha obrigatórios
 * -> usuário precisa existir e estar ativo
 * -> senha precisa bater com senha_hash
 * -> se estiver ok, retorna token + dados básicos do usuário
 */
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;   // 1) Captura credenciais do body

     // 2) Validação básica (evita query desnecessária)
    if (!email || !senha) return res.status(400).json({ error: "email e senha são obrigatórios" });

     /**
     * 3) Busca usuário pelo email
     * - LIMIT 1 por segurança/performance
     * - já traz senha_hash e status ativo para validações
     */
    const [rows] = await db.query(
      "SELECT id, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );

    // 4) Se não existir usuário, retorna erro genérico (não revela se email existe)
    if (!rows.length) return res.status(401).json({ error: "Credenciais inválidas" });
    const user = rows[0];

    // 5) Bloqueia se usuário estiver desativado
    if (!user.ativo) return res.status(403).json({ error: "Usuário desativado" });

     /**
     * 6) Compara senha digitada com hash do banco
     * bcrypt.compare:
     * - senha em texto (input)
     * - hash salvo no banco
     */
    const ok = await bcrypt.compare(senha, user.senha_hash);

    // 7) Se senha não bater, retorna erro genérico
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

     /**
     * 8) Gera token JWT
     * Payload mínimo (o que a API precisa saber):
     * - id: identificar usuário
     * - perfil: controle de permissão (se for usar)
     * - nome: útil em logs/uso no front
     *
     * expiresIn: expira em 8h por segurança
     */
    const token = jwt.sign(
      { id: user.id, perfil: user.perfil, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

     /**
     * 9) Retorna:
     * - token: usado pelo front no Authorization Bearer
     * - user: dados básicos (sem senha_hash!)
     */
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } });
  } catch (err) {
     /**
     * 10) Erro interno (ex: falha DB)
     * Em produção é melhor não retornar err.message diretamente.
     */
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;