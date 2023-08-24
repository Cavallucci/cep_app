const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');

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
                childFirstName: customerData[19],
                childLastName: customerData[20],
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                customerEmail: customerData[27],
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

function displayCustomerDetails(customer) {
    const container = document.getElementById('customerDetails');
    container.innerHTML = '';

    const customerDetails = document.createElement('div');
    customerDetails.innerHTML = `
        <h3>Informations de l'enfant</h3>
        <p><strong>Prénom</strong>: ${customer.childFirstName}</p>
        <p><strong>Nom</strong>: ${customer.childLastName}</p>
        <p><strong>Identifiant</strong>: ${customer.childId}</p>
        <p><strong>Parent</strong>: ${customer.customerFirstName} ${customer.customerLastName}</p>
        <p><strong>Identifiant du parent</strong>: ${customer.customerId}</p>
        <ul><strong>Cours</strong>:
        ${customer.courses.map(courses => `<li>${courses}</li>`).join('')}
        </ul>
            `;
    
    container.appendChild(customerDetails);
}
  
function displayAdhesion(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = fillCustomersList(groupedData);

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `adhesion`;
        checkbox.setAttribute('data-customer-id', t_customers[i].customerId);
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `${t_customers[i].childFirstName} ${t_customers[i].childLastName}`;
        customerInfo.appendChild(label);

        label.addEventListener('click', () => {
            displayCustomerDetails(t_customers[i]);
        });

        container.appendChild(customerInfo);
    }
}

async function fillAdhesionWorksheet(worksheet, data, sortedData) {
    const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
    worksheet.addRow(header);
  
    sortedData.sort((a, b) => a[18] - b[18]);
  
    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.childId === rowData[18]);
  
      if (existingCustomer && rowData[7].startsWith('TK')) {
        worksheet.addRow(rowData);
      }
    });
  }

async function manageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const adhesionList = adhesionModule.fillCustomersList(globalData);

    let groupEmail = [];
    for (const adhesion of adhesionList) {
        if (adhesion.customerId === customerId) {
            groupEmail.push(adhesion);
        }
    }
    if (groupEmail.length > 0) {
        if (emailValidator.validate(groupEmail[0].customerEmail)) {
            try {
                const response = await checkboxModule.sendEmailAdhesion(groupEmail);
                return response;
            } catch (error) {
                throw error;
            }
        } else {
            alert(`Email du client ${groupEmail[0].customerFirstName} ${groupEmail[0].customerLastName} numéro ${groupEmail[0].customerId} erroné`);
        }
    }
}

module.exports = {
    displayAdhesion,
    fillCustomersList,
    fillAdhesionWorksheet,
    manageEmail
  };