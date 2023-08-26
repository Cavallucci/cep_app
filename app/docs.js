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

async function fillAccueilDoc(downloadsPath, stageList, dateDoc1, dateDoc2) {
    const title = addTitle(dateDoc1, dateDoc2);

    const matchingChildren = [];

    for (const stage of stageList) {
        for (const child of stage.childs) {
            if ((child.status === 'pending' || child.status === 'processing') &&
                !matchingChildren.some(existingChild => 
                    existingChild.customerFirstName === child.customerFirstName &&
                    existingChild.customerLastName === child.customerLastName
                )) {
                matchingChildren.push(child);
            }
        }
    }
    
    let table = '';
    if (matchingChildren.length > 0) {
        table = withoutPaimentTable(matchingChildren);
    } else {
        table = new docx.Paragraph({
            children: [
                new docx.TextRun({
                    text: `Aucun non réglé à checker`,
                    font: 'Calibri',
                    size: `14pt`,
                }),
            ],
        });
    }

    const aReplacer = aReplacerTable();
    const header = addHeader();
    const footer = addFooter();
    const planning = planningTable(stageList);


    const doc = new docx.Document({
      sections: [{
        properties: {
            page: {
                size: {
                    orientation: docx.PageOrientation.LANDSCAPE,
                },
            },
        },
        headers: {
            default: header,
        },
        footers: {
            default: footer,
        },
        children: [title, table, aReplacer]
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

function addTitle(dateDoc1, dateDoc2) {
    return new docx.Paragraph({
        children: [
            new docx.TextRun({
                text: `STAGES du ${filterModule.formatDate(dateDoc1)} au ${filterModule.formatDate(dateDoc2)}`.toUpperCase(),
                bold: true,
                font: 'Calibri',
                size: `24pt`,
                color: '#0070c0',
            }),
            new docx.TextRun({ break: 3 }),
        ],
        alignment: docx.AlignmentType.CENTER,
    });
}

function addHeader() {
    return new docx.Header({
        children: [
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: 'version accueil',
                        font: 'Calibri',
                        size: `11pt`,
                        bold: true,
                    }),
                ],
                alignment: docx.AlignmentType.RIGHT,
            }),
            new docx.Paragraph({
                children: [
                    new docx.ImageRun({
                        data: fs.readFileSync(path.join(__dirname, '../icons/logo_docs.png')),
                        transformation: {
                            width: 189,
                            height: 102,
                        },
                        alignment: docx.AlignmentType.LEFT,
                    }),
                ],
            }),
        ],
    });
}

function addFooter() {
    return new docx.Footer({
        children: [
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: 'Page ',
                        font: 'Calibri',
                        size: `10pt`,
                    }),
                    docx.PageNumber.CURRENT,
                    new docx.TextRun({
                        text: ' sur ',
                        font: 'Calibri',
                        size: `10pt`,
                    }),
                    docx.PageNumber.TOTAL_PAGES,
                    new docx.TextRun({
                        text: ' - ',
                        font: 'Calibri',
                        size: `10pt`,
                    }),
                    new docx.TextRun({
                        text: 'Planning accueil',
                        font: 'Calibri',
                        size: `10pt`,
                    }),
                ],
                alignment: docx.AlignmentType.CENTER,
            }),
        ],
    });
}

function aReplacerTable() {
    return new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: 'Enfants à replacer',
                                    font: 'Calibri',
                                    size: `16pt`,
                                    bold: true,
                                }),
                            ],
                        })],
                    }),
                ],
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: 'Prénom',
                                    font: 'Calibri',
                                    size: `11pt`,
                                    bold: true,
                                }),
                            ],
                        }),
                    ]}),
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: 'Nom',
                                    font: 'Calibri',
                                    size: `11pt`,
                                    bold: true,
                                }),
                            ],
                        }),
                    ]}),
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: 'Date de naissance',
                                    font: 'Calibri',
                                    size: `11pt`,
                                    bold: true,
                                }),
                            ],
                        }),
                    ]}),
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: 'Commentaire',
                                    font: 'Calibri',
                                    size: `11pt`,
                                    bold: true,
                                }),
                            ],
                        }),
                    ]}),
                ],
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({ children: []}),
                    new docx.TableCell({ children: []}),
                    new docx.TableCell({ children: []}),
                    new docx.TableCell({ children: []}),
                ],
            }),
        ],
    });
}

function withoutPaimentTable(matchingChildren) {
    return new docx.Paragraph({
        children: [
            new docx.Table({
            width: {
                size: 30,
                type: docx.WidthType.PERCENTAGE,
            },
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: 'Non réglé ou à checker',
                                            font: 'Calibri',
                                            size: `16pt`,
                                            bold: true,
                                        }),
                                    ],
                                }),
                            ],
                         }),
                    ],
                }),
                ...matchingChildren.map(stage => {
                    return new docx.TableRow({
                        children: [
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.customerFirstName,
                                                font: 'Calibri',
                                                size: `11pt`,
                                                color: '#ff0000',
                                            }),
                                        ],
                                    })
                                ],                             
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.customerLastName,
                                                font: 'Calibri',
                                                size: `11pt`,
                                                color: '#ff0000',
                                            }),
                                        ],
                                    })
                                ],
                            }),
                        ],
                    });
                }),
            ],
            }),
        ],
    });
}

function planningTable( stageList) {
    const header = headerPlanningTable();
    return new docx.Paragraph({
        children: [
            new docx.Table({
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE,
            },
            rows: [
                header,
                ...stageList.map(stage => {
                    return new docx.TableRow({
                        children: [
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.age,
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],                             
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.staName,
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: `${filterModule.formatDate(stage.debut)} - ${filterModule.formatDate(stage.fin)}`,
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.salle1,
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.salle2 ? stage.salle2 : '',
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.prof1.nom,
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],
                            }),
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({ 
                                        children: [
                                            new docx.TextRun({
                                                text: stage.prof2 ? stage.prof2.nom : '',
                                                font: 'Calibri',
                                                size: `11pt`,
                                            }),
                                        ],
                                    })
                                ],
                            }),
                        ],
                    });
                }),
            ],
        }),
    ],
});
}

function headerPlanningTable() {
        return new docx.TableRow({
        children: [
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Age',
                                font: 'Calibri',
                                size: `16pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Intitulé',
                                font: 'Calibri',
                                size: `11pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Horaires',
                                font: 'Calibri',
                                size: `11pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Salle 1',
                                font: 'Calibri',
                                size: `11pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Salle 2',
                                font: 'Calibri',
                                size: `11pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Prof 1',
                                font: 'Calibri',
                                size: `11pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: 'Prof 2',
                                font: 'Calibri',
                                size: `11pt`,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
}

module.exports = {
    customerFillList,
    fillAccueilDoc
  };