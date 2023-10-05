const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');
const filterModule = require('./filter');
const { ipcRenderer } = require('electron');

async function fillCustomersList(groupedData) {
    const t_customers = [];
    const header = await ipcRenderer.invoke('get-header-data');
    for (customerData of groupedData) {
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[header.participantsIdIndex]);

        if (existingCustomer) {
            if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('CD')) {
                existingCustomer.cd.push(customerData[header.nameIndex]);
                existingCustomer.month.push(customerData[header.skuIndex]);
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TK')) {
                existingCustomer.tk.push(customerData[header.nameIndex]);
            }
            existingCustomer.courses.push(customerData[header.nameIndex]);
            existingCustomer.sku.push(customerData[header.skuIndex]);
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
                month: [],
                cd: [],
                tk: [],
            };
            if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('CD')) {
                newCustomer.cd.push(customerData[header.nameIndex]);
                newCustomer.month.push(customerData[header.skuIndex]);
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TK')) {
                newCustomer.tk.push(customerData[header.nameIndex]);
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
    monthCD = "06";
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

      const cdWordWithoutAccents = filterModule.removeDiacritics(wordAfterCoursDeDecouverte).toLowerCase();

      if (
        customer.tk.some(
          (tkCourse) =>
          filterModule.removeDiacritics(tkCourse).toLowerCase().includes(cdWordWithoutAccents)
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

async function displayDecouverte(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = await fillCustomersList(groupedData);

    t_customers.sort((a, b) => a.childLastName.localeCompare(b.childLastName));

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
}

async function fillDécouverteWorksheet(worksheet, data, sortedData, header) {
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[header.participantsIdIndex] - b[header.participantsIdIndex]);

  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.childId === rowData[header.participantsIdIndex]);

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
async function manageEmail(checkbox, globalData) {
  const customerId = checkbox.getAttribute('data-customer-id');
  const decouverteList = await decouverteModule.fillCustomersList(globalData);
  
  let groupEmail = [];
  for (const decouverte of decouverteList) {
      if (decouverte.customerId === customerId) {
          groupEmail.push(decouverte);
      }
  }
  if (groupEmail.length > 0) {
    if (emailValidator.validate(groupEmail[0].customerEmail)) {
      try {
          const response = await checkboxModule.sendEmailDecouverte(groupEmail);
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
    displayDecouverte,
    fillCustomersList,
    fillDécouverteWorksheet,
    manageEmail
  };