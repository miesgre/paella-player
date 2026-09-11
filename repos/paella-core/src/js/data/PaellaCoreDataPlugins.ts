import PluginModule from "../core/PluginModule";

let g_pluginModule: PaellaCoreDataPlugins | null = null;

export default class PaellaCoreDataPlugins extends PluginModule {
    static Get() {
        if (!g_pluginModule) {
            g_pluginModule = new PaellaCoreDataPlugins();
        }
        return g_pluginModule;
    }
    
    get moduleName() {
        return "paella-core default data plugins";
    }

    get moduleVersion(): string {
        return __PAELLA_VERSION__;
    }
}