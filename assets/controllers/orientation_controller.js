'use strict';

import { Controller } from '@hotwired/stimulus';
import * as THREE from 'three';

export default class extends Controller {
  static targets = ['alpha', 'beta', 'gamma', 'canvas'];

  scene;
  camera;
  renderer;
  cube;

  connect() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, (window.innerWidth/2) / (window.innerHeight/2), 0.1, 1000
    );
    this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('myCanvas'), antialias: true });
    this.renderer.setSize((window.innerWidth/2), (window.innerHeight/2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1).normalize();
    this.scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(this.cube.position);

    this.animate();

    window.addEventListener('resize', this.resizeScreen);
  }

  resizeScreen = () => {
    const width = (window.innerWidth/2);
    const height = (window.innerHeight/2);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  update({detail}) {
    const adjusted = this.adjustOrientation(detail.alpha, detail.beta, detail.gamma);
    this.alphaTarget.innerText = Math.round(adjusted.alpha);
    this.betaTarget.innerText = Math.round(adjusted.beta);
    this.gammaTarget.innerText = Math.round(adjusted.gamma);
    this.updateCubeRotation(adjusted.alpha, adjusted.beta, adjusted.gamma);
  }



  updateCubeRotation = (alpha, beta, gamma) => {
    this.cube.rotation.order = 'ZXY';
    this.cube.rotation.x = (beta * Math.PI) / 180;
    this.cube.rotation.y = (gamma * Math.PI) / 180;
    this.cube.rotation.z = (-alpha * Math.PI) / 180;
  }


  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }

  adjustOrientation = (alpha, beta, gamma) => {
    const orientation = window.screen.orientation?.angle || 0;

    switch (orientation) {
      case 0: // Portrait
        return { alpha, beta, gamma };
      case 90: // Paysage vers la gauche
        return {
          alpha,
          beta: gamma,
          gamma: -beta
        };
      case -90:
      case 270: // Paysage vers la droite
        return {
          alpha,
          beta: -gamma,
          gamma: beta
        };
      case 180: // Portrait à l’envers
        return {
          alpha,
          beta: -beta,
          gamma: -gamma
        };
      default:
        return { alpha, beta, gamma };
    }
  };
}
