
import Paella, { PlayerStateNames } from './Paella';
import PlayerState from './core/PlayerState';
import PopUp from './core/PopUp';
import * as utils from './core/utils';
import {
    defaultLoadConfigFunction,
    defaultGetVideoIdFunction,
    defaultGetManifestUrlFunction,
    defaultGetManifestFileUrlFunction,
    defaultLoadVideoManifestFunction
} from './core/initFunctions';
import {
    defaultGetCookieConsentCallback,
    defaultGetCookieDescriptionCallback
} from './core/CookieConsent';

import Plugin from './core/Plugin';
import { importPlugins, getPluginsOfType, loadPluginsOfType } from './core/plugin_tools';
import UserInterfacePlugin from './core/UserInterfacePlugin';
import ButtonPlugin, { getNextTabIndex, getCurrentTabIndex } from './core/ButtonPlugin';
import PopUpButtonPlugin from './core/PopUpButtonPlugin';
import MenuButtonPlugin from './core/MenuButtonPlugin';
import VideoLayout from './core/VideoLayout';
import VideoPlugin, { Video, isVolumeApiAvailable } from './core/VideoPlugin';
import ProgressIndicatorPlugin from './core/ProgressIndicatorPlugin';
import Events, { bindEvent, triggerEvent, triggerIfReady } from './core/Events';
import PlayerResource from './core/PlayerResource';
import CanvasPlugin, { CanvasButtonPosition, Canvas } from './core/CanvasPlugin';
import Data, { DataPlugin } from './core/Data';
import VideoQualityItem from './core/VideoQualityItem';
import AudioTrackData from './core/AudioTrackData';
import EventLogPlugin from './core/EventLogPlugin';
import ButtonGroupPlugin from './core/ButtonGroupPlugin';
import PluginModule from './core/PluginModule';
import { checkManifestIntegrity } from './core/StreamProvider';
import Loader from './core/Loader';

import { DomClass, createElementWithHtmlText, createElement } from './core/dom';

import WebVTTParser, { parseWebVTT } from './captions/WebVTTParser';
import DFXPParser, { parseDFXP } from './captions/DFXPParser';
import CaptionsPlugin from './captions/CaptionsPlugin';
import Captions from './captions/Captions';

import KeyShortcutPlugin, { KeyCodes, getShortcuts } from './core/KeyShortcutPlugin';

import { VideoContainerMessagePosition } from './core/VideoContainerMessage';

import ManifestParser from './core/ManifestParser';

import {
    defaultTranslateFunction,
    defaultSetLanguageFunction,
    defaultGetLanguageFunction,
    defaultAddDictionaryFunction,
    defaultGetDictionariesFunction,
    defaultGetDefaultLanguageFunction,
    translate,
    setLanguage,
    getLanguage,
    addDictionary,
    getDictionaries,
    getDefaultLanguage
} from "./core/Localization";

import Log, {
    log,
    LOG_LEVEL
} from "./core/Log";

/******* Export the built-in plugin classes *******/
// video formats
import HlsVideoFormatPlugin, { HlsVideo, getHlsSupport, defaultHlsConfig, HlsSupport } from './videoFormats/es.upv.paella.hlsVideoFormat';
import Mp4VideoFormatPlugin, { Mp4Video } from './videoFormats/es.upv.paella.mp4VideoFormat';
import ImageVideoFormatPlugin, { ImageVideo } from './videoFormats/es.upv.paella.imageVideoFormat';
import AudioVideoPlugin, { AudioOnlyVideo } from './videoFormats/es.upv.paella.audioVideoFormat';

// Buttons
import PlayPauseButtonPlugin from './plugins/es.upv.paella.playPauseButton';

// Shortcuts
import DefaultKeyShortcutsPlugin from './plugins/es.upv.paella.defaultShortcuts';

// Video layouts
import SingleVideoLayoutPlugin from './layouts/es.upv.paella.singleVideo';
import DualVideoLayoutPlugin from './layouts/es.upv.paella.dualVideo';
import DualVideoDynamicLayoutPlugin from './layouts/es.upv.paella.dualVideoDynamic';
import TripleVideoLayoutPlugin from './layouts/es.upv.paella.tripleVideo';

// Captions
import VttManifestCaptionsPlugin from './plugins/es.upv.paella.vttManifestCaptionsPlugin';
import DfxpManifestCaptionsPlugin from './plugins/es.upv.paella.dfxpManifestCaptionsPlugin';


// Video canvas
import VideoCanvasPlugin, { VideoCanvas } from './canvas/es.upv.paella.videoCanvas';

// Canvas button
import CanvasButtonPlugin from './core/CanvasButtonPlugin';

export {
    Paella,
    PlayerState,
    PlayerStateNames,
    PopUp,
    utils,
    defaultLoadConfigFunction,
    defaultGetVideoIdFunction,
    defaultGetManifestUrlFunction,
    defaultGetManifestFileUrlFunction,
    defaultLoadVideoManifestFunction,
    defaultGetCookieConsentCallback,
    defaultGetCookieDescriptionCallback,
    PlayerResource,
    Loader,
    
    Plugin,
    PluginModule,
    importPlugins,
    getPluginsOfType,
    loadPluginsOfType,
    UserInterfacePlugin,
    ButtonPlugin,
    PopUpButtonPlugin,
    MenuButtonPlugin,
    VideoLayout,
    VideoPlugin,
    ProgressIndicatorPlugin,
    Video,
    Canvas,
    CanvasButtonPosition,
    CanvasPlugin,
    VideoQualityItem,
    AudioTrackData,
    EventLogPlugin,
    ButtonGroupPlugin,
    isVolumeApiAvailable,

    ManifestParser,

    getNextTabIndex,
    getCurrentTabIndex,

    checkManifestIntegrity,
    
    Events,
    bindEvent,
    triggerEvent,
    triggerIfReady,

    DomClass,
    createElement,
    createElementWithHtmlText,

    WebVTTParser,
    parseWebVTT,
    DFXPParser,
    parseDFXP,
    CaptionsPlugin,
    Captions,

    Data,
    DataPlugin,

    HlsVideo,
    getHlsSupport,
    defaultHlsConfig,
    HlsSupport,
    Mp4Video,
    ImageVideo,
    AudioOnlyVideo,

    HlsVideoFormatPlugin,
    Mp4VideoFormatPlugin,
    ImageVideoFormatPlugin,
    AudioVideoPlugin,

    KeyShortcutPlugin,
    KeyCodes,
    getShortcuts,

    defaultTranslateFunction,
    defaultSetLanguageFunction,
    defaultGetLanguageFunction,
    defaultAddDictionaryFunction,
    defaultGetDictionariesFunction,
    defaultGetDefaultLanguageFunction,
    translate,
    setLanguage,
    getLanguage,
    addDictionary,
    getDictionaries,
    getDefaultLanguage,

    Log,
    log,
    LOG_LEVEL,

    DefaultKeyShortcutsPlugin,

    PlayPauseButtonPlugin,

    VttManifestCaptionsPlugin,
    DfxpManifestCaptionsPlugin,

    SingleVideoLayoutPlugin,
    DualVideoLayoutPlugin,
    DualVideoDynamicLayoutPlugin,
    TripleVideoLayoutPlugin,

    VideoCanvasPlugin,
    VideoCanvas,

    CanvasButtonPlugin,

    VideoContainerMessagePosition
}

