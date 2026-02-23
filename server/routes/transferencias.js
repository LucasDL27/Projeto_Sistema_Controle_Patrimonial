const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");

// LISTAR transferências
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        t.*,
        b.numero_patrimonio, b.descricao,
        so.nome AS setor_origem,
        sd.nome AS setor_destino
      FROM transferencias t
      JOIN bens b ON b.id = t.bem_id
      JOIN setores so ON so.id = t.setor_origem_id
      JOIN setores sd ON sd.id = t.setor_destino_id
      ORDER BY t.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRIAR transferência
router.post("/", auth, async (req, res) => {
  try {
    const {
      bem_id,
      setor_destino_id,
      responsavel_destino_id,
      motivo,
      observacoes
    } = req.body;

    if (!bem_id || !setor_destino_id) {
      return res.status(400).json({ error: "bem_id e setor_destino_id são obrigatórios" });
    }

    // buscar dados atuais do bem
    const [[bem]] = await db.query(
      "SELECT status, setor_id, responsavel_id FROM bens WHERE id=?",
      [bem_id]
    );

    if (!bem) return res.status(404).json({ error: "Bem não encontrado" });
    if (bem.status === "BAIXADO")
      return res.status(409).json({ error: "Bem BAIXADO não pode ser transferido" });

    if (Number(bem.setor_id) === Number(setor_destino_id)) {
      return res.status(409).json({ error: "Setor de destino não pode ser igual ao setor de origem" });
    }

    const usuario_id = req.user.id;

    // inserir transferência
    await db.query(
      `INSERT INTO transferencias
        (bem_id, setor_origem_id, setor_destino_id,
         responsavel_origem_id, responsavel_destino_id,
         usuario_id, motivo, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bem_id,
        bem.setor_id,
        setor_destino_id,
        bem.responsavel_id,
        responsavel_destino_id ?? null,
        usuario_id,
        motivo ?? null,
        observacoes ?? null
      ]
    );

    // atualizar o bem
    await db.query(
      `UPDATE bens
       SET setor_id = ?,
           responsavel_id = ?,
           atualizado_em = NOW()
       WHERE id = ?`,
      [
        setor_destino_id,
        responsavel_destino_id ?? bem.responsavel_id,
        bem_id
      ]
    );

    res.status(201).json({ message: "Transferência registrada com sucesso" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;