'use strict';

/*
|------------------------------------------------------------------------------
| Define Namespace
|------------------------------------------------------------------------------
*/

window.config = window.config || {};

console.log('config.js');


/*
|------------------------------------------------------------------------------
| App
|------------------------------------------------------------------------------
*/

window.config.app = {
    id: 'com.survos.pwabundle',
    version: '1.0.0',
    name: 'What PWA Bundle Can Do Today',
    logos: {
        logomarkLight: 'assets/custom/img/logos/logomark-light.svg',
        logomarkDark: 'assets/custom/img/logos/logomark-dark.svg',
        logotypeLight: 'assets/custom/img/logos/logotype-light.svg',
        logotypeDark: 'assets/custom/img/logos/logotype-dark.svg',
        logomarkCircleLight: 'assets/custom/img/logos/logomark-circle-light.svg',
        logomarkCircleDark: 'assets/custom/img/logos/logomark-circle-dark.svg',
        logomarkSquareLight: 'assets/custom/img/logos/logomark-square-light.svg',
        logomarkSquareDark: 'assets/custom/img/logos/logomark-square-dark.svg'
    }
}

/*
|------------------------------------------------------------------------------
| Theming
|------------------------------------------------------------------------------
*/

window.config.theming = {
    theme: 'auto',
    color: '#2563EB',
    mode: 'system',
    tone: 'warm'
}
