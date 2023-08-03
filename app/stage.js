function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7].startsWith('STA')) {
                existingCustomer.sta.push(customerData[8]);
                existingCustomer.dateStage.push(customerData[7]);
            }
            else if (customerData[7].startsWith('TK')) {
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
                courses: [customerData[8]],
                sku: [customerData[7]],
                dateStage: [],
                sta: [],
                tk: [],
            };
            if (customerData[7].startsWith('STA')) {
                newCustomer.sta.push(customerData[8]);
                newCustomer.dateStage.push(customerData[7]);
            }
            else if (customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
            }
            t_customers.push(newCustomer);
        }
    }
    const customerWithSTA = t_customers.filter((customer) => {
        const hasSTASKU = customer.sku.some((sku) => sku.startsWith('STA'));
        return hasSTASKU;
    });

    const customerWithDate = findMatchingDate(customerWithSTA); // Date la plus récente

    const customerWithMatch = findMatchingEnrollments(customerWithDate); // compare stage et tk

    return customerWithMatch;
}

function findMatchingDate(customersWithSTA) {
    const customersWithoutMatch = [];

    for (const customer of customersWithSTA) { //STA_TOUSS22_24OCT_018_2022
        let mostRecentDate = new Date(0);

        for (const date of customer.dateStage) {

            let dateSTA = date.split('_'); //TOUSS22
            let yearSTA = dateSTA[1].slice(-2); //22
            let completeYearSTA = `20${yearSTA}`; //2022
            let monthSTA = dateSTA[1].slice(0, -2); //TOUSS
            let daySTA = '01';

            if (monthSTA == "TOUSS") {
                monthSTA = "10";
            }
            else if (monthSTA == "NOEL") { 
                monthSTA = "12";
            }
            else if (monthSTA == "PAQ") {
                monthSTA = "04";
            }
            else if (monthSTA == "ETE") {
                monthSTA = "07";
            }
            else if (monthSTA == "TOUSS") {
                monthSTA = "10";
            }
            else if (monthSTA == "FEV") {
                monthSTA = "02";
            }

            const completeDateSTA = new Date(`${completeYearSTA}-${monthSTA}-${daySTA}`);
            customer.dateStage = completeDateSTA;
            if (completeDateSTA > mostRecentDate) {
                mostRecentDate = completeDateSTA;
            }
        }

        if (mostRecentDate === customer.dateStage) {
            customersWithoutMatch.push(customer);
        }
    }
    return customersWithoutMatch;
}

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
  
function findMatchingEnrollments(customerWithDate) {
    const customersWithoutMatch = [];
    const stageList = [
        'boxe', 'yoga', 'skate', 'chant', 'théatre', 'danse', 'poterie', 'hip hop',
        'couture', 'dessin', 'gym', 'taekwondo', 'street art', 'cuisine', 'zumba',
        'programmation', 'echecs', 'piano', 'guitare', 'peinture', 'kid boxing',
        'trapèze', 'cirque',
    ];
      
    for (const customer of customerWithDate) {
        const newListOfStage = [];
        let matchedTK = false;

        for (const staCourse of customer.sta) {
            for (const stage of stageList) {
                if (staCourse.includes(stage)) {
                    newListOfStage.push(stage);
                }
            }
        }    
    //for (const staCourse of customer.sta) {

    //   const staWords = staCourse.split(' ');
    //   const wordAfterCoursDeDecouverte = staWords[3];

    //   const staWordWithoutAccents = removeDiacritics(wordAfterCoursDeDecouverte).toLowerCase();

    //   if (
    //     customer.tk.some(
    //       (tkCourse) =>
    //         removeDiacritics(tkCourse).toLowerCase().includes(staWordWithoutAccents)
    //     )
    //   ) {
    //     matchedTK = true;
    //     break;
    //   }
    //}

    if (!matchedTK) {
      customersWithoutMatch.push(customer);
    }
  }


  return customersWithoutMatch;
}  

function displayStage(groupedData) {
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
        label.textContent = `L'enfant ${t_customers[i].childId} ${t_customers[i].childFirstName} ${t_customers[i].childLastName} a fait les stages suivants : ${t_customers[i].sta},  en date du : ${t_customers[i].dateStage} mais ne s'est pas inscrit à l'année : ${t_customers[i].tk}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
}

async function fillStageWorksheet(worksheet, data, sortedData) {
  const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[18] - b[18]);

  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.childId === rowData[18]);

    if (existingCustomer) {
      row = worksheet.addRow(rowData);

      if (rowData[7].startsWith('STA')) {
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

module.exports = {
    displayStage,
    fillCustomersList,
    fillStageWorksheet
  };