import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'download',
        'duration',
        'message',
        'pipButton',
        'pipIcon',
        'pipLabel',
        'preview',
        'recording',
        'result',
        'resultSummary',
        'session',
        'slideStatus',
        'startButton',
        'status',
        'statusIcon',
        'stopButton',
        'swiper',
    ];

    connect() {
        this.stream = null;
        this.chunks = [];
        this.recordingUrl = null;
        this.startedAt = null;
        this.errorActive = false;
        this.onEnterPictureInPicture = () => this.updatePictureInPictureState(true);
        this.onLeavePictureInPicture = () => this.updatePictureInPictureState(false);
        this.previewTarget.addEventListener('enterpictureinpicture', this.onEnterPictureInPicture);
        this.previewTarget.addEventListener('leavepictureinpicture', this.onLeavePictureInPicture);
        this.onSlideChange = () => this.updateSlideStatus();
        this.swiperTarget.addEventListener('swiperslidechange', this.onSlideChange);
        requestAnimationFrame(() => this.updateSlideStatus());

        if (!this.elementCaptureSupported()) {
            this.unsupported();
            return;
        }

        this.statusTarget.textContent = 'Ready to capture an element';
        this.messageTarget.textContent = 'Start capture and select this Symphone tab in the browser sharing dialog.';
        this.statusIconTarget.textContent = 'select_all';
    }

    disconnect() {
        this.stopTimer();
        this.previewTarget.removeEventListener('enterpictureinpicture', this.onEnterPictureInPicture);
        this.previewTarget.removeEventListener('leavepictureinpicture', this.onLeavePictureInPicture);
        this.swiperTarget.removeEventListener('swiperslidechange', this.onSlideChange);
        this.closePictureInPicture();
        this.bundleController()?.stop();
        this.revokeRecordingUrl();
    }

    elementCaptureSupported() {
        return Boolean(
            navigator.mediaDevices?.getDisplayMedia
            && window.MediaRecorder
            && window.CaptureController
            && window.RestrictionTarget?.fromElement
        );
    }

    previousSlide() {
        this.swiperTarget.swiper?.slidePrev();
    }

    nextSlide() {
        this.swiperTarget.swiper?.slideNext();
    }

    updateSlideStatus() {
        const swiper = this.swiperTarget.swiper;
        this.slideStatusTarget.textContent = `Slide ${(swiper?.activeIndex ?? 0) + 1} of 3`;
    }

    start() {
        const bundle = this.bundleController();
        if (!bundle) return;

        this.errorActive = false;
        this.revokeRecordingUrl();
        this.resultTarget.hidden = true;
        this.chunks = [];
        this.startButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Waiting for this tab…';
        this.messageTarget.textContent = 'In the browser dialog, choose the current Symphone tab—not a window, screen, or different tab.';
        this.statusIconTarget.textContent = 'hourglass_top';
        bundle.capture({
            params: {
                videoConstraints: true,
                audioConstraints: false,
                preferCurrentTab: true,
                selfBrowserSurface: 'include',
                surfaceSwitching: 'exclude',
                systemAudio: 'exclude',
            },
        });
    }

    stop() {
        this.stopButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Stopping element capture…';
        this.messageTarget.textContent = 'Finalizing the recording and releasing the captured tab.';
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
        this.startedAt = Date.now();
        this.timer = window.setInterval(() => this.updateDuration(), 1000);
        this.updateDuration();
        this.statusTarget.textContent = 'Element restriction active';
        this.messageTarget.textContent = 'The MediaStream is restricted to the release-status card and its descendants.';
        this.statusIconTarget.textContent = 'select_all';
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

        if (this.errorActive) return;
        if (this.chunks.length) this.showResult();
        this.statusTarget.textContent = 'Element capture stopped';
        this.messageTarget.textContent = this.chunks.length
            ? 'The restricted recording is ready to review or download.'
            : 'The captured tab and restricted element have been released.';
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
                    ? 'Tap the button again while the restricted preview is active.'
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
        this.messageTarget.textContent = 'The browser’s native sharing control stopped the captured tab.';
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
        this.downloadTarget.download = `symphone-element-capture.${extension}`;
        this.resultSummaryTarget.textContent = `Video · ${this.formatBytes(blob.size)}`;
        this.resultTarget.hidden = false;
    }

    error({ detail }) {
        const error = detail.error;
        this.errorActive = true;
        const messages = {
            AbortError: ['Element capture cancelled', 'No tab was selected. Start capture when you are ready to try again.'],
            NotAllowedError: ['Element capture not allowed', 'The request was cancelled, blocked, or the target element was not eligible for restriction.'],
            NotFoundError: ['No browser tab available', 'The browser could not find a tab that can be captured.'],
            NotReadableError: ['Selected tab could not be captured', 'The browser or operating system prevented access to that tab.'],
            InvalidStateError: ['Current-tab capture required', 'Keep this page active and select this Symphone tab from the browser dialog.'],
        };
        let [status, message] = messages[error?.name] || ['Could not restrict the capture', error?.message || 'The browser rejected the Element Capture request.'];
        if (error instanceof ReferenceError && String(error.message).includes('CaptureController')) {
            status = 'CaptureController unavailable';
            message = 'This browser does not provide the capture controller required by PWA Bundle for Element Capture.';
        } else if (error instanceof TypeError && String(error.message).includes('restrictTo')) {
            status = 'The selected source cannot be restricted';
            message = 'Select the current Symphone browser tab. Windows, screens, and other tabs cannot be restricted to this element.';
        }
        this.stopTimer();
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = 'error_outline';
        this.startButtonTarget.hidden = false;
        this.startButtonTarget.disabled = false;
        this.sessionTarget.hidden = true;
        this.bundleController()?.stop();
    }

    unsupported() {
        this.statusTarget.textContent = 'Element Capture API unavailable';
        this.messageTarget.textContent = 'Use a compatible desktop Chromium browser with CaptureController, RestrictionTarget, and MediaRecorder support.';
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

    bundleController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--capture');
    }
}
