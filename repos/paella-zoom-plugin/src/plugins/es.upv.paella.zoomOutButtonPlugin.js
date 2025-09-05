import { ButtonPlugin } from '@asicupv/paella-core';
import { ZoomCanvas } from './es.upv.paella.zoomPlugin';
import ZoomPluginsModule from './ZoomPluginsModule';

import { ZoomOutIcon as defaultZoomOutButton } from '../icons/mini-zoom-out.js';

export default class ZoomOutButtonPlugin extends ButtonPlugin {
    getPluginModuleInstance() {
        return ZoomPluginsModule.Get();
    }

    get name() {
        return super.name || "es.upv.paella.zoomOutButtonPlugin";
    }

    getAriaLabel() {
        return "Zoom out";
    }

    getDescription() {
        return this.getAriaLabel();
    }

    async isEnabled() {
        if (!(await super.isEnabled())) {
            return false;
        }
        
        try {
            this.target = this.config.target;
            this._canvas = this.player.videoContainer.streamProvider.streams[this.target].canvas;
            return this._canvas instanceof ZoomCanvas;
        }
        catch (err) {
            this.player.log.warn("ZoomOutButtonPlugin: no such target stream", this.target);
            return false;
        }
    }

    async load() {
        this.icon = this.player.getCustomPluginIcon(this.name,"zoomOutIcon") || defaultZoomOutButton;
    }

    async action() {
        this._canvas.zoomOut();
    }
}
