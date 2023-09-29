const { app, BrowserWindow, ipcMain, dialog, shell} = require('electron');
const ExcelJS = require('exceljs');
const filterModule = require('./filter');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');
const docsModule = require('./docs');
const docx = require('docx');
const fs = require('fs');
const path = require('path');
const downloadManager = require('electron-download-manager');
const configfile = require(path.join(__dirname, '../config.json'));
const unzipper = require('unzipper');
const axios = require('axios');
const semver = require('semver');
const { url } = require('inspector');
const rimraf = require('rimraf');

const downloadsPath = app.getPath('downloads');
const userDataPath = app.getPath('userData');
downloadManager.register({ downloadFolder: downloadsPath });

let mainWindow;
let sortedData = [];
let dateAsk = new Date(0);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: 'app/preload.js'
    }
  });

  mainWindow.loadFile('app/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.on('reload-window', () => {
    mainWindow.webContents.session.clearCache(() => {
      mainWindow.reload();
    });
  });

  checkForUpdates();
}

async function checkForUpdates() {
  try {
    const latestRelease = await getLatestReleaseInfo();

    console.log('Version actuelle :', app.getVersion());
    console.log('Dernière version :', latestRelease.version);

    if (latestRelease && semver.gt(latestRelease.version, app.getVersion())) {
      const response = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['Installer maintenant', 'Plus tard'],
        defaultId: 0,
        message: 'Une nouvelle mise à jour est disponible. Voulez-vous l\'installer maintenant ?',
      });

      if (response === 0) {
        const updateFilePath = 'update.zip';
        await downloadUpdate(latestRelease.downloadUrl, updateFilePath);
        installUpdate(updateFilePath);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour :', error);
  }
}

