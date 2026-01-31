const { parsePhoneNumberFromString } = require('libphonenumber-js');

module.exports = async (req, res) => {
  let numeroOriginal = req.query.numero || (req.body && req.body.numero);
  const regiao = 'BR';

  if (!numeroOriginal) return res.status(400).json({ error: 'Informe o numero' });

  try {
    let numeroLimpo = numeroOriginal.replace(/\D/g, '');

    // Regra: Mínimo 10 dígitos
    if (numeroLimpo.length < 10) {
      return res.status(200).json({ status: "invalido", valido: false, mensagem: "Menos de 10 dígitos" });
    }

    // Validação de DDDs válidos no Brasil
    const dddsValidos = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38',
      '41', '42', '43', '44', '45', '46', '47', '48', '49',
      '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69',
      '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89',
      '91', '92', '93', '94', '95', '96', '97', '98', '99'
    ];

    const ddd = numeroLimpo.substring(0, 2);
    if (!dddsValidos.includes(ddd)) {
      return res.status(200).json({ status: "invalido", valido: false, mensagem: "DDD inválido" });
    }

    let finalNumber = numeroLimpo;
    let correcaoAplicada = false;

    // Lógica para 10 dígitos: Verifica se o próximo é 6-9 e insere o 9
    if (numeroLimpo.length === 10) {
      const primeiroAposDDD = numeroLimpo.substring(2, 3);
      if (['6', '7', '8', '9'].includes(primeiroAposDDD)) {
        finalNumber = ddd + '9' + numeroLimpo.substring(2);
        correcaoAplicada = true;
      }
    }

    // Validação de Sequências Repetidas (Filtro Anti-Lixo)
    const apenasNumero = finalNumber.substring(2);
    if (/^(\d)\1+$/.test(apenasNumero)) {
      return res.status(200).json({ status: "invalido", valido: false, mensagem: "Sequência repetida" });
    }

    const phoneNumber = parsePhoneNumberFromString(finalNumber, regiao);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(200).json({ status: "invalido", valido: false });
    }

    const nacional = phoneNumber.nationalNumber; // Ex: 819xxxx...
    const tipo = phoneNumber.getType();
    
    // Regra do 11º dígito: Terceiro deve ser 9 e o quarto entre 6-9
    const terceiroDigito = nacional.substring(2, 3);
    const quartoDigito = nacional.substring(3, 4);
    
    // Regra: Números que iniciam entre 1-5 após DDD (ou após DDD+9) são FIXOS
    const ehFixoPorRegra = ['1', '2', '3', '4', '5'].includes(quartoDigito);
    
    const eCelularValido = (
      nacional.length === 11 && 
      terceiroDigito === '9' && 
      ['6', '7', '8', '9'].includes(quartoDigito) &&
      !ehFixoPorRegra
    );

    res.status(200).json({
      status: "sucesso",
      valido: true,
      e_celular_valido: eCelularValido,
      tipo_detectado: (ehFixoPorRegra || !eCelularValido) ? 'FIXED_LINE' : tipo,
      formatado_e164: phoneNumber.format('E.164'),
      ddd: ddd,
      numero_puro: nacional.substring(2),
      correcao_aplicada: correcaoAplicada
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
