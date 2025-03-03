# Add plugins

The main `paella-core` library contains only the most basic plugins to make the player work. To have a complete player, we need to complement it with the use of other plugins. In this example we are going to add a plugin library to add the most typical player buttons.

The first thing we do is install the paella-basic-plugins plugin library from npm:

```sh
$ npm install @asicupv/paella-basic-plugins
```

## Plugin system

The plugins included in `paella-core` are imported automatically, for this reason, to use them we only had to add the configuration of each plugin. This is for two reasons: On the one hand, the automatically imported `paella-core` plugins are disabled by default, and to enable them you have to indicate it in the configuration. On the other hand, some plugins need a certain minimum configuration to work, such as video layout plugins.

However, `paella-core` includes an explicit plugin import system. With this system we can import the plugins we want to use, and in this case they will be activated by default. The explicit plugin import system has higher priority than the automatic import system: if a plugin is imported explicitly, then the automatic import system will not be used to import that plugin. Therefore, we can import `paella-core` plugins explicitly so that it is not necessary to include them in the configuration. To see this at work, let's remove the part of the code where we activate the play/pause button plugin. We will also remove from the configuration file the reference to the playPauseButton configuration:

**main.js:**

```js
...
    loadConfig: async (configUrl, player) => {
        const config = await defaultLoadConfigFunction(configUrl, player);
        utils.mergeObjects(config, {
        //    plugins: {
        //        "es.upv.paella.playPauseButton": {
        //            "enabled": true
        //        }
        //    }
        })
        return config;
    },
    ...
```

After that you will see that the play button has disappeared from the playback bar. If you still see the play/pause plugin, make sure it is not activated in the configuration file.

To include the play button again, we are going to import the plugin explicitly using the plugins attribute of the initParams object:

**main.js:**

```js
import { 
    ...
    PlayPauseButtonPlugin
} from '@asicupv/paella-core';

const initParams = {
    ...
    plugins: [
        PlayPauseButtonPlugin
    ]
};
...
```

When you add the `PlayPauseButtonPlugin` plugin explicitly, the play button appears again, even if you have not added it in the configuration. Note that not all `paella-core` plugins are automatically activated when you explicitly import them. For example, video format plugins or video canvas plugins are not automatically activated because they may interfere with other plugins we may import.

The list of plugins you can import from paella-core is at [this link](../reference/paella-core/plugins.md).

In addition to importing plugins, you can also include a default configuration. This is useful if you want your player to include certain initial configuration parameters so that they do not have to appear in the configuration file. To do this, instead of including the plugin directly, you can use an object that includes the plugin and also its configuration:

**main.js:**

```js
...
const initParams = {
    ...
    plugins: [
        {
            plugin: PlayPauseButtonPlugin,
            config: {
                enabled: true
            }
        }
    ]
};
...
```

## Import plugins from libraries

To import external plugins, we will use the library documentation as a reference to know which classes correspond to each plugin. From here you just have to add the plugins to the plugins array of initParams.:

**main.js**

```js
...
import {
    FullscreenButtonPlugin,
    VolumeButtonPlugin
} from '@asicupv/paella-basic-plugins';
...
const initParams = {
    ...
    plugins: [
        PlayPauseButtonPlugin,
        FullscreenButtonPlugin,
        VolumeButtonPlugin
    ]
};
...
```

Normally you can also import all plugins from a library. To do this, the library must include an array with all plugins. All plugins libraries of the Universidad Politécnica de Valencia include this array, which is also defined in the documentation:

**main.js**

```js
...
import {
    basicPlugins
} from '@asicupv/paella-basic-plugins';
...
const initParams = {
    ...
    plugins: [
        PlayPauseButtonPlugin,
        ...basicPlugins
    ]
};
...
```

When importing all plugins from a library, in this case using the `basicPlugins` array, they are not activated by default, so you will have to activate them in the configuration file. We are going to activate two plugins: volume and fullscreen, in addition to the plugin we had activated before play/pause.

**public/settings/settings.json:**

```json
{
    "plugins": {
        ...
         "es.upv.paella.playPauseButton": {
            "enabled": true,
            "order": 0
        },

        "es.upv.paella.volumeButtonPlugin": {
            "enabled": true,
            "side": "left",
            "order": 1
        },

        "es.upv.paella.fullscreenButton": {
            "enabled": true,
            "side": "right",
            "order": 3
        }
    }
}
```

