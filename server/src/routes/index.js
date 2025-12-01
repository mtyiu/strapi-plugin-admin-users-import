import adminRoutes from './admin';
import contentApiRoutes from './content-api';

const routes = {
  admin: {
    type: 'admin',
    routes: adminRoutes,
  },
  'content-api': {
    type: 'content-api',
    routes: contentApiRoutes,
  },
};

export default routes;
