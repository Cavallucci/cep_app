const { ipcRenderer } = require('electron');
const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');

async function fillCustomersList(groupedData) {
    const t_customers = [];
    const headers = await ipcRenderer.invoke('get-header-data'); 
    for (customerData of groupedData) {
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[headers.participantsIdIndex]);

        if (existingCustomer) {
            existingCustomer.courses.push(customerData[headers.nameIndex]);
            existingCustomer.sku.push(customerData[headers.skuIndex]);
        } else {
            const newCustomer = {
                childId: customerData[headers.participantsIdIndex],
                childFirstName: customerData[headers.prenomParticipantIndex],
                childLastName: customerData[headers.nomParticipantIndex],
                customerId: customerData[headers.customerIDIndex],
                customerFirstName: customerData[headers.customerFirstNameIndex],
                customerLastName: customerData[headers.customerLastNameIndex],
                customerEmail: customerData[headers.emailIndex],
                courses: [customerData[headers.nameIndex]],
                sku: [customerData[headers.skuIndex]],
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
  
async function displayAdhesion(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = await fillCustomersList(groupedData);

    t_customers.sort((a, b) => a.childLastName.localeCompare(b.childLastName));

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

async function fillAdhesionWorksheet(worksheet, data, sortedData, header) {
    worksheet.addRow(header);
  
    sortedData.sort((a, b) => a[header.participantsIdIndex] - b[header.participantsIdIndex]);
  
    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.childId === rowData[header.participantsIdIndex]);
  
      if (existingCustomer && rowData[7].startsWith('TK')) {
        worksheet.addRow(rowData);
      }
    });
  }

async function manageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const adhesionList = await adhesionModule.fillCustomersList(globalData);

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