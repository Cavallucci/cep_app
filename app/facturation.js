const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');
const axios = require('axios');
const { config } = require('exceljs');
const Base64 = require('js-base64').Base64;
const path = require('path');
const configfile = require(path.join(__dirname, '../config.json'));

function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.customerId === customerData[4]);

        if (existingCustomer) {
            if (!existingCustomer.childCourses.has(customerData[19])) {
                existingCustomer.childCourses.set(customerData[19], []);
            }
            existingCustomer.childCourses.get(customerData[19]).push(customerData[8]);
                        
            existingCustomer.totalPxVente += customerData[23];
            let existingOrder = false;

            for (order of existingCustomer.nborder) {
                if (order === customerData[2]) {
                    existingOrder = true;
                }
            }
            if (existingOrder === false) {
                existingCustomer.nborder.push(customerData[2]);
                existingCustomer.totalRestantDu += customerData[3];
            }
            if (existingCustomer.childsFirstName.some((childsFirstName) => childsFirstName !== customerData[19])) {
                existingCustomer.childsFirstName.push(customerData[19]);
            }
        } else {
            const newCustomer = {
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                childsFirstName: [customerData[19]],
                nborder: [customerData[2]],
                totalRestantDu: customerData[3],
                childCourses: new Map([[customerData[19], [customerData[8]]]]),
                totalPxVente: customerData[23],
                customerEmail: customerData[27],
                lienSystemPay: '',
            };
            
            if (newCustomer.totalRestantDu > 0 && newCustomer.totalPxVente > 0) {
                t_customers.push(newCustomer);
            }
        }
    }
    return t_customers;
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

    const t_customers = fillCustomersList(groupedData);

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
        const expirationDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
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
        const password = configfile.SMTP_SYSTESTPASSWORD;
        const auth = Base64.encode(`${username}:${password}`);
        const headers = {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
        };
        const url = 'https://api.systempay.fr/api-payment/V4/Charge/CreatePaymentOrder';
        const response = await axios.post(url, body, { headers: headers });
        customer.lienSystemPay = response.data.answer.paymentURL;
}

async function fillFacturationWorksheet(worksheet, data, sortedData) {
    const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
    worksheet.addRow(header);
  
    sortedData.sort((a, b) => a[4] - b[4]);
  
    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.customerId === rowData[4]);
  
      if (existingCustomer  && rowData[3] > 0) {
        row = worksheet.addRow(rowData);
        row.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }
        };
      }
    });
}

async function manageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const facturationList = facturationModule.fillCustomersList(globalData);
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