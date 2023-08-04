const checkboxModule = require('./checkbox');

function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7] && customerData[7].startsWith('CD')) {
                existingCustomer.cd.push(customerData[8]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                existingCustomer.tk.push(customerData[8]);
            }
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
                cd: [],
                tk: [],
            };
            if (customerData[7] && customerData[7].startsWith('CD')) {
                newCustomer.cd.push(customerData[8]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
            }
            t_customers.push(newCustomer);
        }
    }
    const customerWithCD = t_customers.filter((customer) => {
        const hasCDDSKU = customer.sku.some((sku) => sku && sku.startsWith('CD'));
        return hasCDDSKU;
    });

    const customerWithMatch = findMatchingEnrollments(customerWithCD);

    return customerWithMatch;
}

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
  
function findMatchingEnrollments(customersWithCD) {
  const customersWithoutMatch = [];

  for (const customer of customersWithCD) {
    let matchedTK = false;

    for (const cdCourse of customer.cd) {
      const cdWords = cdCourse.split(' ');
      const wordAfterCoursDeDecouverte = cdWords[3];

      const cdWordWithoutAccents = removeDiacritics(wordAfterCoursDeDecouverte).toLowerCase();

      if (
        customer.tk.some(
          (tkCourse) =>
            removeDiacritics(tkCourse).toLowerCase().includes(cdWordWithoutAccents)
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

function displayDecouverte(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = fillCustomersList(groupedData);

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `decouverte`;
        checkbox.setAttribute('data-customer-id', t_customers[i].childId);
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `L'enfant ${t_customers[i].childId} a fait un cours de découverte : ${t_customers[i].cd}, mais ne s'est pas inscrit à l'année : ${t_customers[i].tk}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
    checkboxModule.setupCheckboxListeners(t_customers);
}

async function fillDécouverteWorksheet(worksheet, data, sortedData) {
  const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[18] - b[18]);

  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.childId === rowData[18]);

    if (existingCustomer) {
      row = worksheet.addRow(rowData);

      if (rowData[7].startsWith('CD')) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }
          };
        });
      }
    }
  });
}
function manageDecouverteEmail(checkbox, globalData) {
  const customerId = checkbox.getAttribute('data-customer-id');
  const decouverteList = decouverteModule.fillCustomersList(globalData);
  const checkboxFound = decouverteList.find((decouverteList) => decouverteList.childId === customerId);
  
  let groupEmail = [];
  for (const decouverte of decouverteList) {
      if (decouverte.customerId === checkboxFound.customerId) {
          groupEmail.push(decouverte);
      }
  }
  console.log(groupEmail);
  //checkboxModule.sendEmailDecouverte(checkboxFound);

}

module.exports = {
    displayDecouverte,
    fillCustomersList,
    fillDécouverteWorksheet,
    manageDecouverteEmail
  };