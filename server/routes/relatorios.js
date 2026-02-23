// server/routes/relatorios.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/auth");

// 1) Bens por setor (lista)
router.get("/bens-por-setor", auth, async (req, res) => {
  try {
    const { setor_id } = req.query;

    let sql = `
      SELECT 
        b.id,
        b.numero_patrimonio,
        b.descricao,
        b.status,
        s.nome AS setor_nome,
        c.nome AS responsavel_nome
      FROM bens b
      LEFT JOIN setores s ON s.id = b.setor_id
      LEFT JOIN colaboradores c ON c.id = b.responsavel_id
    `;
    const params = [];

    if (setor_id) {
      sql += ` WHERE b.setor_id = ? `;
      params.push(Number(setor_id));
    }

    sql += ` ORDER BY s.nome, b.numero_patrimonio `;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2) Bens em empréstimo (ABERTO/ATRASADO)
router.get("/bens-em-emprestimo", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.id AS emprestimo_id,
        e.status AS emprestimo_status,
        e.data_emprestimo,
        e.data_prevista_devolucao,
        b.id AS bem_id,
        b.numero_patrimonio,
        b.descricao,
        s.nome AS setor_nome,
        c.nome AS colaborador_nome
      FROM emprestimos e
      JOIN bens b ON b.id = e.bem_id
      LEFT JOIN setores s ON s.id = b.setor_id
      JOIN colaboradores c ON c.id = e.colaborador_id
      WHERE e.status IN ('ABERTO','ATRASADO')
      ORDER BY e.data_emprestimo DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3) Total por status (contagem)
router.get("/total-por-status", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT status, COUNT(*) AS total
      FROM bens
      GROUP BY status
      ORDER BY total DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4) Histórico por plaqueta (timeline)
router.get("/historico/:plaqueta", auth, async (req, res) => {
  try {
    const plaqueta = req.params.plaqueta;

    const [[bem]] = await db.query(
      `SELECT 
         b.*,
         s.nome AS setor_nome,
         c.nome AS responsavel_nome
       FROM bens b
       LEFT JOIN setores s ON s.id=b.setor_id
       LEFT JOIN colaboradores c ON c.id=b.responsavel_id
       WHERE b.numero_patrimonio = ? LIMIT 1`,
      [plaqueta]
    );

    if (!bem) return res.status(404).json({ error: "Bem não encontrado" });

    // eventos: transferências
    const [transfs] = await db.query(`
      SELECT 
        'TRANSFERENCIA' AS tipo,
        t.data_transferencia AS data_evento,
        CONCAT('De ', so.nome, ' para ', sd.nome) AS titulo,
        CONCAT(
          'Origem: ', COALESCE(co.nome,'-'),
          ' | Destino: ', COALESCE(cd.nome,'-'),
          CASE WHEN t.motivo IS NULL OR t.motivo='' THEN '' ELSE CONCAT(' | Motivo: ', t.motivo) END
        ) AS detalhes
      FROM transferencias t
      LEFT JOIN setores so ON so.id = t.setor_origem_id
      LEFT JOIN setores sd ON sd.id = t.setor_destino_id
      LEFT JOIN colaboradores co ON co.id = t.responsavel_origem_id
      LEFT JOIN colaboradores cd ON cd.id = t.responsavel_destino_id
      WHERE t.bem_id = ?
    `, [bem.id]);

    // eventos: empréstimos
    const [emps] = await db.query(`
      SELECT 
        'EMPRESTIMO' AS tipo,
        e.data_emprestimo AS data_evento,
        CONCAT('Emprestado para ', c.nome) AS titulo,
        CONCAT(
          'Status: ', e.status,
          CASE WHEN e.data_prevista_devolucao IS NULL THEN '' ELSE CONCAT(' | Prevista: ', DATE_FORMAT(e.data_prevista_devolucao, '%Y-%m-%d')) END,
          CASE WHEN e.observacoes IS NULL OR e.observacoes='' THEN '' ELSE CONCAT(' | Obs: ', e.observacoes) END
        ) AS detalhes
      FROM emprestimos e
      JOIN colaboradores c ON c.id = e.colaborador_id
      WHERE e.bem_id = ?
    `, [bem.id]);

    // eventos: devoluções (se tiver data_devolucao)
    const [devs] = await db.query(`
      SELECT 
        'DEVOLUCAO' AS tipo,
        e.data_devolucao AS data_evento,
        'Devolvido' AS titulo,
        CONCAT(
          'Colaborador: ', c.nome,
          CASE WHEN e.observacoes IS NULL OR e.observacoes='' THEN '' ELSE CONCAT(' | Obs: ', e.observacoes) END
        ) AS detalhes
      FROM emprestimos e
      JOIN colaboradores c ON c.id = e.colaborador_id
      WHERE e.bem_id = ? AND e.data_devolucao IS NOT NULL
    `, [bem.id]);

    // eventos: baixas
    const [baixas] = await db.query(`
      SELECT 
        'BAIXA' AS tipo,
        bx.data_baixa AS data_evento,
        CONCAT('Baixa: ', bx.tipo) AS titulo,
        CONCAT(
          CASE WHEN bx.motivo IS NULL OR bx.motivo='' THEN '' ELSE CONCAT('Motivo: ', bx.motivo, ' | ') END,
          CASE WHEN bx.descricao_motivo IS NULL OR bx.descricao_motivo='' THEN '' ELSE CONCAT('Desc: ', bx.descricao_motivo, ' | ') END,
          CASE WHEN bx.documento_ref IS NULL OR bx.documento_ref='' THEN '' ELSE CONCAT('Doc: ', bx.documento_ref, ' | ') END,
          CASE WHEN bx.valor_recuperado IS NULL THEN '' ELSE CONCAT('Valor: ', bx.valor_recuperado, ' | ') END,
          CASE WHEN bx.observacoes IS NULL OR bx.observacoes='' THEN '' ELSE CONCAT('Obs: ', bx.observacoes) END
        ) AS detalhes
      FROM baixas bx
      WHERE bx.bem_id = ?
    `, [bem.id]);

    // junta tudo e ordena
    const eventos = [...transfs, ...emps, ...devs, ...baixas]
      .filter(e => e.data_evento) // remove null
      .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));

    res.json({ bem, eventos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;