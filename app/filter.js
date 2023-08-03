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
      
      if (typeof restDueValue === 'string'){
        const formattedRestDue = parseFloat(restDueValue.replace('.', ','));
        rowData[3] = formattedRestDue;
      }

      if (typeof dateTest === 'string'){
        const extractedDate = extractDateFromString(dateTest);
        if (extractedDate) {
          rowData[36] = extractedDate;
        }
      }
    
      if (customerId != '917' && statusValue !== 'canceled' && statusValue !== 'closed' && amountValue > 0) {
          filteredRows.push(rowData);
      }
    });
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
  
  module.exports = {
    createWorkbook,
    convertCSVtoXLSX
  };