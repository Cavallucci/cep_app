const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');

function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7] && customerData[7].startsWith('CD')) {
                existingCustomer.cd.push(customerData[8]);
                existingCustomer.month.push(customerData[7]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                existingCustomer.tk.push(customerData[8]);
            }
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
                month: [],
                cd: [],
                tk: [],
            };
            if (customerData[7] && customerData[7].startsWith('CD')) {
                newCustomer.cd.push(customerData[8]);
                newCustomer.month.push(customerData[7]);
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

    const customerWithMonth = findMatchingMonth(customerWithCD);

    const customerWithMatch = findMatchingEnrollments(customerWithMonth);

    return customerWithMatch;
}

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findMatchingMonth(customerWithCD) {
  const customersWithoutMatch = [];
  const customerWithMonth = [];
  let mostRecentDate = new Date(0);
  let today = new Date();

  for (const customer of customerWithCD) {
      for (const month of customer.month) {
        completeMonthCD = replaceMonthCD(month);
        customer.month = completeMonthCD;
        if (completeMonthCD > mostRecentDate && completeMonthCD < today) {
          mostRecentDate = completeMonthCD;
        }
      }
      customersWithoutMatch.push(customer);
  }
  for (const customer of customersWithoutMatch) {
    const customerDate = new Date(customer.month);
    customerDate.setHours(0, 0, 0, 0);

    const recentDate = new Date(mostRecentDate);
    recentDate.setHours(0, 0, 0, 0);

    if (customerDate.getTime() === recentDate.getTime()) {
      customerWithMonth.push(customer);
    }
  }
  return customerWithMonth;
}

function replaceMonthCD(month) {
  let monthCD;
  const monthLower = month.toLowerCase();
  let year = month.slice(-4);
  let day = '01';

  if (monthLower.includes('janv')) {
    monthCD = "01";
  }
  else if (monthLower.includes('fev')) {
    monthCD = "02";
  }
  else if (monthLower.includes('mars')) {
    monthCD = "03";
  }
  else if (monthLower.includes('avr')) {
    monthCD = "04";
  }
  else if (monthLower.includes('mai')) {
    monthCD = "05";
  }
  else if (monthLower.includes('juin')) {
    monthCD = "06";
  }
  else if (monthLower.includes('juil')) {
    monthCD = "07";
  }
  else if (monthLower.includes('aout')) {
    monthCD = "08";
  }
  else if (monthLower.includes('sept')) {
    monthCD = "09";
  }
  else if (monthLower.includes('oct')) {
    monthCD = "10";
  }
  else if (monthLower.includes('nov')) {
    monthCD = "11";
  }
  else if (monthLower.includes('dec')) {
    monthCD = "12";
  }

  const completeDateCD = new Date(`${year}-${monthCD}-${day}`);
  return completeDateCD;
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
      <p><strong>Dade de découverte</strong>: ${customer.month}</p>
      <ul><strong>Cours de découverte</strong>: 
      ${customer.cd.map(cd => `<li>${cd}</li>`).join('')}
      </ul>
      <ul><strong>Cours à l'année</strong>:
      ${customer.tk.map(tk => `<li>${tk}</li>`).join('')}
      </ul>
          `;
  
  container.appendChild(customerDetails);
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
    //checkboxModule.setupCheckboxListeners(t_customers);
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
async function manageDecouverteEmail(checkbox, globalData) {
  const customerId = checkbox.getAttribute('data-customer-id');
  const decouverteList = decouverteModule.fillCustomersList(globalData);
  
  let groupEmail = [];
  for (const decouverte of decouverteList) {
      if (decouverte.customerId === customerId) {
          groupEmail.push(decouverte);
      }
  }
  if (emailValidator.validate(groupEmail[0].customerEmail)) {
    await checkboxModule.sendEmailDecouverte(groupEmail);
  } else {
    alert(`Email du client ${groupEmail[0].customerFirstName} ${groupEmail[0].customerLastName} numéro ${groupEmail[0].customerId} erroné`);
    }  
}

module.exports = {
    displayDecouverte,
    fillCustomersList,
    fillDécouverteWorksheet,
    manageDecouverteEmail
  };