We have added the play/pause button plugin to specify the `order` attribute. Actually, the value we have assigned to it is the default value, but it is good practice to include all button plugins in the same file (in this case, in the configuration) to be able to control more easily the order in which they appear. Since we have included this button in the configuration, we no longer need to import it explicitly in the `main.js` file, so the code file would look like this:

**main.js**

```js
import { 
    Paella,
    defaultLoadConfigFunction
} from '@asicupv/paella-core';
import {
    basicPlugins
} from '@asicupv/paella-basic-plugins';

import '@asicupv/paella-core/paella-core.css';
import '@asicupv/paella-basic-plugins/paella-basic-plugins.css';

const initParams = {
    // Initialization parameters
    configResourcesUrl: 'settings/',
    configUrl: 'settings/settings.json',
    defaultVideoPreview: "/settings/default_preview_landscape.jpg",
    loadConfig: async (configUrl, player) => {
        const config = await defaultLoadConfigFunction(configUrl, player);
        return config;
    },

    plugins: [
        ...basicPlugins
    ]
};
const player = new Paella('playerContainer', initParams);

await player.loadManifest();
```


In the configuration file we see one new attribute in the plugins configuration: `side`.

For button type plugins, `side` indicates on which side the button will be displayed, which can be on the left or on the right.

As for the `order` attribute, we have already seen it in previous chapters. This attribute indicates the order in which the plugins will be loaded, and in the case of button plugins, it influences the position in which they will be placed. Buttons will be placed from left to right depending on their order. If two buttons are configured on different sides (left or right) they can share the same order number, because this attribute will only influence the position with respect to the other buttons on the same side of the toolbar.

Taking all this into account, the configuration file for the button plugins would look like this:

**public/settings/settings.json**

```json
{
    "plugins": {
        ...
        "es.upv.paella.playPauseButton": {
            "enabled": true,
            "side": "left",
            "order": 0
        },
        
        "es.upv.paella.volumeButtonPlugin": {
            "enabled": true,
            "side": "left",
            "order": 1
        },

        "es.upv.paella.currentTimeLabel": {
            "enabled": true,
            "side": "left",
            "showTotalTime": true,
            "order": 2
        },

        "es.upv.paella.layoutSelector": {
            "enabled": true,
            "side": "right",
            "order": 2,
            "showIcons": false
        },

        "es.upv.paella.fullscreenButton": {
            "enabled": true,
            "side": "right",
            "order": 3
        }
    }
}
```

## Video layout selector

The video layout selector plugin allows you to switch between the available video layouts. In the two streams tutorial we left one attribute to be configured in the layouts: the icon for a specific contentId. This icon will be used by the video layout selector, and we have to configure it before we can use it. The goal is to add an icon to each contentId. In addition to the icon, we already have an identifying text for each contentId, if we don't want to use the icons we can just use the showIcons: false attribute:

**public/settings/settings.json**

```json
{
    "plugins": {
        ...
        "es.upv.paella.layoutSelector": {
            "enabled": true,
            "side": "right",
            "order": 2,
            "showIcons": false
        },
    }
}
```

To use the icons in the video layout selectors, the images must be provided. They will be placed in the same directory as the configuration. The image paths will be loaded based on that directory. Create four files in the settings directory with the following names:

