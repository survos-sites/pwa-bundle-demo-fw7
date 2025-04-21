'use strict';

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['message'];
  disabled = () => {
    this.messageTarget.classList.remove('hidden');
  }
}

