import { Controller } from '@hotwired/stimulus';

const EVENT_PREFIX = 'pwa--speech-synthesis:pwa:speech-synthesis:';

export default class extends Controller {
    static targets = [
        'cancelButton',
        'message',
        'pauseButton',
        'pitch',
        'pitchValue',
        'queue',
        'queueSize',
        'rate',
        'rateValue',
        'resumeButton',
        'smartSelect',
        'speakButton',
        'status',
        'statusIcon',
        'text',
        'voice',
        'voiceSummary',
        'volume',
        'volumeValue',
    ];

    connect() {
        this.listeners = {
            voicesloaded: ({ detail }) => this.voicesLoaded(detail.voices),
            start: () => this.playing(),
            end: () => this.finished(),
            pause: () => this.paused(),
            resume: () => this.playing(),
            cancel: () => this.cancelled(),
            error: ({ detail }) => this.failed(detail.error),
            queuechange: ({ detail }) => this.queueSizeTarget.textContent = String(detail.size),
        };
        Object.entries(this.listeners).forEach(([name, listener]) => {
            this.element.addEventListener(`${EVENT_PREFIX}${name}`, listener);
        });
        this.settingsChanged();

        if (!('speechSynthesis' in window)) {
            this.unsupported();
        }
    }

    disconnect() {
        Object.entries(this.listeners).forEach(([name, listener]) => {
            this.element.removeEventListener(`${EVENT_PREFIX}${name}`, listener);
        });
        this.voiceSmartSelect?.destroy();
        this.bundleController()?.cancel();
    }

    speak(event) {
        event.preventDefault();
        const controller = this.bundleController();
        const text = this.textTarget.value.trim();
        if (!controller || !text) return;

        const voice = controller.getVoiceByName(this.voiceTarget.value);
        controller.enqueueValue = this.queueTarget.checked;
        controller.speak({
            params: {
                text,
                voice: voice?.name,
                locale: voice?.lang || document.documentElement.lang,
                rate: Number(this.rateTarget.value),
                pitch: Number(this.pitchTarget.value),
                volume: Number(this.volumeTarget.value),
            },
        });
        this.statusTarget.textContent = this.queueTarget.checked && controller.isSpeaking
            ? 'Utterance queued'
            : 'Preparing utterance…';
        this.messageTarget.textContent = 'PWA Bundle submitted the text to the browser speech queue.';
        this.statusIconTarget.textContent = 'waveform';
    }

    pause() {
        this.bundleController()?.pause();
    }

    resume() {
        this.bundleController()?.resume();
    }

    cancel() {
        this.bundleController()?.cancel();
    }

    voiceChanged(event) {
        if (event) this.voiceWasSelected = true;
        const controller = this.bundleController();
        controller?.changeVoiceFromSelect();
        const voice = controller?.getVoiceByName(this.voiceTarget.value);
        this.voiceSummaryTarget.textContent = voice
            ? `${voice.lang} · ${voice.localService ? 'Local voice' : 'Remote voice'}${voice.default ? ' · System default' : ''}`
            : 'The browser will choose a voice for the requested locale.';
    }

    queueChanged() {
        const controller = this.bundleController();
        if (controller) controller.enqueueValue = this.queueTarget.checked;
    }

    settingsChanged() {
        this.rateValueTarget.textContent = `${Number(this.rateTarget.value).toFixed(1)}×`;
        this.pitchValueTarget.textContent = Number(this.pitchTarget.value).toFixed(1);
        this.volumeValueTarget.textContent = `${Math.round(Number(this.volumeTarget.value) * 100)}%`;
    }

    voicesLoaded(voices) {
        if (!this.voiceWasSelected) {
            const preferredVoice = this.preferredVoice(voices);
            if (preferredVoice) this.voiceTarget.value = preferredVoice.name;
        }

        this.voiceSmartSelect?.destroy();
        this.voiceSmartSelect = window.app.smartSelect.create({
            el: this.smartSelectTarget,
            openIn: 'popup',
            searchbar: true,
            searchbarPlaceholder: 'Search voices',
            appendSearchbarNotFound: true,
            closeOnSelect: true,
            scrollToSelectedItem: true,
        });
        this.speakButtonTarget.disabled = false;
        this.statusTarget.textContent = 'Speech synthesis ready';
        this.messageTarget.textContent = `${voices.length} system ${voices.length === 1 ? 'voice is' : 'voices are'} available.`;
        this.statusIconTarget.textContent = 'checkmark_circle';
        this.voiceChanged();
    }

    preferredVoice(voices) {
        const locales = [...(navigator.languages || []), navigator.language, document.documentElement.lang]
            .filter(Boolean)
            .map(locale => locale.replace('_', '-').toLowerCase());

        for (const locale of locales) {
            const exactMatch = voices.find(voice => voice.lang.replace('_', '-').toLowerCase() === locale);
            if (exactMatch) return exactMatch;
        }

        for (const locale of locales) {
            const language = locale.split('-')[0];
            const languageMatch = voices.find(voice => voice.lang.replace('_', '-').toLowerCase().split('-')[0] === language);
            if (languageMatch) return languageMatch;
        }

        return this.bundleController()?.getDefaultVoice();
    }

    playing() {
        this.statusTarget.textContent = 'Speaking';
        this.messageTarget.textContent = 'The current SpeechSynthesisUtterance is playing.';
        this.statusIconTarget.textContent = 'speaker_wave_2_fill';
        this.pauseButtonTarget.disabled = false;
        this.resumeButtonTarget.disabled = true;
        this.cancelButtonTarget.disabled = false;
    }

    paused() {
        this.statusTarget.textContent = 'Speech paused';
        this.messageTarget.textContent = 'Resume the current utterance or stop speech playback.';
        this.statusIconTarget.textContent = 'pause_circle';
        this.pauseButtonTarget.disabled = true;
        this.resumeButtonTarget.disabled = false;
        this.cancelButtonTarget.disabled = false;
    }

    finished() {
        this.statusTarget.textContent = 'Utterance finished';
        this.messageTarget.textContent = 'The browser completed the current speech request.';
        this.statusIconTarget.textContent = 'checkmark_circle';
        this.pauseButtonTarget.disabled = true;
        this.resumeButtonTarget.disabled = true;
        this.cancelButtonTarget.disabled = true;
    }

    cancelled() {
        this.statusTarget.textContent = 'Speech stopped';
        this.messageTarget.textContent = 'The active utterance and queued requests were cancelled.';
        this.statusIconTarget.textContent = 'stop_circle';
        this.queueSizeTarget.textContent = '0';
        this.pauseButtonTarget.disabled = true;
        this.resumeButtonTarget.disabled = true;
        this.cancelButtonTarget.disabled = true;
    }

    failed(error) {
        this.statusTarget.textContent = 'Speech synthesis failed';
        this.messageTarget.textContent = error ? `The browser reported: ${error}.` : 'The browser could not synthesize this utterance.';
        this.statusIconTarget.textContent = 'exclamationmark_triangle';
        this.pauseButtonTarget.disabled = true;
        this.resumeButtonTarget.disabled = true;
        this.cancelButtonTarget.disabled = true;
    }

    unsupported() {
        this.statusTarget.textContent = 'Speech Synthesis API unavailable';
        this.messageTarget.textContent = 'This browser does not expose window.speechSynthesis.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.speakButtonTarget.disabled = true;
    }

    bundleController() {
        return this.application.getControllerForElementAndIdentifier(this.element, 'pwa--speech-synthesis');
    }
}
