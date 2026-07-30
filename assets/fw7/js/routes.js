'use strict';

/*
|------------------------------------------------------------------------------
| Define Namespace
|------------------------------------------------------------------------------
*/

window.routes = window.routes || [];

console.log('routes.js');

/*
|------------------------------------------------------------------------------
| Define Routes
|------------------------------------------------------------------------------
*/

window.routes.push({
    path: '/',
    componentUrl: '/en_US/partials/tabbar.html',
    tabs: [
        {
            id: 'tab-working',
            path: '/',
            componentUrl: '/en_US/partials/home.html'
        },
        {
            id: 'tab-todo',
            path: '/en_US/todo',
            componentUrl: '/en_US/partials/tab-todo.html'
        },
        {
            id: 'tab-info',
            path: '/en_US/info',
            componentUrl: '/en_US/partials/tab-info.html'
        },
        {
            id: 'tab-share',
            path: '/en_US/share',
            componentUrl: '/en_US/partials/tab-share.html'
        }
    ]
});

window.routes.push(
    {
        path: '/en_US/ar-vr',
        componentUrl: '/en_US/ar-vr'
    },
    {
        path: '/en_US/audio',
        componentUrl: '/en_US/audio'
    },
    {
        path: '/en_US/audio-recording',
        componentUrl: '/en_US/audio-recording'
    },
    {
        path: '/en_US/audio-session',
        componentUrl: '/en_US/audio-session'
    },
    {
        path: '/en_US/authentication',
        componentUrl: '/en_US/authentication'
    },
    {
        path: '/en_US/background-fetch',
        componentUrl: '/en_US/background-fetch'
    },
    {
        path: '/en_US/background-sync',
        componentUrl: '/en_US/background-sync'
    },
    {
        path: '/en_US/barcode-detection',
        componentUrl: '/en_US/barcode-detection'
    },
    {
        path: '/en_US/bluetooth',
        componentUrl: '/en_US/bluetooth'
    },
    {
        path: '/en_US/contact-picker',
        componentUrl: '/en_US/contact-picker'
    },
    {
        path: '/en_US/device-motion',
        componentUrl: '/en_US/device-motion'
    },
    {
        path: '/en_US/element-capture',
        componentUrl: '/en_US/element-capture'
    },
    {
        path: '/en_US/face-detection',
        componentUrl: '/en_US/face-detection'
    },
    {
        path: '/en_US/file-handling',
        componentUrl: '/en_US/file-handling'
    },
    {
        path: '/en_US/file-system',
        componentUrl: '/en_US/file-system'
    },
    {
        path: '/en_US/geolocation',
        componentUrl: '/en_US/geolocation'
    },
    {
        path: '/en_US/i18n',
        componentUrl: '/en_US/i18n'
    },
    {
        path: '/en_US/installation',
        componentUrl: '/en_US/installation'
    },
    {
        path: '/en_US/media-capture',
        componentUrl: '/en_US/media-capture'
    },
    {
        path: '/en_US/multi-touch',
        componentUrl: '/en_US/multi-touch'
    },
    {
        path: '/en_US/network-info',
        componentUrl: '/en_US/network-info'
    },
    {
        path: '/en_US/nfc',
        componentUrl: '/en_US/nfc'
    },
    {
        path: '/en_US/notifications',
        componentUrl: '/en_US/notifications'
    },
    {
        path: '/en_US/offline-support',
        componentUrl: '/en_US/offline-support'
    },
    {
        path: '/en_US/orientation',
        componentUrl: '/en_US/orientation'
    },
    {
        path: '/en_US/payment',
        componentUrl: '/en_US/payment'
    },
    {
        path: '/en_US/picture-in-picture',
        componentUrl: '/en_US/picture-in-picture'
    },
    {
        path: '/en_US/presentation',
        componentUrl: '/en_US/presentation'
    },
    {
        path: '/en_US/protocol-handling',
        componentUrl: '/en_US/protocol-handling'
    },
    {
        path: '/en_US/receiver',
        componentUrl: '/en_US/receiver'
    },
    {
        path: '/en_US/screen-capture',
        componentUrl: '/en_US/screen-capture'
    },
    {
        path: '/en_US/shortcuts',
        componentUrl: '/en_US/shortcuts'
    },
    {
        path: '/en_US/speech-recognition',
        componentUrl: '/en_US/speech-recognition'
    },
    {
        path: '/en_US/speech-synthesis',
        componentUrl: '/en_US/speech-synthesis'
    },
    {
        path: '/en_US/storage',
        componentUrl: '/en_US/storage'
    },
    {
        path: '/en_US/vibration',
        componentUrl: '/en_US/vibration'
    },
    {
        path: '/en_US/view-transition',
        componentUrl: '/en_US/view-transition'
    },
    {
        path: '/en_US/wake-lock',
        componentUrl: '/en_US/wake-lock'
    },
    {
        path: '/en_US/web-share',
        componentUrl: '/en_US/web-share'
    },
    {
        path: '/en_US/information',
        componentUrl: '/en_US/information'
    }
);

/*
export default (
    [
        {
            path: '/',
            url: '/en_US/partials/home.html',
        },
        {
            path: '/pages/about',
            url: './pages/about', // this is the Symfony route, we can combine this
        },

        {
            path: '/dynamic-route/blog/:blogId/post/:postId/',
            componentUrl: './pages/dynamic-route.html',
        },

        // Default route (404 page). MUST BE THE LAST
        {
            path: '(.*)',
            //url: './pages/404.html',
            async : function ({ app, router, to, resolve }) {
                //if the to.path contains _profiler , then open in _blank , current base url + to.path
                console.error("this route is not yet handled.");
                if (to.path.includes('_profiler')) {
                    let url = to.path.replace(/.*?https:\//, 'https://');
                    window.open(url, '_blank');
                    return;
                }

                resolve({
                    url: './pages/404.html'
                });
            }
        },
    ]);
*/