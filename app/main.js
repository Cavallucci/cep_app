const { app, BrowserWindow, ipcMain } = require('electron');
const ExcelJS = require('exceljs');

let mainWindow;

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

    // Supprimer l'ancienne feuille de calcul
    workbook.removeWorksheet(worksheet.id);

    // Créer une nouvelle feuille de calcul vide
    const newWorksheet = workbook.addWorksheet('facturation');

    // Ajouter les en-têtes de colonnes à la nouvelle feuille de calcul
    const headerRow = newWorksheet.getRow(1);
    headerRow.values = worksheet.getRow(1).values;

    // Ajouter les lignes filtrées dans la nouvelle feuille de calcul
    filteredRows.forEach((rowData) => {
      newWorksheet.addRow(rowData);
    });

    // Créer un nouveau fichier Excel avec les données triées
    const newFilePath = filePath.replace('.xlsx', '_trie.xlsx');
    await workbook.xlsx.writeFile(newFilePath);

    console.log('Fichier Excel trié créé :', newFilePath);
    event.sender.send('sortingSuccess', 'Données triées avec succès!');
  } catch (error) {
    console.error('Erreur lors du tri des données :', error);
    event.sender.send('sortingError', 'Erreur lors du tri des données : ' + error.message);
  }
});
