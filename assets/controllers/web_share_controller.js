import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'action',
        'fileSummary',
        'files',
        'message',
        'status',
        'statusIcon',
        'text',
        'title',
        'url',
    ];

    connect() {
        this.objectUrls = [];
        this.onSuccess = () => this.showSuccess();
        this.onError = ({ detail }) => this.showError(detail.error);
        this.element.addEventListener('pwa--web-share:success', this.onSuccess);
        this.element.addEventListener('pwa--web-share:error', this.onError);

        if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
            this.statusTarget.textContent = 'Web Share API unavailable';
            this.messageTarget.textContent = 'Open this page in a browser that supports the Web Share API.';
            this.statusIconTarget.textContent = 'xmark_circle';
            this.actionTarget.disabled = true;
            return;
        }

        this.statusTarget.textContent = 'Ready to share';
    }

    disconnect() {
        this.element.removeEventListener('pwa--web-share:success', this.onSuccess);
        this.element.removeEventListener('pwa--web-share:error', this.onError);
        this.releaseObjectUrls();
    }

    async share(event) {
        event.preventDefault();

        const data = this.buildShareData();
        if (Object.keys(data).length === 0) {
            this.statusTarget.textContent = 'Add something to share';
            this.messageTarget.textContent = 'Enter a title, text, URL, or choose at least one file.';
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
            return;
        }

        const webShareController = this.application.getControllerForElementAndIdentifier(
            this.element,
            'pwa--web-share',
        );
        if (!webShareController) {
            this.showError();
            return;
        }

        this.statusTarget.textContent = 'Opening share sheet…';
        this.messageTarget.textContent = 'Choose an app or contact for this content.';
        this.statusIconTarget.textContent = 'share';
        this.actionTarget.disabled = true;

        await webShareController.share({ params: { data } });
        this.actionTarget.disabled = false;
        this.releaseObjectUrls();
    }

    buildShareData() {
        this.releaseObjectUrls();

        const data = {};
        const title = this.titleTarget.value.trim();
        const text = this.textTarget.value.trim();
        const url = this.urlTarget.value.trim();

        if (title) data.title = title;
        if (text) data.text = text;
        if (url) data.url = url;

        const files = Array.from(this.filesTarget.files);
        if (files.length > 0) {
            this.objectUrls = files.map((file) => {
                const objectUrl = URL.createObjectURL(file);
                return `${objectUrl}#${encodeURIComponent(file.name)}`;
            });
            data.files = this.objectUrls;
        }

        return data;
    }

    updateFiles() {
        const files = Array.from(this.filesTarget.files);
        if (files.length === 0) {
            this.fileSummaryTarget.textContent = 'Optional. Choose one or more files supported by your browser.';
            return;
        }

        this.fileSummaryTarget.textContent = files.length === 1
            ? `${files[0].name} (${this.formatBytes(files[0].size)})`
            : `${files.length} files selected (${this.formatBytes(files.reduce((total, file) => total + file.size, 0))})`;
    }

    showSuccess() {
        this.statusTarget.textContent = 'Shared successfully';
        this.messageTarget.textContent = 'The content was handed to the selected app.';
        this.statusIconTarget.textContent = 'checkmark_circle';
    }

    showError(error) {
        if (error?.name === 'AbortError') {
            this.statusTarget.textContent = 'Sharing cancelled';
            this.messageTarget.textContent = 'Nothing was shared.';
            this.statusIconTarget.textContent = 'xmark_circle';
            return;
        }

        this.statusTarget.textContent = 'Could not share this content';
        this.messageTarget.textContent = this.filesTarget.files.length > 0
            ? 'One or more selected file types may not be supported by this browser.'
            : 'The browser or operating system declined the share request.';
        this.statusIconTarget.textContent = 'exclamationmark_triangle';
    }

    releaseObjectUrls() {
        this.objectUrls.forEach((url) => URL.revokeObjectURL(url.split('#', 1)[0]));
        this.objectUrls = [];
    }

    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
