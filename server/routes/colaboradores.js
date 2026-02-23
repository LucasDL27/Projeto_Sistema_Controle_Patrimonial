const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");

router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM colaboradores ORDER BY nome");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { nome, matricula, email, setor_id, ativo } = req.body;
    if (!nome) return res.status(400).json({ error: "nome é obrigatório" });

    const [r] = await db.query(
      "INSERT INTO colaboradores (nome, matricula, email, setor_id, ativo) VALUES (?,?,?,?,?)",
      [
        nome,
        matricula ?? null,
        email ?? null,
        setor_id ? Number(setor_id) : null,
        ativo === undefined ? 1 : (ativo ? 1 : 0),
      ]
    );

    res.status(201).json({ id: r.insertId, message: "Colaborador criado" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Matrícula já existe" });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/colaboradores/por-setor/:setorId
router.get("/por-setor/:setorId", auth, async (req, res) => {
  try {
    const setorId = Number(req.params.setorId);
    if (!setorId) return res.status(400).json({ error: "setorId inválido" });

    const [rows] = await db.query(
      `SELECT id, nome, matricula, email
       FROM colaboradores
       WHERE setor_id = ? AND ativo = 1
       ORDER BY nome`,
      [setorId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;