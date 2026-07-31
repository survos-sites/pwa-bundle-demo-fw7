import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'enterButton',
        'exitButton',
        'message',
        'status',
        'statusIcon',
    ];

    connect() {
        this.onFullscreenChange = ({ detail }) => this.update(detail.fullscreen, detail.element);
        this.onFullscreenError = () => this.showError();
        this.element.addEventListener('pwa--fullscreen:change', this.onFullscreenChange);
        this.element.addEventListener('pwa--fullscreen:error', this.onFullscreenError);

        if (!document.fullscreenEnabled || typeof document.documentElement.requestFullscreen !== 'function') {
            this.statusTarget.textContent = 'Fullscreen API unavailable';
            this.messageTarget.textContent = 'This browser does not allow web content to enter fullscreen.';
            this.statusIconTarget.textContent = 'xmark_circle';
            this.enterButtonTargets.forEach((button) => {
                button.disabled = true;
            });
            return;
        }

        this.statusTarget.textContent = 'Fullscreen API available';
    }

    disconnect() {
        this.element.removeEventListener('pwa--fullscreen:change', this.onFullscreenChange);
        this.element.removeEventListener('pwa--fullscreen:error', this.onFullscreenError);
    }

    update(fullscreen, element) {
        const labels = {
            'fullscreen-image-stage': 'The image viewer now occupies the display.',
            'fullscreen-element-stage': 'The selected DOM element now occupies the display.',
        };
        const message = element === document.documentElement
            ? 'The entire Symphone document now occupies the display.'
            : labels[element?.id];

        this.statusTarget.textContent = fullscreen ? 'Fullscreen is active' : 'Fullscreen API available';
        this.messageTarget.textContent = fullscreen
            ? message || 'The selected content now occupies the display.'
            : 'Choose whether to display an image, a particular element, or the whole app in fullscreen.';
        this.statusIconTarget.textContent = fullscreen
            ? 'rectangle_compress_vertical'
            : 'rectangle_expand_vertical';
        this.enterButtonTargets.forEach((button) => {
            button.disabled = fullscreen;
        });
        this.exitButtonTargets.forEach((button) => {
            button.disabled = !fullscreen;
        });
    }

    showError() {
        this.statusTarget.textContent = 'Fullscreen request was not completed';
        this.messageTarget.textContent = 'The browser or operating system declined the request.';
        this.statusIconTarget.textContent = 'exclamationmark_triangle';
    }
}
