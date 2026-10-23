const path = require('path');
require('../../config/env');

const ARCA_ENV = process.env.ARCA_ENV || 'homologacion'; // 'homologacion' | 'produccion' | 'simulado'

const URLS = {
  homologacion: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
    wsfeWsdl: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL'
  },
  produccion: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
    wsfeWsdl: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL'
  }
};

const resolverRutaCert = (p, def) =>
  !p
    ? path.resolve(__dirname, '../../../certs', def)
    : path.isAbsolute(p)
      ? p
      : path.resolve(__dirname, '../../..', p);

const CERT_PATH = resolverRutaCert(process.env.ARCA_CERT_PATH, 'arca.crt');
const KEY_PATH = resolverRutaCert(process.env.ARCA_KEY_PATH, 'arca.key');

module.exports = {
  env: ARCA_ENV,
  urls: URLS[ARCA_ENV === 'produccion' ? 'produccion' : 'homologacion'],
  cuit: process.env.ARCA_CUIT || '20111111112',
  puntoVenta: parseInt(process.env.ARCA_PTO_VENTA || '1'),
  certPath: CERT_PATH,
  keyPath: KEY_PATH,

  // Tipos de Comprobante según tabla ARCA (FEParamGetTiposCbte)
  CBTE_TIPO: {
    FACTURA_A: 1,
    NOTA_DEBITO_A: 2,
    NOTA_CREDITO_A: 3,
    FACTURA_B: 6,
    NOTA_DEBITO_B: 7,
    NOTA_CREDITO_B: 8,
    FACTURA_C: 11,
    NOTA_DEBITO_C: 12,
    NOTA_CREDITO_C: 13
  },

  // Tipos de Concepto (FEParamGetTiposConcepto)
  CONCEPTO: {
    PRODUCTOS: 1,
    SERVICIOS: 2,
    PRODUCTOS_Y_SERVICIOS: 3
  },

  // Tipos de Documento del receptor (FEParamGetTiposDoc)
  DOC_TIPO: {
    CUIT: 80,
    CUIL: 86,
    CDI: 87,
    DNI: 96,
    CONSUMIDOR_FINAL: 99
  },

  // Alícuotas de IVA según ARCA (FEParamGetTiposIva)
  ALICUOTAS_IVA: {
    IVA_0: 3,     // 0%
    IVA_10_5: 4,  // 10.5%
    IVA_21: 5,    // 21%
    IVA_27: 6,    // 27%
    IVA_5: 8,     // 5%
    IVA_2_5: 9    // 2.5%
  },

  // Condición frente al IVA del Receptor (RG 5616 obligatorio, manual pág 202)
  CONDICION_IVA_RECEPTOR: {
    RESPONSABLE_INSCRIPTO: 1,
    EXENTO: 4,
    CONSUMIDOR_FINAL: 5,
    MONOTRIBUTO: 6,
    NO_CATEGORIZADO: 7,
    EXTERIOR: 9
  }
};
