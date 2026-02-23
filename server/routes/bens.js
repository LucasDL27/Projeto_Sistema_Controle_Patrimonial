const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");

// LISTAR (GET /api/bens)
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.id, b.numero_patrimonio, b.descricao, b.valor_aquisicao, b.data_aquisicao,
        b.status, b.estado_conservacao,
        b.setor_id, s.nome AS setor_nome,
        b.responsavel_id, c.nome AS responsavel_nome
      FROM bens b
      LEFT JOIN setores s ON s.id = b.setor_id
      LEFT JOIN colaboradores c ON c.id = b.responsavel_id
      ORDER BY b.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUSCAR POR PLAQUETA (GET /api/bens/por-plaqueta/:numero)
router.get("/por-plaqueta/:numero", auth, async (req, res) => {
  try {
    const numero = req.params.numero;
    const [rows] = await db.query(
      `SELECT 
         b.id, b.numero_patrimonio, b.descricao, b.valor_aquisicao, b.data_aquisicao,
         b.status, b.estado_conservacao,
         b.setor_id, s.nome AS setor_nome,
         b.responsavel_id, c.nome AS responsavel_nome
       FROM bens b
       LEFT JOIN setores s ON s.id = b.setor_id
       LEFT JOIN colaboradores c ON c.id = b.responsavel_id
       WHERE b.numero_patrimonio = ?
       LIMIT 1`,
      [numero]
    );

    if (!rows.length) return res.status(404).json({ error: "Bem não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUSCAR POR ID (GET /api/bens/:id)
router.get("/:id", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM bens WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Bem não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRIAR (POST /api/bens)
router.post("/", auth, async (req, res) => {
  try {
    const {
      numero_patrimonio, descricao, valor_aquisicao, data_aquisicao,
      setor_id, responsavel_id, estado_conservacao, status, observacoes
    } = req.body;

    if (!numero_patrimonio || !descricao) {
      return res.status(400).json({ error: "numero_patrimonio e descricao são obrigatórios" });
    }
    
    if (responsavel_id && setor_id) {
      const [ok] = await db.query(
        `SELECT 1 FROM colaboradores
         WHERE id = ? AND setor_id = ? AND ativo = 1 LIMIT 1`,
        [responsavel_id, setor_id]
      );
      if (!ok.length) return res.status(409).json({ error: "Responsável não pertence ao setor" });
    }

    const [r] = await db.query(
      `INSERT INTO bens 
        (numero_patrimonio, descricao, valor_aquisicao, data_aquisicao, setor_id, responsavel_id, estado_conservacao, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero_patrimonio,
        descricao,
        valor_aquisicao ?? null,
        data_aquisicao ?? null,
        setor_id ?? null,
        responsavel_id ?? null,
        estado_conservacao ?? "BOM",
        status ?? "ATIVO",
        observacoes ?? null
      ]
    );

    res.status(201).json({ id: r.insertId, message: "Bem criado" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "numero_patrimonio já existe" });
    res.status(500).json({ error: err.message });
  }
});

// ATUALIZAR (PUT /api/bens/:id)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      descricao, valor_aquisicao, data_aquisicao,
      setor_id, responsavel_id, estado_conservacao, status, observacoes
    } = req.body;

    const [r] = await db.query(
      `UPDATE bens SET
        descricao = COALESCE(?, descricao),
        valor_aquisicao = COALESCE(?, valor_aquisicao),
        data_aquisicao = COALESCE(?, data_aquisicao),
        setor_id = COALESCE(?, setor_id),
        responsavel_id = COALESCE(?, responsavel_id),
        estado_conservacao = COALESCE(?, estado_conservacao),
        status = COALESCE(?, status),
        observacoes = COALESCE(?, observacoes),
        atualizado_em = NOW()
       WHERE id = ?`,
      [
        descricao ?? null,
        valor_aquisicao ?? null,
        data_aquisicao ?? null,
        setor_id ?? null,
        responsavel_id ?? null,
        estado_conservacao ?? null,
        status ?? null,
        observacoes ?? null,
        id
      ]
    );

    if (!r.affectedRows) return res.status(404).json({ error: "Bem não encontrado" });
    res.json({ message: "Bem atualizado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETAR (DELETE /api/bens/:id)
router.delete("/:id", auth, async (req, res) => {
  try {
    const [r] = await db.query("DELETE FROM bens WHERE id = ?", [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: "Bem não encontrado" });
    res.json({ message: "Bem removido" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;