/**
 * Bootstrap phase - plugin is Super Admin only
 */
const bootstrap = async ({ strapi }) => {
  strapi.log.info('Admin Users Import plugin: Super Admin only access enabled');
};

export default bootstrap;
