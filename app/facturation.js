const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');
const axios = require('axios');
const { config } = require('exceljs');
const Base64 = require('js-base64').Base64;
const path = require('path');
const { ipcRenderer, ipcMain } = require('electron');
const configfile = require(path.join(__dirname, '../config.json'));

async function fillCustomersList(groupedData) {
    const t_customers = [];
    const header = await ipcRenderer.invoke('get-header-data');
    for (customerData of groupedData) {
        let existingCustomer = t_customers.find((t_customer) => t_customer.customerId === customerData[header.customerIDIndex]);

        if (existingCustomer) {
            if (!existingCustomer.childCourses.has(customerData[header.prenomParticipantIndex])) {
                existingCustomer.childCourses.set(customerData[header.prenomParticipantIndex], []);
            }
            existingCustomer.childCourses.get(customerData[header.prenomParticipantIndex]).push(customerData[header.nameIndex]);
                        
            existingCustomer.totalPxVente += customerData[header.prixVenteIndex];
            let existingOrder = false;

            for (order of existingCustomer.nborder) {
                if (order === customerData[header.incrementIdIndex]) {
                    existingOrder = true;
                }
            }
            if (existingOrder === false) {
                existingCustomer.nborder.push(customerData[header.incrementIdIndex]);
                existingCustomer.totalRestantDu += customerData[header.restDueValueIndex];
            }
            if (existingCustomer.childsFirstName.some((childsFirstName) => childsFirstName !== customerData[header.prenomParticipantIndex])) {
                existingCustomer.childsFirstName.push(customerData[header.prenomParticipantIndex]);
            }
        } else {
            const newCustomer = {
                customerId: customerData[header.customerIDIndex],
                customerFirstName: customerData[header.customerFirstNameIndex],
                customerLastName: customerData[header.customerLastNameIndex],
                childsFirstName: [customerData[header.prenomParticipantIndex]],
                nborder: [customerData[header.incrementIdIndex]],
                totalRestantDu: customerData[header.restDueValueIndex],
                childCourses: new Map([[customerData[header.prenomParticipantIndex], [customerData[header.nameIndex]]]]),
                totalPxVente: customerData[header.prixVenteIndex],
                customerEmail: customerData[header.emailIndex],
                lienSystemPay: '',
            };
            t_customers.push(newCustomer);
        }
    }
    const withoutRestantDue = t_customers.filter((customer) => {
        return customer.totalRestantDu > 0 && customer.totalPxVente > 0;
    });

    return withoutRestantDue;
}

function displayCustomerDetails(customer) {
    const customerDetailsContainer = document.getElementById('customerDetails');
    customerDetailsContainer.innerHTML = '';

    const customerDetails = document.createElement('div');
    customerDetails.innerHTML = `
        <h3>Informations du client</h3>
        <p><strong>Nom complet</strong>: ${customer.customerFirstName} ${customer.customerLastName}</p>
        <p><strong>Identifiant</strong>: ${customer.customerId}</p>
        <p><strong>Reste à payer</strong>: ${customer.totalRestantDu}€</p>
        <p><strong>Total</strong>: ${customer.totalPxVente}€</p>
        <ul><strong>Cours</strong>:
        ${Array.from(customer.childCourses.keys()).map(childFirstName => {
            const courses = customer.childCourses.get(childFirstName);
            const coursesList = courses.map(course => `<ul>${course}</ul>`).join('');
            return `<li>${childFirstName}:<br> ${coursesList}</li>`;
        }).join('')}
        </ul>
         `;

    customerDetailsContainer.appendChild(customerDetails);
}
  
async function displayFacturation(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = '';

    const t_customers = await fillCustomersList(groupedData);

    t_customers.sort((a, b) => a.customerLastName.localeCompare(b.customerLastName));
    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `facturation`; 
        checkbox.setAttribute('data-customer-id', t_customers[i].customerId);
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `${t_customers[i].customerFirstName} ${t_customers[i].customerLastName}, ${t_customers[i].totalRestantDu}€`;
        customerInfo.appendChild(label);

        label.addEventListener('click', () => {
            displayCustomerDetails(t_customers[i]);
        });

        container.appendChild(customerInfo);
    }
}

async function fillSystemPay(customer) {
        const today = new Date();
        const expirationDate = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate() + 27); // date ajd + 89 jours
        const body = {
            amount: customer.totalRestantDu * 100,
            currency: "EUR",
            customer: {
                email: customer.customerEmail,
                reference: customer.customerId,
                billingDetails: {
                    firstName: customer.customerFirstName,
                    lastName: customer.customerLastName,
                }
            },
            channelOptions: {
                channelType: "URL"
            },
            paymentReceiptEmail: customer.customerEmail,
            expirationDate: expirationDate,
            dataCollectionForm: "false"
        };
        const username = configfile.SMTP_SYSUSERNAME;
        const password = configfile.SMTP_SYSPASSWORD;
        const auth = Base64.encode(`${username}:${password}`);
        const headers = {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
        };
        const url = 'https://api.systempay.fr/api-payment/V4/Charge/CreatePaymentOrder';
        const response = await axios.post(url, body, { headers: headers });
        customer.lienSystemPay = response.data.answer.paymentURL;
}

async function fillFacturationWorksheet(worksheet, data, sortedData, header) {
    const columnNames = Object.keys(header);
    worksheet.addRow(columnNames);
  
    sortedData.sort((a, b) => a[header.customerIDIndex] - b[header.customerIDIndex]);
  
    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.customerId === rowData[header.customerIDIndex]);
        if (existingCustomer) {
            row = worksheet.addRow(rowData);
        }
        if (rowData[header.restDueValueIndex] > 0) {
            row.getCell(header.restDueValueIndex).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' }
            };
        }
    });
}

async function manageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const facturationList = await facturationModule.fillCustomersList(globalData);
    const checkboxFound = facturationList.find((facturationList) => facturationList.customerId === customerId);
  
    try {
      await fillSystemPay(checkboxFound);
  
      if (!emailValidator.validate(checkboxFound.customerEmail)) {
        alert(`Le customer ${checkboxFound.customerFirstName} ${checkboxFound.customerLastName} numéro ${checkboxFound.customerId} n'a pas d'email de renseigné`);
        return;
      }
      if (checkboxFound.lienSystemPay === '') {
        alert(`Erreur systemPay customer ${checkboxFound.customerFirstName} ${checkboxFound.customerLastName} numéro ${checkboxFound.customerId}`);
        return;
      }
      const response = await checkboxModule.sendEmailFacturation(checkboxFound);
      return response;

    } catch (error) {
      alert(`Une erreur s'est produite lors de l'interaction avec SystemPay : ${error.message}`);
    }
}

module.exports = {
    displayFacturation,
    fillCustomersList,
    manageEmail,
    fillFacturationWorksheet,
  };