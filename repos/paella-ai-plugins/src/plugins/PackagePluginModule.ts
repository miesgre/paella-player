import { PluginModule } from "@asicupv/paella-core";
import packageData from "../../package.json";

import defaultDictionaries from "../i18n/all";

let g_pluginModule: PluginModule | null = null;

export default class PackagePluginModule extends PluginModule {
    static Get() {
        if (!g_pluginModule) {
            g_pluginModule = new PackagePluginModule();
        }
        return g_pluginModule;
    }

    get moduleName() {
        return packageData.name;
    }

    get moduleVersion() {
        return packageData.version;
    }

    async getDictionaries() {
        return  defaultDictionaries;
    }
}