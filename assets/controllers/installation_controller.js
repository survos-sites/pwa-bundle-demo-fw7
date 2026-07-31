import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['button', 'guidance', 'message', 'status', 'statusIcon'];

    connect() {
        this.onBeforeInstallPrompt = () => this.showReady();
        this.onInstalled = () => this.showInstalled();
        this.onInstalling = () => this.showInstalling();
        this.onCancelled = () => this.showCancelled();

        window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
        window.addEventListener('appinstalled', this.onInstalled);
        document.addEventListener('pwa--install:installing', this.onInstalling);
        document.addEventListener('pwa--install:cancelled', this.onCancelled);
        document.addEventListener('pwa--install:installed', this.onInstalled);

        this.refresh();
    }

    disconnect() {
        window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', this.onInstalled);
        document.removeEventListener('pwa--install:installing', this.onInstalling);
        document.removeEventListener('pwa--install:cancelled', this.onCancelled);
        document.removeEventListener('pwa--install:installed', this.onInstalled);
    }

    refresh() {
        if (this.isInstalled()) {
            this.showInstalled();
            return;
        }

        const installController = this.application.getControllerForElementAndIdentifier(
            document.body,
            'pwa--install'
        );

        if (installController?.deferredPrompt) {
            this.showReady();
            return;
        }

        this.showManualGuidance();
    }

    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.matchMedia('(display-mode: fullscreen)').matches
            || window.matchMedia('(display-mode: minimal-ui)').matches
            || window.navigator.standalone === true;
    }

    showReady() {
        this.setState(
            'Ready to install',
            'Add Symphone to this device for quick access and an app-like experience.',
            'download_circle',
            true,
            false
        );
    }

    showInstalling() {
        this.setState(
            'Installation requested',
            'Complete the confirmation in your browser to add Symphone.',
            'hourglass',
            false,
            false
        );
    }

    showCancelled() {
        this.setState(
            'Installation cancelled',
            'Nothing was changed. You can try again whenever the install option is available.',
            'xmark_circle',
            false,
            true
        );
    }

    showInstalled() {
        this.setState(
            'Installed on this device',
            'Symphone can now be launched like your other apps.',
            'checkmark_circle',
            false,
            false
        );
    }

    showManualGuidance() {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isFirefox = /Firefox|FxiOS/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);

        if (isIos) {
            this.setState(
                'Install from the Share menu',
                'Tap Share, then choose “Add to Home Screen”. All browsers on iPhone and iPad use this installation flow.',
                'square_arrow_up',
                false,
                true
            );
            return;
        }

        if (isSafari) {
            this.setState(
                'Install from Safari',
                'Open the File menu and choose “Add to Dock”.',
                'macwindow',
                false,
                true
            );
            return;
        }

        if (isFirefox) {
            this.setState(
                isAndroid ? 'Install from the Firefox menu' : 'Installation unavailable in Firefox desktop',
                isAndroid
                    ? 'Open the Firefox menu and choose “Install” or “Add app to Home screen”.'
                    : 'Open Symphone in a supporting browser to install it as a desktop app.',
                isAndroid ? 'ellipsis_circle' : 'xmark_circle',
                false,
                true
            );
            return;
        }

        this.setState(
            'Install from your browser menu',
            'Open the browser menu and look for “Install app” or “Add to Home screen”.',
            'ellipsis_circle',
            false,
            true
        );
    }

    setState(status, message, icon, buttonVisible, guidanceVisible) {
        this.statusTarget.textContent = status;
        this.messageTarget.textContent = message;
        this.statusIconTarget.textContent = icon;
        this.buttonTarget.hidden = !buttonVisible;
        this.guidanceTarget.hidden = !guidanceVisible;
    }
}
