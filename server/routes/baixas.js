const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");

// POST /api/baixas
router.post("/", auth, async (req, res) => {
  try {
    const { bem_id, data_baixa, tipo, motivo, descricao_motivo, documento_ref, valor_recuperado, observacoes } = req.body;

    if (!bem_id || !data_baixa || !tipo) {
      return res.status(400).json({ error: "bem_id, data_baixa e tipo são obrigatórios" });
    }

    const usuario_id = req.user.id;

    const [[bem]] = await db.query("SELECT status FROM bens WHERE id=?", [bem_id]);
    if (!bem) return res.status(404).json({ error: "Bem não encontrado" });
    if (bem.status === "BAIXADO") return res.status(409).json({ error: "Bem já está BAIXADO" });

    // transforma YYYY-MM-DD em datetime (00:00:00)
    const dt = `${data_baixa} 00:00:00`;

    await db.query(
      `INSERT INTO baixas
       (bem_id, usuario_id, data_baixa, tipo, motivo, descricao_motivo, documento_ref, valor_recuperado, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bem_id,
        usuario_id,
        dt,
        tipo,                      // tem que ser um dos ENUM
        motivo ?? null,
        descricao_motivo ?? null,
        documento_ref ?? null,
        valor_recuperado ?? null,
        observacoes ?? null
      ]
    );

    await db.query("UPDATE bens SET status='BAIXADO', atualizado_em=NOW() WHERE id=?", [bem_id]);

    res.status(201).json({ message: "Baixa registrada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;