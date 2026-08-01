import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'acceleration',
        'accelerationIncludingGravity',
        'intensity',
        'intensityBar',
        'interval',
        'marker',
        'message',
        'permissionBlock',
        'permissionButton',
        'rotationRate',
        'sensor',
        'shakeCount',
        'status',
        'statusIcon',
    ];

    connect() {
        this.lastRender = 0;
        this.lastShake = 0;
        this.shakes = 0;

        if (typeof DeviceMotionEvent === 'undefined') {
            this.unavailable();
            return;
        }

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            this.statusTarget.textContent = 'Motion permission required';
            this.messageTarget.textContent = 'Tap Enable motion sensors to show the system permission prompt.';
            this.permissionBlockTarget.hidden = false;
            return;
        }

        this.attachBundleController();
        this.statusTarget.textContent = 'Waiting for motion data…';
    }

    enable() {
        this.permissionButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Requesting motion permission…';
        this.attachBundleController();
    }

    attachBundleController() {
        const controllers = this.sensorTarget.getAttribute('data-controller')?.split(/\s+/).filter(Boolean) || [];
        if (!controllers.includes('pwa--device-motion')) {
            this.sensorTarget.setAttribute('data-controller', [...controllers, 'pwa--device-motion'].join(' '));
        }
    }

    permissionGranted() {
        this.permissionBlockTarget.hidden = true;
        this.statusTarget.textContent = 'Motion sensors active';
        this.messageTarget.textContent = 'Move your device to update the visualizer and sensor values.';
        this.statusIconTarget.textContent = 'checkmark_circle';
    }

    permissionDenied() {
        this.statusTarget.textContent = 'Motion permission denied';
        this.messageTarget.textContent = 'Allow motion access in the browser settings, then reload this page.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.permissionButtonTarget.disabled = false;
    }

    unavailable() {
        this.statusTarget.textContent = 'Device Motion API unavailable';
        this.messageTarget.textContent = 'This browser or device does not expose motion sensor data.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.permissionBlockTarget.hidden = true;
    }

    update({ detail }) {
        const now = performance.now();
        const acceleration = this.vector(detail.acceleration);
        const gravity = this.vector(detail.accelerationIncludingGravity);
        const rotation = this.rotation(detail.rotationRate);

        this.detectShake(acceleration, now);
        if (now - this.lastRender < 100) {
            return;
        }
        this.lastRender = now;

        this.permissionBlockTarget.hidden = true;
        this.statusTarget.textContent = 'Motion sensors active';
        this.messageTarget.textContent = 'Live readings are updating from this device.';
        this.statusIconTarget.textContent = 'checkmark_circle';

        this.accelerationTarget.textContent = this.formatVector(acceleration, ['x', 'y', 'z'], 'm/s²');
        this.accelerationIncludingGravityTarget.textContent = this.formatVector(gravity, ['x', 'y', 'z'], 'm/s²');
        this.rotationRateTarget.textContent = this.formatVector(rotation, ['α', 'β', 'γ'], '°/s');
        this.intervalTarget.textContent = Number.isFinite(detail.interval) ? `${detail.interval.toFixed(1)} ms` : 'Unavailable';

        const intensity = Math.hypot(acceleration.x || 0, acceleration.y || 0, acceleration.z || 0);
        this.intensityTarget.textContent = `${intensity.toFixed(2)} m/s²`;
        this.intensityBarTarget.style.transform = `translate3d(-${100 - Math.min(intensity / 20 * 100, 100)}%, 0, 0)`;

        const x = this.clamp((gravity.x || 0) * 8, -90, 90);
        const y = this.clamp(-(gravity.y || 0) * 8, -70, 70);
        this.markerTarget.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    detectShake(acceleration, now) {
        const intensity = Math.hypot(acceleration.x || 0, acceleration.y || 0, acceleration.z || 0);
        if (intensity >= 12 && now - this.lastShake >= 800) {
            this.lastShake = now;
            this.shakes += 1;
            this.shakeCountTarget.textContent = String(this.shakes);
        }
    }

    resetShakes() {
        this.shakes = 0;
        this.lastShake = 0;
        this.shakeCountTarget.textContent = '0';
    }

    vector(value = {}) {
        return {
            x: this.numberOrNull(value.x),
            y: this.numberOrNull(value.y),
            z: this.numberOrNull(value.z),
        };
    }

    rotation(value = {}) {
        return {
            x: this.numberOrNull(value.alpha),
            y: this.numberOrNull(value.beta),
            z: this.numberOrNull(value.gamma),
        };
    }

    formatVector(vector, labels, unit) {
        return [vector.x, vector.y, vector.z]
            .map((value, index) => `${labels[index]} ${value === null ? '—' : value.toFixed(2)}`)
            .join(' · ') + ` ${unit}`;
    }

    numberOrNull(value) {
        return Number.isFinite(value) ? value : null;
    }

    clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }
}
