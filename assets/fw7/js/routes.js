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
        path: '/en_US/installation',
        componentUrl: '/en_US/installation'
    },
    {
        path: '/en_US/network-info',
        componentUrl: '/en_US/network-info'
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