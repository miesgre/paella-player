
import { DomClass, createElementWithHtmlText,createElement } from './dom';
import { 
    getValidLayouts, 
    getValidContentIds, 
    getLayoutStructure, 
    getLayoutWithContentId,
    getValidContentSettings } from './VideoLayout';
import StreamProvider from './StreamProvider';
import Events, { triggerEvent } from './Events';
import { addButtonPlugin } from './ButtonPlugin';
import { translate } from './Localization';

import { loadPluginsOfType, unloadPluginsOfType } from './plugin_tools'
import { loadVideoPlugins, unloadVideoPlugins, getVideoPluginWithFileUrl } from './VideoPlugin';
import { addVideoCanvasButton, CanvasButtonPosition, setTabIndex } from './CanvasPlugin';
import VideoContainerMessage from './VideoContainerMessage';
import PlayerState from './PlayerState';

export function getSourceWithUrl(player,url) {
    if (!Array.isArray[url]) {
        url = [url];
    }
    const plugin = getVideoPluginWithFileUrl(player, url);
    return plugin.getManifestData(url);
}

export async function getContainerBaseSize(player) {
    // TODO: In the future, this function can be modified to support different
    // aspect ratios, which can be loaded from the video manifest.
    return { w: 1280, h: 720 }
}

async function enableVideos(layoutStructure) {
    for (const content in this.streamProvider.streams) {
        const isPresent = layoutStructure?.videos?.find(video => video.content === content) != null;
        const video = this.streamProvider.streams[content];
        
        if (isPresent && !video.player.isEnabled) {
            await video.player.enable();
        }
        else if (!isPresent && video.player.isEnabled) {
            await video.player.disable();
        }
    }
}

function hideAllVideoPlayers() {
    // Hide all video players
    
    for (const key in this.streamProvider.streams) {
        const videoData = this.streamProvider.streams[key];
        videoData.canvas.element.style.display = "none";
        this._hiddenVideos.appendChild(videoData.canvas.element);
    }
}

async function updateLayoutStatic() {
    const layoutStructure = getLayoutStructure(this.player, this.streamProvider.streamData, this._layoutId, this._mainLayoutContent);

    await enableVideos.apply(this, [ layoutStructure ]);

    hideAllVideoPlayers.apply(this);

    // Conversion factors for video rect
    const baseSize = await getContainerBaseSize(this.player);
    const playerSize = this.elementSize;
    const wFactor = 100 / baseSize.w;
    const hFactor = 100 / baseSize.h;
    const playerRatio = playerSize.w / playerSize.h;
    const baseRatio = baseSize.w / baseSize.h; 
    const containerCurrentSize = playerRatio>baseRatio ?
        { w: playerSize.h * baseRatio, h: playerSize.h } :
        { w: playerSize.w, h: playerSize.w / baseRatio };

    this.baseVideoRect.style.width = containerCurrentSize.w + "px";
    this.baseVideoRect.style.height = containerCurrentSize.h + "px";
    this.baseVideoRect.classList.remove("dynamic");


    if (layoutStructure?.videos?.length) {
        const buttonElements = [];
        for (const video of layoutStructure.videos) {
            const videoData = this.streamProvider.streams[video.content];
            const { stream, player, canvas } = videoData;
            const res = await player.getDimensions();
            const videoAspectRatio = res.w / res.h;
            let difference = Number.MAX_VALUE;
            let resultRect = null;

            canvas.buttonsArea.innerHTML = "";
            buttonElements.push(await addVideoCanvasButton(this.player, layoutStructure, canvas, video, video.content));
            
            video.rect.forEach((videoRect) => {
                const aspectRatioData = /^(\d+.?\d*)\/(\d+.?\d*)$/.exec(videoRect.aspectRatio);
                const rectAspectRatio = aspectRatioData ? Number(aspectRatioData[1]) / Number(aspectRatioData[2]) : 1;
                const d = Math.abs(videoAspectRatio - rectAspectRatio);
                if (d < difference) {
                    resultRect = videoRect;
                    difference = d;
                }
            });

            canvas.element.style.display = "block";
            canvas.element.style.position = "absolute";
            canvas.element.style.left = `${ resultRect?.left * wFactor }%`;
            canvas.element.style.top = `${ resultRect?.top * hFactor }%`;
            canvas.element.style.width = `${ resultRect?.width * wFactor }%`;
            canvas.element.style.height = `${ resultRect?.height * hFactor }%`;
            canvas.element.style.zIndex = video.layer;

            this.baseVideoRect.appendChild(canvas.element);
        }

        setTimeout(() => {
            setTabIndex(this.player, layoutStructure, buttonElements.flat());
        }, 100);
    }
    
    const prevButtons = this.baseVideoRect.getElementsByClassName('video-layout-button');
    Array.from(prevButtons).forEach(btn => this.baseVideoRect.removeChild(btn));
    layoutStructure?.buttons?.forEach(buttonData => {
        const button = createElement({
            tag: 'button',
            attributes: {
                "class": "video-layout-button",
                "aria-label": translate(buttonData.ariaLabel),
                "title": translate(buttonData.title),
                style: `
                    left: ${buttonData.rect.left * wFactor}%;
                    top: ${buttonData.rect.top * hFactor}%;
                    width: ${buttonData.rect.width * wFactor}%;
                    height: ${buttonData.rect.height * hFactor}%;
                    z-index: ${ buttonData.layer };
                `
            },
            parent: this.baseVideoRect,
            children: buttonData.icon
        });
        button.layout = layoutStructure;
        button.buttonAction = buttonData.onClick;
        button.addEventListener("click", async (evt) => {
            triggerEvent(this.player, Events.BUTTON_PRESS, {
                plugin: layoutStructure.plugin,
                layoutStructure: layoutStructure
            });
            await evt.target.buttonAction.apply(evt.target.layout);
            evt.stopPropagation();
        });
        this._layoutButtons.push(button);
    });

    return true;
}