**public/settings/presenter-presentation.svg:**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="0 0 74 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <path d="M36,34L0,34L0,0L36,0L36,34ZM74,34L38,34L38,0L74,0L74,34ZM20,22L24.998,30.289C25.21,30.807 25.325,31.582 24.923,31.74C24.361,31.961 23.869,31.935 23.639,31.566L18.598,23.508L13.441,31.566C12.869,32.144 12.275,32.057 12.039,31.861C11.805,31.667 11.623,31.16 12.081,30.289L17,22L5,22L5,5L3,5L3,3L33,3L33,5L31,5L31,22L20,22ZM64.968,17L47.032,17C46.557,17 46.172,17.385 46.172,17.86L46.172,19.14C46.172,19.615 46.557,20 47.032,20L52,20L52,31L60,31L60,20L64.968,20C65.442,20 65.828,19.615 65.828,19.14L65.828,17.86C65.828,17.385 65.443,17 64.968,17ZM7,5L29,5L29,20L7,20L7,5ZM15.459,10.085L9.145,17.338L8.52,16.818L15.435,8.876L19.923,13.35L26.11,7.301L26.69,7.869L19.921,14.484L15.459,10.085ZM62.991,16C62.99,15.984 62.552,11.315 61.936,10.039C61.319,8.762 58.25,8.717 58.25,8.717C58.25,8.717 57.543,12.025 57.354,12.654C57.164,13.284 57.125,13.43 57.125,13.43C57.125,13.43 56.646,10.234 56.562,9.91C56.5,9.666 56.088,9.65 56,9.65C55.912,9.65 55.5,9.678 55.437,9.921C55.354,10.246 55.01,13.359 55.01,13.359C55.01,13.359 54.905,13.284 54.716,12.654C54.526,12.025 53.75,8.717 53.75,8.717C53.75,8.717 50.681,8.762 50.064,10.039C49.447,11.317 49.009,16 49.009,16L62.991,16ZM57.125,8.717C57.186,8.978 56.358,9.54 56.358,9.54L55.696,9.524C55.696,9.524 54.814,8.978 54.875,8.717C54.931,8.477 55.686,8.503 56,8.5C56.316,8.503 57.069,8.477 57.125,8.717ZM56,1.133C57.711,1.133 59.1,2.638 59.1,4.491C59.1,6.344 57.711,7.848 56,7.848C54.289,7.848 52.9,6.344 52.9,4.491C52.9,2.638 54.289,1.133 56,1.133Z"/>
</svg>
```

**public/settings/presenter.svg:**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="0 0 36 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <path d="M36,0L36,34L0,34L0,0L36,0ZM26.968,20C27.442,20 27.828,19.615 27.828,19.14L27.828,17.86C27.828,17.385 27.442,17 26.968,17L9.032,17C8.558,17 8.172,17.385 8.172,17.86L8.172,19.14C8.172,19.615 8.558,20 9.032,20L14,20L14,31L22,31L22,20L26.968,20ZM24.991,16C24.99,15.984 24.552,11.315 23.936,10.039C23.319,8.762 20.25,8.717 20.25,8.717C20.25,8.717 19.543,12.025 19.354,12.654C19.164,13.284 19.125,13.43 19.125,13.43C19.125,13.43 18.646,10.234 18.562,9.91C18.5,9.666 18.088,9.65 18,9.65C17.912,9.65 17.5,9.678 17.437,9.921C17.354,10.246 17.01,13.359 17.01,13.359C17.01,13.359 16.905,13.284 16.716,12.654C16.526,12.025 15.75,8.717 15.75,8.717C15.75,8.717 12.681,8.762 12.064,10.039C11.447,11.317 11.009,16 11.009,16L24.991,16ZM19.125,8.717C19.186,8.978 18.358,9.54 18.358,9.54L17.696,9.524C17.696,9.524 16.814,8.978 16.875,8.717C16.931,8.477 17.686,8.503 18,8.5C18.316,8.503 19.069,8.477 19.125,8.717ZM18,1.133C19.711,1.133 21.1,2.638 21.1,4.491C21.1,6.344 19.711,7.848 18,7.848C16.289,7.848 14.9,6.344 14.9,4.491C14.9,2.638 16.289,1.133 18,1.133Z"/>
</svg>
```

