const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");


// LISTAR EMPRÉSTIMOS
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
    SELECT e.*, 
    b.numero_patrimonio, 
    b.descricao, 
    c.nome AS colaborador,
    c.matricula AS matricula
FROM emprestimos e
JOIN bens b ON b.id = e.bem_id
JOIN colaboradores c ON c.id = e.colaborador_id
ORDER BY e.id DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CRIAR EMPRÉSTIMO
router.post("/", auth, async (req, res) => {
  try {
    const { bem_id, colaborador_id, data_prevista_devolucao, observacoes } = req.body;

    const usuario_id = req.user.id;

    if (!bem_id || !colaborador_id) {
      return res.status(400).json({ error: "bem_id e colaborador_id são obrigatórios" });
    }

    const [[bem]] = await db.query("SELECT status FROM bens WHERE id=?", [bem_id]);
    if (!bem) return res.status(404).json({ error: "Bem não encontrado" });

    if (bem.status !== "ATIVO") {
      return res.status(409).json({ error: `Bem não está ATIVO (status atual: ${bem.status})` });
    }

    await db.query(
      `INSERT INTO emprestimos 
       (bem_id, colaborador_id, usuario_id, data_prevista_devolucao, observacoes, status)
       VALUES (?, ?, ?, ?, ?, 'ABERTO')`,
      [bem_id, colaborador_id, usuario_id, data_prevista_devolucao ?? null, observacoes ?? null]
    );

    await db.query(
      `UPDATE bens SET status='EMPRESTADO', atualizado_em=NOW() WHERE id=?`,
      [bem_id]
    );

    res.status(201).json({ message: "Empréstimo criado" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DEVOLVER EMPRÉSTIMO
router.post("/:id/devolver", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [[emp]] = await db.query(
      "SELECT bem_id, status FROM emprestimos WHERE id=?",
      [id]
    );

    if (!emp) {
      return res.status(404).json({ error: "Empréstimo não encontrado" });
    }

    if (emp.status !== "ABERTO" && emp.status !== "ATRASADO") {
      return res.status(409).json({ error: "Empréstimo já finalizado" });
    }

    await db.query(
      "UPDATE emprestimos SET status='DEVOLVIDO', data_devolucao=NOW() WHERE id=?",
      [id]
    );

    await db.query(
      "UPDATE bens SET status='ATIVO', atualizado_em=NOW() WHERE id=?",
      [emp.bem_id]
    );

    res.json({ message: "Devolução registrada" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;