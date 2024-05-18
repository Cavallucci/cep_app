const { app, BrowserWindow, ipcMain, dialog, shell} = require('electron');
const ExcelJS = require('exceljs');
const filterModule = require('./filter');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');
const docsModule = require('./docs');
const bafaDocModule = require('./bafaDoc');
const docx = require('docx');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const downloadManager = require('electron-download-manager');
const configfile = require(path.join(__dirname, '../config.json'));
const unzipper = require('unzipper');
const axios = require('axios');
const semver = require('semver');
const { url } = require('inspector');
const rimraf = require('rimraf');
const AdmZip = require('adm-zip');
const { start } = require('repl');
const downloadsPath = app.getPath('downloads');
const userDataPath = app.getPath('userData');
const FormData = require('form-data');
downloadManager.register({ downloadFolder: downloadsPath });

let mainWindow;
let sortedData = [];
let dateAsk = new Date(0);
let headerData;

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

function createLoadingWindow(loadingWindow) {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: 'app/preload.js'
    },
    frame: false,
    transparent: true,
  });
  loadingWindow.loadFile(path.join(__dirname, 'emails/loading.html'));
}

async function checkForUpdates() {
  try {
    if (process.platform === 'linux') return;
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
        let loadingWindow;
        createLoadingWindow(loadingWindow);

        const updateFilePath = 'update.zip';
        await downloadUpdate(latestRelease.downloadUrl, updateFilePath);
        await installUpdate(updateFilePath);
        dialog.showMessageBoxSync({
          type: 'info',
          buttons: ['OK'],
          defaultId: 0,
          message: 'Mise à jour terminée !',
        });
        close(loadingWindow);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour :', error);
  }
}

async function getLatestReleaseInfo() {
  try {
    let response = '';
    const token = configfile.SMTP_TOKEN;
      const headers = {
        'Authorization': `token ${token}`,
      };
    if (process.platform === 'win32') {
      response = await axios.get('https://api.github.com/repos/Cavallucci/cep_app/releases/latest', { headers });
    }
    else if (process.platform === 'darwin') {
      response = await axios.get('https://api.github.com/repos/Cavallucci/cep_app-mac/releases/latest', { headers });
    }
    if (response.status !== 200) {
      console.log('erreur = ' + response)
      return null;
    }
    return {
      version: response.data.tag_name,
      downloadUrl: response.data.assets[0].browser_download_url,
      data: response.data
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

function createDesktopShortcutfunction(pathNewExeApp) {
 if (process.platform === 'win32') {
  try {
    const desktopPath = app.getPath('desktop');
    const shortcutPath = path.join(desktopPath, 'cep-app-auto.lnk');
    const result = shell.writeShortcutLink(shortcutPath, {
      target: pathNewExeApp,
    });
    if (result) {
      console.log('Raccourci créé avec succès.');
    }
  } catch (error) {
    console.error('Erreur lors de la création du raccourci :', error);
  }
  }
}      

function removeDesktopShortcut() {
  const desktopPath = app.getPath('desktop');
  const shortcutPath = path.join(desktopPath, 'cep-app-auto.lnk');

  if (fs.existsSync(shortcutPath)) {
    fs.unlinkSync(shortcutPath);
  }
}

async function installUpdate(updateFolderPath) {
  try {
    if (process.platform === 'win32') {
      const currentAppDir = path.join(path.dirname(app.getAppPath()),'..', '..', '..');
      const myAppDir = path.join(path.dirname(app.getAppPath()), '..', '..');
      const updateFileName = 'update.zip';
      const updateFilePath = path.join(currentAppDir, updateFileName);
      
      removeDesktopShortcut();
      if (fs.existsSync(updateFilePath)) {
        await fs.unlink(updateFilePath, (err) => {
          if (err) {
            console.error('Erreur lors de la suppression du fichier de mise à jour actuel :', err);
          } else {
            console.log('Fichier de mise à jour actuel supprimé avec succès.');
          }
        });
      }
      await fs.promises.copyFile(updateFolderPath, updateFilePath).then(() => {
        console.log('Fichier de mise à jour copié avec succès.');
      }
      ).catch((err) => {
        console.error('Erreur lors de la copie du fichier de mise à jour :', err);
      });
      let previousAppDir = '';
      const matchingDir = fs.readdirSync(currentAppDir).find((item) => item.startsWith('win-unpacked_'));
      if (matchingDir) {
        previousAppDir = path.join(currentAppDir, matchingDir);
      }
      if (fs.existsSync(previousAppDir) && previousAppDir !== myAppDir) {
        await fsExtra.remove(previousAppDir).then(() => {
          console.log('Dossier de l\'ancienne version supprimé avec succès.');
        }).catch((err) => {
          console.error('Erreur lors de la suppression du dossier de l\'ancienne version :', err);
        });
      }
      const zip = new AdmZip(updateFilePath);
      const updateFolderName = `win-unpacked_${new Date().toISOString().replace(/:/g, '-')}`;
      zip.extractAllTo(path.join(currentAppDir, updateFolderName), true);
      await fs.unlink(updateFilePath, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression du fichier :', err);
        } else {
          console.log('Fichier de mise à jour actuel supprimé avec succès.');
        }
      });
      await fs.unlink(updateFolderPath, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression du fichier :', err);
        } else {
          console.log('Fichier de mise à jour actuel supprimé avec succès.');
        }
      });
      pathNewExeApp = path.join(currentAppDir, updateFolderName, 'win-unpacked', 'cep-app-auto.exe');
      createDesktopShortcutfunction(pathNewExeApp);
      await fsExtra.remove(myAppDir).then(() => {
        console.log('Dossier de l\'ancienne version supprimé avec succès.');
      }).catch((err) => {
        console.error('Erreur lors de la suppression du dossier de l\'ancienne version :', err);
      });
      app.exit();
    }
    else if (process.platform === 'darwin') {
      const updateFilePath = path.join(updateFolderPath, 'update.zip');
      const zip = new AdmZip(updateFilePath);
      zip.extractAllTo(path.join(__dirname, '..'), true);

      await fs.unlink(updateFilePath, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression du fichier :', err);
        } else {
          console.log('Fichier de mise à jour actuel supprimé avec succès.');
        }
      });
      
      fsExtra.remove(path.join(__dirname, '..')).then(() => {
        console.log('Dossier de l\'ancienne version supprimé avec succès.');
      } ).catch((err) => {
        console.error('Erreur lors de la suppression du dossier de l\'ancienne version :', err);
      });

      app.exit();
    }
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

