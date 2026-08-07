import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'composer',
        'permission',
        'sendButton',
        'status',
        'statusIcon',
        'subscribeButton',
        'unsubscribeButton',
    ];

    static values = {
        sendUrl: String,
        subscriptionUrl: String,
    };

    connect() {
        this.boundSubscribed = event => this.subscribed(event);
        this.boundUnsubscribed = () => this.unsubscribed();
        this.boundDenied = () => this.denied();
        this.boundError = event => this.error(event);
        this.boundSubmit = event => this.send(event);

        this.element.addEventListener('pwa--web-push:subscribed', this.boundSubscribed);
        this.element.addEventListener('pwa--web-push:unsubscribed', this.boundUnsubscribed);
        this.element.addEventListener('pwa--web-push:denied', this.boundDenied);
        this.element.addEventListener('pwa--web-push:error', this.boundError);
        this.composerTarget.addEventListener('submit', this.boundSubmit);

        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            this.setStatus('Web Push unavailable', 'This browser does not expose the APIs required by this demo.', 'xmark_circle', 'red');
            this.subscribeButtonTarget.disabled = true;
            this.sendButtonTarget.disabled = true;
            return;
        }

        this.permissionTarget.textContent = this.permissionLabel(Notification.permission);
    }

    disconnect() {
        this.element.removeEventListener('pwa--web-push:subscribed', this.boundSubscribed);
        this.element.removeEventListener('pwa--web-push:unsubscribed', this.boundUnsubscribed);
        this.element.removeEventListener('pwa--web-push:denied', this.boundDenied);
        this.element.removeEventListener('pwa--web-push:error', this.boundError);
        this.composerTarget.removeEventListener('submit', this.boundSubmit);
    }

    async subscribed({ detail }) {
        try {
            const response = await this.request(this.subscriptionUrlValue, {
                method: 'POST',
                body: JSON.stringify(detail),
            });
            this.setStatus('Subscribed', response.message, 'checkmark_circle_fill', 'green');
            this.permissionTarget.textContent = this.permissionLabel(Notification.permission);
            this.subscribeButtonTarget.classList.add('display-none');
            this.unsubscribeButtonTarget.classList.remove('display-none');
            this.sendButtonTarget.disabled = false;
        } catch (error) {
            this.setStatus('Subscription was not saved', error.message, 'exclamationmark_triangle_fill', 'red');
        }
    }

    async unsubscribed() {
        try {
            await this.request(this.subscriptionUrlValue, { method: 'DELETE' });
        } catch {
            // The browser is unsubscribed even if clearing the demo session failed.
        }
        this.setStatus('Not subscribed', 'Enable notifications to create a browser subscription for this device.', 'bell_slash_fill', 'gray');
        this.permissionTarget.textContent = this.permissionLabel(Notification.permission);
        this.subscribeButtonTarget.classList.remove('display-none');
        this.unsubscribeButtonTarget.classList.add('display-none');
        this.sendButtonTarget.disabled = true;
    }

    denied() {
        this.setStatus('Notifications blocked', 'Allow notifications for Symphone in the browser site settings, then try again.', 'hand_raised_fill', 'red');
        this.permissionTarget.textContent = this.permissionLabel(Notification.permission);
        this.subscribeButtonTarget.disabled = true;
        this.sendButtonTarget.disabled = true;
    }

    error({ detail }) {
        this.setStatus('Subscription failed', detail.error?.message || 'The browser could not create a push subscription.', 'exclamationmark_triangle_fill', 'red');
    }

    async send(event) {
        event.preventDefault();
        if (!this.composerTarget.reportValidity()) return;

        const data = new FormData(this.composerTarget);
        const payload = {
            title: data.get('title'),
            body: data.get('body'),
            icon: data.get('icon'),
            image: data.get('image'),
            badge: data.get('badge'),
            url: data.get('url'),
            tag: data.get('tag'),
            lang: data.get('lang'),
            dir: data.get('dir'),
            ttl: Number(data.get('ttl')),
            urgency: data.get('urgency'),
            topic: data.get('topic'),
            silent: data.has('silent'),
            renotify: data.has('renotify'),
            requireInteraction: data.has('requireInteraction'),
            vibrate: this.vibrationPattern(data.get('vibrate')),
            actions: [1, 2].map(index => ({
                title: data.get(`action${index}Title`),
                url: data.get(`action${index}Url`),
                icon: data.get(`action${index}Icon`),
            })),
        };

        this.sendButtonTarget.disabled = true;
        this.setStatus('Sending encrypted push', 'Symphone is delivering the payload through this browser’s push service.', 'paperplane_fill', 'blue');
        try {
            const response = await this.request(this.sendUrlValue, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            this.setStatus('Push accepted', response.message, 'checkmark_circle_fill', 'green');
        } catch (error) {
            this.setStatus('Push failed', error.message, 'xmark_circle_fill', 'red');
        } finally {
            this.sendButtonTarget.disabled = false;
        }
    }

    vibrationPattern(value) {
        return String(value || '')
            .split(/[,\s]+/)
            .filter(Boolean)
            .map(Number)
            .filter(duration => Number.isFinite(duration) && duration >= 0);
    }

    async request(url, options) {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
            throw new Error(data.message || `The server returned HTTP ${response.status}.`);
        }
        return data;
    }

    setStatus(title, message, icon, color) {
        this.statusTarget.querySelector('.item-title').textContent = title;
        this.statusTarget.querySelector('.item-text').textContent = message;
        this.statusIconTarget.textContent = icon;
        this.statusIconTarget.className = `icon f7-icons color-${color}`;
    }

    permissionLabel(permission) {
        return permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Blocked' : 'Not requested';
    }
}
