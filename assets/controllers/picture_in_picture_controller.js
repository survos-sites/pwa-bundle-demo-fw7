import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'button',
        'buttonLabel',
        'documentButton',
        'documentButtonLabel',
        'documentDemo',
        'documentMessage',
        'documentStatus',
        'documentStatusIcon',
        'durationButton',
        'message',
        'pauseButton',
        'resetButton',
        'startButton',
        'status',
        'statusIcon',
        'timerDisplay',
        'timerPanel',
        'timerProgress',
        'timerStatus',
        'video',
    ];

    connect() {
        this.onEnter = () => this.updateState(true);
        this.onLeave = () => this.updateState(false);
        this.onDocumentEnter = ({ detail }) => this.documentEntered(detail.pipWindow);
        this.onDocumentExit = () => this.updateDocumentState(false);
        this.onStart = () => this.startTimer();
        this.onPause = () => this.pauseTimer();
        this.onReset = () => this.resetTimer();
        this.onDuration = (event) => this.setDuration(Number(event.currentTarget.dataset.duration), event.currentTarget);
        this.videoTarget.addEventListener('enterpictureinpicture', this.onEnter);
        this.videoTarget.addEventListener('leavepictureinpicture', this.onLeave);
        this.documentDemo = this.documentDemoTarget;
        this.timerPanel = this.timerPanelTarget;
        this.timerDisplay = this.timerDisplayTarget;
        this.timerProgress = this.timerProgressTarget;
        this.timerStatus = this.timerStatusTarget;
        this.startButton = this.startButtonTarget;
        this.pauseButton = this.pauseButtonTarget;
        this.resetButton = this.resetButtonTarget;
        this.durationButtons = this.durationButtonTargets;
        this.startButton.addEventListener('click', this.onStart);
        this.pauseButton.addEventListener('click', this.onPause);
        this.resetButton.addEventListener('click', this.onReset);
        this.durationButtons.forEach((button) => button.addEventListener('click', this.onDuration));
        this.documentDemo.addEventListener('pwa--picture-in-picture:enter', this.onDocumentEnter);
        this.documentDemo.addEventListener('pwa--picture-in-picture:exit', this.onDocumentExit);
        this.timerDuration = 5 * 60;
        this.remaining = this.timerDuration;
        this.timer = null;
        this.checkSupport();
        this.checkDocumentSupport();
        this.renderTimer();
    }

    disconnect() {
        this.videoTarget.removeEventListener('enterpictureinpicture', this.onEnter);
        this.videoTarget.removeEventListener('leavepictureinpicture', this.onLeave);
        this.startButton.removeEventListener('click', this.onStart);
        this.pauseButton.removeEventListener('click', this.onPause);
        this.resetButton.removeEventListener('click', this.onReset);
        this.durationButtons.forEach((button) => button.removeEventListener('click', this.onDuration));
        this.documentDemo.removeEventListener('pwa--picture-in-picture:enter', this.onDocumentEnter);
        this.documentDemo.removeEventListener('pwa--picture-in-picture:exit', this.onDocumentExit);
        this.stopTimerInterval();
        if (document.pictureInPictureElement === this.videoTarget) {
            document.exitPictureInPicture();
        }
        window.documentPictureInPicture?.window?.close();
    }

    checkSupport() {
        const supported = document.pictureInPictureEnabled
            && typeof this.videoTarget.requestPictureInPicture === 'function';
        if (supported) {
            this.statusTarget.textContent = 'Video Picture-in-Picture available';
            this.messageTarget.textContent = 'Start playback and open the video in the browser\'s native floating player.';
            return;
        }

        this.statusTarget.textContent = 'Video Picture-in-Picture unavailable';
        this.messageTarget.textContent = 'This browser does not expose HTMLVideoElement.requestPictureInPicture().';
        this.statusIconTarget.textContent = 'block';
        this.buttonTarget.disabled = true;
    }

    checkDocumentSupport() {
        if (!('documentPictureInPicture' in window)) {
            this.documentStatusTarget.textContent = 'Document Picture-in-Picture unavailable';
            this.documentMessageTarget.textContent = 'This browser does not expose the Document Picture-in-Picture API.';
            this.documentStatusIconTarget.textContent = 'xmark_circle';
            this.documentButtonTarget.disabled = true;
            return;
        }

        const controllers = this.documentDemo.getAttribute('data-controller')?.split(/\s+/).filter(Boolean) || [];
        this.documentDemo.setAttribute('data-controller', [...controllers, 'pwa--picture-in-picture'].join(' '));
        this.documentStatusTarget.textContent = 'Document Picture-in-Picture available';
    }

    async toggle() {
        this.buttonTarget.disabled = true;
        try {
            if (document.pictureInPictureElement === this.videoTarget) {
                await document.exitPictureInPicture();
            } else {
                if (this.videoTarget.paused) {
                    await this.videoTarget.play();
                }
                await this.videoTarget.requestPictureInPicture();
            }
        } catch (error) {
            this.statusTarget.textContent = 'Video could not enter Picture-in-Picture';
            this.messageTarget.textContent = error?.message || 'The browser rejected the Picture-in-Picture request.';
            this.statusIconTarget.textContent = 'error_outline';
        } finally {
            this.buttonTarget.disabled = false;
        }
    }

    updateState(active) {
        this.statusTarget.textContent = active ? 'Video playing in Picture-in-Picture' : 'Video returned to this page';
        this.messageTarget.textContent = active
            ? 'Switch tabs or applications to verify that the native floating player remains visible.'
            : 'Playback continues in the page and can be opened in Picture-in-Picture again.';
        this.statusIconTarget.textContent = active ? 'picture_in_picture_alt' : 'picture_in_picture';
        this.buttonLabelTarget.textContent = active ? 'Return video to page' : 'Open video in PiP';
    }

    async toggleDocument() {
        const controller = this.application.getControllerForElementAndIdentifier(
            this.documentDemo,
            'pwa--picture-in-picture',
        );
        if (!controller) {
            this.documentStatusTarget.textContent = 'PWA Bundle controller is not ready';
            this.documentMessageTarget.textContent = 'Wait a moment and try opening the timer again.';
            return;
        }

        this.documentButtonTarget.disabled = true;
        try {
            await controller.toggle({ params: { propagateStyle: false } });
        } catch (error) {
            this.documentStatusTarget.textContent = 'Timer could not enter Picture-in-Picture';
            this.documentMessageTarget.textContent = error?.message || 'The browser rejected the Document Picture-in-Picture request.';
            this.documentStatusIconTarget.textContent = 'exclamationmark_triangle';
            this.documentButtonTarget.disabled = false;
        }
    }

    documentEntered(pipWindow) {
        const sourceRoot = document.documentElement;
        const sourceBody = document.body;
        pipWindow.document.documentElement.className = sourceRoot.className;
        pipWindow.document.documentElement.dir = sourceRoot.dir;
        pipWindow.document.documentElement.style.cssText = sourceRoot.style.cssText;
        pipWindow.document.body.className = sourceBody.className;
        pipWindow.document.body.classList.add('framework7-root');
        pipWindow.document.body.style.cssText = sourceBody.style.cssText;
        pipWindow.document.title = 'Focus timer | Symphone';
        this.copyStylesTo(pipWindow.document);
        this.updateDocumentState(true);
    }

    copyStylesTo(targetDocument) {
        document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((source) => {
            const copy = source.cloneNode(true);
            if (copy instanceof HTMLLinkElement) {
                copy.href = source.href;
            }
            targetDocument.head.append(copy);
        });
    }

    updateDocumentState(active) {
        this.documentStatusTarget.textContent = active ? 'Timer open in Picture-in-Picture' : 'Timer returned to Symphone';
        this.documentMessageTarget.textContent = active
            ? 'The Framework7 timer remains interactive in the floating document window.'
            : 'PWA Bundle restored the original timer element without resetting its state.';
        this.documentStatusIconTarget.textContent = active ? 'rectangle_on_rectangle_angled' : 'rectangle_on_rectangle';
        this.documentButtonLabelTarget.textContent = active ? 'Return timer to app' : 'Open timer in PiP';
        this.documentButtonTarget.disabled = false;
    }

    setDuration(minutes, selectedButton) {
        this.stopTimerInterval();
        this.timerDuration = minutes * 60;
        this.remaining = this.timerDuration;
        this.durationButtons.forEach((button) => button.classList.toggle('button-active', button === selectedButton));
        this.timerStatus.textContent = 'Ready to focus';
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.renderTimer();
    }

    startTimer() {
        if (this.timer || this.remaining <= 0) return;
        this.timerStatus.textContent = 'Focus session in progress';
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.timer = window.setInterval(() => {
            this.remaining -= 1;
            this.renderTimer();
            if (this.remaining <= 0) {
                this.stopTimerInterval();
                this.timerStatus.textContent = 'Focus session complete';
                this.startButton.disabled = true;
                this.pauseButton.disabled = true;
            }
        }, 1000);
    }

    pauseTimer() {
        this.stopTimerInterval();
        this.timerStatus.textContent = 'Focus session paused';
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
    }

    resetTimer() {
        this.stopTimerInterval();
        this.remaining = this.timerDuration;
        this.timerStatus.textContent = 'Ready to focus';
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.renderTimer();
    }

    stopTimerInterval() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }

    renderTimer() {
        const minutes = String(Math.floor(this.remaining / 60)).padStart(2, '0');
        const seconds = String(this.remaining % 60).padStart(2, '0');
        const progress = ((this.timerDuration - this.remaining) / this.timerDuration) * 100;
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
        this.timerProgress.setAttribute('aria-valuenow', String(Math.round(progress)));
        window.app.progressbar.set(this.timerProgress, progress);
    }
}
