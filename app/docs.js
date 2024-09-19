const stageModule = require('./stage');
const docx = require('docx');
const filterModule = require('./filter');
const fs = require('fs');
const path = require('path');

async function customerFillList(groupedData, dateDoc1, dateDoc2) {
    const t_stages = [];
    const header = await ipcRenderer.invoke('get-header-data');
    for (customerData of groupedData) {
        let existingStage = t_stages.find((t_stage) => t_stage.staSku === customerData[header.skuIndex]);

        if (existingStage) {
            const child = {
                childId: customerData[header.participantsIdIndex],
                childFirstName: customerData[header.prenomParticipantIndex],
                childLastName: customerData[header.nomParticipantIndex],
                birth: formatDateFrench(customerData[header.dateNaissanceIndex]),
                status: customerData[header.statusValueIndex],
                customerFirstName: customerData[header.customerFirstNameIndex],
                customerLastName: customerData[header.customerLastNameIndex],
            }
            existingStage.childs.push(child);
        } else if (customerData[header.skuIndex] && customerData[header.skuIndex].startsWith('STA')){
            const newCustomer = {
                staSku: customerData[header.skuIndex],
                staName: customerData[header.nameIndex],
                dateStage: customerData[header.skuIndex],
                commentaire: '',
                childs: [],
                age: customerData[header.nameIndex].match(/\d+\/\d+ ans/g),
                debut: formatTime(customerData[header.debutIndex]),
                fin: formatTime(customerData[header.finIndex]),
                salle1: customerData[header.salleIndex],
                salle2: customerData[header.salle2Index] ? customerData[header.salle2Index] : null,
                prof1: {
                    id: customerData[header.profCodeIndex],
                    nom: customerData[header.profNameIndex]
                },
                prof2: customerData[header.profCode2Index] ? {
                    id: customerData[header.profCode2Index],
                    nom: customerData[header.profName2Index]
                } : null,
            };
            const child = {
                childId: customerData[header.participantsIdIndex],
                childFirstName: customerData[header.prenomParticipantIndex],
                childLastName: customerData[header.nomParticipantIndex],
                birth: formatDateFrench(customerData[header.dateNaissanceIndex]),
                status: customerData[header.statusValueIndex],
                customerFirstName: customerData[header.customerFirstNameIndex],
                customerLastName: customerData[header.customerLastNameIndex],
            }
            newCustomer.childs.push(child);
            t_stages.push(newCustomer);
        }
    }

    const customerWithDate = await findMatchingDate(t_stages, dateDoc1, dateDoc2); 

    for (const stage of customerWithDate) {
        const ageSort = stage.childs.sort((a, b) => customBirthComparison(a.birth, b.birth));
        stage.childs = ageSort;
    }

    await addComments(customerWithDate);

    return customerWithDate;
}

async function addComments(stages) {
    for (const stage of stages) {
        const totalTime = subtractTimeInMinutes(stage.fin, stage.debut);
        if (totalTime > 120) {
            const debutPlus1h = modifyHoursComment('debut', stage);
            const finMoins1h = modifyHoursComment('fin', stage);
            stage.commentaire = `A ${debutPlus1h}, les Bafas emmènent les enfants de ${stage.age} de la salle ${stage.salle1} à l’accueil puis à ${finMoins1h} d’accueil en salle ${stage.salle2 ? stage.salle2 : '?'}`;
        }
        else if (stage.prof1.nom !== stage.prof2.nom) {
            const debutPlus1h = profDocModule.modifyHours('debut', stage);
            stage.commentaire = `A ${debutPlus1h}, les Bafas emmènent les enfants de ${stage.age} de la salle ${stage.salle1} à la salle ${stage.salle2 ? stage.salle2 : '?'}`;
        }
    }
    return stages;
}

function modifyHoursComment(name, stage) {
    if (stage.prof2 && stage.prof2.nom !== stage.prof1.nom) {
        if (name === 'fin') {
            const newFin = stage.fin.split(':')[0];
            const minFin = stage.fin.split(':')[1];
            const hourFin = parseInt(newFin, 10) - 1;
            const hours = `${hourFin}:${minFin}`;
            return hours;
        }
        else if (name === 'debut') {
            const newDebut = stage.debut.split(':')[0];
            const minDebut = stage.debut.split(':')[1];
            const hourDebut = parseInt(newDebut, 10) + 1;
            const hours = `${hourDebut}:${minDebut}`;
            return hours;
        }
    }
    return stage[name];
}

function subtractTimeInMinutes(endTime, startTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const totalMinutesStart = startHours * 60 + startMinutes;
    const totalMinutesEnd = endHours * 60 + endMinutes;

    return totalMinutesEnd - totalMinutesStart;
}

