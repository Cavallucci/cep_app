const stageModule = require('./stage');
const docx = require('docx');
const filterModule = require('./filter');
const fs = require('fs');
const path = require('path');

async function customerFillList(groupedData, dateDoc1, dateDoc2) {
    const t_stages = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingStage = t_stages.find((t_stage) => t_stage.staSku === customerData[7]);

        if (existingStage) {
            const child = {
                childId: customerData[18],
                childFirstName: customerData[19],
                childLastName: customerData[20],
                birth: customerData[21],
                status: customerData[1],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
            }
            existingStage.childs.push(child);
        } else if (customerData[7] && customerData[7].startsWith('STA')){
            const newCustomer = {
                staSku: customerData[7],
                staName: customerData[8],
                dateStage: customerData[7],
                childs: [],
                age: customerData[8].match(/\d+\/\d+ ans/g),
                debut: customerData[16],
                fin: customerData[17],
                salle1: customerData[10],
                salle2: customerData[11] ? customerData[11] : null,
                prof1: {
                    id: customerData[12],
                    nom: customerData[13]
                },
                prof2: customerData[14] ? {
                    id: customerData[14],
                    nom: customerData[15]
                } : null,
            };
            const child = {
                childId: customerData[18],
                childFirstName: customerData[19],
                childLastName: customerData[20],
                birth: customerData[21],
                status: customerData[1],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
            }
            newCustomer.childs.push(child);
            t_stages.push(newCustomer);
        }
    }

    const customerWithDate = await findMatchingDate(t_stages, dateDoc1, dateDoc2); 

    return customerWithDate;
}

async function findMatchingDate(t_stages, dateDoc1, dateDoc2) {
    const t_stagesMatch = [];

    for (const stage of t_stages) { //STA_TOUSS22_24OCT_018_2022
        completeDateSTA = replaceDateStage(stage.dateStage);
        stage.dateStage = completeDateSTA;
        completeDateSTA.setHours(0, 0, 0, 0);
        dateDoc1.setHours(0, 0, 0, 0);
        dateDoc2.setHours(0, 0, 0, 0);
        if (completeDateSTA >= dateDoc1 && completeDateSTA <= dateDoc2) {
            t_stagesMatch.push(stage);
        }
    }
    return t_stagesMatch;
}

function replaceDateStage(date) { //STA_ETE23_28AOUT_019_2022

    let dateSTA = date.split('_');
    let yearSTA = dateSTA[1].slice(-2); 
    let completeYearSTA = `20${yearSTA}`;
    let daySTA = dateSTA[2].match(/\d+/g);
    let monthSTA = dateSTA[2].match(/[a-zA-Z]+/g);

    monthSTA = monthSTA[0].toUpperCase();
    switch (monthSTA) {
        case 'JANV':
            monthSTA = '01';
            break;
        case 'FEV':
            monthSTA = '02';
            break;
        case 'MARS':
            monthSTA = '03';
            break;
        case 'AVR':
            monthSTA = '04';
            break;
        case 'AVRIL':
            monthSTA = '04';
            break;
        case 'MAI':
            monthSTA = '05';
            break;
        case 'JUIN':
            monthSTA = '06';
            break;
        case 'JUIL':
            monthSTA = '07';
            break;
        case 'AOUT':
            monthSTA = '08';
            break;
        case 'SEPT':
            monthSTA = '09';
            break;
        case 'OCT':
            monthSTA = '10';
            break;
        case 'NOV':
            monthSTA = '11';
            break;
        case 'DEC':
            monthSTA = '12';
            break;
    }

    const completeDateSTA = new Date(`${completeYearSTA}-${monthSTA}-${daySTA}`);
    return completeDateSTA
}

async function fillAccueilDoc(downloadsPath, stageList, sortedData, dateDoc1, dateDoc2) {
    const title = new docx.Paragraph({
      children: [
        new docx.TextRun({
          text: `STAGES du ${filterModule.formatDate(dateDoc1)} au ${filterModule.formatDate(dateDoc2)}`.toUpperCase(),
          bold: true,
          font: 'Calibri',
          size: `24pt`,
          color: '#0070c0',
        }),
      ],
      alignment: docx.AlignmentType.CENTER,
    });

    const matchingChildren = [];

    for (const stage of listPendingProcessing) {
        const childrenWithStatus = stage.childs.filter(child => {
            return child.status === 'Pending' || child.status === 'Processing';
        });

        if (childrenWithStatus.length > 0) {
            matchingChildren.push({
            customerFirstName: stage.customerFirstName,
            customerLastName: stage.customerLastName,
            });
        }
    }

    const table = new docx.Table({
        width: {
            size: 30,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [new docx.Paragraph('Non réglé ou à checker')],
                }),
            ],
        }),
        ...matchingChildren.map(stage => {
            return new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph(stage.customerFirstName)],
                    }),
                    new docx.TableCell({
                        children: [new docx.Paragraph(stage.customerLastName)],
                    }),
                ],
            });
        }),
      ],
    });

    const doc = new docx.Document({
      sections: [{
        properties: {
            page: {
                size: {
                    orientation: docx.PageOrientation.LANDSCAPE,
                },
            },
        },
        children: [title, table]
      }]
    });

    const fileName = path.join(downloadsPath, `planning_accueil_semaine_${filterModule.formatDate(dateDoc1)}_au_${filterModule.formatDate(dateDoc2)}.docx`);
    docx.Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync(fileName, buffer, (err) => {
            if (err) {
            console.error(err);
            } else {
            console.log('Fichier enregistré dans le dossier Téléchargements.');
            }
        });
    });
  }
  

module.exports = {
    customerFillList,
    fillAccueilDoc
  };