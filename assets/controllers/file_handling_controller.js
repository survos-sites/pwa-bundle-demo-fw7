import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['empty', 'gallery', 'message', 'status', 'statusIcon'];

    connect() {
        this.openedFiles = [];
        this.renderVersion = 0;
        this.onSelected = ({ detail }) => this.receive(detail.data);
        this.onViewInit = () => this.navigateToPendingDemo();
        this.onBeforeUnload = () => this.releaseFiles();
        this.element.addEventListener('pwa--file-handling:selected', this.onSelected);
        window.addEventListener('beforeunload', this.onBeforeUnload);
        window.app?.on('viewInit', this.onViewInit);

        if (!('launchQueue' in window)) {
            return;
        }

        const controllers = this.element.getAttribute('data-controller')?.split(/\s+/) || [];
        if (!controllers.includes('pwa--file-handling')) {
            this.element.setAttribute('data-controller', [...controllers, 'pwa--file-handling'].join(' '));
        }
    }

    disconnect() {
        this.element.removeEventListener('pwa--file-handling:selected', this.onSelected);
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        window.app?.off('viewInit', this.onViewInit);
        this.releaseFiles();
    }

    statusTargetConnected() {
        const supported = 'launchQueue' in window;
        this.statusTarget.textContent = supported ? 'Ready to open images' : 'File Handling API unavailable';
        this.messageTarget.textContent = supported
            ? 'Open a supported image with the installed Symphone app.'
            : 'Use an installed desktop version of Chrome or Edge to test this feature.';
        this.statusIconTarget.textContent = supported ? 'folder' : 'xmark_circle';
    }

    galleryTargetConnected() {
        this.render();
    }

    receive(url) {
        if (!url || this.openedFiles.includes(url)) {
            return;
        }

        this.openedFiles.push(url);
        this.navigateToDemo();
        this.render();
    }

    navigateToDemo() {
        this.pendingDestination = `/${document.documentElement.dataset.locale}/file-handling`;
        this.navigateToPendingDemo();
    }

    navigateToPendingDemo() {
        if (!this.pendingDestination) {
            return;
        }

        const navigateWhenReady = (attempt = 0) => {
            const router = window.app?.views?.main?.router
                || document.querySelector('#view-main')?.f7View?.router;
            if (router) {
                if (router.currentRoute?.path !== this.pendingDestination) {
                    router.navigate(this.pendingDestination);
                }

                this.pendingDestination = null;
                return;
            }

            if (attempt < 600) {
                window.requestAnimationFrame(() => navigateWhenReady(attempt + 1));
            }
        };

        if (window.app?.initialized) {
            navigateWhenReady();
        } else {
            window.app?.once('init', () => {
                navigateWhenReady();
            });
        }
    }

    async render() {
        if (!this.hasGalleryTarget) {
            return;
        }

        const version = ++this.renderVersion;
        const files = await Promise.all(this.openedFiles.map(async (url, index) => {
            const response = await fetch(url);
            const blob = await response.blob();
            return { blob, index, url };
        }));
        if (version !== this.renderVersion || !this.hasGalleryTarget) {
            return;
        }

        this.galleryTarget.replaceChildren(...files.map((file) => this.createPreview(file)));
        if (this.hasEmptyTarget) {
            this.emptyTarget.hidden = files.length > 0;
        }
        if (files.length > 0 && this.hasStatusTarget) {
            this.statusTarget.textContent = files.length === 1 ? 'Image opened' : `${files.length} images opened`;
            this.messageTarget.textContent = 'The operating system delivered the selected file through the launch queue.';
            this.statusIconTarget.textContent = 'checkmark_circle';
        }
    }

    createPreview({ blob, index, url }) {
        const card = document.createElement('div');
        card.className = 'card card-outline';

        const header = document.createElement('div');
        header.className = 'card-header';
        header.textContent = `Opened image ${index + 1}`;

        const content = document.createElement('div');
        content.className = 'card-content card-content-padding';

        const image = document.createElement('img');
        image.src = url;
        image.alt = `Image ${index + 1} opened with Symphone`;
        image.style.cssText = 'display:block;width:100%;height:auto;';

        const details = document.createElement('p');
        details.className = 'text-color-gray no-margin-bottom';
        details.textContent = `${blob.type || 'Unknown media type'} · ${this.formatBytes(blob.size)}`;

        content.append(image, details);
        card.append(header, content);

        return card;
    }

    releaseFiles() {
        this.openedFiles.forEach((url) => URL.revokeObjectURL(url));
        this.openedFiles = [];
    }

    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
