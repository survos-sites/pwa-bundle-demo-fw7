// *** Service Worker *** //
/*
    This is the service worker file. It will be populated with the rules you define in the
    configuration file.
    You can define here custom rules depending on your application needs.
 */

registerPushTask(structuredPushNotificationSupport);

registerNotificationAction('*', async (event) => {
    const data = event.notification.data ?? {};
    const actionUrl = data.actionUrls?.[event.action];
    const destination = new URL(actionUrl || data.url || '/', self.location.origin);

    if (destination.origin !== self.location.origin) {
        return clients.openWindow(destination.href);
    }

    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appWindow = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (appWindow) {
        await appWindow.navigate(destination.href);
        return appWindow.focus();
    }

    return clients.openWindow(destination.href);
});
