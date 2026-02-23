const jwt = require("jsonwebtoken");
require("dotenv").config();   // Carrega variáveis do arquivo .env (ex: JWT_SECRET)

module.exports = function auth(req, res, next) {

   /**
   * 1️ - Lê o header Authorization
   * Formato esperado:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  const header = req.headers.authorization || "";

   /**
   * 2️ - Extrai o token removendo o prefixo "Bearer "
   * Se não começar com "Bearer ", considera token inválido
   */
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;   // remove "Bearer "

   /**
   * 3️ - Se não houver token → bloqueia acesso
   */
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    /**
     * 4️ - Verifica validade do token
     * - Assinatura
     * - Expiração
     * - Integridade
     */
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * 5 -  Anexa dados do usuário à requisição
     * Exemplo de payload:
     * { id, perfil, nome, iat, exp }
     */
    req.user = payload; // { id, perfil, nome }

    // 6 - Continua para próxima função da rota
    next();
  } catch (err) {

    //Token inválido, expirado ou adulterado
    return res.status(401).json({ error: "Token inválido" });
  }
};