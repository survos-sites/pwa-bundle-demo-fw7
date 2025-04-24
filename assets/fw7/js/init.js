'use strict';

/*
|------------------------------------------------------------------------------
| Initialize Framework7
|------------------------------------------------------------------------------
*/
import Framework7 from 'framework7/framework7-bundle';

window.app = new Framework7({
    el: '#app',
    componentUrl: '/en_US/partials/app.html',
    theme: 'auto',
    routes: window.routes,
    store: window.store,
    init: false,
    navbar: {
        mdCenterTitle: true
    },
    toast: {
        closeTimeout: 2500
    }
});

/*
|------------------------------------------------------------------------------
| Extend App Object
|------------------------------------------------------------------------------
*/

app.on('init', function() {
    app.utils.extend(app, {config: window.config});
});
