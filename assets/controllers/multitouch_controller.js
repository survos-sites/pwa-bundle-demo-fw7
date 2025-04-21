'use strict';

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  connect() {
    this.canvas = this.element;
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.offsetWidth * ratio;
    this.canvas.height = this.canvas.offsetHeight * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // plus sûr que `scale`
  }

  update({ detail }) {
    const { touches } = detail;

    const rect = this.canvas.getBoundingClientRect(); // position du canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    touches.forEach(touch => {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const radiusX = touch.radiusX || 20;
      const radiusY = touch.radiusY || 20;
      const identifier = touch.identifier;

      this.drawTouchPoint(x, y, radiusX, radiusY, identifier);
    });
  }

  drawTouchPoint(x, y, radiusX, radiusY, identifier) {
    // Cercle de contact
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radiusX || 20, radiusY || 20, 0, 0, 2 * Math.PI);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.fill();
    this.ctx.stroke();

    // Texte (identifiant de la touche)
    this.ctx.fillStyle = 'black';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText(`#${identifier}`, x + radiusX + 5, y);
  }
}

