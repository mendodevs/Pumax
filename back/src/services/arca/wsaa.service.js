const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const { XMLParser } = require('fast-xml-parser');
const config = require('./config');

const cacheFilePath = path.resolve(path.dirname(config.certPath), '.ta-cache.json');
let cachedTicket = null;

function cargarTicketPersistido() {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
      if (data && data.expirationTime && new Date(data.expirationTime) > new Date(Date.now() + 10 * 60 * 1000)) {
        return data;
      }
    }
  } catch (e) {
    // Ignorar si el archivo está corrupto o expirado
  }
  return null;
}

function persistirTicket(ticket) {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(ticket, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando caché de ticket en disco:', e.message);
  }
}

/**
 * Genera el XML del Ticket de Requerimiento de Acceso (TRA)
 */
function generarTRA(service = 'wsfe') {
  const now = new Date();
  // AFIP exige que generationTime sea un poco en el pasado para evitar desfases de reloj
  const genTime = new Date(now.getTime() - 2 * 60 * 1000);
  const expTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  const pad = (n) => String(n).padStart(2, '0');
  const formatIso = (d) => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const uniqueId = Math.floor(Date.now() / 1000);

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${formatIso(genTime)}</generationTime>
    <expirationTime>${formatIso(expTime)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
}

/**
 * Firma el TRA con PKCS#7 / CMS usando node-forge
 */
function firmarTRA(traXml, certPem, keyPem) {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(traXml, 'utf8');

  const cert = forge.pki.certificateFromPem(certPem);
  const key = forge.pki.privateKeyFromPem(keyPem);

  p7.addCertificate(cert);
  p7.addSigner({
    key: key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data
      },
      {
        type: forge.pki.oids.messageDigest
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date()
      }
    ]
  });

  p7.sign();
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(der);
}

/**
 * Obtiene credenciales activas (Token + Sign) desde WSAA con caché persistente de 12hs
 */
async function obtenerCredenciales() {
  // 1. Si hay ticket en caché vigente (memoria o disco), reutilizarlo
  if (!cachedTicket) {
    cachedTicket = cargarTicketPersistido();
  }

  if (cachedTicket && new Date(cachedTicket.expirationTime) > new Date(Date.now() + 10 * 60 * 1000)) {
    return {
      token: cachedTicket.token,
      sign: cachedTicket.sign,
      cuit: config.cuit,
      simulado: false
    };
  }

  // 2. Comprobar si existen los certificados físicos
  const certExiste = fs.existsSync(config.certPath);
  const keyExiste = fs.existsSync(config.keyPath);

  if (!certExiste || !keyExiste || config.env === 'simulado') {
    return {
      token: 'TOKEN_SIMULADO_' + Date.now(),
      sign: 'SIGN_SIMULADO_' + Date.now(),
      cuit: config.cuit,
      simulado: true
    };
  }

  // 3. Flujo real con WSAA
  try {
    const certPem = fs.readFileSync(config.certPath, 'utf8');
    const keyPem = fs.readFileSync(config.keyPath, 'utf8');

    const traXml = generarTRA();
    const cmsBase64 = firmarTRA(traXml, certPem, keyPem);

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cmsBase64}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(config.urls.wsaa, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': ''
      },
      body: soapRequest
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`WSAA HTTP Error ${response.status}: ${responseText}`);
    }

    // Parsear respuesta XML
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsedSoap = parser.parse(responseText);

    const body = parsedSoap['soapenv:Envelope']?.['soapenv:Body'] || parsedSoap['soap:Envelope']?.['soap:Body'];
    const fault = body?.['soapenv:Fault'] || body?.['soap:Fault'];

    if (fault) {
      const faultString = fault.faultstring || 'Error en autenticación WSAA';
      throw new Error(`Fallo de autenticación en ARCA (WSAA): ${faultString}`);
    }

    // loginCmsReturn contiene el XML interno de respuesta
    const loginCmsReturn = body?.['loginCmsResponse']?.['loginCmsReturn'] || body?.['wsaa:loginCmsResponse']?.['loginCmsReturn'];

    if (!loginCmsReturn) {
      throw new Error(`Respuesta inesperada de WSAA: ${responseText}`);
    }

    const ticketParsed = parser.parse(loginCmsReturn);
    const loginTicket = ticketParsed.loginTicketResponse;

    const token = loginTicket.credentials.token;
    const sign = loginTicket.credentials.sign;
    const expirationTime = loginTicket.header.expirationTime;

    // Guardar en caché de memoria y disco
    cachedTicket = {
      token,
      sign,
      expirationTime
    };
    persistirTicket(cachedTicket);

    console.log(`✓ Credenciales ARCA obtenidas exitosamente (Vigentes hasta: ${expirationTime})`);

    return {
      token,
      sign,
      cuit: config.cuit,
      simulado: false
    };

  } catch (error) {
    console.error('✗ Error conectando a WSAA:', error.message);
    throw error;
  }
}

/**
 * Invalida la caché del token (en caso de error de sesión o prueba)
 */
function limpiarCache() {
  cachedTicket = null;
  try {
    if (fs.existsSync(cacheFilePath)) {
      fs.unlinkSync(cacheFilePath);
    }
  } catch (e) {
    // Ignorar
  }
}

module.exports = {
  obtenerCredenciales,
  limpiarCache,
  generarTRA
};
