const ExcelJS = require('exceljs');
const fs = require('fs');

const createWorkbook = (worksheet, filteredRows) => {
    worksheet.eachRow((row) => {
      const rowData = row.values;

      const statusValue = rowData[1];
      const customerId = rowData[4];
      const amountValue = rowData[9];
      const restDueValue = rowData[3];
      const dateTest = rowData[33];
      const pxVente = rowData[23];
      
      //rowData[27] = 'nathalie@clubdesenfantsparisiens.com';
      //rowData[27] = 'test.cep.application@laposte.net';
      //rowData[27] = 'laura.cllucci@gmail.com';

      if (typeof restDueValue === 'string'){
        const formattedRestDue = parseFloat(restDueValue);
        rowData[3] = formattedRestDue;
      }

      if (typeof pxVente === 'string'){
        const formattedVenteDue = parseFloat(pxVente);
        rowData[23] = formattedVenteDue;
      }

      if (typeof dateTest === 'string'){
        const extractedDate = extractDateFromString(dateTest);
        if (extractedDate) {
          rowData[36] = extractedDate;
        }
      }
      //customerId != '917' && 
      if (statusValue !== 'canceled' && statusValue !== 'closed' && amountValue > 0) {
          filteredRows.push(rowData);
      }
    });

    for (let i = 0; i < filteredRows.length; i++) {
      for (let j = 0; j < filteredRows[i].length; j++) {
          if (filteredRows[i][j] && typeof filteredRows[i][j] === 'string') {
            filteredRows[i][j] = filteredRows[i][j].toString().replace(/"/g, '');
          }
      }
  }

    return filteredRows;
}

function extractDateFromString(str) {
  if (str) {
    const dateParts = str.split(' ');
    const datePart = dateParts[6];
    if (datePart) {
      const [day, month, year] = datePart.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      return date;
    }
  }
  return str;
}

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

  function removeDoublons(checkboxes) {
    const uniqueCheckboxes = new Map();
  
    checkboxes.forEach(checkbox => {
      const customerId = checkbox.getAttribute('data-customer-id');
      if (!uniqueCheckboxes.has(customerId)) {
        uniqueCheckboxes.set(customerId, checkbox);
      }
    });
  
    return Array.from(uniqueCheckboxes.values());
  }

  function setTimeWaiting(lenght) {
      let time = 0;

      if (lenght < 50) {
        time = 1000;
      }
      else if (lenght < 100) {
        time = 2000;
      }
      else if (lenght < 200) {
        time = 3000;
      }
      else if (lenght < 300 ) {
        time = 4000;
      }
      else if (lenght < 400) {
        time = 5000;
      }
      else if (lenght < 500) {
        time = 6000;
      }
      else if (lenght > 500) {
        time = 7000;
      }
      return time;
  }

  function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  module.exports = {
    createWorkbook,
    convertCSVtoXLSX,
    removeDoublons,
    setTimeWaiting,
    formatDate
  };