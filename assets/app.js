import './bootstrap.js';
/*
 * Welcome to your app's main JavaScript file!
 *
 * This file will be included onto the page via the importmap() Twig function,
 * which should already be in your base.html.twig.
 */
import './styles/app.css';
// import 'bootstrap-icons/font/bootstrap-icons.min.css'

console.log('This log comes from assets/app.js - welcome to AssetMapper! 🎉');

let installPrompt = null;
const installButton = document.querySelector("#install");

// These are now replaced by pwa-bundle install component
// window.addEventListener("beforeinstallprompt", (event) => {
//   event.preventDefault();
//   installPrompt = event;
//   installButton.removeAttribute("hidden");
// });

// main.js

// installButton.addEventListener("click", async () => {
//   if (!installPrompt) {
//     return;
//   }
//   const result = await installPrompt.prompt();
//   console.log(`Install prompt was: ${result.outcome}`);
//   disableInAppInstallPrompt();
// });

function disableInAppInstallPrompt() {
  installPrompt = null;
  installButton.setAttribute("hidden", "");
}
import 'flowbite';
import 'flowbite/dist/flowbite.min.css';
import "@hotwired/hotwire-native-bridge"

import 'framework7';
