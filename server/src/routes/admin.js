export default [
  {
    method: 'GET',
    path: '/template',
    handler: 'controller.downloadTemplate',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        'plugin::admin-users-import.isSuperAdminOnly',
      ],
    },
  },
  {
    method: 'POST',
    path: '/import',
    handler: 'controller.importUsers',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        'plugin::admin-users-import.isSuperAdminOnly',
      ],
    },
  },
  {
    method: 'GET',
    path: '/results/:resultId',
    handler: 'controller.downloadResults',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        'plugin::admin-users-import.isSuperAdminOnly',
      ],
    },
  },
  {
    method: 'GET',
    path: '/roles',
    handler: 'controller.getRoles',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        'plugin::admin-users-import.isSuperAdminOnly',
      ],
    },
  },
];
