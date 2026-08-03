import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'audioPreview',
        'camera',
        'cameraItem',
        'cameraSmartSelect',
        'download',
        'duration',
        'message',
        'microphone',
        'microphoneItem',
        'microphoneSmartSelect',
        'modeButton',
        'preview',
        'recordingAudio',
        'recordingVideo',
        'result',
        'resultSummary',
        'resultTitle',
        'session',
        'startButton',
        'status',
        'statusIcon',
        'stopButton',
    ];

    connect() {
        this.mode = 'both';
        this.chunks = [];
        this.stream = null;
        this.recordingUrl = null;
        this.startedAt = null;

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            this.unsupported();
            return;
        }

        requestAnimationFrame(() => {
            this.bundleController()?.getSupportedDevices();
            this.refreshDeviceSelectors();
            this.statusTarget.textContent = 'Ready to capture media';
            this.messageTarget.textContent = 'Choose camera and microphone sources, then start capture.';
        });
    }

    disconnect() {
        this.stopTimer();
        this.cameraSelect?.destroy();
        this.microphoneSelect?.destroy();
        this.bundleController()?.stop();
        this.revokeRecordingUrl();
    }

    selectMode(event) {
        this.mode = event.currentTarget.dataset.mode;
        this.modeButtonTargets.forEach(button => button.classList.toggle('button-active', button === event.currentTarget));
        this.cameraItemTarget.hidden = this.mode === 'audio';
        this.microphoneItemTarget.hidden = this.mode === 'video';
    }

    start() {
        const bundle = this.bundleController();
        if (!bundle) return;

        this.revokeRecordingUrl();
        this.resultTarget.hidden = true;
        this.chunks = [];
        this.startButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Requesting device access…';
        this.messageTarget.textContent = 'Approve the camera or microphone permission prompt shown by the browser.';
        this.statusIconTarget.textContent = 'hourglass_top';
        bundle.media({ params: { constraints: this.captureConstraints() } });
    }

    stop() {
        this.stopButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Stopping capture…';
        this.messageTarget.textContent = 'Finalizing the captured media and releasing its sources.';
        this.bundleController()?.stop();
    }

    captureConstraints() {
        const video = this.mode === 'audio' ? false : this.cameraTarget.value
            ? { deviceId: { exact: this.cameraTarget.value } }
            : true;
        const audio = this.mode === 'video' ? false : this.microphoneTarget.value
            ? { deviceId: { exact: this.microphoneTarget.value } }
            : true;
        return { video, audio };
    }

    devices({ detail }) {
        const devices = detail.devices || [];
        this.populateSelect(this.cameraTarget, devices.filter(device => device.kind === 'videoinput'), 'Default camera', 'Camera');
        this.populateSelect(this.microphoneTarget, devices.filter(device => device.kind === 'audioinput'), 'Default microphone', 'Microphone');
        this.refreshDeviceSelectors();
    }

    populateSelect(select, devices, defaultLabel, fallbackLabel) {
        const currentValue = select.value;
        select.replaceChildren(new Option(defaultLabel, ''));
        devices.forEach((device, index) => select.add(new Option(device.label || `${fallbackLabel} ${index + 1}`, device.deviceId)));
        if ([...select.options].some(option => option.value === currentValue)) select.value = currentValue;
    }

    refreshDeviceSelectors() {
        if (!window.app?.smartSelect) return;
        this.cameraSelect?.destroy();
        this.microphoneSelect?.destroy();
        this.cameraSelect = this.createSmartSelect(this.cameraSmartSelectTarget, 'Search cameras');
        this.microphoneSelect = this.createSmartSelect(this.microphoneSmartSelectTarget, 'Search microphones');
    }

    createSmartSelect(element, placeholder) {
        return window.app.smartSelect.create({
            el: element,
            openIn: 'popup',
            searchbar: true,
            searchbarPlaceholder: placeholder,
            appendSearchbarNotFound: true,
            closeOnSelect: true,
            scrollToSelectedItem: true,
        });
    }

    recorderStarted({ detail }) {
        this.stream = detail.stream;
        this.hasVideo = this.stream.getVideoTracks().length > 0;
        this.previewTarget.srcObject = this.stream;
        this.previewTarget.hidden = !this.hasVideo;
        this.audioPreviewTarget.hidden = this.hasVideo;
        this.sessionTarget.hidden = false;
        this.startButtonTarget.hidden = true;
        this.startButtonTarget.disabled = false;
        this.stopButtonTarget.disabled = false;
        this.startedAt = Date.now();
        this.timer = window.setInterval(() => this.updateDuration(), 1000);
        this.updateDuration();
        this.statusTarget.textContent = 'Media capture active';
        this.messageTarget.textContent = this.hasVideo ? 'The selected camera stream is visible below.' : 'The selected microphone stream is active.';
        this.statusIconTarget.textContent = 'sensors';
        this.bundleController()?.getSupportedDevices();
    }

    recorderData({ detail }) {
        if (detail.data?.size) this.chunks.push(detail.data);
    }

    recorderStopped() {
        this.stopTimer();
        this.previewTarget.srcObject = null;
        this.stream = null;
        this.sessionTarget.hidden = true;
        this.startButtonTarget.hidden = false;
        this.startButtonTarget.disabled = false;
        this.stopButtonTarget.disabled = false;
        if (this.chunks.length) this.showResult();
        this.statusTarget.textContent = 'Media sources released';
        this.messageTarget.textContent = this.chunks.length ? 'The captured media is ready to play or download.' : 'Capture stopped without recorded media.';
        this.statusIconTarget.textContent = 'check_circle';
    }

    showResult() {
        const mimeType = this.chunks.find(chunk => chunk.type)?.type || (this.hasVideo ? 'video/webm' : 'audio/webm');
        const blob = new Blob(this.chunks, { type: mimeType });
        this.revokeRecordingUrl();
        this.recordingUrl = URL.createObjectURL(blob);
        const media = this.hasVideo ? this.recordingVideoTarget : this.recordingAudioTarget;
        this.recordingVideoTarget.hidden = !this.hasVideo;
        this.recordingAudioTarget.hidden = this.hasVideo;
        media.src = this.recordingUrl;
        this.downloadTarget.href = this.recordingUrl;
        const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        this.downloadTarget.download = `symphone-media-capture.${extension}`;
        this.resultTitleTarget.textContent = this.hasVideo ? 'Captured video' : 'Captured audio';
        this.resultSummaryTarget.textContent = `${this.hasVideo ? 'Video' : 'Audio'} · ${this.formatBytes(blob.size)}`;
        this.resultTarget.hidden = false;
    }

    trackEnded() {
        this.statusTarget.textContent = 'Media source ended';
        this.messageTarget.textContent = 'The browser or device ended the active capture source.';
        this.statusIconTarget.textContent = 'stop_circle';
    }

    error({ detail }) {
        const error = detail.error;
        const messages = {
            NotAllowedError: ['Device access denied', 'Allow camera or microphone access in browser settings, then try again.'],
            NotFoundError: ['Media source unavailable', 'No camera or microphone matched the selected source.'],
            NotReadableError: ['Media source is busy', 'Close other apps using the selected source, then try again.'],
            OverconstrainedError: ['Selected source unavailable', 'Choose the default source and try again.'],
        };
        const [status, message] = messages[error?.name] || ['Could not start capture', error?.message || 'The browser rejected the media request.'];
        this.stopTimer();
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = 'error_outline';
        this.startButtonTarget.hidden = false;
        this.startButtonTarget.disabled = false;
        this.sessionTarget.hidden = true;
    }

    unsupported() {
        this.statusTarget.textContent = 'Media capture unavailable';
        this.messageTarget.textContent = 'This browser does not expose the required MediaDevices and MediaRecorder APIs.';
        this.statusIconTarget.textContent = 'videocam_off';
        this.startButtonTarget.disabled = true;
    }

    updateDuration() {
        if (!this.startedAt) return;
        const seconds = Math.floor((Date.now() - this.startedAt) / 1000);
        this.durationTarget.textContent = `Capturing · ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }

    stopTimer() {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
        this.startedAt = null;
    }

    revokeRecordingUrl() {
        if (this.recordingUrl) URL.revokeObjectURL(this.recordingUrl);
        this.recordingUrl = null;
    }

    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    bundleController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--capture');
    }
}
