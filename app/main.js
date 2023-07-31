const { app, BrowserWindow, ipcMain } = require('electron');
const ExcelJS = require('exceljs');
const filterModule = require('./filter');

let mainWindow;
let sortedData = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
}

app.on('ready', createWindow);

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

ipcMain.on('sortExcelFile', async (event, filePath) => {
  console.log('Reçu un message pour trier le fichier Excel :', filePath);
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
      event.sender.send('sortingSuccess', filteredRows);

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

ipcMain.on('printExcelFile', async (event, filePath) => {
  if (!sortedData) {
    event.sender.send('printError', 'Veuillez d\'abord trier le fichier Excel !');
    return;
  }
  try {
    let newFilePath = '';
    // Créez un nouveau fichier Excel avec les données triées
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
    const worksheet = workbook.addWorksheet('facturation');

    // Écrivez les données triées dans la feuille de calcul
    sortedData.forEach((rowData) => {
      worksheet.addRow(rowData);
    });

    await workbook.xlsx.writeFile(newFilePath);

    // Envoyez un message de succès au processus de rendu
    event.sender.send('printSuccess');
  } catch (error) {
    console.error('Erreur lors de l\'impression des données :', error);
    event.sender.send('printError', 'Erreur lors de l\'impression des données : ' + error.message);
  }
});