function customBirthComparison(dateOfBirthA, dateOfBirthB) {
    const datePartsA = dateOfBirthA.split('/').reverse().join('');
    const datePartsB = dateOfBirthB.split('/').reverse().join('');

    if (datePartsA < datePartsB) {
        return -1;
    }
    if (datePartsA > datePartsB) {
        return 1;
    }

    return 0;
}

function formatTime(timeStr) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5]?[0-9]$/;
    if (timeStr && timeStr.match(timeRegex)) {
        const [hours, minutes] = timeStr.split(':');
        const formattedHours = hours.padStart(2, '0');
        const formattedMinutes = minutes.padStart(2, '0');
        return `${formattedHours}:${formattedMinutes}`;
    }
    return timeStr;
}

function formatDateFrench(dateStr) {
    if (dateStr) {
        const parts = dateStr.split('-'); 
        if (parts.length === 3) {
            const day = parts[2];
            const month = parts[1];
            const year = parts[0];
            return `${day}/${month}/${year}`;
        }
    }
    return dateStr; 
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
        case 'ERJUIL':
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

async function fillProfDoc(downloadsPath, profList, dateDoc1, dateDoc2) {
    const header = addHeader('version professeur', dateDoc1, dateDoc2);
    const footer = addFooter('professeur');
    
    const profWithoutBafa = profList.filter(prof => prof.nom !== 'Bafa');
    const profBafa = profList.find(prof => prof.nom === 'Bafa');
    let childListWithBafa = [];
    if (profBafa) {
        for (const stage of profBafa.stage) {
            childListWithBafa = stage.childs;
        }
    }
    const planning = planningProfTable(profWithoutBafa, childListWithBafa);
    const ligneVide = new docx.Paragraph({
        children: [
            new docx.TextRun({ break: 2 }),
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
        headers: {
            default: header,
        },
        footers: {
            default: footer,
        },
        children: [ligneVide, ...planning]
        }]
    });

    const fileName = path.join(downloadsPath, `planning_prof_semaine_${filterModule.formatDate(dateDoc1)}_au_${filterModule.formatDate(dateDoc2)}.doc`);
    docx.Packer.toBase64String(doc).then((base64String) => {
        const buffer = Buffer.from(base64String, 'base64');
        fs.writeFileSync(fileName, buffer, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Fichier enregistré dans le dossier Téléchargements.');
            }
        });
    });
}

async function fillAccueilDoc(downloadsPath, stageList, dateDoc1, dateDoc2) {
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
    const table = withoutPaimentTable(matchingChildren);
    const aReplacer = aReplacerTable();
    const header = addHeader('version accueil', dateDoc1, dateDoc2);
    const footer = addFooter('accueil');
    const stageListWithoutJC = stageList.filter(stage => stage.staName.startsWith('Journée continue') === false);
    const stageWithJC = stageList.find(stage => stage.staName.startsWith('Journée continue'));
    let childListWithJC = [];
    if (stageWithJC) {
        childListWithJC = stageWithJC.childs;
    }
    const stageListSort = sortStage(stageListWithoutJC);
    const planning = planningTable(stageListSort, childListWithJC);
    const ligneVide = new docx.Paragraph({
        children: [
            new docx.TextRun({ break: 2 }),
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
        headers: {
            default: header,
        },
        footers: {
            default: footer,
        },
        children: [ligneVide, table, ligneVide, aReplacer,ligneVide, ligneVide, ligneVide, ligneVide, ...planning]
      }]
    });

    const fileName = path.join(downloadsPath, `planning_accueil_semaine_${filterModule.formatDate(dateDoc1)}_au_${filterModule.formatDate(dateDoc2)}.doc`);
    docx.Packer.toBase64String(doc).then((base64String) => {
        const buffer = Buffer.from(base64String, 'base64');
        fs.writeFileSync(fileName, buffer, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Fichier enregistré dans le dossier Téléchargements.');
            }
        });
    });
  }

  function withoutPaimentTable(matchingChildren) {
    if (matchingChildren.length === 0) {
        const paragraph = new docx.Paragraph({
            children: [
                addText('Aucun non réglé à checker', true, `14pt`),
            ],
        });
        return paragraph;
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
            });
    return table;
}

