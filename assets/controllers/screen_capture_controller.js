import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'audio',
        'audioInfo',
        'download',
        'duration',
        'message',
        'pipButton',
        'pipIcon',
        'pipLabel',
        'preferCurrentTab',
        'preview',
        'recording',
        'result',
        'resultSummary',
        'session',
        'startButton',
        'status',
        'statusIcon',
        'stopButton',
        'surfaceInfo',
        'surfaceSwitching',
    ];

    connect() {
        this.stream = null;
        this.chunks = [];
        this.recordingUrl = null;
        this.startedAt = null;
        this.onEnterPictureInPicture = () => this.updatePictureInPictureState(true);
        this.onLeavePictureInPicture = () => this.updatePictureInPictureState(false);
        this.previewTarget.addEventListener('enterpictureinpicture', this.onEnterPictureInPicture);
        this.previewTarget.addEventListener('leavepictureinpicture', this.onLeavePictureInPicture);

        if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
            this.unsupported();
            return;
        }

        this.statusTarget.textContent = 'Ready to capture a screen';
        this.messageTarget.textContent = 'Start capture to open the browser’s screen, window, and tab picker.';
    }

    disconnect() {
        this.stopTimer();
        this.previewTarget.removeEventListener('enterpictureinpicture', this.onEnterPictureInPicture);
        this.previewTarget.removeEventListener('leavepictureinpicture', this.onLeavePictureInPicture);
        this.closePictureInPicture();
        this.bundleController()?.stop();
        this.revokeRecordingUrl();
    }

    start() {
        const bundle = this.bundleController();
        if (!bundle) return;

        this.revokeRecordingUrl();
        this.resultTarget.hidden = true;
        this.chunks = [];
        this.startButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Waiting for a capture source…';
        this.messageTarget.textContent = 'Select a browser tab, application window, or screen in the browser dialog.';
        this.statusIconTarget.textContent = 'hourglass_top';

        bundle.capture({
            params: {
                videoConstraints: true,
                audioConstraints: this.audioTarget.checked,
                preferCurrentTab: this.preferCurrentTabTarget.checked,
                selfBrowserSurface: 'include',
                surfaceSwitching: this.surfaceSwitchingTarget.checked ? 'include' : 'exclude',
                systemAudio: this.audioTarget.checked ? 'include' : 'exclude',
            },
        });
    }

    stop() {
        this.stopButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Stopping screen capture…';
        this.messageTarget.textContent = 'Finalizing the recording and releasing the shared surface.';
        this.statusIconTarget.textContent = 'hourglass_bottom';
        this.bundleController()?.stop();
    }

    captureStarted({ detail }) {
        this.stream = detail.stream;
        this.chunks = [];
        this.previewTarget.srcObject = this.stream;
        this.sessionTarget.hidden = false;
        this.startButtonTarget.hidden = true;
        this.startButtonTarget.disabled = false;
        this.stopButtonTarget.disabled = false;
        this.pipButtonTarget.hidden = !this.pictureInPictureSupported();
        this.describeTracks();
        this.startedAt = Date.now();
        this.timer = window.setInterval(() => this.updateDuration(), 1000);
        this.updateDuration();
        this.statusTarget.textContent = 'Screen capture active';
        this.messageTarget.textContent = 'The selected surface is streaming to the live preview.';
        this.statusIconTarget.textContent = 'screen_share';
    }

    describeTracks() {
        const video = this.stream.getVideoTracks()[0];
        const audio = this.stream.getAudioTracks()[0];
        const settings = video?.getSettings() || {};
        const surfaceNames = {
            browser: 'Browser tab',
            window: 'Application window',
            monitor: 'Entire screen',
        };
        this.surfaceInfoTarget.textContent = [
            surfaceNames[settings.displaySurface] || video?.label || 'Shared surface',
            settings.width && settings.height ? `${settings.width} × ${settings.height}` : null,
            settings.frameRate ? `${this.round(settings.frameRate)} fps` : null,
        ].filter(Boolean).join(' · ');
        this.audioInfoTarget.textContent = audio
            ? `${audio.label || 'Shared audio track'} is included in this capture.`
            : 'The selected source did not provide an audio track.';
    }

    recorderData({ detail }) {
        if (detail.data?.size) this.chunks.push(detail.data);
    }

    async captureStopped() {
        this.stopTimer();
        await this.closePictureInPicture();
        this.previewTarget.srcObject = null;
        this.stream = null;
        this.sessionTarget.hidden = true;
        this.startButtonTarget.hidden = false;
        this.startButtonTarget.disabled = false;
        this.stopButtonTarget.disabled = false;
        if (this.chunks.length) this.showResult();
        this.statusTarget.textContent = 'Screen sharing stopped';
        this.messageTarget.textContent = this.chunks.length
            ? 'The captured screen recording is ready to review or download.'
            : 'The shared surface has been released.';
        this.statusIconTarget.textContent = 'check_circle';
    }

    async togglePictureInPicture() {
        try {
            if (document.pictureInPictureElement === this.previewTarget) {
                await document.exitPictureInPicture();
                return;
            }
            await this.previewTarget.play();
            await this.previewTarget.requestPictureInPicture();
        } catch (error) {
            window.app.toast.create({
                text: error?.name === 'NotAllowedError'
                    ? 'Tap the button again while the live preview is active.'
                    : 'Picture-in-Picture could not be opened for this capture.',
            }).open();
        }
    }

    updatePictureInPictureState(active) {
        this.pipLabelTarget.textContent = active ? 'Return to page' : 'Open in PiP';
        this.pipIconTarget.textContent = active ? 'picture_in_picture_alt' : 'picture_in_picture';
    }

    pictureInPictureSupported() {
        return Boolean(document.pictureInPictureEnabled && this.previewTarget.requestPictureInPicture);
    }

    async closePictureInPicture() {
        if (document.pictureInPictureElement !== this.previewTarget) return;
        try {
            await document.exitPictureInPicture();
        } catch {
            // The browser may already be closing PiP as its media track ends.
        }
    }

    trackEnded() {
        this.statusTarget.textContent = 'Sharing ended from the browser';
        this.messageTarget.textContent = 'The browser’s native sharing control stopped the captured surface.';
        this.statusIconTarget.textContent = 'stop_screen_share';
    }

    showResult() {
        const mimeType = this.chunks.find(chunk => chunk.type)?.type || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.revokeRecordingUrl();
        this.recordingUrl = URL.createObjectURL(blob);
        this.recordingTarget.src = this.recordingUrl;
        this.downloadTarget.href = this.recordingUrl;
        const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        this.downloadTarget.download = `symphone-screen-capture.${extension}`;
        this.resultSummaryTarget.textContent = `Video · ${this.formatBytes(blob.size)}`;
        this.resultTarget.hidden = false;
    }

    error({ detail }) {
        const error = detail.error;
        const messages = {
            AbortError: ['Screen capture cancelled', 'No source was selected. Start capture when you are ready to try again.'],
            NotAllowedError: ['Screen sharing not allowed', 'The request was cancelled or blocked by browser or operating-system permissions.'],
            NotFoundError: ['No capture source available', 'The browser could not find a screen, window, or tab that can be shared.'],
            NotReadableError: ['Selected surface could not be captured', 'The operating system prevented the browser from reading that surface.'],
            InvalidStateError: ['Screen capture requires this page', 'Keep this page active and start capture directly from the button.'],
        };
        let [status, message] = messages[error?.name] || ['Could not start screen capture', error?.message || 'The browser rejected the capture request.'];
        if (error instanceof ReferenceError && String(error.message).includes('CaptureController')) {
            status = 'Capture controls unavailable';
            message = 'This browser supports screen sharing but not the CaptureController required by this PWA Bundle version.';
        }
        this.stopTimer();
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = 'error_outline';
        this.startButtonTarget.hidden = false;
        this.startButtonTarget.disabled = false;
        this.sessionTarget.hidden = true;
    }

    unsupported() {
        this.statusTarget.textContent = 'Screen Capture API unavailable';
        this.messageTarget.textContent = 'This browser does not expose the required getDisplayMedia() and MediaRecorder APIs.';
        this.statusIconTarget.textContent = 'desktop_access_disabled';
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

    round(value) {
        return Number(value).toFixed(Number(value) % 1 ? 1 : 0);
    }

    bundleController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--capture');
    }
}
