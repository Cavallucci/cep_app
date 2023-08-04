const checkboxModule = require('./checkbox');

function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.customerId === customerData[4]);

        if (existingCustomer) {
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.totalRestantDu += customerData[3];
            existingCustomer.totalPxVente += customerData[23];
        } else {
            const newCustomer = {
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                totalRestantDu: customerData[3],
                courses: [customerData[8]],
                totalPxVente: customerData[23]
            };
        if (newCustomer.totalRestantDu > 0 && newCustomer.totalPxVente > 0)
            t_customers.push(newCustomer);
        }
    }
    return t_customers;
}
  
function displayFacturation(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = fillCustomersList(groupedData);

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `facturation`; // Unique ID for each checkbox
        checkbox.setAttribute('data-customer-id', t_customers[i].customerId);
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `Le customer ${t_customers[i].customerFirstName} ${t_customers[i].customerLastName} numéro ${t_customers[i].customerId} a un total de ${t_customers[i].totalPxVente}€ restant du pour les cours suivants : ${t_customers[i].courses}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
    checkboxModule.setupCheckboxListeners(t_customers);
}

async function fillFacturationWorksheet(worksheet, data, sortedData) {
    const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
    worksheet.addRow(header);
  
    sortedData.sort((a, b) => a[4] - b[4]);
  
    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.customerId === rowData[4]);
  
      if (existingCustomer  && rowData[3] > 0 && rowData[23] > 0) {
        row = worksheet.addRow(rowData);
        row.getCell(23).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }
        };
      }
    });
}

module.exports = {
    displayFacturation,
    fillCustomersList,
    fillFacturationWorksheet
  };