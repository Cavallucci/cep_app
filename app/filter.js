const ExcelJS = require('exceljs');
const fs = require('fs');

function getHeaderNumber(row) {
  const statusValueIndex = 1;
  const incrementIdIndex = row.indexOf('increment_id');
  const restDueValueIndex = row.indexOf('restant_du');
  const customerIDIndex = row.indexOf('customer_id');
  const customerFirstNameIndex = row.indexOf('customer_firstname');
  const customerLastNameIndex = row.indexOf('customer_lastname');
  const skuIndex = row.indexOf('sku');
  const nameIndex = row.indexOf('name');
  const qtyEnCoursIndex = row.indexOf('qty_en_cours');
  const salleIndex = row.indexOf('salle');
  const salle2Index = row.indexOf('salle2');
  const profCodeIndex = row.indexOf('prof_code');
  const profNameIndex = row.indexOf('prof_name');
  const profCode2Index = row.indexOf('prof_code2');
  const profName2Index = row.indexOf('prof_name2');
  const debutIndex = row.indexOf('debut');
  const finIndex = row.indexOf('fin');
  const participantsIdIndex = row.indexOf('participants_id');
  const prenomParticipantIndex = row.indexOf('prenom_participant');
  const nomParticipantIndex = row.indexOf('nom_participant');
  const dateNaissanceIndex = row.indexOf('date_naissance');
  const prixCatalogIndex = row.indexOf('prix_catalog');
  const prixVenteIndex = row.indexOf('prix_vente');
  const prixVenteHtIndex = row.indexOf('prix_vente_ht');
  const frequenceIndex = row.indexOf('frequence');
  const dateReservationIndex = row.indexOf('date_reservation');
  const emailIndex = row.indexOf('email');
  const additionnalEmailIndex = row.indexOf('additionnal_email');
  const telephoneIndex = row.indexOf('telephone');
  const streetIndex = row.indexOf('street');
  const postcodeIndex = row.indexOf('postcode');
  const cityIndex = row.indexOf('city');
  const productOptionsIndex = row.indexOf('product_options');
  const optionNameIndex = row.indexOf('option_name');
  const optionSkuIndex = row.indexOf('option_sku');
  const dateTestIndex = row.indexOf('date_test');

  return {
    statusValueIndex,
    incrementIdIndex,
    customerIDIndex,
    restDueValueIndex,
    customerFirstNameIndex,
    customerLastNameIndex,
    skuIndex,
    nameIndex,
    qtyEnCoursIndex,
    salleIndex,
    salle2Index,
    profCodeIndex,
    profNameIndex,
    profCode2Index,
    profName2Index,
    debutIndex,
    finIndex,
    participantsIdIndex,
    prenomParticipantIndex,
    nomParticipantIndex,
    dateNaissanceIndex,
    prixCatalogIndex,
    prixVenteIndex,
    prixVenteHtIndex,
    frequenceIndex,
    dateReservationIndex,
    emailIndex,
    additionnalEmailIndex,
    telephoneIndex,
    streetIndex,
    postcodeIndex,
    cityIndex,
    productOptionsIndex,
    optionNameIndex,
    optionSkuIndex,
    dateTestIndex,
  };
}

const createWorkbook = (worksheet, filteredRows, headers) => {
    worksheet.eachRow((row) => {
      const rowData = row.values;

      const statusValue = rowData[headers.statusValueIndex];
      const customerId = rowData[headers.customerIDIndex];
      const amountValue = rowData[headers.qtyEnCoursIndex];
      const restDueValue = rowData[headers.restDueValueIndex];
      const dateTest = rowData[headers.dateTestIndex];
      const pxVente = rowData[headers.prixVenteIndex];

      // const statusValue = rowData[1];
      // const customerId = rowData[4];
      // const amountValue = rowData[9];
      // const restDueValue = rowData[3];
      // const dateTest = rowData[33];
      // const pxVente = rowData[23];
      
      //rowData[headers.emailIndex] = 'nathalie@clubdesenfantsparisiens.com';
      //rowData[27] = 'test.cep.application@laposte.net';
      //rowData[headers.emailIndex] = 'laura.cllucci@gmail.com';

      if (typeof restDueValue === 'string'){
        const formattedRestDue = parseFloat(restDueValue);
        //rowData[3] = formattedRestDue;
        rowData[headers.restDueValueIndex] = formattedRestDue;
      }
      if (typeof pxVente === 'string'){
        const formattedVenteDue = parseFloat(pxVente);
        //rowData[23] = formattedVenteDue;
        rowData[headers.prixVenteIndex] = formattedVenteDue;
      }

      if (typeof dateTest === 'string'){
        const extractedDate = extractDateFromString(dateTest);
        if (extractedDate) {
          //rowData[36] = extractedDate;
          rowData[headers.dateTestIndex] = extractedDate;
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
  
function removeDiacritics(str) {
  if (!str) {
      return '';
  }
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
  
  module.exports = {
    createWorkbook,
    convertCSVtoXLSX,
    removeDoublons,
    setTimeWaiting,
    formatDate,
    removeDiacritics,
    getHeaderNumber,
  };