const { app, BrowserWindow, ipcMain } = require('electron');
const ExcelJS = require('exceljs');
const fs = require('fs');
const csvParser = require('csv-parser');

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
      const xlsxData = await convertCSVtoXLSX(filePath);
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(xlsxData);
    }

      const worksheet = workbook.getWorksheet(1);
      
      worksheet.eachRow((row) => {
        const rowData = row.values;
        const statusValue = rowData[1]; // Colonne 'A'
        const amountValue = rowData[9]; // Colonne 'I'
        const restDueValue = rowData[3]; // Colonne 'C'
        
        if (typeof restDueValue === 'string'){
          const formattedRestDue = parseFloat(restDueValue.replace('.', ','));
          rowData[3] = formattedRestDue; // Met à jour la valeur dans le tableau rowData
        }
      
        if (statusValue !== 'canceled' && statusValue !== 'closed' && amountValue > 0 && rowData[3] > 0) {
            filteredRows.push(rowData);
        }
      });
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

async function convertCSVtoXLSX(filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
  
    // Read the CSV file and split it into lines and columns
    const data = fs.readFileSync(filePath, 'utf-8');
    const lines = data.split(/\r?\n/);
    const header = lines.shift().split(';');
    const rows = lines.map((line) => line.split(';'));
  
    // Write the header and rows to the worksheet
    worksheet.addRow(header);
    rows.forEach((columns) => worksheet.addRow(columns));
  
    // Create a buffer to hold the XLSX file
    const buffer = await workbook.xlsx.writeBuffer();
  
    return buffer;
  }


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