async function getLatestReleaseInfo() {
  try {
    const response = await axios.get('https://api.github.com/repos/Cavallucci/cep_app/releases/latest');

    return {
      version: response.data.tag_name,
      downloadUrl: response.data.assets[0].browser_download_url,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations sur la dernière version :', error);
    return null;
  }
}

async function downloadUpdate(updateUrl, updateFilePath) {
  try {
    console.log('Téléchargement de la mise à jour downloadUpdate...');
    const writer = fs.createWriteStream(updateFilePath);

    const response = await axios({
      method: 'get',
      url: updateUrl,
      responseType: 'stream',
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log('update.zip téléchargé');
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement de la mise à jour :', error);
    return false;
  }
}

function createDesktopShortcut() {
  const desktopPath = app.getPath('desktop');
  const shortcutPath = path.join(desktopPath, 'cep-app-auto');

  const exePath = app.getPath('exe');

  const shortcutArgs = ['--processStart', `"${exePath}"`];

  const shortcutTarget = path.join(app.getPath('exe'), 'cep-app-auto');

  shell.writeShortcutLink(shortcutPath, shortcutTarget, { args: shortcutArgs });
}

function removeDesktopShortcut() {
  const desktopPath = app.getPath('desktop');
  const shortcutPath = path.join(desktopPath, 'cep-app-auto');

  if (fs.existsSync(shortcutPath)) {
    fs.unlinkSync(shortcutPath);
  }
}

async function installUpdate(updateFolderPath) {
  try {
    console.log('Installation de la mise à jour installUpdate...');
    //const currentAppDir = path.dirname(app.getAppPath());
    //const updateFileName = 'update.zip'; // Nom du fichier de mise à jour    
    //const updateFilePath = path.join(currentAppDir, updateFileName);
    const updateFilePath = path.join(__dirname, '..', '..', 'update.zip');
    
    removeDesktopShortcut();
    await fs.unlink(updateFilePath, (err) => {
      if (err) {
        console.error('Erreur lors de la suppression du fichier de mise à jour actuel :', err);
      } else {
        console.log('Fichier de mise à jour actuel supprimé avec succès.');
      }
    });
    await fs.promises.copyFile(updateFolderPath, updateFilePath);
    rimraf.sync(updateFolderPath);
    createDesktopShortcut();

    app.relaunch();
    app.exit();
  } catch (error) {
    console.error('Erreur lors de l\'installation de la mise à jour :', error);
  }
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('get-user-path', (event) => {
  return userDataPath;
});

ipcMain.handle('get-sorted-data', (event) => {
  return sortedData;
});

ipcMain.handle('get-download-path', (event) => {
  return downloadsPath;
});

ipcMain.on('sortExcelFile', async (event, filePath) => {
  try {
    let filteredRows = [];
    let headerData = [];
    let workbook;

    if (filePath.endsWith('.xlsx')) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
    } else if (filePath.endsWith('.csv')) {
      const xlsxData = await filterModule.convertCSVtoXLSX(filePath);
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(xlsxData);
    }

    const worksheet = workbook.getWorksheet(1); 
    filteredRows = await filterModule.createWorkbook(worksheet, filteredRows);

    const headerRow = worksheet.getRow(1);
    headerData = headerRow.values;

    if (filteredRows.length > 0) {
      await downloadEmails();
      event.sender.send('sortingSuccess');

      filteredRows.unshift(headerData);
      sortedData = filteredRows;
    }
    else {
      event.sender.send('sortingError', 'Aucune donnée à trier !');
    }
  } catch (error) {
    console.error('Erreur lors du tri des données :', error);
    event.sender.send('sortingError', 'Erreur lors du tri des données : ' + error.message);
  }
});

async function downloadEmails() {
  const emailsFolderPath = path.join(userDataPath, 'emails');
  if (!fs.existsSync(emailsFolderPath)) {
    fs.mkdirSync(emailsFolderPath);
  }

  function downloadIfNotExists(sourcePath, destinationPath) {
    if (!fs.existsSync(destinationPath)) {
      fs.copyFile(sourcePath, destinationPath, (err) => {
        if (err) {
          console.error('Erreur lors de la copie du fichier :', err);
        } else {
          console.log('Fichier copié avec succès.');
        }
      });
    }
  }

  const emailFiles = [
    { source: path.join(__dirname, 'emails/adhesionEmail.html'), destination: path.join(emailsFolderPath, 'adhesionEmail.html') },
    { source: path.join(__dirname, 'emails/decouverteEmail.html'), destination: path.join(emailsFolderPath, 'decouverteEmail.html') },
    { source: path.join(__dirname, 'emails/facturationEmail.html'), destination: path.join(emailsFolderPath, 'facturationEmail.html') },
    { source: path.join(__dirname, 'emails/testEmail.html'), destination: path.join(emailsFolderPath, 'testEmail.html') },
    { source: path.join(__dirname, 'emails/stageEmail.html'), destination: path.join(emailsFolderPath, 'stageEmail.html') }
  ];

  emailFiles.forEach(emailFile => {
    downloadIfNotExists(emailFile.source, emailFile.destination);
  });
}

ipcMain.on('sortDocFile', async (event, filePath) => {
  try {
    let filteredRows = [];

    if (filePath.endsWith('.docx')) {
      const PizZip = require("pizzip");
      const Docxtemplater = require("docxtemplater");
      
      const fs = require("fs");
      const path = require("path");
      
      const content = fs.readFileSync(
          path.resolve(__dirname, filePath),
          "binary"
      );
      
      const zip = new PizZip(content);
      
      const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
      });

      console.log(doc.getFullText());
    }

    if (filteredRows.length > 0) {
      event.sender.send('sortingSuccess', filteredRows);

      sortedData = filteredRows;
    }
    else {
      event.sender.send('sortingError', 'Aucune donnée');
    }
  } catch (error) {
    console.error('Erreur lors du chargement du document :', error);
    event.sender.send('sortingError', 'Erreur lors du chargement du document : ' + error.message);
  }
});

ipcMain.on('printExcelFile', async (event, filePath, dataSorted) => {
  if (!sortedData) {
    event.sender.send('printError', 'Veuillez d\'abord entrer un fichier Excel !');
    return;
  }
  try {
    let newFilePath = '';

    if (filePath.endsWith('.xlsx')) {
      newFilePath = filePath.replace('.xlsx', '_trie.xlsx');
    } else if (filePath.endsWith('.csv')) {
      newFilePath = filePath.replace('.csv', '_trie.xlsx');
    }
    else {
      catchError('Format de fichier non pris en charge :', fileExtension);
      event.sender.send('sortingError', 'Format de fichier non pris en charge : ' + fileExtension);
    }
    const workbook = new ExcelJS.Workbook();
    const FacturationSheet = workbook.addWorksheet('facturation');
    const AdhesionSheet = workbook.addWorksheet('adhesion');
    const découverteSheet = workbook.addWorksheet('découverte');
    const testSheet = workbook.addWorksheet('test');
    const stageSheet = workbook.addWorksheet('stage');

    await facturationModule.fillFacturationWorksheet(FacturationSheet, dataSorted[0], sortedData);
    await adhesionModule.fillAdhesionWorksheet(AdhesionSheet, dataSorted[1], sortedData);
    await decouverteModule.fillDécouverteWorksheet(découverteSheet, dataSorted[2], sortedData);
    await testModule.fillTestWorksheet(testSheet, dataSorted[3], sortedData);
    await stageModule.fillStageWorksheet(stageSheet, dataSorted[4], sortedData);

    await workbook.xlsx.writeFile(newFilePath);

    event.sender.send('printSuccess');
  } catch (error) {
    console.error('Erreur lors de l\'impression des données :', error);
    event.sender.send('printError', 'Erreur lors de l\'impression des données : ' + error.message);
  }
});

ipcMain.on('printDocAccueil', async (event, dateDoc1, dateDoc2, stageList) => {
  if (!stageList) {
    event.sender.send('printError', 'Pas de liste de stage à imprimer !');
    return;
  }
  try {
    await docsModule.fillAccueilDoc(downloadsPath, stageList, dateDoc1, dateDoc2);
    event.sender.send('printDocSuccess');

  }catch (error) {
    console.error('Erreur lors de l\'impression des données :', error);
    event.sender.send('printError', 'Erreur lors de l\'impression des données : ' + error.message);
  }
});