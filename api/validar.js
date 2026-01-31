// A Vercel instala isso automaticamente se você tiver um package.json
// ou se você apenas subir o arquivo, ela tenta detectar.
const { parsePhoneNumberFromString } = require('libphonenumber-js');

module.exports = async (req, res) => {
  // Pegando os dados da query (URL) ou do corpo da requisição (POST)
  const numero = req.query.numero || (req.body && req.body.numero);
  const regiao = req.query.regiao || 'BR';

  if (!numero) {
    return res.status(400).json({ error: 'Informe o parâmetro "numero"' });
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(numero, regiao);

    if (!phoneNumber) {
      return res.status(400).json({ status: 'invalido', mensagem: 'Formato impossível' });
    }

    const eValido = phoneNumber.isValid();
    const tipo = phoneNumber.getType(); // Ex: 'MOBILE' ou 'FIXED_LINE'

    // Lógica para o 9º dígito no Brasil:
    // Se for BR e você quer garantir que seja celular com 9 dígitos:
    let alertaNonoDigito = false;
    if (regiao === 'BR' && tipo === 'MOBILE' && phoneNumber.nationalNumber.length < 11) {
       // nationalNumber.length < 11 (2 dígitos DDD + 9 dígitos número)
       alertaNonoDigito = true;
    }

    res.status(200).json({
      status: eValido ? 'sucesso' : 'invalido',
      valido: eValido,
      tipo: tipo,
      e_celular: tipo === 'MOBILE',
      alerta_nono_digito: alertaNonoDigito, // Se true, o número pode ser antigo ou fixo
      formatado: phoneNumber.formatInternational(),
      e164: phoneNumber.format('E.164')
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
