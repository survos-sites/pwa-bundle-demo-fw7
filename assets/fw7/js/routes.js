'use strict';

const locale = document.documentElement.dataset.locale;
const localizedPath = (path) => `/${locale}${path}`;

window.routes = window.routes || [];

window.routes.push({
    path: '/',
    componentUrl: localizedPath('/partials/tabbar.html'),
    tabs: [
        {
            id: 'tab-working',
            path: '/',
            componentUrl: localizedPath('/partials/home.html')
        },
        {
            id: 'tab-todo',
            path: localizedPath('/todo'),
            componentUrl: localizedPath('/partials/tab-todo.html')
        },
        {
            id: 'tab-info',
            path: localizedPath('/info'),
            componentUrl: localizedPath('/partials/tab-info.html')
        },
        {
            id: 'tab-share',
            path: localizedPath('/share'),
            componentUrl: localizedPath('/partials/tab-share.html')
        }
    ]
});

const featurePaths = [
    '/ar-vr',
    '/audio',
    '/audio-recording',
    '/audio-session',
    '/authentication',
    '/background-fetch',
    '/background-sync',
    '/badge',
    '/barcode-detection',
    '/battery',
    '/bluetooth',
    '/contact-picker',
    '/device-motion',
    '/element-capture',
    '/face-detection',
    '/file-handling',
    '/file-system',
    '/fullscreen',
    '/geolocation',
    '/i18n',
    '/installation',
    '/media-capture',
    '/multi-touch',
    '/network-info',
    '/nfc',
    '/notifications',
    '/offline-support',
    '/orientation',
    '/payment',
    '/periodic-sync',
    '/picture-in-picture',
    '/presentation',
    '/protocol-handling',
    '/receiver',
    '/screen-capture',
    '/share-target',
    '/shortcuts',
    '/speech-recognition',
    '/speech-synthesis',
    '/storage',
    '/vibration',
    '/view-transition',
    '/wake-lock',
    '/web-share',
    '/information'
];

window.routes.push(...featurePaths.map((path) => ({
    path: localizedPath(path),
    componentUrl: localizedPath(path)
})));
