'use strict';

import { Controller } from '@hotwired/stimulus';
import * as THREE from 'three';

export default class extends Controller {
  static targets = ['acceleration', 'accelerationIncludingGravity', 'rotationRate', 'interval', 'canvas', 'message'];

  connect() {
    // Scene & camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvasTarget.clientWidth / this.canvasTarget.clientHeight,
      0.1,
      1000
    );

    const pixelRatio = window.devicePixelRatio || 1;
    const width = this.canvasTarget.clientWidth;
    const height = this.canvasTarget.clientHeight;

    this.canvasTarget.width = width * pixelRatio;
    this.canvasTarget.height = height * pixelRatio;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasTarget, antialias: true });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(pixelRatio);

    // Objet central : sphère
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x8888ff, metalness: 0.3, roughness: 0.6 });
    this.centerObject = new THREE.Mesh(geometry, material);
    this.scene.add(this.centerObject);

    // Lumière
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Caméra
    this.camera.position.set(0, 0, 5);

    // Accélération et flèche
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.deviceQuaternion = new THREE.Quaternion();

    this.arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0xffff00
    );
    this.scene.add(this.arrow);

    // Orientation de l'appareil → quaternion
    window.addEventListener('deviceorientation', (event) => {
      const alpha = THREE.MathUtils.degToRad(event.alpha || 0); // Z
      const beta = THREE.MathUtils.degToRad(event.beta || 0);   // X'
      const gamma = THREE.MathUtils.degToRad(event.gamma || 0); // Y''

      const euler = new THREE.Euler(beta, gamma, alpha, 'ZYX');
      this.deviceQuaternion.setFromEuler(euler);
    }, true);

    this.animate();
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    // Mise à jour de la flèche si l’accélération est significative
    if (this.acceleration.length() > 0.01) {
      const direction = this.acceleration.clone().normalize();
      const length = Math.min(3, this.acceleration.length());
      const color = this.getColorFromAcceleration(this.acceleration.length());
      this.arrow.setColor(color);

      this.arrow.setDirection(direction);
      this.arrow.setLength(length);
    } else {
      this.arrow.setLength(0.01);
    }

    this.renderer.render(this.scene, this.camera);
  }

  update({ detail }) {
    if (detail.acceleration.x === null) {
      this.disable();
      return;
    }
    this.accelerationTarget.innerHTML =
      `<strong>X:</strong> ${(detail.acceleration.x).toFixed(2)} m/s²` +
      `<br><strong>Y:</strong> ${(detail.acceleration.y).toFixed(2)} m/s²` +
      `<br><strong>Z:</strong> ${(detail.acceleration.z).toFixed(2)} m/s²`;

    this.accelerationIncludingGravityTarget.innerHTML =
      `<strong>X:</strong> ${(detail.accelerationIncludingGravity.x).toFixed(2)} m/s²` +
      `<br><strong>Y:</strong> ${(detail.accelerationIncludingGravity.y).toFixed(2)} m/s²` +
      `<br><strong>Z:</strong> ${(detail.accelerationIncludingGravity.z).toFixed(2)} m/s²`;

    // Rotation (avec unités °/s)
    this.rotationRateTarget.innerHTML =
      `<strong>Alpha:</strong> ${(detail.rotationRate.alpha).toFixed(2)}°/s` +
      `<br><strong>Beta:</strong> ${(detail.rotationRate.beta).toFixed(2)}°/s` +
      `<br><strong>Gamma:</strong> ${(detail.rotationRate.gamma).toFixed(2)}°/s`;

    // Interval (en ms)
    this.intervalTarget.innerHTML = `<strong>Interval:</strong> ${detail.interval} ms`;

    // Vecteur d’accélération transformé dans le référentiel de l’écran
    const rawAcceleration = new THREE.Vector3(
      detail.acceleration.x || 0,
      detail.acceleration.y || 0,
      detail.acceleration.z || 0
    );

    this.acceleration.copy(rawAcceleration.applyQuaternion(this.deviceQuaternion));
  }

  getColorFromAcceleration(intensity) {
    // Limite max à 10 m/s²
    const clamped = Math.min(intensity, 10);
    const t = clamped / 10;

    // Gradient vert → jaune → rouge
    const r = t < 0.5 ? t * 2 * 255 : 255;
    const g = t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255;
    const b = 0;

    return new THREE.Color(r / 255, g / 255, b / 255);
  }

  disable = () => {
      this.messageTarget.classList.remove('hidden');
  }
}
