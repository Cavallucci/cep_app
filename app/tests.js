const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');
const fs = require('fs');
const path = require('path');
const filterModule = require('./filter');
const { ipcRenderer } = require('electron');

async function fillCustomersList(groupedData) {
    const t_customers = [];
    const header = await ipcRenderer.invoke('get-header-data');
    for (customerData of groupedData) {
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[header.participantsIdIndex]);

        if (existingCustomer) {
            if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TEST')) {
                existingCustomer.tests.push(customerData[header.nameIndex]);
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TK')) {
                existingCustomer.tk.push(customerData[header.nameIndex]);
                existingCustomer.tkCode.push(customerData[header.skuIndex]);
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('CARNET')) {
                customerData[header.skuIndex] = customerData[header.skuIndex].replace('CARNET_', '');
                existingCustomer.carnets.push(customerData[header.skuIndex]);
                existingCustomer.tk.push(customerData[header.nameIndex]);
            }
            existingCustomer.courses.push(customerData[header.nameIndex]);
            existingCustomer.sku.push(customerData[header.skuIndex]);
            existingCustomer.dateTest.push(extractDateTest(customerData[header.productOptionsIndex]));
        } else {
            const newCustomer = {
                childId: customerData[header.participantsIdIndex],
                childFirstName: customerData[header.prenomParticipantIndex],
                childLastName: customerData[header.nomParticipantIndex],
                customerId: customerData[header.customerIDIndex],
                customerFirstName: customerData[header.customerFirstNameIndex],
                customerLastName: customerData[header.customerLastNameIndex],
                customerEmail: customerData[header.emailIndex],
                courses: [customerData[header.nameIndex]],
                sku: [customerData[header.skuIndex]],
                carnets: [],
                tests: [],
                tk: [],
                tkCode: [],
                dateTest: [extractDateTest(customerData[header.productOptionsIndex])] //Date de votre test : : 22/04/2023 à 14h00,
            };
            if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TEST')) {
              // if (customerData[header.prixVenteIndex] !== 0) {
                newCustomer.tests.push(customerData[header.nameIndex]);
              // }
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TK')) {
                newCustomer.tk.push(customerData[header.nameIndex]);
                newCustomer.tkCode.push(customerData[header.skuIndex]);
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('CARNET')) {
                customerData[header.skuIndex] = customerData[header.skuIndex].replace('CARNET_', '');
                newCustomer.carnets.push(customerData[header.skuIndex]);
                newCustomer.tk.push(customerData[header.nameIndex]);
            }
            t_customers.push(newCustomer);
        }
    }
    let today = new Date();
    let dateAsk = document.getElementById('dateInput').value;
    dateAsk = new Date(dateAsk);

    const customerWithDate = t_customers.filter((customer) => {
        const hasDate = customer.dateTest.some((date) => date && date <= today && date >= dateAsk);
        return hasDate;
    });
    
    const customerWithtest = customerWithDate.filter((customer) => {
        const hastestDSKU = customer.sku.some((sku) => sku && sku.startsWith('TEST'));
        return hastestDSKU;
    });

    const customerWithMatchTK = findMatchingTK(customerWithtest);

    const customerWithMatch = findMatchingEnrollments(customerWithMatchTK);
    return customerWithMatch;
}