async function updateLayoutDynamic() {
    const layoutStructure = getLayoutStructure(this.player, this.streamProvider.streamData, this._layoutId, this._mainLayoutContent);

    await enableVideos.apply(this, [ layoutStructure ]);

    hideAllVideoPlayers.apply(this);

    this.baseVideoRect.style.width = "";
    this.baseVideoRect.style.height = "";
    this.baseVideoRect.style.display = "flex";
    this.baseVideoRect.classList.add("dynamic");
    this.baseVideoRect.innerHTML = "";


    const videoContainerWidth = this.element.clientWidth;
    const videoContainerHeight = this.element.clientHeight;
    const isLandscape = videoContainerWidth > videoContainerHeight;
    this.baseVideoRect.classList.remove("align-center");
    this.baseVideoRect.classList.remove("align-top");
    this.baseVideoRect.classList.remove("align-bottom");
    this.baseVideoRect.classList.remove("align-left");
    this.baseVideoRect.classList.remove("align-right");

    if (isLandscape) {
        const videoCanvasAlign = this.player.config.videoContainer?.dynamicLayout?.landscapeVerticalAlignment || "align-center";
        this.baseVideoRect.classList.remove("portrait");
        this.baseVideoRect.classList.add("landscape");
        this.baseVideoRect.classList.add(videoCanvasAlign);
    }
    else {
        const videoCanvasAlign = this.player.config.videoContainer?.dynamicLayout?.portraitHorizontalAlignment || "align-center";
        this.baseVideoRect.classList.add("portrait");
        this.baseVideoRect.classList.remove("landscape");
        this.baseVideoRect.classList.add(videoCanvasAlign);
    }
    const width = this.baseVideoRect.clientWidth;
    const height = this.element.clientHeight;

    if (layoutStructure?.videos?.length === 1) {
        const canvasElements = [];
        const buttonElements = [];
        const video = layoutStructure.videos[0];
        const videoData = this.streamProvider.streams[video.content];
        const { player, canvas } = videoData;

        canvas.buttonsArea.innerHTML = "";
        buttonElements.push(await addVideoCanvasButton(this.player, layoutStructure, canvas, video, video.content));

        canvas.element.style = {};
        canvas.element.style.display = "block";
        canvas.element.style.width = "100%";
        canvas.element.style.height = "100%";
        canvas.element.style.overflow = "hidden";
        canvas.element.style.position = "relative";
        canvasElements.push(canvas.element);
        canvas.element.sortIndex = 0;
        canvasElements.forEach(e => this.baseVideoRect.appendChild(e));
        setTimeout(() => {
            setTabIndex(this.player, layoutStructure, buttonElements.flat());
        }, 100);
    }
    else if (layoutStructure?.videos?.length) {
        let i = 0;
        const canvasElements = [];
        const buttonElements = [];
        for (const video of layoutStructure.videos) {
            const videoData = this.streamProvider.streams[video.content];
            const { player, canvas } = videoData;
            const res = await player.getDimensions();
            const videoAspectRatio = res.w / res.h;
            const maxWidth = width;
            const maxHeight = height;
            const baseSize = (isLandscape ? maxWidth : maxHeight) * video.size / 100;
            let videoWidth = Math.round(isLandscape ? baseSize : baseSize * videoAspectRatio);
            let videoHeight = Math.round(isLandscape ? baseSize / videoAspectRatio : baseSize);
            if (videoWidth>maxWidth) {
                videoWidth = maxWidth;
                videoHeight = Math.round(videoWidth / videoAspectRatio);
            }
            if (videoHeight>maxHeight) {
                videoHeight = maxHeight;
                videoWidth = Math.round(videoHeight * videoAspectRatio);
            }
            

            canvas.buttonsArea.innerHTML = "";
            buttonElements.push(await addVideoCanvasButton(this.player, layoutStructure, canvas, video, video.content));

            canvas.element.style = {};
            canvas.element.style.display = "block";
            canvas.element.style.width = `${videoWidth}px`;
            canvas.element.style.height = `${videoHeight}px`;
            canvas.element.style.overflow = "hidden";
            canvas.element.style.position = "relative";
            canvas.element.sortIndex = i++;
            canvasElements.push(canvas.element);
        }
        if (isLandscape) {
            const landscapeContainer = createElementWithHtmlText(`<div class="landscape-container"></div>`, this.baseVideoRect);
            canvasElements.forEach(e => landscapeContainer.appendChild(e));
        }
        else {
            canvasElements.forEach(e => this.baseVideoRect.appendChild(e));
        }
        setTimeout(() => {
            setTabIndex(this.player, layoutStructure, buttonElements.flat());
        }, 100);
    }

    return true;
}

