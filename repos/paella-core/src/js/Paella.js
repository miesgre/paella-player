import {
    defaultLoadConfigFunction,
    defaultGetVideoIdFunction,
    defaultGetManifestUrlFunction,
    defaultGetManifestFileUrlFunction,
    defaultLoadVideoManifestFunction
} from './core/initFunctions';
import { 
    resolveResourcePath,
    setupAutoHideUiTimer,
    clearAutoHideTimer,
    getUrlFileName,
    removeExtension,
    removeFileName
} from './core/utils';
import Loader from "./core/Loader";
import ErrorContainer from "./core/ErrorContainer";
import { registerPlugins, unregisterPlugins } from './core/plugin_tools';
import VideoContainer, {
    getSourceWithUrl
} from './core/VideoContainer';
import PreviewContainer from './core/PreviewContainer';
import PlaybackBar from './core/PlaybackBar';
import Events, { bindEvent, triggerEvent, unregisterEvents } from './core/Events';
import Data from './core/Data';
import CaptionCanvas from './captions/CaptionsCanvas';
import { loadLogEventPlugins, unloadLogEventPlugins } from "./core/EventLogPlugin";
import { checkManifestIntegrity } from "./core/StreamProvider";
import CookieConsent, {
    defaultGetCookieConsentCallback,
    defaultGetCookieDescriptionCallback
} from "./core/CookieConsent";
import { getAvailableContentIds } from "./core/VideoLayout";
import { createProgressIndicator } from "./core/progress-indicator.js";

import {
    defaultTranslateFunction,
    defaultSetLanguageFunction,
    defaultAddDictionaryFunction,
    setTranslateFunction,
    setGetLanguageFunction,
    setSetLanguageFunction,
    setAddDictionaryFunction,
    setGetDefaultLanguageFunction,
    addDictionary,
    getDictionaries,
    translate,
    setLanguage,
    getLanguage,
    getDefaultLanguage,
    defaultGetDictionariesFunction,
    setGetDictionariesFunction,
    defaultGetDefaultLanguageFunction,
    setupDefaultLanguage
} from "./core/Localization";

import { defaultGetLanguageFunction } from "./core/Localization";

import Log, { LOG_LEVEL } from "./core/Log";

import defaultDictionaries from "../i18n/all.js";

import Preferences from "./core/Preferences";

import Skin, { overrideSkinConfig, loadSkinStyleSheets, loadSkinIcons, unloadSkinStyleSheets } from "./core/Skin";

import PlayerState from "./core/PlayerState";

export const PlayerStateNames = Object.freeze([
    'UNLOADED',
    'LOADING_MANIFEST',
    'MANIFEST',
    'LOADING_PLAYER',
    'LOADED',
    'UNLOADING_MANIFEST',
    'UNLOADING_PLAYER',
    'ERROR'
]);

function buildPreview() {
    const preview = (this.videoManifest?.metadata?.preview && resolveResourcePath(this, this.videoManifest?.metadata?.preview)) || this.defaultVideoPreview;
    const previewPortrait = (this.videoManifest?.metadata?.previewPortrait && resolveResourcePath(this, this.videoManifest?.metadata?.previewPortrait)) || this.defaultVideoPreviewPortrait;
    this._previewContainer = new PreviewContainer(this, this._containerElement, preview, previewPortrait);
}

import packageData from "../../package.json";
import ManifestParser from "./core/ManifestParser";

