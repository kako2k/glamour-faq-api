
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

let faq = [];
try {
  faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
} catch (err) {
  console.error('Erro ao carregar FAQ:', err);
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,!?]/g, '')
    .trim();
}

function encontrarResposta(perguntaUsuario) {
  const texto = normalizarTexto(perguntaUsuario);

  for (const item of faq) {
    const perguntaBase = normalizarTexto(item.pergunta);
    if (texto.includes(perguntaBase)) return item.resposta;

    const temVariacao = item.variacoes?.some(v => texto.includes(normalizarTexto(v)));
    if (temVariacao) return item.resposta;
  }

  return null;
}

app.post('/responder', (req, res) => {
  const { pergunta } = req.body;
  const resposta = encontrarResposta(pergunta);
  if (resposta) {
    res.json({ resposta });
  } else {
    res.json({
      resposta: "Essa pergunta ainda não está cadastrada no nosso sistema automático. Um de nossos atendentes irá te ajudar com isso agora mesmo."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
