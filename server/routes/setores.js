// server/routes/setores.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");

router.get("/", auth, async (req, res) => {
  const [rows] = await db.query("SELECT * FROM setores ORDER BY nome");
  res.json(rows);
});

router.post("/", auth, async (req, res) => {
  const { nome, sigla } = req.body;
  if (!nome) return res.status(400).json({ error: "nome é obrigatório" });

  try {
    const [r] = await db.query("INSERT INTO setores (nome, sigla) VALUES (?,?)", [nome, sigla ?? null]);
    res.status(201).json({ id: r.insertId, message: "Setor criado" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Setor já existe" });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;