import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'absolute',
        'alpha',
        'beta',
        'compassHeading',
        'compassNeedle',
        'device',
        'deviceOrientation',
        'deviceOrientationDetail',
        'gamma',
        'message',
        'permissionBlock',
        'permissionButton',
        'screenAngle',
        'sensor',
        'status',
        'statusIcon',
    ];

    connect() {
        this.onScreenOrientationChange = () => this.updateScreenOrientation();
        this.onAbsoluteOrientation = (event) => this.updateAbsoluteHeading(event);
        this.onWebkitCompass = (event) => this.updateWebkitHeading(event);
        window.addEventListener('orientationchange', this.onScreenOrientationChange);
        window.addEventListener('deviceorientationabsolute', this.onAbsoluteOrientation, true);
        window.addEventListener('deviceorientation', this.onWebkitCompass, true);
        window.screen.orientation?.addEventListener('change', this.onScreenOrientationChange);
        this.updateScreenOrientation();
        this.showCompassUnavailable();

        if (typeof DeviceOrientationEvent === 'undefined') {
            this.unavailable();
            return;
        }

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            this.statusTarget.textContent = 'Orientation permission required';
            this.messageTarget.textContent = 'Tap Enable orientation sensors to show the system permission prompt.';
            this.permissionBlockTarget.hidden = false;
            return;
        }

        this.attachBundleController();
        this.statusTarget.textContent = 'Waiting for orientation data…';
    }

    disconnect() {
        window.removeEventListener('orientationchange', this.onScreenOrientationChange);
        window.removeEventListener('deviceorientationabsolute', this.onAbsoluteOrientation, true);
        window.removeEventListener('deviceorientation', this.onWebkitCompass, true);
        window.screen.orientation?.removeEventListener('change', this.onScreenOrientationChange);
    }

    async enable() {
        this.permissionButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Requesting orientation permission…';

        try {
            const state = await DeviceOrientationEvent.requestPermission();
            if (state !== 'granted') {
                this.permissionDenied();
                return;
            }
            this.permissionBlockTarget.hidden = true;
            this.attachBundleController();
            this.statusTarget.textContent = 'Waiting for orientation data…';
        } catch (error) {
            this.permissionDenied();
        }
    }

    attachBundleController() {
        const controllers = this.sensorTarget.getAttribute('data-controller')?.split(/\s+/).filter(Boolean) || [];
        if (!controllers.includes('pwa--device-orientation')) {
            this.sensorTarget.setAttribute('data-controller', [...controllers, 'pwa--device-orientation'].join(' '));
        }
    }

    update({ detail }) {
        const alpha = this.numberOrNull(detail.alpha);
        const beta = this.numberOrNull(detail.beta);
        const gamma = this.numberOrNull(detail.gamma);

        if (alpha === null && beta === null && gamma === null) {
            this.statusTarget.textContent = 'Orientation values unavailable';
            this.messageTarget.textContent = 'The browser exposed the event but did not provide sensor readings.';
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
            return;
        }

        const normalizedAlpha = alpha === null ? null : this.normalizeDegrees(alpha);
        const screenAngle = window.screen.orientation?.angle || window.orientation || 0;
        this.alphaTarget.textContent = this.formatAngle(normalizedAlpha);
        this.betaTarget.textContent = this.formatAngle(beta);
        this.gammaTarget.textContent = this.formatAngle(gamma);
        this.absoluteTarget.textContent = detail.absolute ? 'Yes' : 'No';
        this.screenAngleTarget.textContent = `${this.normalizeDegrees(screenAngle)}°`;

        if (detail.absolute && alpha !== null && beta !== null && gamma !== null) {
            this.showCompassHeading(this.calculateCompassHeading(alpha, beta, gamma));
        }
        this.deviceTarget.style.transform = [
            `rotateX(${this.clamp(beta || 0, -70, 70)}deg)`,
            `rotateY(${this.clamp(gamma || 0, -70, 70)}deg)`,
            `rotateZ(${-screenAngle}deg)`,
        ].join(' ');

        this.permissionBlockTarget.hidden = true;
        this.statusTarget.textContent = 'Orientation sensors active';
        this.messageTarget.textContent = 'Rotate and tilt the device to update the angles.';
        this.statusIconTarget.textContent = 'checkmark_circle';
    }

    updateAbsoluteHeading(event) {
        if ([event.alpha, event.beta, event.gamma].every(Number.isFinite)) {
            this.showCompassHeading(this.calculateCompassHeading(event.alpha, event.beta, event.gamma));
        }
    }

    updateWebkitHeading(event) {
        if (Number.isFinite(event.webkitCompassHeading)) {
            this.showCompassHeading(event.webkitCompassHeading);
        }
    }

    showCompassHeading(value) {
        const heading = this.normalizeDegrees(value);
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const direction = directions[Math.round(heading / 45) % directions.length];
        this.compassNeedleTarget.style.opacity = '1';
        this.compassNeedleTarget.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
        this.compassHeadingTarget.textContent = `${heading.toFixed(1)}° ${direction}`;
    }

    showCompassUnavailable() {
        this.compassNeedleTarget.style.opacity = '.25';
        this.compassHeadingTarget.textContent = 'Compass heading unavailable';
    }

    calculateCompassHeading(alpha, beta, gamma) {
        const degreesToRadians = Math.PI / 180;
        const alphaRadians = alpha * degreesToRadians;
        const betaRadians = beta * degreesToRadians;
        const gammaRadians = gamma * degreesToRadians;
        const cosineBeta = Math.cos(betaRadians);
        const sineBeta = Math.sin(betaRadians);
        const cosineGamma = Math.cos(gammaRadians);
        const sineGamma = Math.sin(gammaRadians);
        const cosineAlpha = Math.cos(alphaRadians);
        const sineAlpha = Math.sin(alphaRadians);
        const vectorX = -cosineAlpha * sineGamma - sineAlpha * sineBeta * cosineGamma;
        const vectorY = -sineAlpha * sineGamma + cosineAlpha * sineBeta * cosineGamma;
        if (Math.abs(vectorX) < 0.0001 && Math.abs(vectorY) < 0.0001) {
            return this.normalizeDegrees(360 - alpha);
        }
        let heading = Math.atan2(vectorX, vectorY);
        if (heading < 0) heading += 2 * Math.PI;
        return heading / degreesToRadians;
    }

    updateScreenOrientation() {
        const angle = window.screen.orientation?.angle || window.orientation || 0;
        const type = window.screen.orientation?.type || '';
        const landscape = type.startsWith('landscape') || (!type && window.innerWidth > window.innerHeight);
        const primary = type.endsWith('primary');
        const secondary = type.endsWith('secondary');
        this.deviceOrientationTarget.textContent = landscape ? 'Landscape' : 'Portrait';
        this.deviceOrientationDetailTarget.textContent = [
            primary ? 'Primary orientation' : secondary ? 'Secondary orientation' : null,
            `${this.normalizeDegrees(angle)}° screen rotation`,
        ].filter(Boolean).join(' · ');
        this.screenAngleTarget.textContent = `${this.normalizeDegrees(angle)}°`;
    }

    permissionDenied() {
        this.statusTarget.textContent = 'Orientation permission denied';
        this.messageTarget.textContent = 'Allow motion and orientation access in browser settings, then reload this page.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.permissionButtonTarget.disabled = false;
    }

    unavailable() {
        this.statusTarget.textContent = 'Device Orientation API unavailable';
        this.messageTarget.textContent = 'This browser or device does not expose orientation sensor data.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.permissionBlockTarget.hidden = true;
    }

    formatAngle(value) {
        return value === null ? 'Unavailable' : `${value.toFixed(1)}°`;
    }

    numberOrNull(value) {
        return Number.isFinite(value) ? value : null;
    }

    normalizeDegrees(value) {
        return (value % 360 + 360) % 360;
    }

    clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }
}
