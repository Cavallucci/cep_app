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

    for (const stage of customerWithDate) {
        const ageSort = stage.childs.sort((a, b) => {
            if (a.birth < b.birth) {
                return -1;
            }
            if (a.birth > b.birth) {
                return 1;
            }
            return 0;
        });
        stage.childs = ageSort;
    }

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
                addText('Aucun non réglé à checker', true, `14pt`),
            ],
        });
    }

    const aReplacer = aReplacerTable();
    const header = addHeader();
    const footer = addFooter();

    const stageListWithoutJC = stageList.filter(stage => stage.staName.startsWith('Journée continue') === false);
    const stageListSort = sortStage(stageListWithoutJC);
    const planning = planningTable(stageListSort);


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
        children: [title, table, aReplacer, planning]
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

  function sortStage(stageList) {
    const stageListSort = stageList.sort((a, b) => {
        if (a.debut < b.debut) {
            return -1;
        }
        if (a.debut > b.debut) {
            return 1;
        }

        const ageA = parseInt(a.age[0]);
        const ageB = parseInt(b.age[0]); 

        if (ageA < ageB) {
            return -1;
        }
        if (ageA > ageB) {
            return 1;
        }

        return 0;
    });
    return stageListSort;
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
                    addText('version accueil', true, `11pt`),
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
                    addText('Page ', false, `10pt`),
                    docx.PageNumber.CURRENT,
                    addText(' sur ', false, `10pt`),
                    docx.PageNumber.TOTAL_PAGES,
                    addText(' - ', false, `10pt`),
                    addText('Planning accueil', false, `10pt`),
                ],
                alignment: docx.AlignmentType.CENTER,
            }),
        ],
    });
}

function aReplacerTable() {
    return new docx.Paragraph({
        children: [
        new docx.Table({
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
                                addText('Enfants à replacer', true, `16pt`),
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
                                addText('Prénom', true, `11pt`),
                            ],
                        }),
                    ]}),
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                addText('Nom', true, `11pt`),
                            ],
                        }),
                    ]}),
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                addText('Date de naissance', true, `11pt`),
                            ],
                        }),
                    ]}),
                    new docx.TableCell({ children: [
                        new docx.Paragraph({
                            children: [
                                addText('Commentaire', true, `11pt`),
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
    }),
    new docx.TextRun({ break: 3 }),
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
                                        addText('Non réglé ou à checker', true, `16pt`),
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
                                            addText(stage.customerFirstName, false, `11pt`, '#ff0000'),
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
                                            addText(stage.customerLastName, false, `11pt`, '#ff0000'),
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

function planningTable(stageList) {
    const globalTable = new docx.Paragraph({
        children: [],
    });
    const headerRow = headerPlanningTable();
    const headerChildTables = headerChildTable();
    for (const stage of stageList) {
        const stageRow = stagePlanningTable(stage);
        globalTable.addChildElement(headerRow);
        globalTable.addChildElement(stageRow);
        globalTable.addChildElement(addCellYellow());

        globalTable.addChildElement(headerChildTables);
        const childTable = childRowTable(stage.childs);
        globalTable.addChildElement(childTable);

        globalTable.addChildElement(new docx.Table({
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE,
            },
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({ 
                                    children: [ 
                                        new docx.TextRun({ break: 2 }),
                                    ],
                                })
                            ],
                        }),
                    ],
                }),
            ],
        }));
    }
    return globalTable;
}

function childRowTable(childs) {
    return new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            ...childs.map(child => {
                return new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({ 
                                    children: [
                                        addText(child.childFirstName, false, `11pt`),
                                    ],
                                })
                            ],
                        }),
                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({ 
                                    children: [
                                        addText(child.childLastName, false, `11pt`),
                                    ],
                                })
                            ],
                        }),
                        new docx.TableCell({
                            children: [
                                new docx.Paragraph({ 
                                    children: [
                                        addText(child.birth, false, `11pt`),
                                    ],
                                })
                            ],
                        }),
                        new docx.TableCell({
                            children: [ new docx.Paragraph({ children: [ ],})],
                        }),
                        new docx.TableCell({
                            children: [ new docx.Paragraph({ children: [ ],})],
                        }),
                        new docx.TableCell({
                            children: [ new docx.Paragraph({ children: [ ],})],
                        }),
                        new docx.TableCell({
                            children: [ new docx.Paragraph({ children: [ ],})],
                        }),
                        new docx.TableCell({
                            children: [ new docx.Paragraph({ children: [ ],})],
                        }),
                        new docx.TableCell({
                            children: [ new docx.Paragraph({ children: [ ],})],
                        }),
                    ],
                });
            }),
        ],
    });
}

function addCellYellow() {
    return new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        shading: {
                            fill: 'ffff00',
                        },
                        children: [],
                    }),
                ],
            }),
        ],
    });
}

function stagePlanningTable(stage) {  
    return  new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
        new docx.TableRow({
        children: [
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(stage.age[0], true, `13pt`),
                        ],
                    })
                ],                             
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(stage.staName, true, `13pt`),
                        ],
                    })
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(`${stage.debut} - ${stage.fin}`, true, `13pt`),
                        ],
                    })
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(stage.salle1, true, `13pt`),
                        ],
                    })
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(stage.salle2 ? stage.salle2 : '', true, `13pt`),
                        ],
                    })
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(stage.prof1.nom, true, `13pt`),
                        ],
                    })
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({ 
                        children: [
                            addText(stage.prof2 ? stage.prof2.nom : '', true, `13pt`),
                        ],
                    })
                ],
            }),
        ],
    }),
    ],
    });
}

function headerPlanningTable() {
    return  new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            new docx.TableRow({
            children: [
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Age', true, `13pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Intitulé', true, `13pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Horaires', true, `13pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Salle 1', true, `13pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Salle 2', true, `13pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Prof 1', true, `13pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                shading: {
                    fill: 'd0e5fe',
                },
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Prof 2', true, `13pt`),
                        ],
                    }),
                ],
            }),
            ],
        }),
        ],
    });
}

function headerChildTable() {
    return  new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            new docx.TableRow({
            children: [
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Prénom', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Nom', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Date de naissance', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Commentaires', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Lundi', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Mardi', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Mercredi', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Jeudi', true, `11pt`),
                        ],
                    }),
                ],
            }),
            new docx.TableCell({
                children: [
                    new docx.Paragraph({
                        children: [
                            addText('Vendredi', true, `11pt`),
                        ],
                    }),
                ],
            }),
            ],
        }),
        ],
    });
}

function addText(text, bold, size, color) {
    return new docx.TextRun({
        text: text,
        font: 'Calibri',
        size: size,
        bold: bold,
        color: color ? color : null,
    });
}

module.exports = {
    customerFillList,
    fillAccueilDoc
  };