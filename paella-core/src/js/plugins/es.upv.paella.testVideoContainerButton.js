import MenuButtonPlugin from '../core/MenuButtonPlugin';

import PaellaCorePlugins from './PaellaCorePlugins';

import screenIcon from '../../icons/screen';

const wait = async (fn,t) => {
    return new Promise(r => {
        setTimeout(() => {
            fn();
            r();
        }, t);
    });
}

export default class VideoContainerButtonPlugin extends MenuButtonPlugin {
    getPluginModuleInstance() {
        return PaellaCorePlugins.Get();
    }

    async load() {
        this.icon = screenIcon;
        this.title = "tx";

        this.hide();

        wait(() => this.show(), 1000);
    }

    get titleSize() {
        return "medium";
    }

    get popUpType() {
        return "no-modal";
    }

    async getMenu() {
        if (!this._items) {
            this._items = [
                { id: 0, title: "Option 1" },
                { id: 1, title: "Option 2" },
                { id: 2, title: "Option 3" },
                { id: 3, title: "Option 4" },
                { id: 4, title: "Option 5" },
                { id: 0, title: "Option 6" },
                { id: 1, title: "Option 7" },
                { id: 2, title: "Option 8" },
                { id: 3, title: "Option 9" },
                { id: 4, title: "Option 10" }
            ];
        }
		return this._items;
	}

    itemSelected(itemData) {
        if (itemData.id === 0) {
            // The next time the user press the button icon, the menu will be regenerated
            this.refreshContent = true;
        }
    }

    get buttonType() {
        return "check";
    }
}