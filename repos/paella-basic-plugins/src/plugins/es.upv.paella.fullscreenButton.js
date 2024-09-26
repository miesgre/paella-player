import { Events, bindEvent, ButtonPlugin } from 'paella-core';
import BasicPluginsModule from './BasicPluginsModule';

import { FullscreenIcon, WindowedIcon } from '../icons/fullscreen-icons.js';

export default class PauseButtonPlugin extends ButtonPlugin {
	getPluginModuleInstance() {
        return BasicPluginsModule.Get();
    }

    get name() {
        return super.name || "es.upv.paella.fullscreenButton";
    }

	getAriaLabel() {
        return "Toggle fullscreen";
    }

    getDescription() {
        return this.getAriaLabel();
    }
	
	get isFallbackFSAvailable() {
		const { width: viewportWidth, height: viewportHeight } = globalThis.visualViewport;
		const { w: playerWidth, h: playerHeight } = this.player.containerSize;
		return viewportWidth !== playerWidth || viewportHeight !== playerHeight;
	}

	async isEnabled() {
		const enabled = await super.isEnabled();
		return enabled && this.player.isFullScreenSupported() || this.isFallbackFSAvailable;
	}
	
	async load() {
		const fsIcon = this.player.getCustomPluginIcon(this.name,"fullscreenIcon") || FullscreenIcon;
		const wIcon = this.player.getCustomPluginIcon(this.name,"windowedIcon") || WindowedIcon;
		this.icon = fsIcon
		bindEvent(this.player, Events.FULLSCREEN_CHANGED, (data) => {
			if (data.status) {
				this.icon = wIcon;
			}
			else {
				this.icon = fsIcon;
			}
		})
	}
	
	async toggleFS() {
		if (this.player.isFullscreen) {
			await this.player.exitFullscreen();
		}
		else {
			await this.player.enterFullscreen();
		}
	}

	toggleFallbackFS() {
		if (this.player.containerElement.classList.contains("paella-fallback-fullscreen")) {
			this.player.containerElement.classList.remove("paella-fallback-fullscreen");
		}
		else {
			this.player.containerElement.classList.add("paella-fallback-fullscreen");
		}
		setTimeout(() => {
			this.player.resize();
		}, 100);
	}
	
	async action() {
		if (this.player.isFullScreenSupported()) {
			await this.toggleFS();
		}
		else {
			this.toggleFallbackFS();
		}
	}
}