ipcMain.handle('get-header-data', (event) => {
  return headerData;
});

ipcMain.on('sortExcelFile', async (event, filePath) => {
  try {
    let filteredRows = [];
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
    const headerRow = worksheet.getRow(1);
    headerData = filterModule.getHeaderNumber(headerRow.values);
    filteredRows = await filterModule.createWorkbook(worksheet, filteredRows, headerData);
    
    if (filteredRows.length > 0) {
      await downloadEmails();
      event.sender.send('sortingSuccess');

      filteredRows.unshift(headerRow.values);
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
    { source: path.join(__dirname, 'emails/stageEmail.html'), destination: path.join(emailsFolderPath, 'stageEmail.html') },
    { source: path.join(__dirname, 'emails/evenementEmail.html'), destination: path.join(emailsFolderPath, 'evenementEmail.html') },
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

    await facturationModule.fillFacturationWorksheet(FacturationSheet, dataSorted[0], sortedData, headerData);
    await adhesionModule.fillAdhesionWorksheet(AdhesionSheet, dataSorted[1], sortedData, headerData);
    await decouverteModule.fillDécouverteWorksheet(découverteSheet, dataSorted[2], sortedData, headerData);
    await testModule.fillTestWorksheet(testSheet, dataSorted[3], sortedData, headerData);
    await stageModule.fillStageWorksheet(stageSheet, dataSorted[4], sortedData, headerData);

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

ipcMain.on('printDocProf', async (event, dateDoc1, dateDoc2, stageList) => {
  if (!stageList) {
    event.sender.send('printError', 'Pas de liste de stage à imprimer !');
    return;
  }
  try {
    await docsModule.fillProfDoc(downloadsPath, stageList, dateDoc1, dateDoc2);
    event.sender.send('printDocSuccess');

  }catch (error) {
    console.error('Erreur lors de l\'impression des données :', error);
    event.sender.send('printError', 'Erreur lors de l\'impression des données : ' + error.message);
  }
});

ipcMain.on('printDocBafa', async (event, dateDoc1, dateDoc2, stageList) => {
  if (!stageList) {
    event.sender.send('printError', 'Pas de liste de stage à imprimer !');
    return;
  }
  try {
    await bafaDocModule.fillBafaDoc(downloadsPath, stageList, dateDoc1, dateDoc2);
    event.sender.send('printDocSuccess');

  }catch (error) {
    console.error('Erreur lors de l\'impression des données :', error);
    event.sender.send('printError', 'Erreur lors de l\'impression des données : ' + error.message);
  }
});