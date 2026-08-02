import { Controller } from '@hotwired/stimulus';
import L from 'leaflet';
import 'leaflet/dist/leaflet.min.css';

export default class extends Controller {
    static targets = [
        'accuracy',
        'accuracySummary',
        'altitude',
        'heading',
        'latitude',
        'locateButton',
        'longitude',
        'map',
        'mapLink',
        'message',
        'result',
        'speed',
        'status',
        'statusIcon',
        'stopBlock',
        'updated',
        'watchButton',
    ];

    connect() {
        this.positionValue = null;
        this.mapInstance = null;
        this.marker = null;
        this.accuracyCircle = null;

        if (!('geolocation' in navigator)) {
            this.unsupported();
        }
    }

    disconnect() {
        const bundle = this.application.getControllerForElementAndIdentifier(this.element, 'pwa--geolocation');
        bundle?.clearWatch();
        this.mapInstance?.remove();
        this.mapInstance = null;
    }

    locating() {
        this.setBusy('Requesting current position…', 'Waiting for getCurrentPosition() to return a result.');
    }

    watching() {
        this.setBusy('Starting position watch…', 'watchPosition() will report updated coordinates until the watch is cleared.');
        this.watchButtonTarget.disabled = true;
        this.stopBlockTarget.hidden = false;
    }

    position({ detail }) {
        const position = detail.position;
        if (!position?.coords) return;

        this.positionValue = position;
        const { coords } = position;
        this.latitudeTarget.textContent = this.coordinate(coords.latitude);
        this.longitudeTarget.textContent = this.coordinate(coords.longitude);
        this.accuracyTarget.textContent = this.metres(coords.accuracy);
        this.altitudeTarget.textContent = this.metres(coords.altitude);
        this.headingTarget.textContent = Number.isFinite(coords.heading) ? `${coords.heading.toFixed(1)}°` : 'Unavailable';
        this.speedTarget.textContent = Number.isFinite(coords.speed) ? `${coords.speed.toFixed(1)} m/s` : 'Unavailable';
        this.accuracySummaryTarget.textContent = `Accurate to approximately ${this.metres(coords.accuracy)}`;
        this.updatedTarget.textContent = `Updated ${new Date(position.timestamp).toLocaleTimeString()}`;
        this.mapLinkTarget.href = this.openStreetMapUrl(coords.latitude, coords.longitude);
        this.resultTarget.hidden = false;
        this.locateButtonTarget.disabled = false;
        this.statusTarget.textContent = 'Position received';
        this.messageTarget.textContent = this.stopBlockTarget.hidden
            ? 'getCurrentPosition() returned the coordinate data shown below.'
            : 'The position watch is active and will update this view when new coordinates are reported.';
        this.statusIconTarget.textContent = 'checkmark_circle';
        this.updateMap(coords);
    }

    error({ detail }) {
        const error = detail.error;
        const messages = {
            1: ['Location permission denied', 'Allow location access in browser settings, then try again.'],
            2: ['Location unavailable', 'The device could not determine its position. Check location services and signal.'],
            3: ['Location request timed out', 'The device took too long to determine its position. Try again outdoors or with a stronger signal.'],
        };
        const [status, message] = messages[error?.code] || ['Location could not be retrieved', error?.message || 'Please try again.'];
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = 'exclamationmark_triangle';
        this.locateButtonTarget.disabled = false;
        this.watchButtonTarget.disabled = false;
        this.stopBlockTarget.hidden = true;
    }

    unsupported() {
        this.statusTarget.textContent = 'Geolocation API unavailable';
        this.messageTarget.textContent = 'This browser does not provide access to device location.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.locateButtonTarget.disabled = true;
        this.watchButtonTarget.disabled = true;
        this.stopBlockTarget.hidden = true;
    }

    watchCleared() {
        this.statusTarget.textContent = this.positionValue ? 'Position watch cleared' : 'Ready to request a position';
        this.messageTarget.textContent = this.positionValue
            ? 'The last reported position remains available below.'
            : 'Request one position or start a continuous position watch.';
        this.statusIconTarget.textContent = this.positionValue ? 'pause_circle' : 'location_circle';
        this.watchButtonTarget.disabled = false;
        this.stopBlockTarget.hidden = true;
    }

    async copy() {
        if (!this.positionValue) return;
        const { latitude, longitude } = this.positionValue.coords;
        await navigator.clipboard.writeText(`${latitude}, ${longitude}`);
        this.statusTarget.textContent = 'Coordinates copied';
        this.messageTarget.textContent = 'Paste them into a map, message, or navigation app.';
        this.statusIconTarget.textContent = 'doc_on_clipboard_fill';
    }

    setBusy(status, message) {
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = 'location_circle';
        this.locateButtonTarget.disabled = true;
    }

    updateMap(coords) {
        const point = [coords.latitude, coords.longitude];
        if (!this.mapInstance) {
            this.mapInstance = L.map(this.mapTarget, { zoomControl: true }).setView(point, 16);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(this.mapInstance);
            this.marker = L.circleMarker(point, {
                radius: 8,
                color: '#ffffff',
                weight: 3,
                fillColor: '#007aff',
                fillOpacity: 1,
            }).addTo(this.mapInstance);
            this.accuracyCircle = L.circle(point, {
                radius: coords.accuracy,
                color: '#007aff',
                weight: 1,
                fillColor: '#007aff',
                fillOpacity: 0.12,
            }).addTo(this.mapInstance);
            window.requestAnimationFrame(() => this.mapInstance?.invalidateSize());
            return;
        }

        this.marker.setLatLng(point);
        this.accuracyCircle.setLatLng(point).setRadius(coords.accuracy);
        this.mapInstance.setView(point, this.mapInstance.getZoom());
    }

    coordinate(value) {
        return Number.isFinite(value) ? value.toFixed(6) : 'Unavailable';
    }

    metres(value) {
        return Number.isFinite(value) ? `${Math.round(value)} m` : 'Unavailable';
    }

    openStreetMapUrl(latitude, longitude) {
        return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    }
}
