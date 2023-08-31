const filterModule = require('./filter');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const testModule = require('./tests');

async function printTodayCourse(groupedData) {
    if (!groupedData) {
        alert('printError', 'Veuillez d\'abord entrer un fichier Excel !');
        return;
    }
    try {
        const sortedData = fillCourseList(groupedData);
        const downloadpath = await ipcRenderer.invoke('get-download-path');
        const today = new Date();
        const fileName = path.join(downloadpath, `feuille_accueil_${filterModule.formatDate(today)}.xlsx`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Feuille accueil');

        await fillCourseWorksheet(worksheet, sortedData);
        await workbook.xlsx.writeFile(fileName);
        alert('Fichier Excel généré avec succès dans Téléchargements !');
    } catch (error) {
        console.error('Erreur lors de la génération du fichier Excel :', error);
        alert('printError', 'Erreur lors de la génération du fichier Excel : ' + error.message);
    }
}

function fillCourseList(groupedData) {
    const sortedData = [];

    for (const customerData of groupedData) {
        const newCustomer = {
            customerLastName: customerData[6],
            debut: customerData[9],
            fin: customerData[10],
            childId: customerData[18],
            childFirstName: customerData[19],
            childLastName: customerData[20],
            courseName: customerData[8],
            room: customerData[11],
            teacher: customerData[12],
            sku: customerData[7],
            day: customerData[25],
            testDate: testModule.extractDateTest(customerData[33]),
        };
        sortedData.push(newCustomer);
    }

    const customersWithTK = sortedData.filter((customer) => {
        const hasTKSKU = customer.sku && (customer.sku.startsWith('TK') || customer.sku.startsWith('TEST'));
        return hasTKSKU;
    });

    let today = new Date();
    const joursSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const nomJourAujourdhui = joursSemaine[today.getDay()];
    const listWithDay = customersWithTK.filter((customer) => {
        return customer.day === nomJourAujourdhui;
    });

    const listWithTestOfTheDay = listWithDay.filter((customer) => {
        if (customer.sku.startsWith('TK')) {
            return true;
        }
        if (customer.sku.startsWith('TEST')) {
            if (customer.testDate && customer.testDate.getDate() === today.getDate()) {
                return true;
            }
        }
        return false;
    });

    return listWithTestOfTheDay;
}

async function fillCourseWorksheet(worksheet, groupedData) {
    const headerData = ['Nom Parent', 'Heure début', 'Heure fin', 'Nom enfant', 'Prénom enfant', 'Nom cours', 'Salle', 'Nom prof', 'Tk cours'];
    worksheet.addRow(headerData);

    if (groupedData.length === 0) {
        return;
    }
    groupedData.forEach((rowData) => {
        const row = worksheet.addRow([
            rowData.customerLastName, 
            rowData.debut,
            rowData.fin, 
            rowData.childLastName, 
            rowData.childFirstName, 
            rowData.courseName, 
            rowData.room,
            rowData.teacher, 
            rowData.sku 
        ]);
    });
}

module.exports = {
    printTodayCourse,
  };