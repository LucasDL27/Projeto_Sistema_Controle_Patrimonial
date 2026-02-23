const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });

app.use("/api/auth", require("./routes/auth"));
app.use("/api/setores", require("./routes/setores"));
app.use("/api/colaboradores", require("./routes/colaboradores"));
app.use("/api/bens", require("./routes/bens"));
app.use("/api/emprestimos", require("./routes/emprestimos"));
app.use("/api/transferencias", require("./routes/transferencias"));
app.use("/api/baixas", require("./routes/baixas"));
app.use("/api/relatorios", require("./routes/relatorios"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));