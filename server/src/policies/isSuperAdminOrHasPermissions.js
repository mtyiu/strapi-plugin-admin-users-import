const SUPER_ADMIN_CODE = 'strapi-super-admin';

/**
 * Policy to check if user is Super Admin
 * Only Super Admin can access this plugin
 * @param {Object} policyContext - Koa context
 * @param {Object} config - Policy configuration
 * @param {Object} strapi - Strapi instance
 * @returns {Boolean} Authorization result
 */
export default async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;

  if (!user) {
    return false;
  }

  // Check if user is Super Admin
  const userWithRole = await strapi.query('admin::user').findOne({
    where: { id: user.id },
    populate: ['roles'],
  });

  return userWithRole?.roles?.some(role => role.code === SUPER_ADMIN_CODE) || false;
};