// Used in the first step of loadManifest and loadUrl
async function preLoadPlayer() {
    this._playerState = PlayerState.LOADING_MANIFEST;
    this._manifestLoaded = true;

    this.log.debug("Loading paella player");
    this._config = await this.initParams.loadConfig(this.configUrl,this);

    // Override config.json options from skin
    overrideSkinConfig.apply(this.skin, [this._config]);

    setupDefaultLanguage(this);

    this._defaultVideoPreview = this._config.defaultVideoPreview || this._initParams.defaultVideoPreview || "";
    this._defaultVideoPreviewPortrait = this._config.defaultVideoPreviewPortrait || this._initParams.defaultVideoPreviewPortrait || "";

    this._cookieConsent = new CookieConsent(this, {
        getConsent: this._initParams.getCookieConsentFunction, 
        getDescription: this._initParams.getCookieDescriptionFunction
    });

    this._preferences = new Preferences(this);

    const urlSearch = new URLSearchParams(window.location.search);
    const caseInsensitiveParams = new URLSearchParams();
    for (const [name, value] of urlSearch) {
        caseInsensitiveParams.append(name.toLowerCase(), value);
    }
    const urlParamLogLevel = caseInsensitiveParams.get("loglevel");
    const logLevel = (urlParamLogLevel && Array.from(Object.keys(LOG_LEVEL)).indexOf(urlParamLogLevel.toUpperCase()) !== -1) ?
        urlParamLogLevel :
        this._config.logLevel || "INFO";
    this._log.setLevel(logLevel);

    // Load localization dictionaries
    await this._initParams.loadDictionaries(this);

    registerPlugins(this);

    // EventLogPlugin plugins are loaded first, so that all lifecycle events can be captured.
    await loadLogEventPlugins(this);

    // Create video container.
    this._videoContainer = new VideoContainer(this, this._containerElement);

    // This function will load the video plugins
    await this.videoContainer.create();

    // Load plugin modules dictionaries
    for (const module of this.pluginModules) {
        const dict = module.getDictionaries && await module.getDictionaries();
        if (dict) {
            for (const lang in dict) {
                addDictionary(lang, dict[lang]);
            }
        }
    }
}

// Used in the last step of loadManifest and loadUrl
async function postLoadPlayer() {
    this.log.debug("Video manifest loaded:");
    this.log.debug(this.videoManifest);

    // Load data plugins
    this._data = new Data(this);

    // Load default dictionaries
    for (const lang in defaultDictionaries) {
        const dict = defaultDictionaries[lang];
        addDictionary(lang, dict);
    }

    this._playerState = PlayerState.MANIFEST;
    triggerEvent(this, Events.MANIFEST_LOADED);

    // The video preview is required
    if (!this.videoManifest?.metadata?.preview) {
        throw new Error("No preview image found in video manifest, and no default preview image defined.");
    }
    else {
        buildPreview.apply(this);
    }

    checkManifestIntegrity(this._videoManifest);
}

export default class Paella {

    constructor(containerElement, initParams = {}) {
        this._log = new Log(this);

        this._packageData = packageData;

        // The default log level before loading the configuration is
        // VERBOSE, to ensure that all previous messages are displayed
        this._log.setLevel(LOG_LEVEL.VERBOSE);

        // Debug: create an array of all paella player instances
        window.__paella_instances__ = window.__paella_instances__ || [];
        window.__paella_instances__.push(this);

        this.log.debug("New paella player instance");
        
        
        if (typeof(containerElement) === "string") {
            containerElement = document.getElementById(containerElement);
        }
        
        containerElement.classList.add("player-container");

        this.log.debug("Loading skin manager");
        this._skin = new Skin(this);
        
        this._containerElement = containerElement;
        this._initParams = initParams;
        
        // Default initParams values:
        this._initParams.manifestFileName = this._initParams.manifestFileName || "data.json";
        this._initParams.loadConfig = this._initParams.loadConfig || defaultLoadConfigFunction;
        this._initParams.getVideoId = this._initParams.getVideoId || defaultGetVideoIdFunction;
        this._initParams.getManifestUrl = this._initParams.getManifestUrl || defaultGetManifestUrlFunction;
        this._initParams.getManifestFileUrl = this._initParams.getManifestFileUrl || defaultGetManifestFileUrlFunction;
        this._initParams.loadVideoManifest = this._initParams.loadVideoManifest || defaultLoadVideoManifestFunction;
        this._initParams.translateFunction = this._initParams.translateFunction || defaultTranslateFunction;
        this._initParams.getLanguageFunction = this._initParams.getLanguageFunction || defaultGetLanguageFunction;
        this._initParams.setLanguageFunction = this._initParams.setLanguageFunction || defaultSetLanguageFunction;
        this._initParams.addDictionaryFunction = this._initParams.addDictionaryFunction || defaultAddDictionaryFunction;
        this._initParams.getDictionariesFunction = this._initParams.getDictionariesFunction || defaultGetDictionariesFunction;
        this._initParams.getDefaultLanguageFunction = this._initParams.getDefaultLanguageFunction || defaultGetDefaultLanguageFunction;
        this._initParams.Loader = this._initParams.customLoader || Loader;
        this._initParams.getCookieConsentFunction = this._initParams.getCookieConsentFunction || defaultGetCookieConsentCallback;
        this._initParams.getCookieDescriptionFunction = this._initParams.getCookieDescriptionFunction || defaultGetCookieDescriptionCallback;
        this._initParams.getProgressIndicator = this._initParams.getProgressIndicator || createProgressIndicator;

        this._initParams.loadDictionaries = this._initParams.loadDictionaries || async function(player) {
            addDictionary("en", {
                "Hello": "Hello",
                "World": "World"
            });

            addDictionary("es", {
                "Hello": "Hola",
                "World": "Mundo"
            });

            setLanguage(navigator.language.substring(0,2));
        }

        const userPlugins = this._initParams.plugins || [];
        this._initParams.plugins = [
            ...userPlugins
        ]

        setTranslateFunction(this._initParams.translateFunction);
        setSetLanguageFunction(this._initParams.setLanguageFunction);
        setGetLanguageFunction(this._initParams.getLanguageFunction);
        setAddDictionaryFunction(this._initParams.addDictionaryFunction);
        setGetDictionariesFunction(this._initParams.getDictionariesFunction);
        setGetDefaultLanguageFunction(this._initParams.getDefaultLanguageFunction);

        this._config = null;
        this._defaultVideoPreview = "";
        this._defaultVideoPreviewPortrait = "";
        this._videoId = null;
        this._manifestUrl = null;
        this._manifestFileUrl = null;
        this._manifestData = null;
        this._videoManifest = null;

        // Load status flags
        this._playerLoaded = false;

        const resize = () => {
            this.resize();
        }
        this._resizeEventListener = window.addEventListener("resize", resize);
        
        this.containerElement.addEventListener("fullscreenchange", () => {
            triggerEvent(this, Events.FULLSCREEN_CHANGED, { status: this.isFullscreen });
            this.isFullscreen ? triggerEvent(this, Events.ENTER_FULLSCREEN) : triggerEvent(this, Events.EXIT_FULLSCREEN);
        });

        this._playerState = PlayerState.UNLOADED;

        this._customPluginIcons = {};
    }