function sortChild(profList) {
    for (const prof of profList) {
        for (const stage of prof.stage) {
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
    }
}

function sortStage(stageList) {
    const stageListSort = stageList.sort((a, b) => {
        if (a.debut < b.debut) {
            return -1;
        }
        if (a.debut > b.debut) {
            return 1;
        }

        if (!a.age || !b.age) {
            return 0;
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

function addHeader(version, dateDoc1, dateDoc2) {
    return new docx.Header({
        children: [
            new docx.Paragraph({
                children: [
                    addText(version, true, `11pt`),
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
            new docx.Paragraph({
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
            }),
        ],
    });
}

function addFooter(version) {
    return new docx.Footer({
        children: [
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        children: ["Page ", docx.PageNumber.CURRENT],
                    }),
                    addText(` version ${version}`, false, `10pt`),
                ],
                alignment: docx.AlignmentType.CENTER,
            }),
        ],
    });
}

function aReplacerTable() {
    const table = new docx.Table({
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
    });
    return table;
}

function planningTable(stageList, childListWithJC) {
    const globalTable = [];

    const headerRow = headerPlanningTable();
    const headerChildTables = headerChildTable();
    for (const stage of stageList) {
        const stageRow = stagePlanningTable(stage);
        globalTable.push(headerRow);
        globalTable.push(stageRow);
        globalTable.push(addCellYellow(stage.commentaire));

        globalTable.push(headerChildTables);
        const childTable = childRowTable(stage.childs, childListWithJC);
        globalTable.push(childTable);
        const nbChilds = stage.childs.length;
        if (nbChilds < 10) {
            const nbDiff = 10 - nbChilds;
            const childTableVide = childRowTableVide(nbDiff);
            globalTable.push(childTableVide);
        }

        globalTable.push(new docx.Table({
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

function planningProfTable(profList, profBafa) {
    const globalTable = [];
    for (const prof of profList) {
        const headerProf = headerProfPlanningTable(prof.nom);
        globalTable.push(headerProf);
        const headerRow = headerPlanningTable();
        const headerChildTables = headerChildTable();
        for (const stage of prof.stage) {
            const stageRow = stagePlanningTable(stage);
            globalTable.push(headerRow);
            globalTable.push(stageRow);
            globalTable.push(addCellYellow(stage.commentaire));

            globalTable.push(headerChildTables);
            const childTable = childRowTable(stage.childs, profBafa);
            globalTable.push(childTable);
            const nbChilds = stage.childs.length;
            if (nbChilds < 10) {
                const nbDiff = 10 - nbChilds;
                const childTableVide = childRowTableVide(nbDiff);
                globalTable.push(childTableVide);
            }

            globalTable.push(new docx.Table({
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
    }
    return globalTable;
}

function childRowTable(childs, childListWithJC) {
    const table = new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            ...childs.map(child => {
                let isChildInJCList = false;
                if (childListWithJC.length > 0) {
                    isChildInJCList = childListWithJC.some(item => item.childId === child.childId);
                }

                const backgroundColor = isChildInJCList ? '#ffff00' : undefined;
                return new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            shading: {
                                fill: backgroundColor,
                            },
                            children: [
                                new docx.Paragraph({ 
                                    children: [
                                        addText(child.childFirstName, false, `11pt`),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            shading: {
                                fill: backgroundColor,
                            },
                            children: [
                                new docx.Paragraph({ 
                                    children: [
                                        addText(child.childLastName, false, `11pt`),
                                    ],
                                })
                            ],
                        }),
                        new docx.TableCell({
                            shading: {
                                fill: backgroundColor,
                            },
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
    return table;
}

function childRowTableVide(nbChilds) {
    const rows = [];
    for (let i = 0; i < nbChilds; i++) {
        const row = new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({ children: [] })],
                }),
            ],
        });
        rows.push(row);
    }

    const table = new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: rows,
    });

    return table;
}

function addCellYellow(comment) {
    const table = new docx.Table({
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
                        children: [
                            new docx.Paragraph({ 
                                children: [
                                    addText(comment, true, `11pt`),
                                ],
                            })
                        ],
                        columnSpan: 4,
                    }),
                ],
            }),
        ],
    });
    return table;
}

function stagePlanningTable(stage) {  
    const table = new docx.Table({
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
                        alignment: docx.AlignmentType.CENTER, 
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
                        alignment: docx.AlignmentType.CENTER, 
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
                columnSpan: 2,
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
    return table;
}

function headerProfPlanningTable(name) {
    const table = new docx.Table({
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
                        pageBreakBefore: true,
                        children: [
                            addText(name, true, `18pt`, '#ff0000'),
                        ],
                    }),
                ],
            }),
            ],
        }),
        ],
    });
    return table;
}

function headerPlanningTable() {
    const table = new docx.Table({
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
                        alignment: docx.AlignmentType.CENTER, 
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
                        alignment: docx.AlignmentType.CENTER, 
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
                columnSpan: 2,
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
    return table;
}

function headerChildTable() {
    const table = new docx.Table({
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
    return table;
}

function addText(text, bold, size, color) {
    const table = new docx.TextRun({
        text: text,
        font: 'Calibri',
        size: size,
        bold: bold,
        color: color ? color : null,
    });
    return table;
}

module.exports = {
    customerFillList,
    fillAccueilDoc,
    sortStage,
    formatTime,
    fillProfDoc,
    customBirthComparison,
    addText,
    addHeader,
    addFooter,
  };