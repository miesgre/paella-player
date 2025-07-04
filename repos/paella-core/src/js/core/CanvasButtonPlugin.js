import UserInterfacePlugin from "./UserInterfacePlugin";
import { CanvasButtonPosition } from "./CanvasPlugin";
import { loadPluginsOfType } from "./plugin_tools";

export function getNextTabIndex(player) {
	player.__tabIndex = player.__tabIndex || 0;
	++player.__tabIndex;
	return player.__tabIndex;
}

export function getCurrentTabIndex(player) {
	return player.__tabIndex || 0;
}

export function getCanvasButtonPlugin(plugin) {
    return {
        icon: plugin.icon,
        position: plugin.position,
        title: plugin.description,
        ariaLabel: plugin.ariaLabel,
        name: plugin.buttonName,
        click: async (content) => {
            const stream = plugin.player.videoContainer.streamProvider.streams[content];
            await plugin.action(content, stream?.player, stream?.canvas, stream?.canvasPlugin);
        }
    }
}

export async function getCanvasButtons(player, video) {
    const result = [];
    await loadPluginsOfType(player, "canvasButton",
        async (plugin) => {
            player.log.debug(` Canvas button plugin: ${ plugin.name }`);
            result.push(plugin);
        });

    return result.filter(plugin => {
            // TODO: check if this is working
            return plugin.content.indexOf(video.content) !== -1;
        })
        .map(plugin => {
            return getCanvasButtonPlugin(plugin);
        })
}


export default class CanvasButtonPlugin extends UserInterfacePlugin {
    get type() { return "canvasButton" }

    get content() {
        return this._config.content || ["presenter"];
    }

    get ariaLabel() {
        return this._config.ariaLabel || this.getAriaLabel();
    }

    getAriaLabel() {
        return "";
    }

    get tabIndex() {
        return this.config.tabIndex;
    }
    
    get description() {
        return this.config.description || this.getDescription();
    }

    getDescription() {
        return "";
    }

    get icon() {
        return this._icon;
    }

    set icon(icon) {
        this._icon = icon;
    }

    get side() {
        return this.config?.side || "left";
    }

    get buttonName() {
        return this.name;   // By default, the button "name" property is the plugin identifier name
    }

    get position() {
        switch (this.side) {
        case 'left':
            return CanvasButtonPosition.LEFT;
        case 'center':
            return CanvasButtonPosition.CENTER;
        case 'right':
            return CanvasButtonPosition.RIGHT;
        default:
            throw new Error(`Invalid CanvasButtonPlugin side set: ${ this.side }`);
        }
    }

    get targetContent() {
        // This property is set by the VideoContainer when video layout is loaded
        return this._targetContent;
    }

    get button() {
        // This property is set by the VideoContainer when video layout is loaded
        return this._button;
    }

    async action(content) {
        this.player.log.warn(`Action not implemented in canvas button plugin ${ this.name }`);
    }
}