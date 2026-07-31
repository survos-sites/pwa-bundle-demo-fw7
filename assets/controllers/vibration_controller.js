import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['action', 'duration', 'message', 'status', 'statusIcon', 'stopButton'];

    connect() {
        this.onTriggered = ({ detail }) => this.showTriggered(detail.pattern, detail.interval);
        this.onStopped = () => this.showStopped();
        this.element.addEventListener('pwa--vibration:triggered', this.onTriggered);
        this.element.addEventListener('pwa--vibration:stopped', this.onStopped);

        if (typeof navigator.vibrate !== 'function') {
            this.statusTarget.textContent = 'Vibration API unavailable';
            this.messageTarget.textContent = 'This browser or device does not expose vibration controls.';
            this.statusIconTarget.textContent = 'xmark_circle';
            this.actionTargets.forEach((link) => {
                link.classList.add('disabled');
                link.setAttribute('aria-disabled', 'true');
                if ('disabled' in link) link.disabled = true;
            });
            this.stopButtonTarget.disabled = true;
            return;
        }

        this.statusTarget.textContent = 'Ready to vibrate';
    }

    disconnect() {
        this.element.removeEventListener('pwa--vibration:triggered', this.onTriggered);
        this.element.removeEventListener('pwa--vibration:stopped', this.onStopped);
    }

    showTriggered(pattern, interval) {
        const pulses = Array.isArray(pattern)
            ? pattern.filter((duration, index) => index % 2 === 0 && duration > 0).length
            : 1;

        this.statusTarget.textContent = 'Vibration requested';
        this.messageTarget.textContent = interval
            ? `${pulses}-pulse pattern repeating every ${interval / 1000} seconds.`
            : `${pulses} ${pulses === 1 ? 'pulse' : 'pulses'} requested from the browser.`;
        this.statusIconTarget.textContent = 'waveform_path';
        this.stopButtonTarget.disabled = !interval;
    }

    showStopped() {
        this.statusTarget.textContent = 'Repeating alert stopped';
        this.messageTarget.textContent = 'No further vibration patterns are scheduled.';
        this.statusIconTarget.textContent = 'stop_circle';
        this.stopButtonTarget.disabled = true;
    }

    vibrateCustom() {
        const duration = this.normalizeDuration();
        const vibrationController = this.application.getControllerForElementAndIdentifier(
            this.element,
            'pwa--vibration'
        );

        vibrationController?.vibrate({ params: { pattern: [duration] } });
    }

    normalizeDuration() {
        const duration = Math.min(10000, Math.max(50, Number.parseInt(this.durationTarget.value, 10) || 200));
        this.durationTarget.value = duration.toString();

        return duration;
    }
}