    get version() {
        return this._packageData.version;
    }

    get pluginModules() {
        return this.__pluginModules || [];
    }

    get log() {
        return this._log;
    }

    get ready() {
        return this._playerState === PlayerState.LOADED;
    }

    get state() {
        return this._playerState;
    }

    get stateText() {
        return PlayerStateNames[this.state];
    }

    get Events() {
        return Events;
    }

    get preferences() {
        return this._preferences;
    }

    get skin() {
        return this._skin;
    }

    get containsFocus() {
        return this.containerElement.contains(document.activeElement);
    }

    get hideUiTime() {
        return this._hideUiTime;
    }

    set hideUiTime(val) {
        this._hideUiTime = val;
    }
    
    get containerSize() { return { w: this._containerElement.offsetWidth, h: this._containerElement.offsetHeight }; }
    
    get containerElement() { return this._containerElement; }

    get initParams() { return this._initParams; }

    get cookieConsent() { return this._cookieConsent; }

    get configLoaded() {
        return this.configUrl !== null;
    }

    get videoManifestLoaded() {
        return this.videoManifest !== null;
    }

    get videoLoaded() {
        return this.videoContainer?.ready || false;
    }

    get playerLoaded() {
        return this._playerLoaded;
    }

    get configResourcesUrl() {
        return this._initParams?.configResourcesUrl || 'config/';
    }
    
    get configUrl() {
        return this._initParams?.configUrl || 'config/config.json';
    }

    get config() {
        return this._config;
    }

    get defaultVideoPreview() {
        return this._defaultVideoPreview;
    }

    get defaultVideoPreviewPortrait() {
        return this._defaultVideoPreviewPortrait;
    }

    get videoId() {
        return this._videoId;
    }

    // Base URL where the video repository is located, for example "repository/"
    get repositoryUrl() {
        return this._initParams?.repositoryUrl || this.config?.repositoryUrl || "";
    }

    // Base URL where the video manifest file is located, for example "repository/[video_id]"
    get manifestUrl() {
        return this._manifestUrl;
    }

    // Video manifest file name, for example "data.json"
    get manifestFileName() {
        return this.config?.manifestFileName || this._initParams?.manifestFileName || "";
    }

    // Full path of the video manifest, for example "repository/[video_id]/data.json"
    get manifestFileUrl() {
        return this._manifestFileUrl;
    }

    // Video manifest file content (data.json)
    get videoManifest() {
        return this._videoManifest;
    }

