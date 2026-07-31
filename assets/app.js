import './bootstrap.js';
import './styles/app.css';
import '@hotwired/hotwire-native-bridge';

import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.min.css';
import 'material-icons/iconfont/material-icons.css';

import './fw7/js/config.js';
import './fw7/js/store.js';
import './fw7/js/routes.js';
import './fw7/js/init.js';

window.addEventListener('DOMContentLoaded', function() {
    window.app.init();
});
