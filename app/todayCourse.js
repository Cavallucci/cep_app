const filterModule = require('./filter');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const testModule = require('./tests');
const docModule = require('./docs');

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
        const worksheet = workbook.addWorksheet('Feuille accueil', { //ajuster toutes les colonnes à 1 page
            pageSetup: {paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0}
        });

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
            debut: docModule.formatTime(customerData[16]),
            fin: docModule.formatTime(customerData[17]),
            childId: customerData[18],
            childFirstName: customerData[19],
            childLastName: customerData[20],
            courseName: customerData[8],
            room: customerData[10],
            teacher: customerData[13],
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
    today.setHours(0, 0, 0, 0);

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
            if (customer.sku === 'TEST_TK212_2022') {
                console.log(customer);
            }
            if (customer.testDate && customer.testDate.getDate() === today.getDate()) {
                return true;
            }
        }
        return false;
    });

    const sortedList = sortListCourse(listWithTestOfTheDay);

    return sortedList;
}

function sortListCourse(listWithTestOfTheDay) {
    const sortedList = listWithTestOfTheDay.sort((a, b) => {
        if (a.debut < b.debut) {
            return -1;
        }
        if (a.debut > b.debut) {
            return 1;
        }
        
        const childLastNameA = filterModule.removeDiacritics(a.childLastName);
        const childLastNameB = filterModule.removeDiacritics(b.childLastName);
        if (childLastNameA < childLastNameB) {
            return -1;
        }
        if (childLastNameA > childLastNameB) {
            return 1;
        }
        return 0;
    });
    return sortedList;
}

async function fillCourseWorksheet(worksheet, groupedData) {
    const headerData = ['Nom Parent', 'Heure début', 'Heure fin', 'Nom enfant', 'Prénom enfant', 'Nom cours', 'Salle', 'Nom prof', 'Tk cours'];
    const row = worksheet.addRow(headerData);
    row.height = 30;
    row.font = {name: 'Calibri', size: 20, bold: true};

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
        row.height = 30;
        ['B', 'C', 'G'].forEach((col) => {
            row.getCell(col).font = {name: 'Calibri', size: 30, bold: true, color: {argb: "FFFF0000"}};
        });
        ['A', 'H'].forEach((col) => {
            row.getCell(col).font = { name: 'Calibri', size: 20, bold: true,};
        });
        ['D', 'E', 'F'].forEach((col) => {
            row.getCell(col).font = { name: 'Calibri', size: 30, bold: true,};
        });
        ['I'].forEach((col) => {
            row.getCell(col).font = { name: 'Calibri', size: 10};
        });
    });
    
    worksheet.getColumn(1).width = 30; //60 = 117,9
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 45;
    worksheet.getColumn(5).width = 30;
    worksheet.getColumn(6).width = 85;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 40;
    worksheet.getColumn(9).width = 15;
}

module.exports = {
    printTodayCourse,
  };