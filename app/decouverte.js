function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7].startsWith('CD')) {
                existingCustomer.cd.push(customerData[8]);
            }
            else if (customerData[7].startsWith('TK')) {
                existingCustomer.tk.push(customerData[8]);
            }
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.sku.push(customerData[7]);
        } else {
            const newCustomer = {
                childId: customerData[18],
                courses: [customerData[8]],
                sku: [customerData[7]],
                cd: [],
                tk: [],
            };
            if (customerData[7].startsWith('CD')) {
                newCustomer.cd.push(customerData[8]);
            }
            else if (customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
            }
            t_customers.push(newCustomer);
        }
    }
    const customerWithCD = t_customers.filter((customer) => {
        const hasCDDSKU = customer.sku.some((sku) => sku.startsWith('CD'));
        return hasCDDSKU;
    });

    const customerWithMatch = findMatchingEnrollments(customerWithCD);

    return customerWithMatch;
}

// function findMatchingEnrollments(customersWithCD) {
//     const customersWithoutMatch = [];
  
//     for (const customer of customersWithCD) {
//       let matchedTK = false;
  
//       for (const cdCourse of customer.cd) {
//         const cdWords = cdCourse.split(' ');
//         const wordAfterCoursDeDecouverte = cdWords[3].toLowerCase();
  
//         if (customer.tk.some((tkCourse) => tkCourse.toLowerCase().includes(wordAfterCoursDeDecouverte))) {
//           matchedTK = true;
//           break;
//         }
//       }
  
//       if (!matchedTK) {
//         customersWithoutMatch.push(customer);
//       }
//     }
  
//     return customersWithoutMatch;
//   }

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
            console.log('tkCourse', customer.tk);
            console.log('cdWordWithoutAccents', cdWordWithoutAccents);
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
        checkbox.id = `customerCheckbox_${t_customers[i].customerId}`; // Unique ID for each checkbox
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `L'enfant ${t_customers[i].childId} a fait un cours de découverte : ${t_customers[i].cd}, mais ne s'est pas inscrit à l'année : ${t_customers[i].tk}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
}

module.exports = {
    displayDecouverte,
    fillCustomersList
  };