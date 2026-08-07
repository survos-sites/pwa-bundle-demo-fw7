import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'activeBadge',
        'activeCard',
        'activeMessage',
        'activeName',
        'activeUrl',
        'cancelButton',
        'emptyState',
        'fileList',
        'form',
        'notice',
        'noticeIcon',
        'noticeMessage',
        'noticeTitle',
        'percentage',
        'progressBar',
        'progressContainer',
        'size',
        'sizeItem',
        'startButton',
        'transferred',
        'url',
    ];

    connect() {
        this.activeId = null;
        this.activePath = null;
        this.detectedSizeUrl = null;
        this.pollTimer = null;
        this.restoreTimer = null;
        this.boundSubmit = event => this.start(event);
        this.boundCancel = () => this.cancel();
        this.boundUrlInput = () => this.resetFileSize();
        this.boundStarted = event => this.started(event);
        this.boundProgress = event => this.progress(event);
        this.boundCompleted = event => this.completed(event);
        this.boundFailed = event => this.failed(event);
        this.boundAborted = event => this.aborted(event);
        this.boundUnsupported = () => this.unsupported();
        this.boundExists = () => this.exists();
        this.boundNotFound = () => this.cancelUnavailable();
        this.boundCancelRefused = () => this.cancelUnavailable();

        this.formTarget.addEventListener('submit', this.boundSubmit);
        this.cancelButtonTarget.addEventListener('click', this.boundCancel);
        this.urlTarget.addEventListener('input', this.boundUrlInput);
        this.element.addEventListener('pwa--background-fetch:started', this.boundStarted);
        this.element.addEventListener('pwa--background-fetch:in-progress', this.boundProgress);
        this.element.addEventListener('pwa--background-fetch:completed', this.boundCompleted);
        this.element.addEventListener('pwa--background-fetch:failed', this.boundFailed);
        this.element.addEventListener('pwa--background-fetch:aborted', this.boundAborted);
        this.element.addEventListener('pwa--background-fetch:unsupported', this.boundUnsupported);
        this.element.addEventListener('pwa--background-fetch:exists', this.boundExists);
        this.element.addEventListener('pwa--background-fetch:not-found', this.boundNotFound);
        this.element.addEventListener('pwa--background-fetch:cancel-refused', this.boundCancelRefused);

        this.restoreTimer = window.setTimeout(() => {
            this.restoreTimer = null;
            this.restoreActiveDownloads();
            this.refreshFiles();
        }, 0);
        this.pollTimer = window.setInterval(() => this.poll(), 1500);
    }

    disconnect() {
        if (this.hasFormTarget) this.formTarget.removeEventListener('submit', this.boundSubmit);
        if (this.hasCancelButtonTarget) this.cancelButtonTarget.removeEventListener('click', this.boundCancel);
        if (this.hasUrlTarget) this.urlTarget.removeEventListener('input', this.boundUrlInput);
        this.element.removeEventListener('pwa--background-fetch:started', this.boundStarted);
        this.element.removeEventListener('pwa--background-fetch:in-progress', this.boundProgress);
        this.element.removeEventListener('pwa--background-fetch:completed', this.boundCompleted);
        this.element.removeEventListener('pwa--background-fetch:failed', this.boundFailed);
        this.element.removeEventListener('pwa--background-fetch:aborted', this.boundAborted);
        this.element.removeEventListener('pwa--background-fetch:unsupported', this.boundUnsupported);
        this.element.removeEventListener('pwa--background-fetch:exists', this.boundExists);
        this.element.removeEventListener('pwa--background-fetch:not-found', this.boundNotFound);
        this.element.removeEventListener('pwa--background-fetch:cancel-refused', this.boundCancelRefused);
        if (this.restoreTimer) window.clearTimeout(this.restoreTimer);
        if (this.pollTimer) window.clearInterval(this.pollTimer);
        this.restoreTimer = null;
        this.pollTimer = null;
    }

    async start(event) {
        event.preventDefault();
        if (!this.formTarget.reportValidity()) return;

        const controller = this.bundleController();
        if (!controller) {
            this.showNotice('Controller unavailable', 'The PWA Bundle Background Fetch controller is not connected.', 'exclamationmark_triangle');
            return;
        }

        let url;
        try {
            url = new URL(this.urlTarget.value, window.location.href);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
            this.showNotice('Invalid file URL', 'Enter a valid HTTP or HTTPS URL that points directly to a file.', 'exclamationmark_triangle');
            return;
        }

        const name = this.fileName(url);
        this.startButtonTarget.disabled = true;

        let downloadTotal = this.detectedSizeUrl === url.href || !this.sizeItemTarget.classList.contains('display-none')
            ? Number(this.sizeTarget.value)
            : 0;
        if (!Number.isSafeInteger(downloadTotal) || downloadTotal <= 0) {
            this.showNotice('Reading file metadata', 'Symphone is requesting the file size from the server before starting the background fetch.', 'info_circle');
            try {
                downloadTotal = await this.detectFileSize(url);
                this.sizeTarget.value = String(downloadTotal);
                this.detectedSizeUrl = url.href;
                this.sizeItemTarget.classList.add('display-none');
            } catch (error) {
                this.sizeItemTarget.classList.remove('display-none');
                this.startButtonTarget.disabled = false;
                this.showNotice(
                    'File size unavailable',
                    `${this.fileSizeError(error)} Enter the exact file size in bytes to continue.`,
                    'exclamationmark_triangle',
                );
                this.sizeTarget.focus();
                return;
            }
        }
        this.activeId = `symphone-download-${Date.now()}`;
        this.activePath = url.pathname;
        this.activeCardTarget.hidden = false;
        this.activeNameTarget.textContent = name;
        this.activeUrlTarget.textContent = url.href;
        this.activeBadgeTarget.textContent = 'Starting';
        this.activeBadgeTarget.className = 'badge color-blue';
        this.activeMessageTarget.textContent = 'Handing the file and expected size to the browser background-fetch manager…';
        this.setProgress(0, 0);
        this.startButtonTarget.disabled = true;
        this.noticeTarget.hidden = true;

        try {
            await controller.download({
                params: {
                    id: this.activeId,
                    url: url.href,
                    title: name,
                    downloadTotal,
                },
            });
        } catch (error) {
            this.startButtonTarget.disabled = false;
            this.activeBadgeTarget.textContent = 'Failed';
            this.activeBadgeTarget.className = 'badge color-red';
            this.activeMessageTarget.textContent = this.errorMessage(error);
            this.cancelButtonTarget.hidden = true;
        }
    }

    started({ detail }) {
        if (detail.id !== this.activeId) return;
        this.activeBadgeTarget.textContent = 'Downloading';
        this.activeBadgeTarget.className = 'badge color-blue';
        this.activeMessageTarget.textContent = 'The browser is downloading this file in the background.';
        this.cancelButtonTarget.hidden = false;
    }

    progress({ detail }) {
        if (!this.activeId) {
            this.showExistingDownload(detail);
        }
        if (detail.id !== this.activeId) return;

        const downloaded = Number(detail.downloaded ?? 0);
        const reportedTotal = Number(detail.downloadTotal ?? 0);
        const detectedTotal = Number(this.sizeTarget.value);
        const total = reportedTotal > 0 ? reportedTotal : detectedTotal;
        this.setProgress(downloaded, total);
        this.activeBadgeTarget.textContent = total > 0 && downloaded >= total ? 'Processing' : 'Downloading';
        if (total > 0 && downloaded >= total) {
            this.activeMessageTarget.textContent = 'The transfer is complete. Symphone is storing the response for offline access.';
        } else if (downloaded === 0) {
            this.activeMessageTarget.textContent = 'Chrome is managing this transfer without exposing byte progress to the page. Track it in the browser download UI.';
        } else {
            this.activeMessageTarget.textContent = 'The transfer is managed by the browser and may continue outside Symphone.';
        }
    }

    completed({ detail }) {
        this.refreshFiles();
        if (detail.id !== this.activePath) return;
        this.finishActive('Download complete', 'The file is now available from Downloaded files.', 'Ready', 'green');
        this.showNotice('File available offline', 'Open or save the completed download below.', 'checkmark_circle_fill');
    }

    failed({ detail }) {
        if (detail.id !== this.activeId) return;
        this.finishActive('Download failed', 'The browser could not complete this background fetch.', 'Failed', 'red');
    }

    aborted({ detail }) {
        if (detail.id !== this.activeId) return;
        this.finishActive('Download cancelled', 'No partial file was added to offline storage.', 'Cancelled', 'gray');
    }

    exists() {
        this.startButtonTarget.disabled = false;
        this.showNotice('Download already registered', 'Wait for the existing background fetch to finish or cancel it first.', 'info_circle');
    }

    cancelUnavailable() {
        this.cancelButtonTarget.disabled = false;
        this.showNotice('Download cannot be cancelled', 'The background fetch has already finished, failed, or is no longer registered.', 'info_circle');
    }

    unsupported() {
        this.startButtonTarget.disabled = true;
        this.showNotice(
            'Background Fetch API unavailable',
            'Open Symphone in a supported Chromium-based browser over HTTPS to run this demo.',
            'xmark_circle',
        );
    }

    async cancel() {
        if (!this.activeId) return;
        this.cancelButtonTarget.disabled = true;
        try {
            await this.bundleController()?.cancel({ params: { id: this.activeId } });
        } catch (error) {
            this.cancelButtonTarget.disabled = false;
            this.showNotice('Could not cancel the download', this.errorMessage(error), 'exclamationmark_triangle');
        }
    }

    async poll() {
        await this.refreshActive();
        await this.refreshFiles();
    }

    async restoreActiveDownloads() {
        try {
            const registration = await navigator.serviceWorker.ready;
            if (!('backgroundFetch' in registration)) return;
            const ids = await registration.backgroundFetch.getIds();
            for (const id of ids) {
                const fetch = await registration.backgroundFetch.get(id);
                if (!fetch || fetch.result !== '') continue;
                const records = await fetch.matchAll();
                const url = records[0]?.request?.url;
                if (!url) continue;
                this.activeId = id;
                this.activePath = new URL(url).pathname;
                this.showExistingDownload({
                    id,
                    downloaded: fetch.downloaded,
                    downloadTotal: fetch.downloadTotal,
                    urls: [url],
                });
                break;
            }
        } catch {
            // The bundle controller reports unsupported browsers separately.
        }
    }

    showExistingDownload(detail) {
        const url = detail.urls?.[0] ?? '';
        this.activeId = detail.id;
        this.activePath = url ? new URL(url).pathname : this.activePath;
        this.activeCardTarget.hidden = false;
        this.activeNameTarget.textContent = url ? this.fileName(new URL(url)) : 'Background download';
        this.activeUrlTarget.textContent = url;
        this.activeBadgeTarget.textContent = 'Downloading';
        this.activeBadgeTarget.className = 'badge color-blue';
        this.activeMessageTarget.textContent = 'This background fetch was restored from the browser.';
        this.cancelButtonTarget.hidden = false;
        this.startButtonTarget.disabled = true;
        this.setProgress(Number(detail.downloaded ?? 0), Number(detail.downloadTotal ?? 0));
    }

    async refreshActive() {
        if (!this.activeId) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const fetch = await registration.backgroundFetch.get(this.activeId);
            if (!fetch) {
                await this.finishFromStoredFile();
                return;
            }
            if (fetch.result === 'failure') {
                this.finishActive('Download failed', 'The browser could not complete this background fetch.', 'Failed', 'red');
                return;
            }
            if (fetch.result !== 'success') {
                this.progress({
                    detail: {
                        id: this.activeId,
                        downloaded: fetch.downloaded,
                        downloadTotal: fetch.downloadTotal,
                    },
                });
                return;
            }

            const files = await this.bundleController().getStoredFiles();
            if (!files.some(file => file.id === this.activePath)) return;
            this.setProgress(fetch.downloadTotal || fetch.downloaded, fetch.downloadTotal || fetch.downloaded);
            this.finishActive('Download complete', 'The file is now available from Downloaded files.', 'Ready', 'green');
            this.showNotice('File available offline', 'Open or save the completed download below.', 'checkmark_circle_fill');
        } catch {
            // A later poll can retry while the service worker finalizes storage.
        }
    }

    async finishFromStoredFile() {
        const files = await this.bundleController().getStoredFiles();
        if (!files.some(file => file.id === this.activePath)) return;
        this.finishActive('Download complete', 'The file is now available from Downloaded files.', 'Ready', 'green');
        this.showNotice('File available offline', 'Open or save the completed download below.', 'checkmark_circle_fill');
    }

    finishActive(title, message, badge, color) {
        this.activeNameTarget.textContent = title;
        this.activeMessageTarget.textContent = message;
        this.activeBadgeTarget.textContent = badge;
        this.activeBadgeTarget.className = `badge color-${color}`;
        this.cancelButtonTarget.hidden = true;
        this.cancelButtonTarget.disabled = false;
        this.startButtonTarget.disabled = false;
        this.activeId = null;
        this.activePath = null;
    }

    async refreshFiles() {
        const controller = this.bundleController();
        if (!controller) return;
        try {
            const files = await controller.getStoredFiles();
            this.renderFiles(files);
        } catch {
            // IndexedDB may be unavailable in private browsing or restricted contexts.
        }
    }

    renderFiles(files) {
        this.emptyStateTarget.hidden = files.length > 0;
        this.fileListTarget.replaceChildren(...files.map(file => this.fileItem(file)));
    }

    fileItem(file) {
        const item = document.createElement('li');
        const content = document.createElement('div');
        content.className = 'item-content';

        const media = document.createElement('div');
        media.className = 'item-media';
        const icon = document.createElement('i');
        icon.className = 'icon f7-icons color-primary';
        icon.textContent = this.fileIcon(file.contentType);
        media.append(icon);

        const inner = document.createElement('div');
        inner.className = 'item-inner';
        const titleRow = document.createElement('div');
        titleRow.className = 'item-title-row';
        const title = document.createElement('div');
        title.className = 'item-title';
        title.textContent = file.name || 'Downloaded file';
        titleRow.append(title);
        const subtitle = document.createElement('div');
        subtitle.className = 'item-subtitle';
        subtitle.textContent = file.contentType || 'Unknown file type';

        const actions = document.createElement('div');
        actions.className = 'segmented margin-top-half';
        actions.append(
            this.fileButton('Open', 'eye', () => this.openFile(file, false)),
            this.fileButton('Save', 'square_arrow_down', () => this.openFile(file, true)),
            this.fileButton('Delete', 'trash', () => this.deleteFile(file), 'color-red'),
        );
        inner.append(titleRow, subtitle, actions);
        content.append(media, inner);
        item.append(content);
        return item;
    }

    fileButton(label, iconName, handler, color = '') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `button button-small button-outline ${color}`.trim();
        const icon = document.createElement('i');
        icon.className = 'icon f7-icons';
        icon.textContent = iconName;
        const text = document.createElement('span');
        text.textContent = label;
        button.append(icon, text);
        button.addEventListener('click', handler);
        return button;
    }

    async openFile(file, save) {
        await this.bundleController().get({
            preventDefault() {},
            params: { url: file.id, name: save ? file.name : null },
        });
    }

    async deleteFile(file) {
        await this.bundleController().delete({ params: { url: file.id } });
        await this.refreshFiles();
        this.showNotice('Download removed', `${file.name || 'The file'} was deleted from offline storage.`, 'trash');
    }

    setProgress(downloaded, total) {
        const progressUnavailable = downloaded === 0 && total > 0 && this.activeId !== null;
        this.progressContainerTarget.classList.toggle('progressbar-infinite', progressUnavailable);
        this.progressContainerTarget.classList.toggle('progressbar', !progressUnavailable);

        if (progressUnavailable) {
            this.progressBarTarget.style.transform = '';
            this.percentageTarget.textContent = 'Browser managed';
            this.transferredTarget.textContent = `${this.formatBytes(total)} download`;
            return;
        }

        const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
        this.progressBarTarget.style.transform = `translate3d(-${100 - percent}%, 0, 0)`;
        this.percentageTarget.textContent = total > 0 ? `${percent}%` : '—';
        this.transferredTarget.textContent = total > 0
            ? `${this.formatBytes(downloaded)} of ${this.formatBytes(total)}`
            : downloaded > 0 ? `${this.formatBytes(downloaded)} downloaded` : 'Waiting for progress…';
    }

    showNotice(title, message, icon) {
        this.noticeTarget.hidden = false;
        this.noticeTitleTarget.textContent = title;
        this.noticeMessageTarget.textContent = message;
        this.noticeIconTarget.textContent = icon;
    }

    fileName(url) {
        return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || 'download');
    }

    async detectFileSize(url) {
        const response = await fetch(url.href, {
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-store',
            credentials: 'omit',
        });
        if (!response.ok) throw new Error(`The metadata request returned HTTP ${response.status}.`);

        const contentLength = Number(response.headers.get('Content-Length'));
        if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
            throw new Error('The server did not expose a valid Content-Length header.');
        }

        return contentLength;
    }

    resetFileSize() {
        this.detectedSizeUrl = null;
        this.sizeTarget.value = '';
        this.sizeItemTarget.classList.add('display-none');
    }

    fileSizeError(error) {
        if (error instanceof TypeError) {
            return 'The server blocked the metadata request or does not allow cross-origin access.';
        }
        return error?.message || 'The file size could not be detected.';
    }

    fileIcon(type = '') {
        if (type.startsWith('video/')) return 'film';
        if (type.startsWith('audio/')) return 'music_note_2';
        if (type.startsWith('image/')) return 'photo';
        return 'doc';
    }

    formatBytes(value) {
        if (!Number.isFinite(value) || value <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
        return `${(value / (1024 ** unit)).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
    }

    errorMessage(error) {
        if (error?.name === 'NotAllowedError') return 'The browser or user denied this background download.';
        if (error?.message?.toLowerCase().includes('permission')) return 'This browser did not grant the origin permission to start a background fetch.';
        if (error?.name === 'TypeError') return 'The URL could not be fetched. Check that it is direct, reachable, and permits cross-origin requests.';
        return error?.message || 'The background download could not be started.';
    }

    bundleController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--background-fetch');
    }
}
