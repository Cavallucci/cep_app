const checkboxModule = require('./checkbox');

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
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.sku.push(customerData[7]);
            existingCustomer.dateTest.push(customerData[36]);
        } else {
            const newCustomer = {
                childId: customerData[18],
                childFirstName: customerData[19],
                childLastName: customerData[20],
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                courses: [customerData[8]],
                sku: [customerData[7]],
                tests: [],
                tk: [],
                tkCode: [],
                dateTest: [customerData[36]],
            };
            if (customerData[7] && customerData[7].startsWith('TEST')) {
                newCustomer.tests.push(customerData[8]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
                newCustomer.tkCode.push(customerData[7]);
            }
            t_customers.push(newCustomer);
        }
    }
    let today = new Date();
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    const customerWithDate = t_customers.filter((customer) => {
        const hasDate = customer.dateTest.some((date) => date && Math.floor((today - date) / oneDayInMilliseconds) >= 0 && Math.floor((today - date) / oneDayInMilliseconds) < 120);
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

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
  
function findMatchingEnrollments(customerWithMatchTK) {
  const customersWithoutMatch = [];

  for (const customer of customerWithMatchTK) {
    let matchedTK = false;

    for (const testCourse of customer.tests) {
      const testWords = testCourse.split(' ');
      const wordAfterCoursDeDecouverte = testWords[4];

      const testWordWithoutAccents = removeDiacritics(wordAfterCoursDeDecouverte).toLowerCase();

      if (
        customer.tk.some(
          (tkCourse) =>
            removeDiacritics(tkCourse).toLowerCase().includes(testWordWithoutAccents)
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
      }
      if (!matchedTK) {
        customersWithoutMatch.push(customer);
      }
    }
    return customersWithoutMatch;
} 

function displayTest(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = fillCustomersList(groupedData);

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `test`; // Unique ID for each checkbox
        checkbox.setAttribute('data-customer-id', t_customers[i].childId);
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `L'enfant ${t_customers[i].childId} ${t_customers[i].childFirstName} ${t_customers[i].childLastName} a fait les tests suivants : ${t_customers[i].tests}, mais ne s'est pas inscrit à l'année : ${t_customers[i].tk}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
    checkboxModule.setupCheckboxListeners(t_customers);
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

function manageTestEmail(checkbox, globalData) {
  const customerId = checkbox.getAttribute('data-customer-id');
  const testList = testModule.fillCustomersList(globalData);
  const checkboxFound = testList.find((testList) => testList.childId === customerId);

  let groupEmail = [];
  for (const test of testList) {
      if (test.customerId === checkboxFound.customerId) {
          groupEmail.push(test);
      }
  }
  console.log(groupEmail);
  //checkboxModule.sendEmailTest(checkboxFound);
}

module.exports = {
    displayTest,
    fillCustomersList,
    fillTestWorksheet,
    manageTestEmail
  };