'use strict';

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['light', 'fade', 'video'];

  watch() {
    window.scrollTo(0, 0);
    this.lightTarget.classList.remove('hidden');
    this.fadeTarget.classList.remove('hidden');
    this.videoTarget.play();
  }

  close() {
    this.lightTarget.classList.add('hidden');
    this.deTarget.classList.add('hidden');
    this.videoTarget.pause();
  }
}