    get previewContainer() {
        return this._previewContainer;
    }

    get videoContainer() {
        return this._videoContainer;
    }

    get playbackBar() {
        return this._playbackBar;
    }

    get captionsCanvas() {
        return this._captionsCanvas;
    }

    get data() {
        return this._data;
    }

    get PlayerState() {
        return PlayerState;
    }

    get PlayerStateNames() {
        return PlayerStateNames;
    }

    // Manifest query functions
    get metadata() {
        return this._manifestParser?.metadata || {};
    }

    get streams() {
        return this._manifestParser?.streams || [];
    }

    get frameList() {
        return this._manifestParser?.frameList || { frames: [] };
    }

    get chapters() {
        return this._manifestParser?.chapters || { chapterList: []  };
    }

    get captions() {
        return this._manifestParser?.captions || [];
    }

    get trimming() {
        return this._manifestParser?.trimming || {};
    }

    get visibleTimeLine() {
        return this._manifestParser?.visibleTimeLine || true;
    }

    async getTimelineFrame() {
        const currentTime = await this.videoContainer.streamProvider.currentTimeIgnoringTrimming();
        return this._manifestParser.getTimelineFrameAtTime(currentTime);
    }

    async getTimelineFrameAtTime(time) {
        const start = this.videoContainer.trimEnabled ? this.videoContainer.trimStart : 0;
        return this._manifestParser.getTimelineFrameAtTime(time - start);
    }

    /**
     * Translate a word or phrase.
     * @param {string} word - The word to translate.
     * @param {Object} [keys=null] - Optional keys for placeholders.
     * @returns {string} - The translated word.
     */
    translate(word, keys = null) {
        return translate(word, keys);
    }

    /**
     * Set the current language.
     * @param {string} lang - The language code.
     */
    setLanguage(lang) {
        setLanguage(lang);
    }

    /**
     * Get the current language.
     * @returns {string} - The current language code.
     */
    getLanguage() {
        return getLanguage();
    }

    /**
     * Add a dictionary for a specific language.
     * @param {string} lang - The language code.
     * @param {Object} dict - The dictionary object.
     */
    addDictionary(lang,dict) {
        addDictionary(lang,dict);
    }

    /**
     * Get all loaded dictionaries.
     * @returns {Object} - The dictionaries.
     */
    getDictionaries() {
        return getDictionaries();
    }

    /**
     * Get the default language.
     * @returns {string} - The default language code.
     */
    getDefaultLanguage() {
        return getDefaultLanguage(this);
    }

    /**
     * Bind an event to the player.
     * @param {string} eventName - The event name.
     * @param {Function} fn - The callback function.
     * @param {boolean} [unregisterOnUnload=true] - Whether to unregister the event on unload.
     */
    bindEvent(eventName, fn, unregisterOnUnload = true) {
        bindEvent(this, eventName, data => fn(data), unregisterOnUnload);
    }

    getPlugin(name, type = null) {
        if (type) {
            const plugins = this.__pluginData__.pluginInstances[type];
            if (plugins) {
                return plugins.find(p => {
                    if (p.name === name) {
                        return p;
                    }
                });
            }
        }
        else {
            const result = {};
            for (const t in this.__pluginData__.pluginInstances) {
                const instances = this.__pluginData__.pluginInstances[t];
                const p = instances.find(p => {
                    if (p.name === name) {
                        return p;
                    }
                });
                if (p) {
                    result[t] = p;
                }
            }
            return result;
        }
    }

    waitState(state) {
        return new Promise((resolve, reject) => {
            const checkState = () => {
                if (this.state === state) {
                    resolve();
                }
                else {
                    setTimeout(checkState, 50);
                }
            }
            if (typeof(state) === 'string') {
                state = PlayerState[state];
            }
            
            if (state<0 || state>Object.values(PlayerState).length) {
                reject(Error(`Invalid player state '${state}'`));
            }
    
            checkState();
        })
    }

