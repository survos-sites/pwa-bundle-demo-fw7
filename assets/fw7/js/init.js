'use strict';

/*
|------------------------------------------------------------------------------
| Initialize Framework7
|------------------------------------------------------------------------------
*/

window.app = new Framework7({
    el: '#app',
    // componentUrl: '{{path("f7_app_partial_root_html")}}',
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