function extractDateTest(dateTest) {
    if (dateTest && typeof dateTest === 'string' && dateTest.startsWith('Date de votre test')) {
        const dateTestWords = dateTest.split(':'); //Date de votre test : : 22/04/2023 à 14h00,
        const dateTestString = dateTestWords.slice(-1);//[' : 22/04/2023 à 14h00,']
        const dateTestString2 = dateTestString[0].split(' ');
        const dateTestString3 = dateTestString2[1];//['22/04/2023']
        const dateTestString4 = dateTestString3.split('/');
        
        const day = dateTestString4[0];
        const month = dateTestString4[1];
        const year = dateTestString4[2];

        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    return null;
}

function findMatchingEnrollments(customerWithMatchTK) {
  const customersWithoutMatch = [];

  for (const customer of customerWithMatchTK) {
    let matchedTK = false;

    for (const testCourse of customer.tests) {
      const testWords = testCourse.split(' ');
      const wordAfterCoursDeDecouverte = testWords[4];

      const testWordWithoutAccents = filterModule.removeDiacritics(wordAfterCoursDeDecouverte).toLowerCase();

      if (
        customer.tk.some(
          (tkCourse) =>
          filterModule.removeDiacritics(tkCourse).toLowerCase().includes(testWordWithoutAccents)
        )
      ) {
        matchedTK = true;
        break;
      }
    }

    if (!matchedTK) {
      customersWithoutMatch.push(customer);
    }
  }

  return customersWithoutMatch;
}  

function findMatchingTK(customersWithtest) {
    const customersWithoutMatch = [];
  
    for (const customer of customersWithtest) {
      let matchedTK = false;
  
      for (const testCourse of customer.sku) {
        const testWords = testCourse.split('TEST_');
        const wordAfterTest = testWords[1];
  
        if (customer.tkCode.some((tkCourse) => tkCourse.includes(wordAfterTest))) {
          matchedTK = true;
          break;
        }
        if (customer.carnets.some((carnetCourse) => carnetCourse.includes(wordAfterTest))) {
          matchedTK = true;
          break;
        }
      }
      if (!matchedTK) {
        customersWithoutMatch.push(customer);
      }
    }
    return customersWithoutMatch;
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
      <ul><strong>Cours de test</strong>: 
      ${customer.tests.map(tests => `<li>${tests}</li>`).join('')}
      </ul>
      <ul><strong>Cours à l'année</strong>:
      ${customer.courses.map(courses => `<li>${courses}</li>`).join('')}
      </ul>
          `;
  
  container.appendChild(customerDetails);
}

async function displayTest(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; 

    const t_customers = await fillCustomersList(groupedData);

    t_customers.sort((a, b) => a.childLastName.localeCompare(b.childLastName));

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `test`;
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

async function fillTestWorksheet(worksheet, data, sortedData, header) {
    worksheet.addRow(header);
  
    sortedData.sort((a, b) => a[header.participantsIdIndex] - b[header.participantsIdIndex]);

    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.childId === rowData[header.participantsIdIndex]);
  
      if (existingCustomer) {
        row = worksheet.addRow(rowData);
  
        if (rowData[7].startsWith('TEST')) {
            let today = new Date();
            let dateTest = rowData[header.dateTestIndex];
            
            if (dateTest) {
                const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
                const differenceInDays = Math.floor((today - dateTest) / oneDayInMilliseconds);

                if (differenceInDays >= 0 && differenceInDays < 120) {
                    row.eachCell((cell) => {
                        cell.fill = {
                          type: 'pattern',
                          pattern: 'solid',
                          fgColor: { argb: 'FFFFFF00' }
                        };
                    });
                }
            }
        }
      }
    });
  }

async function manageEmail(checkbox, globalData) {
  const customerId = checkbox.getAttribute('data-customer-id');
  const testList = await testModule.fillCustomersList(globalData);
  let groupEmail = [];
  for (const test of testList) {
      if (test.customerId === customerId && test.carnets.length === 0) {
          groupEmail.push(test);
      }
  }
  if (groupEmail.length > 0) {
    if (emailValidator.validate(groupEmail[0].customerEmail)) {
      let storeLinks = new Map();
      storeLinks = await getStoreLinks();
      try {
        const response = await checkboxModule.sendEmailTest(groupEmail, storeLinks);
        return response;
      } catch (error) {
        throw error;
      }
    } else {
      alert(`Email du client ${groupEmail[0].customerFirstName} ${groupEmail[0].customerLastName} numéro ${groupEmail[0].customerId} erroné`);
    }
  } 
}

async function getStoreLinks() {
  try {
    const data = await fs.promises.readFile(path.join(__dirname, 'links/tests.txt'), 'utf8');
    const lines = data.split('\n');
    const dataMap = new Map();

    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length === 2) {
        const key = parts[0];
        const url = parts[1];
        dataMap.set(key, url);
      }
    });
    return dataMap;
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier :', err);
    throw err;
  }
}

module.exports = {
    displayTest,
    fillCustomersList,
    fillTestWorksheet,
    manageEmail,
    extractDateTest,
  };