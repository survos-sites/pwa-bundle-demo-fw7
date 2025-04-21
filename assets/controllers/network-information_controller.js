'use strict';

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = [
    'downlink', 'downlinkMax', 'effectiveType', 'rtt', 'saveData', 'type',
    'downlinkContent', 'downlinkMaxContent', 'effectiveTypeContent', 'rttContent', 'saveDataContent', 'typeContent',
  ];

  connect() {
    const connection = navigator.connection;
    connection.addEventListener('change', this.updateConnectionStatus);
    this.updateConnectionStatus();
  }

  updateConnectionStatus = () => {
    const connection = navigator.connection;
    this.dispatch('network-information:change', {bubble: true, details: {connection}});
    this.downlinkTargets.forEach((element) => element.setAttribute('data-network-information-downlink-value', connection.downlink));
    this.downlinkContentTargets.forEach((element) => element.textContent = connection.downlink);
    this.downlinkMaxTargets.forEach((element) => element.setAttribute('data-network-information-downlink-max-value', connection.downlinkMax));
    this.downlinkMaxContentTargets.forEach((element) => element.textContent = connection.downlinkMax ?? '...');
    this.effectiveTypeTargets.forEach((element) => element.setAttribute('data-network-information-effective-type-value', connection.effectiveType));
    this.effectiveTypeContentTargets.forEach((element) => element.textContent = connection.effectiveType);
    this.rttTargets.forEach((element) => element.setAttribute('data-network-information-rtt-value', connection.rtt));
    this.rttContentTargets.forEach((element) => element.textContent = connection.rtt);
    this.saveDataTargets.forEach((element) => element.setAttribute('data-network-information-save-data-value', connection.saveData));
    this.saveDataContentTargets.forEach((element) => element.textContent = connection.saveData ? 'Yes' : 'No');
    this.typeTargets.forEach((element) => element.setAttribute('data-network-information-type-value', connection.type));
    this.typeContentTargets.forEach((element) => element.textContent = connection.type ?? '...');
  }
}
