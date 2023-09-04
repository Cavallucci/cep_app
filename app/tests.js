const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');
const fs = require('fs');
const path = require('path');
const filterModule = require('./filter');

function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7] && customerData[7].startsWith('TEST')) {
                existingCustomer.tests.push(customerData[8]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                existingCustomer.tk.push(customerData[8]);
                existingCustomer.tkCode.push(customerData[7]);
            }
            else if (customerData[7] && customerData[7].startsWith('CARNET')) {
                customerData[7] = customerData[7].replace('CARNET_', '');
                existingCustomer.carnets.push(customerData[7]);
                existingCustomer.tk.push(customerData[8]);
            }
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.sku.push(customerData[7]);
            existingCustomer.dateTest.push(extractDateTest(customerData[33]));
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
                carnets: [],
                tests: [],
                tk: [],
                tkCode: [],
                dateTest: [extractDateTest(customerData[33])] //Date de votre test : : 22/04/2023 à 14h00,
            };
            if (customerData[7] && customerData[7].startsWith('TEST')) {
                newCustomer.tests.push(customerData[8]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
                newCustomer.tkCode.push(customerData[7]);
            }
            else if (customerData[7] && customerData[7].startsWith('CARNET')) {
                customerData[7] = customerData[7].replace('CARNET_', '');
                newCustomer.carnets.push(customerData[7]);
                newCustomer.tk.push(customerData[8]);
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

function displayTest(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; 

    const t_customers = fillCustomersList(groupedData);

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

async function fillTestWorksheet(worksheet, data, sortedData) {
    const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
    worksheet.addRow(header);
  
    sortedData.sort((a, b) => a[18] - b[18]);

    sortedData.forEach((rowData) => {
      let existingCustomer = data.find((data) => data.childId === rowData[18]);
  
      if (existingCustomer) {
        row = worksheet.addRow(rowData);
  
        if (rowData[7].startsWith('TEST')) {
            let today = new Date();
            let dateTest = rowData[36];
            
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
  const testList = testModule.fillCustomersList(globalData);

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