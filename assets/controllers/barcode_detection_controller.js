import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'cameraBadge',
        'cameraButton',
        'cameraFooter',
        'cameraHint',
        'cameraPlaceholder',
        'file',
        'formats',
        'image',
        'imageButton',
        'imageCard',
        'message',
        'resultList',
        'results',
        'scanAgainButton',
        'status',
        'statusIcon',
        'video',
    ];

    connect() {
        this.stream = null;
        this.scanning = false;
        this.detecting = false;
        this.scanTimer = null;
        this.imageUrl = null;
        this.detectionSource = null;

        if (!('BarcodeDetector' in window)) {
            this.unsupported();
            return;
        }

        this.loadFormats();
        this.statusTarget.textContent = 'Barcode detector ready';
        this.messageTarget.textContent = 'Start the camera scanner or choose an image containing a barcode.';
        this.statusIconTarget.textContent = 'qr_code_scanner';
    }

    disconnect() {
        this.stopCamera();
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    }

    async loadFormats() {
        try {
            const formats = await window.BarcodeDetector.getSupportedFormats();
            this.formatsTarget.replaceChildren(...formats.map(format => this.formatChip(format)));
        } catch {
            this.formatsTarget.replaceChildren(this.formatChip('Unavailable'));
        }
    }

    formatChip(format) {
        const chip = document.createElement('span');
        chip.className = 'chip margin-right-half margin-bottom-half';
        const label = document.createElement('span');
        label.className = 'chip-label';
        label.textContent = this.formatName(format);
        chip.append(label);
        return chip;
    }

    async startCamera() {
        try {
            await this.ensureDetector();
            this.stopCamera();
            this.statusTarget.textContent = 'Requesting camera access…';
            this.messageTarget.textContent = 'Allow camera access, then point the preview at a barcode.';
            this.statusIconTarget.textContent = 'hourglass_top';
            this.cameraButtonTarget.disabled = true;
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: { ideal: 'environment' } },
            });
            this.videoTarget.srcObject = this.stream;
            await this.videoTarget.play();
            this.cameraPlaceholderTarget.hidden = true;
            this.videoTarget.hidden = false;
            this.cameraFooterTarget.hidden = false;
            this.cameraButtonTarget.hidden = true;
            this.cameraButtonTarget.disabled = false;
            this.cameraBadgeTarget.className = 'badge color-green';
            this.cameraBadgeTarget.textContent = 'Scanning';
            this.scanAgainButtonTarget.hidden = true;
            this.cameraHintTarget.textContent = 'Searching for a barcode…';
            this.statusTarget.textContent = 'Camera scanner active';
            this.messageTarget.textContent = 'Hold a supported barcode steadily inside the camera preview.';
            this.statusIconTarget.textContent = 'center_focus_strong';
            this.scanning = true;
            this.scanCameraFrame();
        } catch (error) {
            this.cameraError(error);
        }
    }

    stopCamera() {
        this.scanning = false;
        this.detecting = false;
        if (this.scanTimer) window.clearTimeout(this.scanTimer);
        this.scanTimer = null;
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null;
        if (this.hasVideoTarget) this.videoTarget.srcObject = null;
        if (!this.hasCameraButtonTarget) return;
        this.videoTarget.hidden = true;
        this.cameraPlaceholderTarget.hidden = false;
        this.cameraFooterTarget.hidden = true;
        this.cameraButtonTarget.hidden = false;
        this.cameraButtonTarget.disabled = false;
        this.cameraBadgeTarget.className = 'badge color-gray';
        this.cameraBadgeTarget.textContent = 'Stopped';
    }

    scanAgain() {
        if (!this.stream) return;
        this.resultsTarget.hidden = true;
        this.scanAgainButtonTarget.hidden = true;
        this.cameraHintTarget.textContent = 'Searching for a barcode…';
        this.cameraBadgeTarget.className = 'badge color-green';
        this.cameraBadgeTarget.textContent = 'Scanning';
        this.statusTarget.textContent = 'Camera scanner active';
        this.messageTarget.textContent = 'Hold the next barcode steadily inside the preview.';
        this.scanning = true;
        this.scanCameraFrame();
    }

    async scanCameraFrame() {
        if (!this.scanning || this.detecting || this.videoTarget.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            if (this.scanning) this.scheduleCameraScan();
            return;
        }

        this.detecting = true;
        this.detectionSource = 'camera';
        try {
            await this.detectorController().detect({ params: { target: this.videoTarget } });
        } catch (error) {
            this.detectionError(error);
        } finally {
            this.detecting = false;
            if (this.scanning) this.scheduleCameraScan();
        }
    }

    scheduleCameraScan() {
        if (this.scanTimer) window.clearTimeout(this.scanTimer);
        this.scanTimer = window.setTimeout(() => this.scanCameraFrame(), 350);
    }

    imageSelected() {
        const file = this.fileTarget.files?.[0];
        if (!file) return;
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = URL.createObjectURL(file);
        this.imageButtonTarget.disabled = true;
        this.resultsTarget.hidden = true;
        this.imageTarget.onload = () => {
            this.imageCardTarget.hidden = false;
            this.imageButtonTarget.disabled = false;
            this.statusTarget.textContent = 'Image ready to scan';
            this.messageTarget.textContent = `${file.name} is loaded. Scan it to detect supported barcode formats.`;
            this.statusIconTarget.textContent = 'image_search';
        };
        this.imageTarget.src = this.imageUrl;
    }

    async scanImage() {
        try {
            await this.ensureDetector();
            this.detectionSource = 'image';
            this.imageButtonTarget.disabled = true;
            this.statusTarget.textContent = 'Scanning selected image…';
            this.messageTarget.textContent = 'The browser is examining the image locally.';
            this.statusIconTarget.textContent = 'hourglass_top';
            await this.detectorController().detect({ params: { target: this.imageTarget } });
        } catch (error) {
            this.detectionError(error);
        } finally {
            this.imageButtonTarget.disabled = false;
        }
    }

    async ensureDetector() {
        const controller = this.detectorController();
        if (!controller) throw new Error('PWA Bundle barcode detector is not connected.');
        if (!controller.barcodeDetector) await controller.initDetector();
        return controller;
    }

    detected({ detail }) {
        const barcodes = Array.isArray(detail) ? detail : [];
        if (!barcodes.length) {
            if (this.detectionSource === 'image') {
                this.statusTarget.textContent = 'No barcode detected';
                this.messageTarget.textContent = 'Try a sharper image with a larger, well-lit barcode in a supported format.';
                this.statusIconTarget.textContent = 'search_off';
            }
            return;
        }

        if (this.detectionSource === 'camera') {
            this.scanning = false;
            this.cameraBadgeTarget.className = 'badge color-blue';
            this.cameraBadgeTarget.textContent = 'Detected';
            this.cameraHintTarget.textContent = `${barcodes.length} ${barcodes.length === 1 ? 'barcode' : 'barcodes'} detected`;
            this.scanAgainButtonTarget.hidden = false;
        }
        this.renderResults(barcodes);
        this.statusTarget.textContent = barcodes.length === 1 ? 'Barcode detected' : `${barcodes.length} barcodes detected`;
        this.messageTarget.textContent = 'Review the decoded values below.';
        this.statusIconTarget.textContent = 'check_circle';
    }

    renderResults(barcodes) {
        this.resultListTarget.replaceChildren(...barcodes.map((barcode, index) => this.resultItem(barcode, index)));
        this.resultsTarget.hidden = false;
    }

    resultItem(barcode, index) {
        const item = document.createElement('li');
        const content = document.createElement('div');
        content.className = 'item-content';
        const media = document.createElement('div');
        media.className = 'item-media';
        const icon = document.createElement('i');
        icon.className = 'icon material-icons color-primary';
        icon.textContent = barcode.format === 'qr_code' ? 'qr_code_2' : 'view_week';
        media.append(icon);

        const inner = document.createElement('div');
        inner.className = 'item-inner';
        const titleRow = document.createElement('div');
        titleRow.className = 'item-title-row';
        const title = document.createElement('div');
        title.className = 'item-title';
        title.textContent = `Result ${index + 1}`;
        const after = document.createElement('div');
        after.className = 'item-after';
        after.textContent = this.formatName(barcode.format);
        titleRow.append(title, after);

        const value = document.createElement('div');
        value.className = 'item-text';
        value.textContent = barcode.rawValue || 'No decoded value';
        const footer = document.createElement('div');
        footer.className = 'item-footer display-flex align-items-center margin-top-half';
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'button button-small button-outline';
        copy.textContent = 'Copy value';
        copy.dataset.value = barcode.rawValue || '';
        copy.addEventListener('click', () => this.copyValue(copy.dataset.value));
        footer.append(copy);

        if (this.isWebUrl(barcode.rawValue)) {
            const open = document.createElement('a');
            open.className = 'button button-small button-outline external margin-left-half';
            open.href = barcode.rawValue;
            open.target = '_blank';
            open.rel = 'noopener';
            open.textContent = 'Open link';
            footer.append(open);
        }

        inner.append(titleRow, value, footer);
        content.append(media, inner);
        item.append(content);
        return item;
    }

    async copyValue(value) {
        try {
            await navigator.clipboard.writeText(value);
            window.app.toast.create({ text: 'Barcode value copied' }).open();
        } catch {
            window.app.toast.create({ text: 'Could not copy the barcode value' }).open();
        }
    }

    isWebUrl(value) {
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol);
        } catch {
            return false;
        }
    }

    formatName(format = '') {
        return format.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    cameraError(error) {
        const messages = {
            NotAllowedError: ['Camera access denied', 'Allow camera access in browser settings, then try again.'],
            NotFoundError: ['No camera available', 'Connect or enable a camera, or scan an existing image instead.'],
            NotReadableError: ['Camera is already in use', 'Close other apps using the camera, then try again.'],
        };
        const [status, message] = messages[error?.name] || ['Could not start the camera', error?.message || 'Use an existing image instead.'];
        this.stopCamera();
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = 'error_outline';
    }

    detectionError(error) {
        this.statusTarget.textContent = 'Barcode detection failed';
        this.messageTarget.textContent = error?.message || 'The browser could not examine this image source.';
        this.statusIconTarget.textContent = 'error_outline';
    }

    error({ detail }) {
        this.detectionError(detail.error instanceof Error ? detail.error : new Error(String(detail.error || 'Unknown error')));
    }

    unsupported() {
        this.stopCamera();
        this.statusTarget.textContent = 'Barcode Detection API unavailable';
        this.messageTarget.textContent = 'This browser does not expose BarcodeDetector. Try a compatible browser or device.';
        this.statusIconTarget.textContent = 'qr_code_scanner';
        this.cameraButtonTarget.disabled = true;
        this.imageButtonTarget.disabled = true;
        this.formatsTarget.replaceChildren(this.formatChip('Unavailable'));
    }

    detectorController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--barcode-detection');
    }
}