    /**
     * Load a video from a URL.
     * @param {string|string[]} url - The video URL(s).
     * @param {Object} [options] - Additional options.
     * @param {string} [options.title] - The video title.
     * @param {number} [options.duration] - The video duration.
     * @param {string} [options.preview] - The preview image URL.
     * @param {string} [options.previewPortrait] - The portrait preview image URL.
     */
    async loadUrl(url, { title, duration, preview, previewPortrait } = {}) {
        if (this._playerState !== PlayerState.UNLOADED) {
            throw new Error(this.translate("loadUrl(): Invalid current player state: $1", [PlayerStateNames[this._playerState]]));
        }
        if (this._manifestLoaded) {
            throw new Error(this.translate("loadUrl(): Invalid current player state: $1", [PlayerStateNames[this._playerState]]));
        }
        if (!url) {
            throw new Error(this.translate("loadUrl(): No URL specified."));
        }

        if (!Array.isArray(url)) {
            url = [url];
        }

        if (!title) {
            title = getUrlFileName(url[0]);
            this.log.warn("Paella.loadUrl(): no title specified. Using URL file name as video name.");
        }

        try {
            await preLoadPlayer.apply(this);

            if (!preview && (this.defaultVideoPreview !== "" || this.defaultVideoPreviewPortrait !== "")) {
                preview = this.defaultVideoPreview;
                previewPortrait = this.defaultVideoPreviewPortrait;
                this.log.warn("Paella.loadUrl(): no preview image specified. Using default preview image.");
            }
            else if (!preview && !previewPortrait) {
                throw new Error("Paella.loadUrl(): no preview image specified and no default preview image configured.");
            }

            this._videoId = removeExtension(getUrlFileName(url[0]));
            
            this._manifestUrl = removeFileName(url[0]);
            this._manifestFileUrl = url[0];

            this.log.debug(`Loading video with identifier '${this.videoId}' from URL '${this.manifestFileUrl}'`);

            const validContents = getAvailableContentIds(this, url.length)[0];
            this._videoManifest = {
                metadata: {
                    duration,
                    title,
                    preview,
                    previewPortrait
                },

                streams: url.map((u,i) => {
                    const sources = getSourceWithUrl(this, u);
                    return {
                        sources,
                        content: validContents[i],
                        role: i === 0 ? 'mainAudio' : null
                    };
                })
            };

            await postLoadPlayer.apply(this);
        }
        catch (err) {
            this._playerState = PlayerState.ERROR;
            this.log.error(err);
            this._errorContainer = new ErrorContainer(this, this.translate(err.message));
            throw err;
        }
    }

    /**
     * Load the video manifest.
     */
    async loadManifest() {
        if (this._playerState !== PlayerState.UNLOADED) {
            throw new Error(this.translate("loadManifest(): Invalid current player state: $1", [PlayerStateNames[this._playerState]]));
        }
        if (this._manifestLoaded) return;

        try {
            await preLoadPlayer.apply(this);
    
            this._videoId = await this.initParams.getVideoId(this._config, this);
            if (this.videoId === null) {
                throw new Error('No video identifier specified');
            }
    
            this._manifestUrl = await this.initParams.getManifestUrl(this.repositoryUrl,this.videoId,this._config,this);
            
            this._manifestFileUrl = await this.initParams.getManifestFileUrl(this._manifestUrl, this.manifestFileName,this._config,this);
    
            this.log.debug(`Loading video with identifier '${this.videoId}' from URL '${this.manifestFileUrl}'`);
    
            this._videoManifest = await this.initParams.loadVideoManifest(this.manifestFileUrl,this._config,this);
            this._videoManifest.metadata = this._videoManifest.metadata || {};
            if (!this._videoManifest.metadata.preview && (this.defaultVideoPreview !== "" || this.defaultVideoPreviewPortrait !== "")) {
                this._videoManifest.metadata.preview = this.defaultVideoPreview;
                this._videoManifest.metadata.previewPortrait = this.defaultVideoPreviewPortrait;
                this.log.warn("Paella.loadUrl(): no preview image specified. Using default preview image.");
            }

            this._manifestParser = new ManifestParser(this.videoManifest, this);
    
            // Load custom icons from skin
            unloadSkinStyleSheets.apply(this.skin);
            await loadSkinIcons.apply(this.skin);

            // Load custom style sheets
            await loadSkinStyleSheets.apply(this.skin);

            await postLoadPlayer.apply(this);
        }
        catch (err) {
            this._playerState = PlayerState.ERROR;
            this.log.error(err);
            this._errorContainer = new ErrorContainer(this, this.translate(err.message));
            throw err;
        }
    }

