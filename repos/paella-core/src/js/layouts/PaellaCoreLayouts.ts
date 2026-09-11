import PluginModule from "../core/PluginModule";

let g_pluginModule: PaellaCoreLayouts | null = null;

export default class PaellaCoreLayouts extends PluginModule {
    static Get() {
        if (!g_pluginModule) {
            g_pluginModule = new PaellaCoreLayouts();
        }
        return g_pluginModule;
    }
    
    get moduleName() {
        return "paella-core default video layouts";
    }

    get moduleVersion(): string {
        return __PAELLA_VERSION__;
    }
}