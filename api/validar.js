const { parsePhoneNumberFromString } = require('libphonenumber-js');

module.exports = async (req, res) => {
  let numeroOriginal = req.query.numero || (req.body && req.body.numero);
  const regiao = 'BR';

  if (!numeroOriginal) {
    return res.status(400).json({ error: 'Informe o parâmetro "numero"' });
  }

  try {

    let numeroLimpo = numeroOriginal.replace(/\D/g, '');

    let phoneNumber = parsePhoneNumberFromString(numeroLimpo, regiao);

    if (numeroLimpo.length === 10) {
      const ddd = numeroLimpo.substring(0, 2);
      const resto = numeroLimpo.substring(2);
      const numeroCorrigido = ddd + '9' + resto;
      const phoneTentativa = parsePhoneNumberFromString(numeroCorrigido, regiao);
      
      if (phoneTentativa && phoneTentativa.isValid() && phoneTentativa.getType() === 'MOBILE') {
        phoneNumber = phoneTentativa;
      }
    }

    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(200).json({
        status: "invalido",
        valido: false,
        mensagem: "Não foi possível validar este número mesmo após tentativa de correção."
      });
    }

    const nacional = phoneNumber.nationalNumber;
    const tipo = phoneNumber.getType();

    res.status(200).json({
      status: "sucesso",
      valido: true,
      tipo: tipo,
      e_celular_valido: tipo === 'MOBILE' && nacional.length === 11,
      formatado_e164: phoneNumber.format('E.164'),
      formatado_nacional: phoneNumber.formatNational(),
      ddd: nacional.substring(0, 2),
      numero_puro: nacional.substring(2),
      correcao_aplicada: numeroLimpo.length === 10 && nacional.length === 11
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