    /**
     * Load the player interface.
     */
    async loadPlayer() {
        try {
            this._captionsCanvas = new CaptionCanvas(this, this._containerElement);

            if (this._playerState !== PlayerState.MANIFEST) {
                throw new Error(this.translate("loadPlayer(): Invalid current player state: $1", [PlayerStateNames[this._playerState]]));
            }
    
            this._playerState = PlayerState.LOADING_PLAYER;
    
            this._previewContainer?.removeFromParent();
    
            this._loader = new this.initParams.Loader(this);
            await this._loader.create();
    
            await this.videoContainer.load(this.videoManifest?.streams);
    
            triggerEvent(this, Events.STREAM_LOADED);
            
            this._playbackBar = new PlaybackBar(this, this.containerElement);
            
            await this._playbackBar.load();
            
            // UI hide timer
            this._hideUiTime = this.config.ui?.hideUITimer ?? 5000;
            setupAutoHideUiTimer(this);
            
            this._captionsCanvas.load();
    
            this._playerState = PlayerState.LOADED;
    
            // Reload the video layout once the playback bar is loaded
            await this.videoContainer.updateLayout();

            triggerEvent(this, Events.PLAYER_LOADED);
    
            const hideTimeLine = !(this.videoManifest.metadata.visibleTimeLine ?? true);
            if (hideTimeLine) {
                this.playbackBar.progressIndicator.hideTimeLine();
            }
            
            if (!this._loader.debug) {
                this._loader.removeFromParent();
                this._loader = null;
            }
                
        }
        catch (err) {
            this._playerState = PlayerState.ERROR;
            if (this._loader) {
                this._loader.removeFromParent();
                this._loader = null;
            }
            this._errorContainer = new ErrorContainer(this, err.message);
            throw err;
        }
    }

    /**
     * Load the player (manifest and interface).
     */
    async load() {
        switch (this.state) {
        case PlayerState.UNLOADED:
            await this.loadManifest();
            await this.loadPlayer();
            break;
        case PlayerState.MANIFEST:
            await this.loadPlayer();
            break;
        case PlayerState.LOADED:
            break;
        default:
            throw new Error(this.translate("Could not load player: state transition in progress: $1", [PlayerStateNames[this.state]]));
        }
    }

    /**
     * Unload the player.
     */
    async unload() {
        switch (this.state) {
        case PlayerState.UNLOADED:
            break;
        case PlayerState.MANIFEST:
            await this.unloadManifest();
            break;
        case PlayerState.LOADED:
        case PlayerState.ERROR:
            await this.unloadPlayer();
            await this.unloadManifest();
            break;
        default:
            throw new Error(this.translate("Could not unload player: state transition in progress: $1", [PlayerStateNames[this.state]]));
        }
    }

    /**
     * Unloads and then completely removes this Paella instance. Reverts all
     * effects of the constructor. This method is useful for SPAs where
     * the instance should be completely removed on navigation.
     */
    async destroy() {
        await this.unload();

        window.removeEventListener("resize", this._resizeEventListener);

        setTranslateFunction(defaultTranslateFunction);
        setSetLanguageFunction(defaultSetLanguageFunction);
        setGetLanguageFunction(defaultGetLanguageFunction);
        setAddDictionaryFunction(defaultAddDictionaryFunction);
        setGetDictionariesFunction(defaultGetDictionariesFunction);
        setGetDefaultLanguageFunction(defaultGetDefaultLanguageFunction);

        if (window.__paella_instances__ && typeof(window.__paella_instances___) === "array") {
            const index = window.__paella_instances__.indexOf(this);
            if (index > -1) {
                window.__paella_instances__.splice(index, 1);
            }
        }
    }
    
    /**
     * Unloads the video manifest and all its resources.
     * @returns {Promise<void>}
     */
    async unloadManifest() {
        if (this._playerState !== PlayerState.MANIFEST && this._playerState !== PlayerState.ERROR) {
            throw new Error(this.translate("unloadManifest(): Invalid current player state: $1", [PlayerStateNames[this._playerState]]));
        }
        if (this._errorContainer) {
            this._errorContainer.removeFromParent();
            this._errorContainer = null;
        }
        this._playerState = PlayerState.UNLOADING_MANIFEST;
        
        this.log.debug("Unloading paella player");
        
        // EventLogPlugin plugins are loaded first, so that all lifecycle events can be captured.
        await unloadLogEventPlugins(this);
        
        await unregisterPlugins(this);
        
        this._manifestLoaded = false;
        this._previewContainer?.removeFromParent();
        this._preferences = null;
        this._playerState = PlayerState.UNLOADED;

        // Unload skin style sheets
        unloadSkinStyleSheets.apply(this.skin);
    }

