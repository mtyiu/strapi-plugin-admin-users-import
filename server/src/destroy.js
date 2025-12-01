/**
 * Cleanup function for plugin shutdown
 */
const destroy = ({ strapi }) => {
  // Clean up any stored import results on shutdown
  if (global.importResults) {
    delete global.importResults;
    strapi.log.info('Admin Users Import: Cleaned up import results');
  }
};

export default destroy;
