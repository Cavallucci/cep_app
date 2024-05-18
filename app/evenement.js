const { ipcRenderer } = require('electron');
const checkboxModule = require('./checkbox');
const emailValidator = require('email-validator');

async function fillCustomersList(groupedData) {
    const t_customers = [];
    const headers = await ipcRenderer.invoke('get-header-data');
    for (customerData of groupedData) {
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[headers.participantsIdIndex]);

        if (existingCustomer) {
            if (customerData[headers.spectacleIndex] === 1 || customerData[headers.spectacleIndex] === '1') {
                const spectacle = {
                    course: customerData[headers.nameIndex],
                    lieu: customerData[headers.lieuSpectIndex],
                    salle: customerData[headers.salleSiClubIndex],
                    jour: customerData[headers.jourSpectIndex],
                    heure: customerData[headers.heureSpectIndex],
                    durée: customerData[headers.duréeSpectIndex],
                    num: customerData[headers.numSpectIndex],
                    jourRepet: customerData[headers.jourRepetIndex],
                    heureRepet: customerData[headers.heureRepetIndex],
                    parentPrésent: customerData[headers.parentPrésentIndex],
                    nbSpectateur: customerData[headers.nbSpectateurIndex],
                    billetAcheté: customerData[headers.billetAchetéIndex],
                }
                existingCustomer.spectacles.push(spectacle);
            }
        } else {
            if (customerData[headers.spectacleIndex] === 1 || customerData[headers.spectacleIndex] === '1') {
                const spectacle = {
                    course: customerData[headers.nameIndex],
                    lieu: customerData[headers.lieuSpectIndex],
                    salle: customerData[headers.salleSiClubIndex],
                    jour: customerData[headers.jourSpectIndex],
                    heure: customerData[headers.heureSpectIndex],
                    durée: customerData[headers.duréeSpectIndex],
                    num: customerData[headers.numSpectIndex],
                    jourRepet: customerData[headers.jourRepetIndex],
                    heureRepet: customerData[headers.heureRepetIndex],
                    parentPrésent: customerData[headers.parentPrésentIndex],
                    nbSpectateur: customerData[headers.nbSpectateurIndex],
                    billetAcheté: customerData[headers.billetAchetéIndex],
                }
                const newCustomer = {
                    childId: customerData[headers.participantsIdIndex],
                    childFirstName: customerData[headers.prenomParticipantIndex],
                    childLastName: customerData[headers.nomParticipantIndex],
                    customerId: customerData[headers.customerIDIndex],
                    customerFirstName: customerData[headers.customerFirstNameIndex],
                    customerLastName: customerData[headers.customerLastNameIndex],
                    customerEmail: customerData[headers.emailIndex],
                    spectacles: [spectacle],
                };
                t_customers.push(newCustomer);
            }
        }
    }
    console.log(t_customers);

    return t_customers;
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
        <ul><strong>Spectacle</strong>: 
        ${customer.spectacles.map(spectacle => `<li>${spectacle.course}, ${spectacle.jour} à ${spectacle.heure}</li>`).join('')}
        `;
    
    container.appendChild(customerDetails);
}
  
async function displayEvenement(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = await fillCustomersList(groupedData);

    t_customers.sort((a, b) => a.childLastName.localeCompare(b.childLastName));

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `evenement`;
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

async function manageEmail(checkbox, globalData) {
    const customerId = checkbox.getAttribute('data-customer-id');
    const evenmentList = await evenementModule.fillCustomersList(globalData);

    let groupEmail = [];
    console.log(customerId);
    for (const event of evenmentList) {
        if (event.customerId === customerId) {
            groupEmail.push(event);
        }
    }
    if (groupEmail.length > 0) {
        if (emailValidator.validate(groupEmail[0].customerEmail)) {
            try {
                const response = await checkboxModule.sendEmailEvenement(groupEmail);
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
    displayEvenement,
    fillCustomersList,
    manageEmail
  };