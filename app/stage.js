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
            if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('STA')) {
                existingCustomer.sta.push(customerData[header.nameIndex]);
                existingCustomer.dateStage.push(customerData[header.skuIndex]);
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
                dateStage: [],
                sta: [],
                tk: [],
            };
            if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('STA')) {
                newCustomer.sta.push(customerData[header.nameIndex]);
                newCustomer.dateStage.push(customerData[header.skuIndex]);
            }
            else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('TK')) {
                newCustomer.tk.push(customerData[header.nameIndex]);
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
            stageWithoutDiacritics = filterModule.removeDiacritics(staCourse).toLowerCase();
            for (const stage of stageList) {
                if (stageWithoutDiacritics.includes(stage)) {
                    newListOfStage.push(stage);
                }
            }
        }
        for (const tkCourse of customer.tk) {
            tkCourseWithoutDiacritics = filterModule.removeDiacritics(tkCourse).toLowerCase();
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

async function displayStage(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = '';

    const t_customers = await fillCustomersList(groupedData);

    t_customers.sort((a, b) => a.childLastName.localeCompare(b.childLastName));

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
}

async function fillStageWorksheet(worksheet, data, sortedData, header) {
    worksheet.addRow(header);

    sortedData.sort((a, b) => a[header.participantsIdIndex] - b[header.participantsIdIndex]);

    let mostRecentDate = new Date(0);

    for (const date of data) {
        if (date.dateStage > mostRecentDate) {
            mostRecentDate = date.dateStage;
        }
    }
    const recentDate = new Date(mostRecentDate);
    recentDate.setHours(0, 0, 0, 0);


    sortedData.forEach((rowData) => {
        let existingCustomer = data.find((data) => data.childId === rowData[header.participantsIdIndex]);

        if (existingCustomer) {
            row = worksheet.addRow(rowData);
            if (rowData[7].startsWith('STA')) {
                const customerDate = new Date(replaceDateStage(rowData[header.skuIndex]));
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

async function manageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const stageList = await stageModule.fillCustomersList(globalData);

    let groupEmail = [];
    for (const stage of stageList) {
        if (stage.customerId === customerId) {
            groupEmail.push(stage);
        }
    }
    if (groupEmail.length > 0) {
        if (emailValidator.validate(groupEmail[0].customerEmail)) {
            let storeLinks = [];
            storeLinks = await getListToPrint(groupEmail);
            try {
                const response = await checkboxModule.sendEmailStage(groupEmail, storeLinks);
                return response;
            } catch (error) {
                throw error;
            }
        } else {
            alert(`Email du client ${groupEmail[0].customerFirstName} ${groupEmail[0].customerLastName} numéro ${groupEmail[0].customerId} erroné`);
        }
    }
}

async function getListToPrint(customerGroup) {
    try {
      const stagesData = await fs.promises.readFile(path.join(__dirname, 'links/stages.json'), 'utf8');
      const parsedStagesData = JSON.parse(stagesData);
      const listToPrint = [];
      const listWithoutDouble = [];
  
        for (const customer of customerGroup) {
            for (const staAccents of customer.sta) {
                const age = staAccents.match(/\d+\/\d+ ans/g);
                
                const staWords = staAccents.split(' ');
                for (const word of staWords) {
                    const sta = filterModule.removeDiacritics(word).toLowerCase();
                    const stage = parsedStagesData.find(entry => sta.includes(filterModule.removeDiacritics(entry.activ).toLowerCase()));
                    if (stage && stage[age] && stage[age] !== '') {
                        const lien = stage[age];
                        let name = stage.activ;
                        if (name === 'Hip') {
                            name = 'Hip Hop';
                        }
                        else if (name === 'Initiation') {
                            name = 'Initiation Théâtre';
                        }
                        else if (name === 'Peintres') {
                            name = 'Grands Peintres';
                        }
                        else if (name === 'Self') {
                            name = 'Self Defense';
                          }
                        else if (name === 'Street') {
                            name = 'Street Art';
                          }
                        else if (name === 'Expression') {
                            name = 'Expression corporelle';
                          }
                        else if (name === 'Musical') {
                            name = 'Eveil musical';
                          }
                        else if (name === 'Corporel') {
                            name = 'Eveil corporel';
                          }
                        else if (name === 'Musical') {
                            name = 'Eveil musical';
                          }
                        else if (name === 'Modernes') {
                            name = 'Danses Modernes';
                          }
                        else if (name === 'Box') {
                            name = 'Boxe';
                          }
                        else if (name === 'Classique') {
                            name = 'Danse Classique';
                         }
                        else if (name === 'Rythmique') {
                            name = 'Gymnastique Rythmique';
                          }
                        const printName = `${name} ${age}`;
                        listToPrint.push(`<a href="${lien}">${printName}</a>`);
                    }
                }
            }
        }

// "<a href=\"https://www.clubdesenfantsparisiens.com/catalogsearch/result/?q=justine\">Chant et Initiation Théâtre / Multisports et Taekwondo 3/5 ans</a>"
// "<a href=\"https://www.clubdesenfantsparisiens.com/activites.html?discipline=9669%2C9670%2C9671%2C9673&tranche_age=10304%2C8387%2C10300%2C10310%2C10342\">Chant et Initiation Théâtre / Multisports et Taekwondo 3/5 ans</a>"

        for (list of listToPrint) {
            const name = list.split('">')[1].split('</a>')[0];
            if (!listWithoutDouble.some(item => item.includes(name))) {
                listWithoutDouble.push(list);
            }
        }
        return listWithoutDouble;
    } catch (error) {
      console.error("Error reading stages data:", error);
    }
  }

module.exports = {
    displayStage,
    fillCustomersList,
    fillStageWorksheet,
    manageEmail,
    replaceDateStage
  };