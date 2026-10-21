const { AsyncLocalStorage } = require('async_hooks');
const { DataTypes, Op } = require('sequelize');

// Guarda el negocio de la request en curso (sin pasarlo a mano por cada función)
const storage = new AsyncLocalStorage();

const negocioActual = () => storage.getStore()?.negocioId ?? null;

// Para código fuera de una request (cron de promociones, scripts, seeds)
const ejecutarEnNegocio = (negocioId, fn) => storage.run({ negocioId }, fn);

/**
 * Middleware. Ponelo DESPUÉS del que valida el token y carga el usuario.
 * El negocio sale SIEMPRE de la sesión/usuario, nunca del body, query o URL.
 * (middlewares/auth.js ya hace esto solo; este queda por si lo necesitás aparte.)
 */
const contextoNegocio = (req, res, next) => {
  const negocioId = req.user?.negocio_id;
  if (!negocioId) {
    return res.status(403).json({ error: 'Usuario sin negocio asignado' });
  }
  storage.run({ negocioId }, next);
};

/**
 * Convierte un modelo en "multi-negocio":
 *  - agrega el atributo negocio_id
 *  - filtra automáticamente find/count/update/destroy por el negocio actual
 *  - asigna el negocio actual al crear (ignora el que venga del cliente)
 *  - impide mover un registro a otro negocio
 *
 * Falla cerrado: si no hay negocio en contexto, tira error en vez de devolver
 * datos de todos. Para consultas legítimas entre negocios (login, registro,
 * recuperar clave) pasá { sinTenant: true } en las opciones.
 */
function aplicarTenant(Model) {
  Model.rawAttributes.negocio_id = { type: DataTypes.BIGINT, allowNull: false };
  Model.refreshAttributes();

  const filtrar = (options = {}) => {
    if (options.sinTenant) return;
    const negocioId = negocioActual();
    if (!negocioId) {
      throw new Error(`Consulta a ${Model.name} sin negocio en contexto`);
    }
    options.where = options.where
      ? { [Op.and]: [options.where, { negocio_id: negocioId }] }
      : { negocio_id: negocioId };
  };

  Model.addHook('beforeFind', filtrar);
  Model.addHook('beforeCount', filtrar);
  Model.addHook('beforeBulkDestroy', filtrar);
  Model.addHook('beforeBulkUpdate', (options) => {
    filtrar(options);
    if (options.attributes) delete options.attributes.negocio_id;
  });

  Model.addHook('beforeValidate', (instance) => {
    if (!instance.isNewRecord) return;
    const negocioId = negocioActual();
    if (negocioId) {
      instance.negocio_id = negocioId; // pisa lo que venga del cliente
    } else if (!instance.negocio_id) {
      throw new Error(`Alta en ${Model.name} sin negocio en contexto`);
    }
  });

  Model.addHook('beforeBulkCreate', (instances) => {
    const negocioId = negocioActual();
    instances.forEach((i) => {
      if (negocioId) i.negocio_id = negocioId;
      else if (!i.negocio_id) {
        throw new Error(`Alta en ${Model.name} sin negocio en contexto`);
      }
    });
  });

  Model.addHook('beforeUpdate', (instance) => {
    if (instance.changed('negocio_id')) {
      throw new Error('No se puede cambiar el negocio de un registro');
    }
  });
}

/** Negocio de la request en curso; tira error si no hay (para SQL escrito a mano). */
const negocioRequerido = () => {
  const id = negocioActual();
  if (!id) throw new Error('No hay negocio en contexto');
  return id;
};

/**
 * sequelize.query() para SQL ESCRITO A MANO (reportes, exportaciones, inicio).
 * Esas consultas NO pasan por los filtros automáticos de los modelos, así que:
 *  - el SQL tiene que usar :negocioId (si no, se bloquea con error en vez de mezclar negocios)
 *  - :negocioId se completa solo con el negocio de la sesión
 * Usalo siempre con parámetros (replacements), nunca pegando texto en el SQL.
 */
const consultaNegocio = (sequelize, sql, opciones = {}) => {
  if (!/:negocioId\b/.test(sql)) {
    throw new Error('Consulta SQL sin filtro :negocioId (bloqueada para no mezclar negocios)');
  }
  return sequelize.query(sql, {
    ...opciones,
    replacements: { ...(opciones.replacements || {}), negocioId: negocioRequerido() }
  });
};

module.exports = {
  aplicarTenant, contextoNegocio, ejecutarEnNegocio, negocioActual, negocioRequerido, consultaNegocio
};