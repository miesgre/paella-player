declare module "@asicupv/paella-core" {

    export type PluginConfig = {
        enabled?: boolean;
        order?: number;
        description?: string;
    };
    


    export class PlayerResource {
        constructor(player: Paella);
        get player(): Paella;
    }
    
    export class Plugin<C extends PluginConfig = PluginConfig> extends PlayerResource {
        constructor(player: Paella, name?: string);
        getPluginModuleInstance(): PluginModule;
        get config(): C;
        get type(): string;
        get order(): number | null;
        get description(): string;
        get name(): string;

        isEnabled(): Promise<boolean>;
        load(): Promise<void>;
        unload(): Promise<void>;
    }

    export type PluginHelpData = {
        title: string;
        description?: string;
    };

    export type Language =
        "aa" | "ab" | "ae" | "af" | "ak" | "am" | "an" | "ar" | "as" | "av" | "ay" | "az" | "ba" | "be" | "bg" | "bh" | "bi" | "bm" | "bn" | "bo" | "br" | "bs" | "ca" | "ce" | "ch" | "co" | "cr" | "cs" | "cu" | "cv" | "cy" | "da" | "de" | "dv" | "dz" | "ee" | "el" | "en" | "eo" | "es" | "et" | "eu" | "fa" | "ff" | "fi" | "fj" | "fo" | "fr" | "fy" | "ga" | "gd" | "gl" | "gn" | "gu" | "gv" | "ha" | "he" | "hi" | "ho" | "hr" | "ht" | "hu" | "hy" | "hz" | "ia" | "id" | "ie" | "ig" | "ii" | "ik" | "io" | "is" | "it" | "iu" | "ja" | "jv" | "ka" | "kg" | "ki" | "kj" | "kk" | "kl" | "km" | "kn" | "ko" | "kr" | "ks" | "ku" | "kv" | "kw" | "ky" | "la" | "lb" | "lg" | "li" | "ln" | "lo" | "lt" | "lu" | "lv" | "mg" | "mh" | "mi" | "mk" | "ml" | "mn" | "mr" | "ms" | "mt" | "my" | "na" | "nb" | "nd" | "ne" | "ng" | "nl" | "nn" | "no" | "nr" | "nv" | "ny" | "oc" | "oj" | "om" | "or" | "os" | "pa" | "pi" | "pl" | "ps" | "pt" | "qu" | "rm" | "rn" | "ro" | "ru" | "rw" | "sa" | "sc" | "sd" | "se" | "sg" | "si" | "sk" | "sl" | "sm" | "sn" | "so" | "sq" | "sr" | "ss" | "st" | "su" | "sv" | "sw" | "ta" | "te" | "tg" | "th" | "ti" | "tk" | "tl" | "tn" | "to" | "tr" | "ts" | "tt" | "tw" | "ty" | "ug" | "uk" | "ur" | "uz" | "ve" | "vi" | "vo" | "wa" | "wo" | "xh" | "yi" | "yo" | "za" | "zh" | "zu";

    export type Dictionary = Record<string, string>;
    export type Dictionaries = Partial<Record<Language, Dictionary>>;

    export class UserInterfacePlugin<C extends PluginConfig = PluginConfig> extends Plugin<C> {
        getHelp(): Promise<PluginHelpData | null>;
        getTranslatedHelp(): Promise<PluginHelpData | null>;
        getDictionaries(): Promise<Dictionaries>;
    }

    export type VideoLayoutConfig = PluginConfig & {
        tabIndexStart?: number;
        validContent?: string[];
    }

    export class VideoLayout<C extends VideoLayoutConfig = VideoLayoutConfig> extends UserInterfacePlugin<C> {

        get type(): string;
        get layoutType(): string;
        get tabIndexStart(): number;
        get identifier(): string;
        get icon(): string;
        // get validContent():;
        get validContentIds(): string[];
        public getValidContentIds(streamData: Stream): string[];
        public getValidStreams(streamData: Stream): Stream[];
        public getLayoutStructure(streamData: Stream[], contentId: string, mainContent: any): VideoLayoutStructure;
        // public getVideoCanvasButtons(content, video, videoCanvas): any[];
    }

    export interface VideoLayoutStructure {
        hidden: boolean;
        videos: Array<{
            content: string;
            visible: boolean;
            size: number;
        }>;
    }


    export type ButtonPluginConfig = PluginConfig & {
        id?: string;
        name?: string;
        ariaLabel?: string;
        tabIndex?: number;
        description?: string;
        minContainerSize?: number;
        parentContainer?: string;
        side?: ButtonPluginSide;
        closePopUps?: boolean;
    }

    export class ButtonPlugin<C extends ButtonPluginConfig = ButtonPluginConfig> extends UserInterfacePlugin<C> {

        get interactive(): boolean;
        get dynamicWidth(): boolean;

        getId(): string | null;
        getButtonName(): string | null;
        getAriaLabel(): string | null;
        getDescription(): string | null;
        getMinContainerSize(): number | null;

        icon: string | null;
        get haveIcon(): boolean;
        menuIcon: string | null;
        get haveMenuIcon(): boolean;

        get titleSize(): "small" | "medium" | "large";

        get side(): ButtonPluginSide;

        get parentContainer(): string | null;

        enable(): void;
        disable(): void;
        hide(): void;
        show(): void;

        readonly hidden: boolean;

        setState({ text, icon,} : { text: string | null, icon: string | null}): void;

        focus(): void;
        blur(): void;
        isFocus(): boolean;

        action(): Promise<void>;
        getAnchorUrl(): Promise<string | null>;
        get isAnchor(): boolean;

        get anchorTarget(): string | null;
        get anchorDownloadFilename(): string | null;
        get anchorReferrerPolicy(): string | null;
    }

    export type CanvasButtonPluginConfig = PluginConfig & {
        content?: string[];
        ariaLabel?: string;
        tabIndex?: number;
        description?: string;
        side?: "left" | "center" | "right";
    }
    export class CanvasButtonPlugin<C extends CanvasButtonPluginConfig = CanvasButtonPluginConfig> extends UserInterfacePlugin<C> {
        get content(): string[];

        get ariaLabel() : string | null;
    
        getAriaLabel() : string | null;
        
        get description(): string;
    
        getDescription() : string;
    
        get icon() : string | null;
    
        set icon(icon);
    
        get side() : "left" | "center" | "right";
    
        get buttonName() : string | null;
    
        get position() : "left" | "center" | "right";
    
        action(content) : Promise<void>;

        get targetContent() : string | null;
    }

    export class Canvas {
    
        loadCanvas(player: Paella) : Promise<void>;
    
        get userArea() : HTMLElement;
    
        get buttonsArea() : HTMLElement;
    
        showButtons();
    
        hideButtons();
    }

    export class CanvasPlugin<C extends PluginConfig = PluginConfig> extends Plugin<C> {
        get canvasType() : string;

        isCompatible(stream: any) : boolean;

        getCanvasInstance(videoContainer: Paella) : Promise<Canvas>;
    }

    export type PopUpButtonPluginConfig = ButtonPluginConfig & {
        closeParentPopUp?: boolean;
        menuTitle?: string;
        moveable?: boolean;
        resizable?: boolean;
        customPopUpClass?: string;
        closeActions?: {
            clickOutside?: boolean;
            closeButton?: boolean;
        };
        popUpType?: "modal" | "timeline";
    }
    export class PopUpButtonPlugin<C extends PopUpButtonPluginConfig = PopUpButtonPluginConfig> extends ButtonPlugin<C> {
        getContent(): Promise<HTMLElement>

        get popUpType(): "modal" | "timeline";
        
        showPopUp(): Promise<void>;
    }

    export type TableInfo = {
      category: string;
        rows: { key: string; value: string }[];
    };
    export type ContentTableInfo = {
        header?: string; // Optional header for the table
        footer?: string; // Optional footer for the table
        table: TableInfo[];
    }
    
    export class TableInfoPopUpPlugin<C extends PopUpButtonPluginConfig = PopUpButtonPluginConfig>  extends PopUpButtonPlugin<C> {
        getContentTableInfo(): Promise<ContentTableInfo | null>;
    }


    type MenuItem<T = any> = {
        id: string | number;
        title: string;
        icon?: string;
        iconText?: string;
        showTitle?: boolean;
        stateText?: string;
        stateIcon?: string;
        selected?: boolean;
        data?: T;
        plugin?: Plugin;
    }

    export type MenuButtonPluginConfig = ButtonPluginConfig & {
        closeOnSelect?: boolean;
    }
    export class MenuButtonPlugin<C extends MenuButtonPluginConfig = MenuButtonPluginConfig> extends PopUpButtonPlugin<C> {
        get menuTitle(): string | null

        getMenu(): Promise<MenuItem[]>

        closeMenu(): void
    }


    export type ButtonGroupPluginConfig = MenuButtonPluginConfig & {
        groupName?: string;
    }

    
    export class ButtonGroupPlugin<C extends ButtonGroupPluginConfig = ButtonGroupPluginConfig> extends MenuButtonPlugin<C> {
        get groupName(): string;

        // Note: This functions returns an empty array if the menu has never been displayed
        get buttons(): HTMLButtonElement[];
        get buttonPlugins() :ButtonPlugin[];

        getButtons(): Promise<HTMLButtonElement[]>;
        getButtonPlugins(): Promise<ButtonPlugin[]>;
        getVisibleButtonPlugins(): Promise<ButtonPlugin[]>;
    }

    export class EventLogPlugin<C extends PluginConfig = PluginConfig> extends Plugin<C> {
        get events(): EventName[]

        onEvent(event: EventName, params: object)
    }

    export type DataPluginConfig = PluginConfig & {
        context?: string | string[];
    }
    export class DataPlugin<C extends PluginConfig = DataPluginConfig, D = unknown> extends Plugin<C> {
        get context(): string | string[]

        read(context: string, key: string): Promise<D>

        write(context: string, key: string, data: D): Promise<void>

        remove(context: string, key: string): Promise<void>
    }

    export class VideoPlugin<C extends PluginConfig = PluginConfig>  extends Plugin<C> {
        get streamType(): string

        isCompatible(streamData: Stream): Promise<boolean>

        getVideoInstance(playerContainer: any, isMainAudio: boolean): Promise<any>

        getCompatibleFileExtensions(): string[]
    }

    export type LogLevel = "DISABLED" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "VERBOSE";

    export type DynamicLayoutAlignment = "align-center" | "align-top" | "align-bottom" | "align-left" | "align-right";

    export type ButtonPluginSide = "left" | "right";

    export interface Config {
        /** Default video ID to be used when one is not specified explicitly */
        fallbackId:                  string;

        /** Default directory with the manifest video repository */
        repositoryUrl:               string;

        /** Default manifest file name */
        manifestFileName:            string;

        /** Default layout to be used when one has not yet been configured. */
        defaultLayout:               string;

        /** Default translation language for text strings, when no translations are available for the current language. */
        defaultLanguage:             string;

        /** Default preview image, which is used when one has not been specified in the video manifest. */
        defaultVideoPreview:         string;

        /** Default preview image for the portrait mode, which is used when one has not been specified in the video manifest. */
        defaultVideoPreviewPortrait: string;

        /** Log level to use */
        logLevel:                    LogLevel;

        /** General user interface settings */
        ui: {
            /** Timeout to hide the interface, from when the user stops interacting with the player. */
            hideUITimer:      number;

            /** Hide the interface when the mouse leaves the video area */
            hideOnMouseLeave: boolean;
        };

        /** Preference storage settings */
        preferences: {
            /** Storage type to use for the preferences. */
            currentSource: string;

            /** Storage types */
            sources:       {

                /** Store settings in cookies */
                cookie?: {
                    /** Consent type used to store the settings (see Cookie Consent settings) */
                    consentType: string;
                },

                /** Store settings using a Data plugin */
                dataPlugin?: {
                    /** Context of the data plugin to use */
                    context: string;
                    name:    string;
                };
            }
        };

        /** Video container settings */
        videoContainer:              {
            /** Place the video container above or below the playback bar. */
            overPlaybackBar:     boolean;

            /** Restore the playback rate setting in the next player load */
            restorePlaybackRate: boolean;

            /** Restore the volume setting in the next player load */
            restoreVolume:       boolean;

            /** Restore the video layout in the next load of the current video */
            restoreVideoLayout: {
                /** Enable or disable this setting */
                enabled: boolean;

                /** If global=false, then the layout is only restored the next load of the current video */
                global:  boolean;
            }

            restoreLastTime: {
                /** Enable or disable this setting */
                enabled:          boolean;

                /** Remaining video time after which the last known instant of playback will not be restored */
                remainingSeconds: number;
            };
            
            /** Alignment of the video canvas in dynamic layout mode */
            dynamicLayout:       {
                landscapeVerticalAlignment:  DynamicLayoutAlignment;
                portraitHorizontalAlignment: DynamicLayoutAlignment;
            }
        };

        /** Button groups */
        buttonGroups: {
            /** Enable or disable the button group */
            enabled:         boolean;

            /** Button group name. This name will be used in the child buttons as `parentContainer` attribute */
            groupName:       string;

            /** Button group description */
            description:     string;

            /** Button group icon */
            icon:            string;

            /** Loading order */
            order:           number;

            /** Button group position */
            side:            ButtonPluginSide;

            /** Parent button group name */
            parentContainer: string;

            /** Title used in the menu title bar */
            menuTitle:       string;
        }[];

        /** Cookie consent options */
        cookieConsent: {
            /** Type of the cookie consent, for example `analytical` */
            type:        string;

            /** Human readable name of the cookie consent, for example 'Analytical Cookies' */
            title:       string;

            /** Description of the cookie consent, for example 'Cookies used to analyze the user behavior' */
            description: string;

            /** Is this cookie group required for the website to work? */
            required:    boolean;

            /** Is enabled by default? */
            value:       boolean;
        }[];

        plugins: Record<string, GenericPluginConfig>;
    }

    export interface Transcription {
        index: number;
        preview: string;
        time: number;
        text: string;
        duration: number;
    }

    export interface Frame {
        id: string;
        time: number,
        mimetype: string,
        url: string,
        thumb: string
    }

    export interface FrameList {
        targetContent: string;
        frames: Frame[];
    }

    export interface Chapter {
        id: string;
        title: string;
        description?: string;
        time: number;
        thumb?: string
    }

    export interface Chapters {
        chapterList: Chapter[]
    }

    export interface Source {
        src: string;
        // Currently unused...
        mimetype: string;
        res?: {
            w: number;
            h: number;
        };
    }

    export interface Stream {
        content: string;
        role?: "mainAudio";
        sources: {
            html?: Source[];
            mp4?: Source[];
            hls?: Source[];
            hlsLive?: Source[];
        };
    }

    export interface CaptionManifestItem {
        id: string,
        format: string;
        url: string;
        lang: string;
        text: string;
    }

    export interface TimelineImages {
        url: string;
        rows: number;
        cols: number;
    }

    export interface Manifest {
        metadata: {
            duration?: number;
            title?: string;
            preview?: string;
            timelineMarks?: "frameList" | "chapters";
            timeline?: TimelineImages
        } & Record<string, unknown>;

        streams: Stream[];

        captions?: CaptionManifestItem[];

        frameList?: FrameList;

        chapters?: Chapters;

        transcriptions?: Transcription[];
    }

    
    export type GenericPluginConfig = PluginConfig & Record<string, any>;
    export type PluginConstructor<C extends PluginConfig = GenericPluginConfig> = new (...args: any[]) => Plugin<C>
    export interface PluginRef<C extends PluginConfig = GenericPluginConfig> {
        plugin: PluginConstructor<C>;
        config: C;
    }
    
    export interface InitParams {
        configResourcesUrl?: string;
        configUrl?: string;
        repositoryUrl?: string;
        manifestFileName?: string;

        loadConfig?: (configUrl: string, player: Paella) => Promise<Config>;
        getVideoId?: (config: Config, player: Paella) => Promise<string | null>;
        getManifestUrl?: (repoUrl: string, videoId: string) => Promise<string>;
        getManifestFileUrl?: (manifestUrl: string, manifestFileName: string) => Promise<string>;
        loadVideoManifest?: (manifestUrl: string, config: Config, player: Paella) => Promise<Manifest>;
        getCookieConsentFunction?: (type: string) => boolean;

        plugins?: (PluginRef | Plugin)[];
    }
    export interface Log {
        setLevel(level: LogLevel | number): void;
        currentLevel(): number;
        error(msg: string, context?: string | null): void;
        warn(msg: string, context?: string | null): void;
        info(msg: string, context?: string | null): void;
        debug(msg: string, context?: string | null): void;
        verbose(msg: string, context?: string | null): void;
    }

    export class PluginModule {
        get moduleName(): string;
        get moduleVersion(): string;
        getDictionaries(): Promise<Dictionaries>;
    }

    export interface Preferences {
        set(key: string, value: any, options?: { global?: boolean }): Promise<void>;
        get(key: string, options?: { global?: boolean }): Promise<any>;
    }

    export const Events: Readonly<{
        PLAY: "paella:play";
        PAUSE: "paella:pause";
        STOP: "paella:stop";
        ENDED: "paella:ended";
        SEEK: "paella:seek";
        FULLSCREEN_CHANGED: "paella:fullscreenchanged";
        ENTER_FULLSCREEN: "paella:enterfullscreen";
        EXIT_FULLSCREEN: "paella:exitfullscreen";
        VOLUME_CHANGED: "paella:volumeChanged";
        TIMEUPDATE: "paella:timeupdate";
        TRIMMING_CHANGED: "paella:trimmingChanged";
        CAPTIONS_CHANGED: "paella:captionsChanged";
        CAPTIONS_ENABLED: "paella:captionsEnabled";
        CAPTIONS_DISABLED: "paella:captionsDisabled";
        BUTTON_PRESS: "paella:buttonPress";
        SHOW_POPUP: "paella:showPopUp";
        HIDE_POPUP: "paella:hidePopUp";
        MANIFEST_LOADED: "paella:manifestLoaded";
        STREAM_LOADED: "paella:streamLoaded";
        PLAYER_LOADED: "paella:playerLoaded";
        PLAYER_UNLOADED: "paella:playerUnloaded";
        RESIZE: "paella:resize";
        RESIZE_END: "paella:resizeEnd";
        LAYOUT_CHANGED: "paella:layoutChanged";
        PLAYBACK_RATE_CHANGED: "paella:playbackRateChanged";
        VIDEO_QUALITY_CHANGED: "paella:videoQualityChanged";
        HIDE_UI: "paella:hideUI";
        SHOW_UI: "paella:showUI";
        COOKIE_CONSENT_CHANGED: "paella:cookieConsentChanged";
        LOG: "paella:log";
    }>;
    type Events = typeof Events;
    type EventName = typeof Events[keyof typeof Events];


    export const PlayerState: Readonly<{    
        UNLOADED: 0;
        LOADING_MANIFEST: 1;
        MANIFEST: 2;
        LOADING_PLAYER: 3;
        LOADED: 4;
        UNLOADING_MANIFEST: 5;
        UNLOADING_PLAYER: 6;
        ERROR: 7;
    }>;    
    type PlayerState = typeof PlayerState;    

    export type PlayerStateNames = [
        "UNLOADED",
        "LOADING_MANIFEST",
        "MANIFEST",
        "LOADING_PLAYER",
        "LOADED",
        "UNLOADING_MANIFEST",
        "UNLOADING_PLAYER",
        "ERROR"
    ]

    type DeepPartial<T> = {
        [P in keyof T]?: T[P] extends object
            ? T[P] extends Function
            ? T[P]
            : DeepPartial<T[P]>
            : T[P];
    };

    export interface SkinThemeIcon {
        plugin: string;
        identifier: string;
        icon: string;
    }

    export interface SkinTheme {
        styleSheets?: string[];
        configOverrides?: DeepPartial<Config>;
        icons?: SkinThemeIcon[];
    }

    export interface Skin {
        loadSkin(skinParam: string | SkinTheme): Promise<void>;
        unloadSkin(): void;
    }

    export interface CookieConsent {
        updateConsentData(): void;
        getConsentForType(type: string): boolean;
    }
    
    export interface Data {
        read<D = unknown>(context: string, key: string): Promise<D>;
        write<D = unknown>(context: string, key: string, data: D): Promise<void>;
        remove(context: string, key: string): Promise<void>;
    }

    export interface StreamPlayer {
        readonly isEnabled: boolean;
        readonly isMainAudioPlayer: boolean;
        readonly isVisible: boolean;
    }

    export interface StreamProperties {
        readonly isMainAudio: boolean;
        readonly player: StreamPlayer;
        readonly stream: Stream;
    }

    export interface AudioTrack {
        readonly groupId: string;
        readonly id: number;
        readonly language: string;
        readonly name: string;
        readonly selected: boolean;
    }

    export interface StreamQuality {
        readonly bitrate: number;
        readonly index: number;
        readonly isAuto: boolean;
        readonly label: string;
        readonly shortLabel: string;
    }

    export interface TrimmingParams {
        enabled?: boolean;
        start?: number;
        end?: number;
    }

    export interface StreamProvider {
        // Properties
        readonly streamData: Stream[];
        readonly streams: Record<string, StreamProperties>;
        readonly players: StreamPlayer[];
        readonly mainAudioPlayer: any;
        readonly isTrimEnabled: boolean;
        readonly trimStart: number;
        readonly trimEnd: number;
        readonly isLiveStream: boolean;
        readonly currentAudioTrack: AudioTrack | null;

        // Basic playback control
        play(): Promise<any>;
        pause(): Promise<any>;
        stop(): Promise<void>;
        paused(): Promise<boolean>;
        setCurrentTime(t: number): Promise<{result: any, prevTime: number, newTime: number}>;
        currentTime(): Promise<number>;
        currentTimeIgnoringTrimming(): Promise<number>;
        volume(): Promise<number>;
        setVolume(v: number): Promise<any>;
        duration(): Promise<number>;
        durationIgnoringTrimming(): Promise<number>;
        playbackRate(): Promise<number>;
        setPlaybackRate(rate: number): Promise<any>;

        // Trimming
        setTrimming(options: TrimmingParams): Promise<void>;

        // Quality control
        getQualityReferencePlayer(): Promise<StreamPlayer>;
        getCurrentQuality(): Promise<StreamQuality>;
        getQualities(): Promise<StreamQuality[]>;
        setQuality(quality: StreamQuality): Promise<void>;

        // Audio tracks
        supportsMultiaudio(): Promise<boolean>;
        getAudioTracks(): Promise<AudioTrack[]>;
        setCurrentAudioTrack(track: AudioTrack): Promise<void>;
    }

    export interface VideoContainer {
        // Properties
        readonly streamProvider: StreamProvider;
        readonly streamData: any[];
        readonly layoutId: string;
        readonly validContentIds: string[];
        readonly validLayouts: any[];
        readonly ready: boolean;
        readonly isTrimEnabled: boolean;
        readonly trimStart: number;
        readonly trimEnd: number;
        readonly layoutButtons: HTMLButtonElement[];
        readonly layoutButtonPlugins: CanvasButtonPlugin[];
        
        // Methods
        setLayout(layoutId: string): Promise<boolean>;
        
        // Video control
        play(): Promise<any>;
        pause(): Promise<any>;
        stop(): Promise<void>;
        paused(): Promise<boolean>;
        setCurrentTime(t: number): Promise<any>;
        currentTime(): Promise<number>;
        volume(): Promise<number>;
        setVolume(v: number): Promise<any>;
        duration(): Promise<number>;
        playbackRate(): Promise<number>;
        setPlaybackRate(r: number): Promise<any>;
        setTrimming(options: TrimmingParams): Promise<any>;
        
        // UI related
        showUserInterface(): void;
        hideUserInterface(): void;
        
        // Layout
        getVideoRect(target?: string | number | null): { x: number, y: number, width: number, height: number, element: HTMLElement } | null;
        appendChild(element: HTMLElement, rect?: { x: number, y: number, width: number, height: number } | null, zIndex?: number): HTMLElement;
        removeChild(element: HTMLElement): void;
    }

    export interface CaptionCue {
        readonly start: number;
        readonly end: number;
        readonly captions: string[];
    }

    export type AddCueParams = {
        label: string
        start: number
        end: number
        captions: string | string[]
    }
    export interface Caption {
        readonly cues: CaptionCue[];
        label: string;
        language: string;

        addCue(params : AddCueParams): void;
        getCue(instant: number): CaptionCue | null;
    }

    export type CaptionSearchOptions = {
        label?: string
        index?: number
        lang?: string
    }
    export interface CaptionsCanvas {
        addCaptions(captions: Caption): void;
        getCaptions(params : CaptionSearchOptions): Caption | null;
        enableCaptions(searchOptions: CaptionSearchOptions): void;
        disableCaptions(): void;

        readonly captions: Caption[];
        readonly currentCaptions: Caption | null;
    }

    export interface PlaybackBar {
        getButtonPlugins(): ButtonPlugin[];
        getVisibleButtonPlugins(): ButtonPlugin[];
    }

    export class Paella {
        public constructor(node: string | HTMLElement, options?: InitParams);

        // Version and status
        readonly version: string;
        readonly ready: boolean;
        readonly state: number;
        readonly stateText: string;
        readonly playerLoaded: boolean;
        readonly configLoaded: boolean;
        readonly videoManifestLoaded: boolean;
        readonly videoLoaded: boolean;
        readonly isFullscreen: boolean;

        // Key components and managers
        readonly log: Log;
        readonly pluginModules: PluginModule[];
        readonly preferences: Preferences;
        readonly skin: Skin;
        readonly Events: Events;
        readonly PlayerState: PlayerState;
        readonly PlayerStateNames: PlayerStateNames;
        readonly cookieConsent: CookieConsent;
        readonly data: Data;

        // Container and UI related
        readonly containerSize: { w: number, h: number };
        readonly containsFocus: boolean;
        readonly hideUiTime: number;

        readonly videoContainer: VideoContainer;
        readonly captionsCanvas: CaptionsCanvas;
        readonly playbackBar: PlaybackBar;

        // Configuration related
        readonly initParams: InitParams;
        readonly config: Config;
        readonly configUrl: string;
        readonly configResourcesUrl: string;

        // Video and manifest related
        readonly videoId: string;
        readonly manifestUrl: string;
        readonly manifestFileName: string;
        readonly manifestFileUrl: string;
        readonly videoManifest: Manifest;
        readonly repositoryUrl: string;
        readonly defaultVideoPreview: string;
        readonly defaultVideoPreviewPortrait: string;

        // Manifest data getters
        readonly metadata: Record<string, any>;
        readonly streams: Stream[];
        readonly frameList: FrameList;
        readonly chapters: Chapters;
        readonly captions: Caption[];
        getTimelineFrame(): Promise<string | null>;
        getTimelineFrameAtTime(time: number): Promise<string | null>;

        readonly trimming: { start?: number, end?: number, enabled?: boolean };
        readonly visibleTimeLine: boolean;

        // Methods
        translate(word: string, keys?: Record<string, any> | null): string;
        setLanguage(lang: string): void;
        getLanguage(): string;
        addDictionary(lang: string, dict: Dictionary): void;
        getDictionaries(): Dictionaries;
        getDefaultLanguage(): string;

        bindEvent(eventName: string, fn: (eventParams: Record<string, any>) => void, unregisterOnUnload?: boolean): void;
        getPlugin(name: string, type?: string | null): Plugin | null;
        waitState(state: string | number): Promise<void>;
        
        // Player control methods
        loadUrl(url: string | string[], options?: { title?: string, duration?: number, preview?: string, previewPortrait?: string }): Promise<void>;
        loadManifest(): Promise<void>;
        loadPlayer(): Promise<void>;
        load(): Promise<void>;
        unload(): Promise<void>;
        destroy(): Promise<void>;
        unloadManifest(): Promise<void>;
        unloadPlayer(): Promise<void>;
        reload(onUnloadFn?: Function | null): Promise<void>;
        resize(): Promise<void>;
        hideUserInterface(): Promise<void>;
        showUserInterface(): Promise<void>;
        
        // Playback control methods
        play(): Promise<void>;
        pause(): Promise<void>;
        togglePlay(): Promise<void>;
        paused(): Promise<boolean>;
        stop(): Promise<void>;
        setCurrentTime(t: number): Promise<void>;
        currentTime(): Promise<number>;
        volume(): Promise<number>;
        setVolume(v: number): Promise<void>;
        duration(): Promise<number>;
        playbackRate(): Promise<number>;
        setPlaybackRate(r: number): Promise<void>;
        skipSeconds(s: number): Promise<void>;
        rewindSeconds(s: number): Promise<void>;
        
        // Fullscreen methods
        isFullScreenSupported(): boolean;
        enterFullscreen(): Promise<void>;
        exitFullscreen(): Promise<void>;
        
        // Custom plugin icons
        addCustomPluginIcon(pluginName: string, iconName: string, svgData: string): void;
        removeCustomPluginIcon(pluginName: string, iconName: string): void;
        getCustomPluginIcon(pluginName: string, iconName: string): string | null;
    }


    export function createElementWithHtmlText(htmlText:string , parent?: HTMLElement ): HTMLElement;

    export function isVolumeApiAvailable() : Promise<boolean>;
}