    /**
     * Unload the player interface.
     * @returns {Promise<void>}
     */
    async unloadPlayer() {
        if (this._playerState !== PlayerState.LOADED && this._playerState !== PlayerState.ERROR) {
            throw new Error(this.translate("unloadManifest(): Invalid current player state: $1", [PlayerStateNames[this._playerState]]));
        }
        if (this._errorContainer) {
            this._errorContainer.removeFromParent();
            this._errorContainer = null;
        }
        this._playerState = PlayerState.UNLOADING_PLAYER;
        
        await this._videoContainer?.unload();
        this._videoContainer = null;
        
        await this._playbackBar?.unload();
        this._playbackBar = null;
        
        this._captionsCanvas?.unload();
        this._captionsCanvas = null;
        
        clearAutoHideTimer(this);
        
        triggerEvent(this, Events.PLAYER_UNLOADED);
        
        if (this.videoManifest?.metadata?.preview) {
            buildPreview.apply(this);
        }
        
        unregisterEvents(this);
        this._playerState = PlayerState.MANIFEST;
    }

    /**
     * Reload the player.
     * @param {Function} [onUnloadFn=null] - Function to call after unloading.
     * @returns {Promise<void>}
     */
    async reload(onUnloadFn = null) {
        switch (this.state) {
        case PlayerState.UNLOADED:
            break;
        case PlayerState.MANIFEST:
            await this.unloadManifest();
            break;
        case PlayerState.LOADED:
            await this.unload();
            break;
        }
        
        if (typeof(onUnloadFn) === "function") {
            await onUnloadFn();
        }
        await this.load();
    }

    async resize() {
        this.videoContainer?.updateLayout();
        this.playbackBar?.onResize();

        if (this.videoContainer) {    
            const getSize = () => {
                return {
                    w: this.videoContainer.element.offsetWidth,
                    h: this.videoContainer.element.offsetHeight
                }
            };
            triggerEvent(this, Events.RESIZE, { size: getSize() });

            if (this._resizeEndTimer) {
                clearTimeout(this._resizeEndTimer);
            }

            this._resizeEndTimer = setTimeout(() => {
                triggerEvent(this, Events.RESIZE_END, { size: getSize() });
            }, 1000);
        }
    }
    
    /**
     * Hide the user interface.
     * @returns {Promise<void>}
     */
    async hideUserInterface() {
        if (!(await this.videoContainer?.paused())) {
            this._uiHidden = true;
            this.videoContainer?.hideUserInterface();
            this.playbackBar?.hideUserInterface();
            triggerEvent(this, Events.HIDE_UI);
        }
    }
    
    /**
     * Show the user interface.
     * @returns {Promise<void>}
     */
    async showUserInterface() {
        this.videoContainer?.showUserInterface();
        this.playbackBar?.showUserInterface();
        this._uiHidden && triggerEvent(this, Events.SHOW_UI);
        this._uiHidden = false;
    }

    /**
     * Play the video.
     * @returns {Promise<void>}
     */
    async play() {
        if (!this.videoContainer.ready) {
            await this.loadPlayer();
        }

        return await this.videoContainer.play();
    }

    /**
     * Pause the video.
     * @returns {Promise<void>}
     */
    async pause() {
        return await this.videoContainer?.pause();
    }

    /**
     * Toggle between play and pause.
     * @returns {Promise<void>}
     */
    async togglePlay() {
        if (!this.videoContainer.ready) {
            return await this.play();
        }

        if (await this.paused()) {
            return await this.play();
        }
        else {
            return await this.pause();
        }
    }

    /**
     * Check if the video is paused.
     * @returns {Promise<boolean>}
     */
    async paused() {
        if (!this.videoContainer) {
            return true;
        }
        else {
            return this.videoContainer.paused();
        }
    }

    /**
     * Stop the video.
     * @returns {Promise<void>}
     */
    async stop() {
        return await this.videoContainer?.stop();
    }

    /**
     * Set the current playback time.
     * @param {number} t - The time in seconds.
     * @returns {Promise<void>}
     */
    async setCurrentTime(t) {
        return await this.videoContainer?.setCurrentTime(t);
    }

    /**
     * Get the current playback time.
     * @returns {Promise<number>}
     */
    async currentTime() {
        return this.videoContainer?.currentTime();
    }

