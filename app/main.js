const { app, BrowserWindow, ipcMain } = require('electron');
const ExcelJS = require('exceljs');
const filterModule = require('./filter');

let mainWindow;
let sortedData = [];

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

ipcMain.handle('get-sorted-data', (event) => {
  return sortedData;
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

ipcMain.on('printExcelFile', async (event, filePath, dataSorted) => {
  if (!sortedData) {
    event.sender.send('printError', 'Veuillez d\'abord trier le fichier Excel !');
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

    await fillFacturationWorksheet(FacturationSheet, dataSorted[0]);
    await fillAdhesionWorksheet(AdhesionSheet, dataSorted[1]);
    await fillDécouverteWorksheet(découverteSheet, dataSorted[2]);

    await workbook.xlsx.writeFile(newFilePath);

    event.sender.send('printSuccess');
  } catch (error) {
    console.error('Erreur lors de l\'impression des données :', error);
    event.sender.send('printError', 'Erreur lors de l\'impression des données : ' + error.message);
  }
});

async function fillFacturationWorksheet(worksheet, data) {
  const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[4] - b[4]);

  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.customerId === rowData[4]);

    if (existingCustomer  && rowData[3] > 0) {
      worksheet.addRow(rowData);
    }
  });
}

async function fillAdhesionWorksheet(worksheet, data) {
  const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[18] - b[18]);

  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.childId === rowData[18]);

    if (existingCustomer) {
      worksheet.addRow(rowData);
    }
  });
}

async function fillDécouverteWorksheet(worksheet, data) {
  const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[18] - b[18]);

  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.childId === rowData[18]);

    if (existingCustomer) {
      worksheet.addRow(rowData);
    }
  });
}