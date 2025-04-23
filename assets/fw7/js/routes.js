export default (
    [
        {
            path: '/',
            url: './',
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
