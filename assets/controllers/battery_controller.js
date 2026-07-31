import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'charging',
        'chargingTime',
        'dischargingTime',
        'level',
        'levelSummary',
        'progress',
        'progressBar',
        'status',
        'statusIcon',
    ];

    connect() {
        this.onBatteryUpdate = ({ detail }) => this.update(detail);
        this.element.addEventListener('pwa--battery:updated', this.onBatteryUpdate);

        if (typeof navigator.getBattery !== 'function') {
            this.showUnsupported();
            return;
        }

        const controllers = this.element.dataset.controller.split(' ');
        if (!controllers.includes('pwa--battery')) {
            this.element.dataset.controller = `${this.element.dataset.controller} pwa--battery`;
        }
    }

    disconnect() {
        this.element.removeEventListener('pwa--battery:updated', this.onBatteryUpdate);
    }

    update({ charging, level, chargingTime, dischargingTime }) {
        const percentage = Math.round(level * 100);

        this.statusTarget.textContent = charging ? 'Charging' : 'Not charging';
        this.statusIconTarget.textContent = charging ? 'battery_100_bolt' : this.batteryIcon(percentage);
        this.levelSummaryTarget.textContent = `${percentage}% available`;
        this.levelTarget.textContent = `${percentage}%`;
        this.chargingTarget.textContent = charging ? 'true' : 'false';
        this.chargingTimeTarget.textContent = charging && percentage < 100
            ? this.formatDuration(chargingTime)
            : 'Not applicable';
        this.dischargingTimeTarget.textContent = charging
            ? 'Not applicable'
            : this.formatDuration(dischargingTime);
        this.progressTarget.setAttribute('aria-valuenow', percentage.toString());
        this.progressBarTarget.style.transform = `translate3d(${percentage - 100}%, 0, 0)`;
    }

    showUnsupported() {
        this.statusTarget.textContent = 'Battery Status API unavailable';
        this.statusIconTarget.textContent = 'battery_0';

        for (const target of [
            this.levelTarget,
            this.levelSummaryTarget,
            this.chargingTarget,
            this.chargingTimeTarget,
            this.dischargingTimeTarget,
        ]) {
            target.textContent = 'Unavailable';
        }
    }

    batteryIcon(percentage) {
        if (percentage >= 90) return 'battery_100';
        if (percentage >= 60) return 'battery_75';
        if (percentage >= 30) return 'battery_50';
        if (percentage >= 10) return 'battery_25';

        return 'battery_0';
    }

    formatDuration(seconds) {
        if (!Number.isFinite(seconds)) return 'Not reported by this device';
        if (seconds <= 0) return 'Less than a minute';

        const totalMinutes = Math.ceil(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} hr`;

        return `${hours} hr ${minutes} min`;
    }
}
