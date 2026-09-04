import { createApp } from 'vue'
import './assets/style.css'
// Habillage alternatif « arcane ». Inerte tant que <html> ne porte pas
// data-skin="arcane" : aucune de ses règles ne matche.
import './assets/skin-arcane.css'
import App from './App.vue'

createApp(App).mount('#app')

// Installation comme application : coque hors ligne et lancement en plein écran.
// Enregistré après le chargement pour ne pas concurrencer le premier rendu.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
