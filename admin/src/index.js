import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';

const SUPER_ADMIN_CODE = 'strapi-super-admin';

export default {
  register(app) {
    // Only add menu link for Super Admin users
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
      permissions: [
        {
          action: 'plugin::admin-users-import.read',
          subject: null,
        },
      ],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
