import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'connection',
        'form',
        'message',
        'queueCount',
        'receipt',
        'messageId',
        'retryButton',
        'status',
        'statusIcon',
        'submitButton',
    ];

    connect() {
        this.pendingSubmission = false;
        this.queueSize = 0;
        this.boundConnectionChanged = () => this.connectionChanged();
        this.boundQueueStatus = event => this.queueStatus(event);
        this.boundSending = event => this.sending(event);
        this.boundSent = event => this.sent(event);
        this.boundSendFailed = event => this.sendFailed(event);
        this.boundSubmit = event => this.submit(event);
        window.addEventListener('online', this.boundConnectionChanged);
        window.addEventListener('offline', this.boundConnectionChanged);
        this.element.addEventListener('pwa--backgroundsync-queue:status', this.boundQueueStatus);
        this.element.addEventListener('pwa--backgroundsync-form:before:send', this.boundSending);
        this.element.addEventListener('pwa--backgroundsync-form:after:send', this.boundSent);
        this.element.addEventListener('pwa--backgroundsync-form:error', this.boundSendFailed);
        this.formTarget.addEventListener('submit', this.boundSubmit);
        this.newMessageId();
        this.connectionChanged();

        if (!('serviceWorker' in navigator) || !('BroadcastChannel' in window)) {
            this.unsupported();
        }
    }

    disconnect() {
        window.removeEventListener('online', this.boundConnectionChanged);
        window.removeEventListener('offline', this.boundConnectionChanged);
        this.element.removeEventListener('pwa--backgroundsync-queue:status', this.boundQueueStatus);
        this.element.removeEventListener('pwa--backgroundsync-form:before:send', this.boundSending);
        this.element.removeEventListener('pwa--backgroundsync-form:after:send', this.boundSent);
        this.element.removeEventListener('pwa--backgroundsync-form:error', this.boundSendFailed);
        this.formTarget.removeEventListener('submit', this.boundSubmit);
    }

    submit(event) {
        const controller = this.application.getControllerForElementAndIdentifier(
            this.formTarget,
            'pwa--backgroundsync-form',
        );
        if (controller) {
            controller.send(event);
            return;
        }
        event.preventDefault();
        this.statusTarget.textContent = 'Form controller unavailable';
        this.messageTarget.textContent = 'The PWA Bundle background sync form controller is not connected.';
        this.statusIconTarget.textContent = 'exclamationmark_triangle';
    }

    connectionChanged() {
        const online = navigator.onLine;
        this.connectionTarget.textContent = online ? 'Online' : 'Offline';
        this.connectionTarget.className = `badge color-${online ? 'green' : 'orange'}`;

        if (!online && Number(this.queueCountTarget.textContent) === 0) {
            this.statusTarget.textContent = 'Ready to queue offline requests';
            this.messageTarget.textContent = 'Send the message to place its failed request in the service worker outbox.';
            this.statusIconTarget.textContent = 'tray_arrow_down_fill';
        }

        if (online) {
            window.setTimeout(() => this.requestQueueStatus(), 750);
        }
    }

    sending() {
        this.pendingSubmission = true;
        this.submitButtonTarget.disabled = true;
        this.statusTarget.textContent = navigator.onLine ? 'Sending message…' : 'Sending while offline…';
        this.messageTarget.textContent = navigator.onLine
            ? 'The request is being sent to the server.'
            : 'The request will fail at the network and be captured by the service worker queue.';
        this.statusIconTarget.textContent = 'arrow_up_circle';
    }

    async sent({ detail }) {
        this.pendingSubmission = false;
        this.submitButtonTarget.disabled = false;

        if (!detail.response?.ok) {
            this.statusTarget.textContent = 'Server rejected the message';
            this.messageTarget.textContent = `The server returned HTTP ${detail.response?.status ?? 'error'}.`;
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
            return;
        }

        let receipt = null;
        try {
            receipt = await detail.response.clone().json();
        } catch {
            // The delivery itself succeeded; receipt metadata is optional.
        }

        this.statusTarget.textContent = 'Message delivered';
        this.messageTarget.textContent = 'The server accepted the request without using the background queue.';
        this.statusIconTarget.textContent = 'checkmark_circle_fill';
        this.receiptTarget.textContent = receipt?.receivedAt
            ? `Received ${this.formatTime(receipt.receivedAt)}`
            : 'Server delivery confirmed';
        this.newMessageId();
    }

    sendFailed() {
        this.submitButtonTarget.disabled = false;
        if (this.queueSize > 0) {
            this.statusTarget.textContent = 'Message added to the outbox';
            this.messageTarget.textContent = 'Restore the connection and the service worker will retry the request.';
            this.statusIconTarget.textContent = 'tray_arrow_down_fill';
            this.receiptTarget.textContent = 'Stored by the service worker';
            return;
        }
        this.statusTarget.textContent = 'Waiting for queue confirmation…';
        this.messageTarget.textContent = 'The network request failed. The service worker is adding it to the background sync queue.';
        this.statusIconTarget.textContent = 'hourglass';
    }

    queueStatus({ detail }) {
        if (detail.name !== 'symphone-message-outbox') return;

        const previousQueueSize = this.queueSize;
        const remaining = Number(detail.remaining ?? 0);
        this.queueSize = remaining;
        this.queueCountTarget.textContent = String(remaining);
        this.retryButtonTarget.hidden = remaining === 0;

        if (detail.replaying && remaining > 0) {
            this.statusTarget.textContent = 'Sending messages from the outbox…';
            this.messageTarget.textContent = `${remaining} ${remaining === 1 ? 'request remains' : 'requests remain'} in the queue.`;
            this.statusIconTarget.textContent = 'arrow_2_circlepath';
            return;
        }

        if (detail.replayed === true) {
            this.pendingSubmission = false;
            this.statusTarget.textContent = 'Outbox messages delivered';
            this.messageTarget.textContent = `${detail.successCount ?? 0} queued ${detail.successCount === 1 ? 'request was' : 'requests were'} accepted by the server.`;
            this.statusIconTarget.textContent = 'checkmark_circle_fill';
            this.receiptTarget.textContent = 'Background replay completed';
            this.newMessageId();
            return;
        }

        if (detail.replayed === false) {
            this.statusTarget.textContent = 'Replay could not finish';
            this.messageTarget.textContent = 'The remaining requests stay queued and can be retried after connectivity is restored.';
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
            return;
        }

        if (remaining > 0) {
            this.pendingSubmission = false;
            this.statusTarget.textContent = 'Message added to the outbox';
            this.messageTarget.textContent = 'Restore the connection and the service worker will retry the request.';
            this.statusIconTarget.textContent = 'tray_arrow_down_fill';
            this.receiptTarget.textContent = 'Stored by the service worker';
            return;
        }

        if (previousQueueSize > 0 && remaining === 0) {
            this.statusTarget.textContent = 'Outbox messages delivered';
            this.messageTarget.textContent = 'The service worker replayed the queued requests after connectivity returned.';
            this.statusIconTarget.textContent = 'checkmark_circle_fill';
            this.receiptTarget.textContent = 'Background queue is empty';
        } else if (!this.pendingSubmission) {
            this.statusTarget.textContent = 'Background sync queue ready';
            this.messageTarget.textContent = 'There are no requests waiting for delivery.';
            this.statusIconTarget.textContent = 'checkmark_circle';
        }
    }

    retry() {
        const controller = this.application.getControllerForElementAndIdentifier(
            this.element,
            'pwa--backgroundsync-queue',
        );
        if (!controller) return;

        this.statusTarget.textContent = 'Requesting queue replay…';
        this.messageTarget.textContent = navigator.onLine
            ? 'The service worker is sending messages from the outbox.'
            : 'The replay will remain queued until the server is reachable.';
        this.statusIconTarget.textContent = 'arrow_2_circlepath';
        controller.replay();
    }

    requestQueueStatus() {
        const controller = this.application.getControllerForElementAndIdentifier(
            this.element,
            'pwa--backgroundsync-queue',
        );
        controller?.bc?.postMessage({ type: 'status-request' });
    }

    unsupported() {
        this.statusTarget.textContent = 'Background sync demo unavailable';
        this.messageTarget.textContent = 'This browser does not expose the service-worker messaging features required by this demo.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.submitButtonTarget.disabled = true;
    }

    newMessageId() {
        this.messageIdTarget.value = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    formatTime(value) {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    }
}
