const { ipcRenderer } = require('electron');

document.getElementById('fileInput').addEventListener('change', () => {
  console.log('Clic sur le bouton "Trier"');
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  console.log('Chemin du fichier Excel :', filePath);

  ipcRenderer.send('sortExcelFile', filePath);
});

document.getElementById('printButton').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;

  ipcRenderer.send('printExcelFile', filePath);
});

ipcRenderer.on('sortingSuccess', (event, groupedData) => {
  if (groupedData.length > 0) {
    displayGroupedData(groupedData);
  }
  else {
    alert('Aucune donnée détecté');
  }
});

ipcRenderer.on('sortingError', (event, error) => {
  alert(error);
  console.error(error);
});

// Écouter l'événement 'printSuccess'
ipcRenderer.on('printSuccess', () => {
  alert('Impression de l\'Excel trié réussie !');
  console.log('Impression de l\'Excel trié réussie !');
});

ipcRenderer.on('printError', (event, error) => {
  alert(error);
  console.error(error);
});

function fillCustomersList(groupedData) {
  const t_customers = [];

  for (let i = 0; i < groupedData.length; i++) {
    const customerData = groupedData[i];
    let existingCustomer = t_customers.find((t_customer) => t_customer.customerId === customerData[4]);
  
    if (existingCustomer) {
      existingCustomer.courses.push(customerData[8]);
      existingCustomer.totalRestantDu += customerData[3];
    } else {
      const newCustomer = {
        customerId: customerData[4],
        customerFirstName: customerData[5],
        totalRestantDu: customerData[3],
        courses: [customerData[8]]
      };
      t_customers.push(newCustomer);
    }
  }
  return t_customers;
}

function displayGroupedData(groupedData) {
  const container = document.getElementById('displayContainer');
  container.innerHTML = ''; // Reset the content of the container

  const t_customers = fillCustomersList(groupedData);

  for (let i = 0; i < t_customers.length; i++) {
    const customerInfo = document.createElement('div');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `customerCheckbox_${t_customers[i].customerId}`; // Unique ID for each checkbox
    customerInfo.appendChild(checkbox);

    const label = document.createElement('label');
    label.textContent = `Le customer ${t_customers[i].customerFirstName} numéro ${t_customers[i].customerId} a un total de ${t_customers[i].totalRestantDu}€ restant du pour les cours suivants : ${t_customers[i].courses}`;
    customerInfo.appendChild(label);

    container.appendChild(customerInfo);
  }
}