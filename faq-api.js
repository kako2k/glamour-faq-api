// faq-api.js (sem IA, com normalização + sugestão de pergunta parecida)

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
  let melhorCorrespondencia = null;
  let maiorSimilaridade = 0;

  for (const item of faq) {
    const base = normalizarTexto(item.pergunta);
    if (texto.includes(base)) return { resposta: item.resposta };

    const variacoes = item.variacoes || [];
    if (variacoes.some(v => texto.includes(normalizarTexto(v)))) return { resposta: item.resposta };

    const scorePergunta = calcularSimilaridade(texto, base);
    if (scorePergunta > maiorSimilaridade) {
      melhorCorrespondencia = item.pergunta;
      maiorSimilaridade = scorePergunta;
    }
  }

  if (maiorSimilaridade >= 0.5 && melhorCorrespondencia) {
    return {
      resposta: `Essa pergunta ainda não está cadastrada no nosso sistema automático. Você quis dizer: '${melhorCorrespondencia}'`
    };
  }

  return null;
}

function calcularSimilaridade(a, b) {
  const palavrasA = new Set(a.split(' '));
  const palavrasB = new Set(b.split(' '));
  const intersecao = [...palavrasA].filter(p => palavrasB.has(p));
  const media = (palavrasA.size + palavrasB.size) / 2;
  return intersecao.length / media;
}

app.post('/responder', (req, res) => {
  const { pergunta } = req.body;
  const resultado = encontrarResposta(pergunta);

  if (resultado && resultado.resposta) {
    res.json({ resposta: resultado.resposta });
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