export default class VideoContainer extends DomClass {

    constructor(player, parent) {
        const baseVideoRectClass = "base-video-rect";

        const attributes = {
            "class": "video-container"
        };

        if (player.config.videoContainer?.overPlaybackBar) {
            attributes.class += " over-playback-bar"
        }

        const children = `
            <div class="${ baseVideoRectClass }"></div>
            <div class="hidden-videos-container" style="display: none"></div>
        `
        super(player, {attributes, children, parent});

        this._hiddenVideos = this.element.getElementsByClassName("hidden-videos-container")[0];
        this._baseVideoRect = this.element.getElementsByClassName(baseVideoRectClass)[0];
        this.element.addEventListener("click", async () => {
            if (await this.paused()) {
                await this.play();
            }
            else {
                await this.pause();
            }
        });

        this._ready = false;

        this._players = [];
        
        this._streamProvider = new StreamProvider(this.player, this.baseVideoRect);
    }

    get layoutId() {
        return this._layoutId;
    }

    get mainLayoutContent() {
        return this._mainLayoutContent;
    }
    
    async setLayout(layoutId,mainContent = null) {
        if (this.validContentIds.indexOf(layoutId) === -1) {
            return false;
        }
        else {
            const global = this.player.config.videoContainer?.restoreVideoLayout?.global;
            await this.player.preferences.set('videoLayout', layoutId, { global });
            await this.player.preferences.set('videoLayoutMainContent', mainContent, { global });
            const prevLayout = this._layoutId;
            this._layoutId = layoutId;
            this._mainLayoutContent = mainContent;
            await this.updateLayout();
            if (prevLayout !== layoutId) {
                triggerEvent(this.player, Events.LAYOUT_CHANGED, { prevLayout, layoutId });
            }
        }
    }
    
    get validContentIds() {
        return this._validContentIds;
    }
    
    get validContentSettings() {
        return this._validContentSettings;
    }

    get validLayouts() {
        return getValidLayouts(this.player, this.streamData);
    }

    get streamData() {
        return this._streamData;
    }

    get baseVideoRect() {
        return this._baseVideoRect;
    }
    
    get streamProvider() {
        return this._streamProvider;
    }
    
    async create() {
        this._baseVideoRect.style.display = "none";

        await loadPluginsOfType(this.player, "layout");

        await loadVideoPlugins(this.player);
    }

