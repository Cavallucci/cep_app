const { app, BrowserWindow, ipcMain } = require('electron');
const ExcelJS = require('exceljs');

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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);

    const filteredRows = [];
    worksheet.eachRow((row) => {
      const rowData = row.values;
      const statusValue = rowData[1]; // Colonne 'A'
      const amountValue = rowData[9]; // Colonne 'I'
      const restDueValue = rowData[3]; // Colonne 'C'

      if (statusValue !== 'canceled' && statusValue !== 'closed' && amountValue > 0 && restDueValue > 0) {
        filteredRows.push(rowData);
      }
    });

    sortedData = filteredRows;
    // Ajouter les en-têtes du worksheet à sortedData
    const headerRow = worksheet.getRow(1);
    const headerData = headerRow.values;
    filteredRows.unshift(headerData);

    event.sender.send('sortingSuccess', filteredRows);

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
    // Créez un nouveau fichier Excel avec les données triées
    const newFilePath = filePath.replace('.xlsx', '_trie.xlsx');
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