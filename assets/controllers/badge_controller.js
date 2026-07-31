import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['action', 'count', 'message', 'status'];

    connect() {
        this.onBadgeUpdated = ({ detail }) => this.updateStatus(detail.counter);
        this.element.addEventListener('pwa--badge:updated', this.onBadgeUpdated);

        if (typeof navigator.setAppBadge !== 'function' || typeof navigator.clearAppBadge !== 'function') {
            this.statusTarget.textContent = 'Badging API unavailable';
            this.messageTarget.textContent = 'This browser does not expose app-icon badging.';
            this.actionTargets.forEach((button) => {
                button.disabled = true;
            });
            return;
        }

        this.statusTarget.textContent = 'Ready to update the app badge';
    }

    disconnect() {
        this.element.removeEventListener('pwa--badge:updated', this.onBadgeUpdated);
    }

    setBadge() {
        const counter = this.normalizeCount();
        const badgeController = this.application.getControllerForElementAndIdentifier(
            this.element,
            'pwa--badge'
        );

        badgeController?.update({ params: { counter } });
    }

    normalizeCount() {
        const counter = Math.min(4294967295, Math.max(1, Number.parseInt(this.countTarget.value, 10) || 1));
        this.countTarget.value = counter.toString();

        return counter;
    }

    updateStatus(counter) {
        const value = Number(counter);

        if (value === 0) {
            this.statusTarget.textContent = 'App badge cleared';
            this.messageTarget.textContent = 'Symphone’s app icon no longer displays a badge value.';
            return;
        }

        this.statusTarget.textContent = `App badge set to ${value}`;
        this.messageTarget.textContent = `Symphone’s app icon now uses the badge value ${value}.`;
    }
}