    async load(streamData) {
        this._streamData = streamData;

        if (this.player.config.videoContainer?.restoreVideoLayout?.enabled) {
            const global = this.player.config.videoContainer?.restoreVideoLayout?.global;
            this._layoutId = await this.player.preferences.get("videoLayout", { global }) || this.player.config.defaultLayout;
            this._mainLayoutContent = await this.player.preferences.get("videoLayoutMainContent", { global }) || null;
        }
        else {
            this._layoutId = this.player.config.defaultLayout;
            this._mainLayoutContent = null;
        }


        await this.streamProvider.load(streamData);
        
        // Find the content identifiers that are compatible with the stream data
        this._validContentIds = getValidContentIds(this.player, streamData);
        
        this._validContentSettings = getValidContentSettings(this.player, streamData);
        
        // Load video layout
        await this.updateLayout(null, true);

        const leftSideButtons = createElementWithHtmlText(
            `<div class="button-plugins left-side"></div>`, this.element
        );
        const rightSideButtons = createElementWithHtmlText(
            `<div class="button-plugins right-side"></div>`, this.element
        );
        this._buttonPlugins = [ leftSideButtons, rightSideButtons ];

        // Load videoContainer plugins
        this.player.log.debug("Loading videoContainer button plugins");
        await loadPluginsOfType(this.player,"button",async (plugin) => {
            this.player.log.debug(` Button plugin: ${ plugin.name }`);
            if (plugin.side === "left") {
                await addButtonPlugin(plugin, leftSideButtons);
            }
            else if (plugin.side === "right") {
                await addButtonPlugin(plugin, rightSideButtons);
            }
        }, async plugin => {
            if (plugin.parentContainer === "videoContainer") {
                return await plugin.isEnabled();
            }
            else {
                return false;
            }
        });
        
        this._baseVideoRect.style.display = "";

        // Restore volume and playback rate
        const storedVolume = await this.player.preferences.get("volume", { global: true });
        const playbackRate = await this.player.preferences.get("playbackRate", { global: true });
        const lastKnownTime = await this.player.preferences.get("lastKnownTime", { global: false });

        if (this.player.config.videoContainer?.restoreVolume && storedVolume !== null && storedVolume !== undefined) {
            await this.streamProvider.setVolume(storedVolume);
        }
        if (this.player.config.videoContainer?.restorePlaybackRate && playbackRate !== null && playbackRate !== undefined) {
            await this.streamProvider.setPlaybackRate(playbackRate);
        }
        
        if (this.player.videoManifest.trimming) {
            await this.player.videoContainer.setTrimming(this.player.videoManifest.trimming);
        }

        if (this.player.config.videoContainer?.restoreLastTime?.enabled && !this.streamProvider.isLiveStream)
        {
            const saveCurrentTime = async () => {
                const paused = await this.paused();
                if (!paused) {
                    const currentTime = await this.currentTime();
                    await this.player.preferences.set("lastKnownTime", currentTime, { global: false });
                }
                setTimeout(saveCurrentTime, 1000);
            }

            if (lastKnownTime) {
                const time = await this.player.preferences.get('lastKnownTime', { global: false });
                const duration = await this.duration();
                const remainingSeconds = this.player.config.videoContainer?.restoreLastTime?.remainingSeconds;
                if ((duration - time) > remainingSeconds) {
                    await this.setCurrentTime(time);
                }
            }

            saveCurrentTime();
        }

        this._messageContainer = new VideoContainerMessage(this.player, this.element);

        this._ready = true;
    }

    async unload() {
        this.removeFromParent();

        // Button plugins are unloaded in PlaybackBar

        await unloadPluginsOfType(this.player, "layout");

        await unloadVideoPlugins(this.player);

        await this.streamProvider.unload();
    }

    // Return true if the layout this.layoutId is compatible with the current stream data.
    async updateLayout(mainContent = null) {
        // The second argument in this function is for internal use only
        const ignorePlayerState = arguments[1];

        if (mainContent) {
            this._mainLayoutContent = mainContent;
        }
        if (!ignorePlayerState && this.player.state !== PlayerState.LOADED) {
            return;
        }

        if (this._updateInProgress) {
            this.player.log.warn("Recursive update layout detected");
            return false;
        }
        this._updateInProgress = true;

        let status = true;
        
        this._layoutButtons = [];
        
        // Current layout: if not selected, or the selected layout is not compatible, load de default layout
        if (!this._layoutId || this._validContentIds.indexOf(this._layoutId) === -1) {
            this._layoutId = this.player.config.defaultLayout;
            this._mainLayoutContent = null;

            // Check if the default layout is compatible
            if (this._validContentIds.indexOf(this._layoutId) === -1) {
                this._layoutId = this._validContentIds[0];
            }
            status = false;
        }

        const layoutPlugin = getLayoutWithContentId(this.player, this.streamProvider.streamData, this._layoutId);
        if (layoutPlugin.layoutType === "static") {
            status = updateLayoutStatic.apply(this);
        }
        else if (layoutPlugin.layoutType === "dynamic") {
            status = updateLayoutDynamic.apply(this);
        }

        this._updateInProgress = false;
        return status;
    }
    