**public/settings/presentation.svg:**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="0 0 36 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <path d="M36,34L0,34L0,0L36,0L36,34ZM20,22L24.998,30.289C25.21,30.807 25.325,31.582 24.923,31.74C24.361,31.961 23.869,31.935 23.639,31.566L18.598,23.508L13.441,31.566C12.869,32.144 12.275,32.057 12.039,31.861C11.805,31.667 11.623,31.16 12.081,30.289L17,22L5,22L5,5L3,5L3,3L33,3L33,5L31,5L31,22L20,22ZM7,5L29,5L29,20L7,20L7,5ZM15.459,10.085L9.145,17.338L8.52,16.818L15.435,8.876L19.923,13.35L26.11,7.301L26.69,7.869L19.921,14.484L15.459,10.085Z"/>
</svg>
```

**public/settings/pip.svg:**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="0 0 74 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <g transform="matrix(1,0,0,1,-21.1235,0)">
        <path d="M78.894,34L31.475,34L31.475,0L78.894,0L78.894,7.324L68.428,7.324L68.428,32.323L78.894,32.323L78.894,34ZM64.968,17L47.032,17C46.557,17 46.172,17.385 46.172,17.86L46.172,19.14C46.172,19.615 46.557,20 47.032,20L52,20L52,31L60,31L60,20L64.968,20C65.442,20 65.828,19.615 65.828,19.14L65.828,17.86C65.828,17.385 65.443,17 64.968,17ZM62.991,16C62.99,15.984 62.552,11.315 61.936,10.039C61.319,8.762 58.25,8.717 58.25,8.717C58.25,8.717 57.543,12.025 57.354,12.654C57.164,13.284 57.125,13.43 57.125,13.43C57.125,13.43 56.646,10.234 56.562,9.91C56.5,9.666 56.088,9.65 56,9.65C55.912,9.65 55.5,9.678 55.437,9.921C55.354,10.246 55.01,13.359 55.01,13.359C55.01,13.359 54.905,13.284 54.716,12.654C54.526,12.025 53.75,8.717 53.75,8.717C53.75,8.717 50.681,8.762 50.064,10.039C49.447,11.317 49.009,16 49.009,16L62.991,16ZM57.125,8.717C57.186,8.978 56.358,9.54 56.358,9.54L55.696,9.524C55.696,9.524 54.814,8.978 54.875,8.717C54.931,8.477 55.686,8.503 56,8.5C56.316,8.503 57.069,8.477 57.125,8.717ZM56,1.133C57.711,1.133 59.1,2.638 59.1,4.491C59.1,6.344 57.711,7.848 56,7.848C54.289,7.848 52.9,6.344 52.9,4.491C52.9,2.638 54.289,1.133 56,1.133Z"/>
    </g>
    <g transform="matrix(0.64268,0,0,0.64268,49.1854,8.82915)">
        <path d="M36,34L0,34L0,0L36,0L36,34ZM20,22L24.998,30.289C25.21,30.807 25.325,31.582 24.923,31.74C24.361,31.961 23.869,31.935 23.639,31.566L18.598,23.508L13.441,31.566C12.869,32.144 12.275,32.057 12.039,31.861C11.805,31.667 11.623,31.16 12.081,30.289L17,22L5,22L5,5L3,5L3,3L33,3L33,5L31,5L31,22L20,22ZM7,5L29,5L29,20L7,20L7,5ZM15.459,10.085L9.145,17.338L8.52,16.818L15.435,8.876L19.923,13.35L26.11,7.301L26.69,7.869L19.921,14.484L15.459,10.085Z"/>
    </g>
</svg>
```

Now we associate the icons to each content id in the configuration:

**public/settings/settings.json**

```json
{
    "plugins": {
        ...
        "es.upv.paella.dualVideoDynamic": {
            ...
            "validContent": [
                { "id": "presenter-presentation", "content": ["presenter","presentation"], "icon": "presenter-presentation.svg", "title": "Presenter and presentation" }
            ],
            ...
        },

        "es.upv.paella.singleVideoDynamic": {
            ...
            "validContent": [
                { "id": "presenter", "content": ["presenter"], "icon": "presenter.svg", "title": "Presenter" },
                { "id": "presentation", "content": ["presentation"], "icon": "presentation.svg", "title": "Presentation" }
            ],
            ...
        },

        "es.upv.paella.dualVideoPiP": {
            ...
            "validContent": [
                { "id": "presenter-presentation-pip", "content": ["presenter","presentation"], "icon": "pip.svg", "title": "PiP mode" }
            ],
            ...
        },
        ...
    }
}
```

Finally, we configure the video layout selector plugin to display icons:

**public/settings/settings.json**

```json
...
"es.upv.paella.layoutSelector": {
    "enabled": true,
    "side": "right",
    "order": 2,
    "showIcons": true
},
```

## Buttons in video container

Toolbar buttons can also be placed in the video container area, but this feature is discouraged in paella-core 2.x and will be removed in the future. The reason for this is that buttons placed in the video container may interfere with the buttons integrated in the video layouts.

```json
...
"es.upv.paella.layoutSelector": {
    "enabled": true,
    "side": "right",
    "order": 2,
    "showIcons": true,
    "parentContainer": "videoContainer"
},
```

