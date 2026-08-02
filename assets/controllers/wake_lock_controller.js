import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'duration',
        'enableButton',
        'message',
        'releaseButton',
        'status',
        'statusIcon',
    ];

    connect() {
        this.startedAt = null;
        this.timer = null;

        if (!('wakeLock' in navigator)) {
            this.unsupported();
            return;
        }

        this.statusTarget.textContent = 'Wake Lock available';
        this.messageTarget.textContent = 'The screen can use its normal timeout until you enable the wake lock.';
    }

    disconnect() {
        this.stopTimer();
    }

    async enable() {
        const controller = this.bundleController();
        if (!controller || !('wakeLock' in navigator)) {
            this.unsupported();
            return;
        }

        this.enableButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Requesting screen wake lock…';
        this.messageTarget.textContent = 'Keep this page active and visible while the browser enables it.';

        try {
            await controller.lock();
        } catch (error) {
            this.enableButtonTarget.disabled = false;
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
            this.statusTarget.textContent = 'Wake lock could not be enabled';
            this.messageTarget.textContent = error?.name === 'NotAllowedError'
                ? 'Keep this page visible and check whether battery-saving settings are preventing wake locks.'
                : 'The browser rejected the request. Confirm that the page is active and served over HTTPS.';
        }
    }

    async release() {
        const controller = this.bundleController();
        if (!controller) return;

        this.releaseButtonTarget.disabled = true;
        try {
            await controller.release();
        } catch {
            this.statusTarget.textContent = 'Wake lock could not be released';
            this.messageTarget.textContent = 'The browser did not complete the wake-lock release request.';
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
            this.releaseButtonTarget.disabled = false;
        }
    }

    updated({ detail }) {
        const active = detail.wakeLock && detail.wakeLock.released === false;
        if (active) {
            this.statusTarget.textContent = 'Screen wake lock active';
            this.messageTarget.textContent = 'The display should remain on while this page stays active and visible.';
            this.statusIconTarget.textContent = 'sun_max_fill';
            this.enableButtonTarget.hidden = true;
            this.enableButtonTarget.disabled = false;
            this.releaseButtonTarget.hidden = false;
            this.releaseButtonTarget.disabled = false;
            this.startTimer();
            return;
        }

        const wasActive = this.startedAt !== null;
        this.stopTimer();
        this.statusTarget.textContent = wasActive ? 'Screen wake lock released' : 'Wake Lock available';
        this.messageTarget.textContent = wasActive
            ? 'The device can now dim or lock according to its normal screen timeout.'
            : 'The screen can use its normal timeout until you enable the wake lock.';
        this.statusIconTarget.textContent = wasActive ? 'moon_zzz_fill' : 'moon_zzz';
        this.enableButtonTarget.hidden = false;
        this.enableButtonTarget.disabled = false;
        this.releaseButtonTarget.hidden = true;
        this.releaseButtonTarget.disabled = false;
    }

    unsupported() {
        this.stopTimer();
        this.statusTarget.textContent = 'Screen Wake Lock API unavailable';
        this.messageTarget.textContent = 'Open this page in a supported browser over HTTPS to access navigator.wakeLock.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.enableButtonTarget.disabled = true;
        this.releaseButtonTarget.hidden = true;
    }

    startTimer() {
        if (this.startedAt === null) {
            this.startedAt = Date.now();
        }
        this.renderDuration();
        if (!this.timer) {
            this.timer = window.setInterval(() => this.renderDuration(), 1000);
        }
    }

    stopTimer() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        this.startedAt = null;
        if (this.hasDurationTarget) {
            this.durationTarget.textContent = '00:00';
        }
    }

    renderDuration() {
        const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        this.durationTarget.textContent = `${minutes}:${seconds}`;
    }

    bundleController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--wake-lock');
    }
}