    hideUserInterface() {
        if (this._layoutButtons && this._buttonPlugins) {
            this.player.log.debug("Hide video container user interface");
            const hideFunc = button => {
                button._prevDisplay = button.style.display;
                button.style.display = "none";
            }
            this._layoutButtons.forEach(hideFunc);
            this._buttonPlugins.forEach(hideFunc);
            for (const content in this.streamProvider.streams) {
                const stream = this.streamProvider.streams[content];
                stream.canvas.hideButtons();
            }
        }
    }
    
    showUserInterface() {
        if (this._layoutButtons && this._buttonPlugins) {
            const showFunc = button => button.style.display = button._prevDisplay || "block";
            this._layoutButtons.forEach(showFunc);
            this._buttonPlugins.forEach(showFunc);
            for (const content in this.streamProvider.streams) {
                const stream = this.streamProvider.streams[content];
                stream.canvas.showButtons();
            }
        }
    }

    get message() {
        return this._messageContainer;
    }

    get elementSize() {
        return { w: this.element.offsetWidth, h: this.element.offsetHeight };
    }

    get ready() {
        return this._ready;
    }

    get isLiveStream() {
        return this.streamProvider.isLiveStream;
    }

    async play() {
        const result = await this.streamProvider.play();
        triggerEvent(this.player, Events.PLAY);
        return result;
    }

    async pause() {
        const result = await this.streamProvider.pause();
        triggerEvent(this.player, Events.PAUSE);
        return result;
    }
    
    async stop() {
        this.streamProvider.stop();
        triggerEvent(this.player, Events.STOP);
    }
    
    async paused() {
        return this.streamProvider.paused();
    }

    async setCurrentTime(t) {
        const result = await this.streamProvider.setCurrentTime(t);
        triggerEvent(this.player, Events.SEEK, { prevTime: result.prevTime, newTime: result.newTime });
        return result.result;
    }
    
    async currentTime() {
        return this.streamProvider.currentTime();
    }
    
    async volume() {
        return this.streamProvider.volume();
    }
    
    async setVolume(v) {
        const result = await this.streamProvider.setVolume(v);
        triggerEvent(this.player, Events.VOLUME_CHANGED, { volume: v });
        await this.player.preferences.set("volume", v, { global: true });
        return result;
    }
    
    async duration() {
        return await this.streamProvider.duration();
    }

    async playbackRate() {
        return await this.streamProvider.playbackRate();
    }

    async setPlaybackRate(r) {
        const result = await this.streamProvider.setPlaybackRate(r);
        triggerEvent(this.player, Events.PLAYBACK_RATE_CHANGED, { newPlaybackRate: r });
        await this.player.preferences.set("playbackRate", r, { global: true });
        return result;
    }

    get isTrimEnabled() {
        return this.streamProvider.isTrimEnabled;
    }

    get trimStart() {
        return this.streamProvider.trimStart;
    }

    get trimEnd() {
        return this.streamProvider.trimEnd;
    }

    async setTrimming({ enabled, start, end }) {
        const result = await this.streamProvider.setTrimming({
            enabled,
            start,
            end
        });
        triggerEvent(this.player, Events.TRIMMING_CHANGED, { 
            enabled, 
            start, 
            end 
        });
        return result;
    }

    getVideoRect(target = null) {
        let element = this.baseVideoRect;
        if (typeof(target) === "string") {
            element = this.streamProvider.streams[target]?.canvas.element;
        }
        
        return {
            x: element?.offsetLeft, 
            y: element?.offsetTop, 
            width: element?.offsetWidth, 
            height: element?.offsetHeight,            
            element
        };
    }

    appendChild(element, rect = null, zIndex = 1) {
        if (rect) {
            const { width, height } = this.getVideoRect();
            rect.x = rect.x * 100 / width;
            rect.width = rect.width * 100 / width;
            rect.y = rect.y * 100 / height;
            rect.height = rect.height * 100 / height;
            element.style.position = "absolute";
            element.style.left = `${ rect.x }%`;
            element.style.top = `${ rect.y }%`;
            element.style.width = `${ rect.width }%`;
            element.style.height = `${ rect.height }%`;
            if (zIndex!==null) element.style.zIndex = zIndex;
        }
        this.baseVideoRect.appendChild(element);
        return element;
    }

    removeChild(element) {
        this.baseVideoRect.removeChild(element);
    }
}

