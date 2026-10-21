/**
 * Limita una ruta a ciertos roles. Debe ir DESPUÉS del authMiddleware.
 * El SUPERADMIN (la cuenta que creó el negocio) pasa siempre: tiene todos los permisos
 * dentro de su negocio. El aislamiento entre negocios no depende de esto, sino del
 * filtro por negocio (utils/tenant.js).
 *
 * Uso: router.use(requireRole('ADMIN'));
 */
const requireRole = (...rolesPermitidos) => (req, res, next) => {
  const permitido =
    req.user && (req.user.rol === 'SUPERADMIN' || rolesPermitidos.includes(req.user.rol));

  if (!permitido) {
    return res.status(403).json({
      success: false,
      message: 'No tenés permisos para realizar esta acción'
    });
  }
  next();
};

module.exports = requireRole;