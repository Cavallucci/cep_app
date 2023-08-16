const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');
const fs = require('fs');
const path = require('path');

function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7] && customerData[7].startsWith('STA')) {
                existingCustomer.sta.push(customerData[8]);
                existingCustomer.dateStage.push(customerData[7]);
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
                dateStage: [],
                sta: [],
                tk: [],
            };
            if (customerData[7] && customerData[7].startsWith('STA')) {
                newCustomer.sta.push(customerData[8]);
                newCustomer.dateStage.push(customerData[7]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
            }
            t_customers.push(newCustomer);
        }
    }
    const customerWithSTA = t_customers.filter((customer) => {
        const hasSTASKU = customer.sku.some((sku) => sku && sku.startsWith('STA'));
        return hasSTASKU;
    });

    const customerWithDate = findMatchingDate(customerWithSTA); // Date la plus récente

    const customerWithMatch = findMatchingEnrollments(customerWithDate); // compare stage et tk

    return customerWithMatch;
}

function findMatchingDate(customersWithSTA) {
    const customersWithoutMatch = [];
    const customerWithDate = [];
    let mostRecentDate = new Date(0);

    for (const customer of customersWithSTA) { //STA_TOUSS22_24OCT_018_2022

        for (const date of customer.dateStage) {
            completeDateSTA = replaceDateStage(date);
            customer.dateStage = completeDateSTA;
            if (completeDateSTA > mostRecentDate) {
                mostRecentDate = completeDateSTA;
            }
        }
        customersWithoutMatch.push(customer);
    }
    for (const customer of customersWithoutMatch) {
        const customerDate = new Date(customer.dateStage);
        customerDate.setHours(0, 0, 0, 0);
      
        const recentDate = new Date(mostRecentDate);
        recentDate.setHours(0, 0, 0, 0);
      
        if (customerDate.getTime() === recentDate.getTime()) {
          customerWithDate.push(customer);
        }
      }
    return customerWithDate;
}

function replaceDateStage(date) {

    let dateSTA = date.split('_');
    let yearSTA = dateSTA[1].slice(-2); 
    let completeYearSTA = `20${yearSTA}`;
    let monthSTA = dateSTA[1].slice(0, -2);
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
    else if (monthSTA == "FEV") {
        monthSTA = "02";
    }

    const completeDateSTA = new Date(`${completeYearSTA}-${monthSTA}-${daySTA}`);
    return completeDateSTA
}

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
  
function findMatchingEnrollments(customerWithDate) {
    const customersWithoutMatch = [];
    const stageList = [
        'boxe', 'batterie', 'yoga', 'skate', 'chant', 'capoeira', 'theatre', 'danse', 'poterie', 'hip hop',
        'couture', 'dessin', 'gym', 'taekwondo', 'street art', 'cuisine', 'zumba',
        'programmation', 'echecs', 'piano', 'guitare', 'peinture', 'kid boxing',
        'trapeze', 'cirque', 'coaching', 'multidanses', 'multisports', 'self defense',
        'eveil', 'expression corporelle', 'déjeuner', 'self defense',
    ];

    for (const customer of customerWithDate) {
        const newListOfStage = [];
        let matchedTK = false;

        for (const staCourse of customer.sta) {
            stageWithoutDiacritics = removeDiacritics(staCourse).toLowerCase();
            for (const stage of stageList) {
                if (stageWithoutDiacritics.includes(stage)) {
                    newListOfStage.push(stage);
                }
            }
        }
        for (const tkCourse of customer.tk) {
            tkCourseWithoutDiacritics = removeDiacritics(tkCourse).toLowerCase();
            for (const stage of newListOfStage) {
                if (tkCourseWithoutDiacritics.includes(stage)) {
                    matchedTK = true;
                    break;
                }
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
        <p><strong>Date de stage</strong>: ${customer.dateStage}</p>
        <ul><strong>Stages</strong>: 
        ${customer.sta.map(sta => `<li>${sta}</li>`).join('')}
        </ul>
        <ul><strong>Cours à l'année</strong>:
        ${customer.tk.map(tk => `<li>${tk}</li>`).join('')}
        </ul>
            `;
    
    container.appendChild(customerDetails);
  }

function displayStage(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = '';

    const t_customers = fillCustomersList(groupedData);

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `stage`;
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
    checkboxModule.setupCheckboxListeners(t_customers);
}

async function fillStageWorksheet(worksheet, data, sortedData) {
  const header = [ 'status', 'increment_id', 'restant_du', 'customer_id', 'customer_firstname', 'customer_lastname', 'sku', 'name', 'qty_en_cours', 'salle', 'salle2', 'prof_code', 'prof_name', 'prof_code2', 'prof_name2', 'debut', 'fin', 'participants_id', 'prenom_participant', 'nom_participant', 'date_naissance', 'prix_catalog', 'prix_vente', 'prix_vente_ht', 'frequence', 'date_reservation', 'email', 'additionnal_email', 'telephone', 'street', 'postcode', 'city', 'product_options', 'option_name', 'option_sku', 'date_test' ];
  worksheet.addRow(header);

  sortedData.sort((a, b) => a[18] - b[18]);

  let mostRecentDate = new Date(0);

  for (const date of data) {
    if (date.dateStage > mostRecentDate) {
        mostRecentDate = date.dateStage;
    }
  }
  const recentDate = new Date(mostRecentDate);
  recentDate.setHours(0, 0, 0, 0);


  sortedData.forEach((rowData) => {
    let existingCustomer = data.find((data) => data.childId === rowData[18]);

        if (existingCustomer) {
            row = worksheet.addRow(rowData);
            if (rowData[7].startsWith('STA')) {
                const customerDate = new Date(replaceDateStage(rowData[7]));
                customerDate.setHours(0, 0, 0, 0);
                if (customerDate.getTime() === recentDate.getTime()) {
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
    });
}

async function manageStageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const stageList = stageModule.fillCustomersList(globalData);

    let groupEmail = [];
    for (const stage of stageList) {
        if (stage.customerId === customerId) {
            groupEmail.push(stage);
        }
    }
    if (emailValidator.validate(groupEmail[0].customerEmail)) {
        let storeLinks = [];
        storeLinks = await getListToPrint(groupEmail);
        await checkboxModule.sendEmailStage(groupEmail, storeLinks);
    } else {
        alert(`Email du client ${groupEmail[0].customerFirstName} ${groupEmail[0].customerLastName} numéro ${groupEmail[0].customerId} erroné`);
        }  
}

async function getListToPrint(customerGroup) {
    try {
      const stagesData = await fs.promises.readFile(path.join(__dirname, 'links/stages.json'), 'utf8');
      const parsedStagesData = JSON.parse(stagesData);
      const listToPrint = [];
  
        for (const customer of customerGroup) {
            for (const staAccents of customer.sta) {
                const lastSpaceIndex = staAccents.lastIndexOf(' ');
                const age = staAccents.slice(lastSpaceIndex - 3);
                const staWords = staAccents.split(' ');
                for (const word of staWords) {
                const sta = removeDiacritics(word).toLowerCase();
                    const stage = parsedStagesData.find(entry => sta.includes(entry.activ.toLowerCase()));
                    if (stage && stage[age] && stage[age] !== '') {
                        const lien = stage[age];
                        listToPrint.push(`<a href="${lien}">${stage.activ}</a>`);
                    }
                }
            }
        }
        return listToPrint;
    } catch (error) {
      console.error("Error reading stages data:", error);
    }
  }

module.exports = {
    displayStage,
    fillCustomersList,
    fillStageWorksheet,
    manageStageEmail
  };