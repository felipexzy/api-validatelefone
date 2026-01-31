const { parsePhoneNumberFromString } = require('libphonenumber-js');

module.exports = async (req, res) => {
  let numeroOriginal = req.query.numero || (req.body && req.body.numero);
  const regiao = 'BR';

  if (!numeroOriginal) return res.status(400).json({ error: 'Informe o numero' });

  try {
    let numeroLimpo = numeroOriginal.replace(/\D/g, '');
    
    const apenasNumero = numeroLimpo.length >= 10 ? numeroLimpo.substring(2) : numeroLimpo;
    if (/^(\d)\1+$/.test(apenasNumero)) {
      return res.status(200).json({ status: "invalido", valido: false, mensagem: "Sequencia repetida" });
    }

    let finalPhoneNumber;
    let correcaoAplicada = false;

    if (numeroLimpo.length === 10) {
      const ddd = numeroLimpo.substring(0, 2);
      const primeiroDigito = numeroLimpo.substring(2, 3);
      
      if (['6', '7', '8', '9'].includes(primeiroDigito)) {
        const tentativaCorrigida = ddd + '9' + numeroLimpo.substring(2);
        const p = parsePhoneNumberFromString(tentativaCorrigida, regiao);
        if (p && p.isValid()) {
          finalPhoneNumber = p;
          correcaoAplicada = true;
        }
      }
    }

    if (!finalPhoneNumber) {
      finalPhoneNumber = parsePhoneNumberFromString(numeroLimpo, regiao);
    }

    if (!finalPhoneNumber || !finalPhoneNumber.isValid()) {
      return res.status(200).json({ status: "invalido", valido: false });
    }

    const nacional = finalPhoneNumber.nationalNumber;
    const tipo = finalPhoneNumber.getType();
    
    const primeiroDigitoAposDDD = nacional.substring(2, 3);
    const dddReal = nacional.substring(0, 2);
    
    const eFixo = ['2', '3', '4', '5'].includes(primeiroDigitoAposDDD);
    const eCelularReal = (tipo === 'MOBILE' && nacional.length === 11 && !eFixo);

    res.status(200).json({
      status: "sucesso",
      valido: true,
      e_celular_valido: eCelularReal,
      tipo_detectado: eFixo ? 'FIXED_LINE' : tipo,
      formatado_e164: finalPhoneNumber.format('E.164'),
      ddd: dddReal,
      numero_puro: nacional.substring(2),
      correcao_aplicada: correcaoAplicada
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
