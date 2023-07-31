const ExcelJS = require('exceljs');
const fs = require('fs');

const createWorkbook = (worksheet, filteredRows) => {
    worksheet.eachRow((row) => {
      const rowData = row.values;
      const statusValue = rowData[1]; // Colonne 'A'
      const amountValue = rowData[9]; // Colonne 'I'
      const restDueValue = rowData[3]; // Colonne 'C'
      
      if (typeof restDueValue === 'string'){
        const formattedRestDue = parseFloat(restDueValue.replace('.', ','));
        rowData[3] = formattedRestDue;
      }
    
      if (statusValue !== 'canceled' && statusValue !== 'closed' && amountValue > 0 && rowData[3] > 0) {
          filteredRows.push(rowData);
      }
    });
    return filteredRows;
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
  
  module.exports = {
    createWorkbook,
    convertCSVtoXLSX
  };