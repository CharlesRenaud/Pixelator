const path = require('path');
const os = require('os');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, listener) => {
      // Vérifiez que le canal est une chaîne valide
      if (typeof channel !== 'string') return;
      // Écoutez l'événement IPC
      ipcRenderer.on(channel, listener);
    },
    send: (channel, ...args) => {
      // Vérifiez que le canal est une chaîne valide
      if (typeof channel !== 'string') return;
      // Envoyez un message IPC
      ipcRenderer.send(channel, ...args);
    },
    // Autres méthodes ou propriétés de ipcRenderer si nécessaire
  }
});

contextBridge.exposeInMainWorld('os', {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld('path', {
  join: (...args) => path.join(...args),
});
