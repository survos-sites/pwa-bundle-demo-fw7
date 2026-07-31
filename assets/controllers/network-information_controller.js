import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'downlink',
        'effectiveType',
        'rtt',
        'saveData',
        'type',
    ];

    connect() {
        this.onNetworkChange = () => this.update();
        this.element.addEventListener('pwa--network-information:change', this.onNetworkChange);

        if (!navigator.connection) {
            this.showUnsupported();
            return;
        }

        const controllers = this.element.dataset.controller.split(' ');
        if (!controllers.includes('pwa--network-information')) {
            this.element.dataset.controller = `${this.element.dataset.controller} pwa--network-information`;
        }
    }

    disconnect() {
        this.element.removeEventListener('pwa--network-information:change', this.onNetworkChange);
    }

    update() {
        const connection = navigator.connection;

        if (!connection) {
            this.showUnsupported();
            return;
        }

        this.effectiveTypeTarget.textContent = connection.effectiveType ?? 'Unavailable';
        this.downlinkTarget.textContent = Number.isFinite(connection.downlink)
            ? `${connection.downlink} Mbps`
            : 'Unavailable';
        this.rttTarget.textContent = Number.isFinite(connection.rtt)
            ? `${connection.rtt} ms`
            : 'Unavailable';
        this.saveDataTarget.textContent = connection.saveData ? 'true' : 'false';
        this.typeTarget.textContent = connection.type ?? 'Unavailable';
    }

    showUnsupported() {
        for (const target of [
            this.effectiveTypeTarget,
            this.downlinkTarget,
            this.rttTarget,
            this.saveDataTarget,
            this.typeTarget,
        ]) {
            target.textContent = 'Unavailable';
        }
    }
}
