const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const Jimp = require('jimp');
const path = require('path');



let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('select-output-folder', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then((result) => {
    if (!result.canceled && result.filePaths.length > 0) {
      event.sender.send('selected-output-folder', result.filePaths[0]);
    }
  }).catch((error) => {
    console.error('Erreur lors de la sélection du dossier de sortie :', error);
  });
});


async function pixelizeImage(inputPath, outputPath, pixelizationLevel) {
  
    const optimizedImage = await Jimp.read(inputPath);

    console.log(outputPath)

    // Pixelisez l'image avec Jimp
    optimizedImage.pixelate(pixelizationLevel).write(outputPath);

    console.log('Image pixelisée avec succès !');
}


// Gestionnaire IPC pour démarrer la pixelisation
ipcMain.on('start-pixelization', async (event, data) => {
  const { inputFolder, outputFolder, pixelizationLevel } = data;

  try {
    const files = await fs.readdir(inputFolder);
    const totalFiles = files.length;
    let processedFiles = 0;

    for (const file of files) {
      const inputPath = path.join(inputFolder, file);
      const segments = outputFolder.split(/[\\/]/);
      const nameFile = segments[segments.length - 1]
      console.log(nameFile)

      const outputPath = path.join(outputFolder,`${nameFile}_${processedFiles}.png`);

      // Créez le répertoire de sortie s'il n'existe pas
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      await pixelizeImage(inputPath, outputPath, pixelizationLevel);

      // Mettez à jour la barre de progression
      processedFiles++;
      const progress = Math.floor((processedFiles / totalFiles) * 100);
      mainWindow.webContents.send('update-progress', progress);
    }

    console.log('Pixelisation terminée.');
  } catch (error) {
    console.error('Erreur lors de la pixelisation des images :', error);
  }
});