    /**
     * Get the current volume.
     * @returns {Promise<number>}
     */
    async volume() {
        return this.videoContainer?.volume();
    }

    /**
     * Set the volume.
     * @param {number} v - The volume level (0-1).
     * @returns {Promise<void>}
     */
    async setVolume(v) {
        return this.videoContainer?.setVolume(v);
    }

    /**
     * Get the video duration.
     * @returns {Promise<number>}
     */
    async duration() {
        return this.videoContainer?.duration();
    }

    /**
     * Get the playback rate.
     * @returns {Promise<number>}
     */
    async playbackRate() {
        return this.videoContainer?.playbackRate();
    }

    /**
     * Set the playback rate.
     * @param {number} r - The playback rate.
     * @returns {Promise<void>}
     */
    async setPlaybackRate(r) {
        return this.videoContainer?.setPlaybackRate(r);
    }
    
    /**
     * Skip forward by a number of seconds.
     * @param {number} s - The number of seconds to skip.
     * @returns {Promise<void>}
     */
    async skipSeconds(s) {
        const currentTime = await this.currentTime();
        return await this.setCurrentTime(currentTime + s);
    }

    /**
     * Rewind by a number of seconds.
     * @param {number} s - The number of seconds to rewind.
     * @returns {Promise<void>}
     */
    async rewindSeconds(s) {
        const currentTime = await this.currentTime();
        return await this.setCurrentTime(currentTime - s);
    }

    /**
     * Check if fullscreen is supported.
     * @returns {boolean}
     */
    isFullScreenSupported() {
        return this.containerElement.requestFullscreen ||
            this.containerElement.webkitRequestFullScreen;
    }
    
    /**
     * Enter fullscreen mode.
     * @returns {Promise<void>}
     */
    async enterFullscreen() {
        let result = null;
        if (this.containerElement.requestFullscreen) {
            result = this.containerElement.requestFullscreen();
        }
        else if (this.containerElement.webkitRequestFullScreen) {
            this.log.debug("Safari enter fullscreen");
            result = this.containerElement.webkitRequestFullScreen();
        }
        setTimeout(() => this.resize(), 500);
        return result;
    } 

    /**
     * Exit fullscreen mode.
     * @returns {Promise<void>}
     */
    async exitFullscreen() {
        if (document.exitFullscreen && this.isFullscreen) {
            return document.exitFullscreen();
        }
        else if (document.webkitCancelFullScreen && this.isFullscreen) {
            this.log.debug("Safari exit fullscreen");
            return document.webkitCancelFullScreen();
        }
    }
    
    /**
     * Check if the player is in fullscreen mode.
     * @returns {boolean}
     */
    get isFullscreen() {
        return  document.fullscreenElement === this.containerElement ||
                document.webkitFullscreenElement === this.containerElement;
    }

    /**
     * Add a custom plugin icon.
     * @param {string} pluginName - The plugin unique identifier, for example `es.upv.paella.playPauseButton`.
     * @param {string} iconName - The icon name in the plugin.
     * @param {string} svgData - The SVG data for the icon.
     */
    addCustomPluginIcon(pluginName, iconName, svgData) {
        this._customPluginIcons[`${pluginName}-${iconName}`] = svgData;
    }

    /**
     *  Remove a custom plugin icon.
     * @param {string} pluginName - The plugin unique identifier, for example `es.upv.paella.playPauseButton`.
     * @param {string} iconName - The icon name in the plugin.
     */
    removeCustomPluginIcon(pluginName, iconName) {
        this._customPluginIcons[`${pluginName}-${iconName}`] = null;
    }

    /**
     * Get a custom plugin icon.
     * @param {string} pluginName - The plugin name.
     * @param {string} iconName - The icon name.
     * @returns {string|null} - The SVG data for the icon, or null if not found.
     */
    getCustomPluginIcon(pluginName, iconName) {
        this._requestedCustomIcons = this._requestedCustomIcons || [];
        if (!this._requestedCustomIcons.find(item => item.pluginName === pluginName && item.iconName === iconName)) {
            this._requestedCustomIcons.push({
                pluginName,
                iconName
            });
        }
        return this._customPluginIcons[`${pluginName}-${iconName}`];
    }

    /**
     * Get the list of requested custom icons.
     * @type {Array}
     */
    get requestedCustomIcons() {
        return this._requestedCustomIcons || [];
    }
}
