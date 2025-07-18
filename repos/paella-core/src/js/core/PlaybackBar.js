import { DomClass, createElementWithHtmlText } from './dom';

import { loadPluginsOfType, unloadPluginsOfType } from './plugin_tools'
import { addButtonPlugin } from './ButtonPlugin';
import { pauseAutoHideUiTimer, resumeAutoHideUiTimer } from './utils';
import PlaybackBarPopUp from './PlaybackBarPopUp.js';

export default class PlaybackBar extends DomClass {
	#popUp = null
	#playbackBarContainer = null
	#topContainer = null
	#navContainer = null
	#buttonPluginsLeft = null
	#centerContainer = null
	#buttonPluginsRight = null
	#progressIndicator = null
	#enabled = true
	#enabledPlugins = []

	constructor(player,parent) {
		const inlineMode = player.config.progressIndicator?.inlineMode ?? false;
		const attributes = { "class": "playback-bar-container" };
		super(player, { attributes, parent });

		this.#popUp = new PlaybackBarPopUp(this);

		this.element.addEventListener('mouseenter', () => pauseAutoHideUiTimer(player));
		this.element.addEventListener('mouseleave', () => resumeAutoHideUiTimer(player));

		
		const toolbarAriaLabel = player.translate("Toolbar");
		const leftSideButtonsAriaLabel = player.translate("Left-side buttons");
		const rightSideButtonsAriaLabel = player.translate("Right-side buttons");
		this.#playbackBarContainer = createElementWithHtmlText('<section class="playback-bar"></section>', this.element);
		this.#topContainer = createElementWithHtmlText(`<div></div>`);
		this.#navContainer = createElementWithHtmlText(`<nav role="toolbar" aria-label="${toolbarAriaLabel}"></nav>`);

		this.#buttonPluginsLeft = createElementWithHtmlText(`<ul role="group" aria-label="${leftSideButtonsAriaLabel}"></ul>`, this.#navContainer);
		this.#centerContainer = createElementWithHtmlText(`<div></div>`, this.#navContainer);
		this.#buttonPluginsRight = createElementWithHtmlText(`<ul  role="group" aria-label="${rightSideButtonsAriaLabel}"></ul>`, this.#navContainer);
		
		const createProgressIndicator = player._initParams.getProgressIndicator;

		const duration = 1000;
		const currentTime = 0;
		const precision = 100;
		if (inlineMode) {
			this.#progressIndicator = createProgressIndicator({ container: this.#centerContainer, player, duration, currentTime, precision });
		}
		else {
			this.#playbackBarContainer.appendChild(this.#topContainer);
			this.#progressIndicator = createProgressIndicator({ container: this.#topContainer, player, duration, currentTime, precision });
		}
		this.#progressIndicator.onChange(async (currentTime) => {
			await player.videoContainer.setCurrentTime(currentTime);
		});

		this.#playbackBarContainer.appendChild(this.#navContainer);
	}

	get popUp() {
		return this.#popUp;
	}

	get enabled() {
		return this.#enabled;
	}

	set enabled(e) {
		this.#enabled = e;
		if (!this.#enabled) {
			this.hide();
		}
		else {
			this.showUserInterface();
		}
	}
	
	async load() {
		this.#enabledPlugins = [];
		
		this.player.log.debug("Loading button plugins");
		await loadPluginsOfType(this.player,"button",async (plugin) => {
			this.player.log.debug(` Button plugin: ${ plugin.name }`);
			this.#enabledPlugins.push(plugin);
			if (plugin.side === "left") {
				await addButtonPlugin(plugin, this.buttonPluginsLeft);
			}
			else if (plugin.side === "right") {
				await addButtonPlugin(plugin, this.buttonPluginsRight);
			}
		}, async plugin => {
			if (plugin.parentContainer === "playbackBar") {
				return await plugin.isEnabled();
			}
			else {
				return false;
			}
		});

		const duration = await this.player.videoContainer.duration();
		this.#progressIndicator.setDuration(duration);

		const manifest = {
			metadata: this.player.metadata,
			frameList: this.player.frameList,
			chapters: this.player.chapters
		};
		const markSource = manifest.metadata?.timelineMarks;
		let markList = null;
		if (markSource === "frameList" && manifest.frameList.frames.length > 0) {
			markList = manifest.frameList.frames;
		}
		else if (markSource === "chapters" && manifest.chapters.chapterList.length > 0) {
			markList = manifest.chapters.chapterList;
		}
		else if (!markSource && manifest.chapters.chapterList.length > 0) {
			markList = manifest.chapters.chapterList;
		}
		else if (!markSource && manifest.frameList.frames.length > 0) {
			markList = manifest.frameList.frames;
		}
		
		markList?.forEach((markData, i, allFrames) => {
			const nextFrame = allFrames[i + 1];
			const frameDuration = nextFrame ? nextFrame.time - markData.time : duration - markData.time;
			this.#progressIndicator.addMarker({ time: markData.time, duration, frameDuration, addGap: i < allFrames.length - 1 });
		});

		this.player.bindEvent([this.player.Events.TIMEUPDATE, this.player.Events.SEEK], (event) => {
			this.#progressIndicator.setCurrentTime(event.newTime ?? event.currentTime);
		});

		this.player.bindEvent(this.player.Events.TRIMMING_CHANGED, async (event) => {
			const newDuration = event.end - event.start;
			this.#progressIndicator.setDuration(newDuration);
			const currentTime = await this.player.videoContainer.currentTime();
			this.#progressIndicator.setCurrentTime(currentTime);
		});

		this.onResize();

		// This CSS variable is generated to be used in the CSS file
		const playbackBarHeight = this.element.querySelector(".playback-bar").offsetHeight;
		this.player.containerElement.style.setProperty('--playback-bar-height', `${playbackBarHeight}px`);
	}

	async unload() {
		// Remove elements from parent
		this.removeFromParent();

		// Unload plugins
		await unloadPluginsOfType(this.player, "button");
		this.#buttonPluginsLeft.innerHTML = ""
		this.#buttonPluginsRight.innerHTML = "";
	}
	
	hideUserInterface() {
		this.player.log.debug("Hide playback bar user interface");
		this.hide();
	}
	
	showUserInterface() {
		if (this.#enabled) {
			const inlineMode = this.player.config.progressIndicator?.inlineMode ?? false;
			const showMode = inlineMode ? 'flex' : 'block';
			this.show(showMode);
			this.onResize();
		}
	}
	
	get buttonPluginsRight() {
		return this.#buttonPluginsRight;
	}
	
	get buttonPluginsLeft() {
		return this.#buttonPluginsLeft;
	}
	
	get progressIndicator() {
		return this.#progressIndicator;
	}

	get containerSize() {
		const width = this.element.clientWidth;
		const height = this.element.clientHeight;
		return { width, height } 
	}
	
	onResize() {
		const { containerSize } = this;
		this.#enabledPlugins.forEach(plugin => plugin.onResize(containerSize));
	}

	getButtonPlugins() {
		return this.#enabledPlugins.sort((a, b) => a.order - b.order );
	}

	getVisibleButtonPlugins() {
  		return this.getButtonPlugins().filter(plugin => !plugin.hidden);
 	}
}
