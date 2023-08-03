function fillCustomersList(groupedData) {
    const t_customers = [];

    for (customerData of groupedData) {
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.sku.push(customerData[7]);
        } else {
            const newCustomer = {
                childId: customerData[18],
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                courses: [customerData[8]],
                sku: [customerData[7]],
            };
            t_customers.push(newCustomer);
        }
    }
    const customersWithoutTKAndAdSKU = t_customers.filter((customer) => {
        const hasTKSKU = customer.sku.some((sku) => sku && sku.startsWith('TK'));
        const hasAdSKU = customer.sku.some((sku) => sku && sku.startsWith('Ad'));
        return hasTKSKU && !hasAdSKU;
    });

    return customersWithoutTKAndAdSKU;
}
  
function displayAdhesion(groupedData) {
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
        label.textContent = `L'enfant ${t_customers[i].childId} n'a pas pris son adhésion pour les cours suivants : ${t_customers[i].courses}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
}

async function fillAdhesionWorksheet(worksheet, data, sortedData) {
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

module.exports = {
    displayAdhesion,
    fillCustomersList,
    fillAdhesionWorksheet
  };