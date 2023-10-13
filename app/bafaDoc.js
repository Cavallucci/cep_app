const docsModule = require('./docs');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const docx = require('docx');
const filterModule = require('./filter');

function modifyHours(name, stage) {
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

async function customerFillList(jsonList) {
    const childList = {
        stages: [],
        commentaires: [],
    };
    const stageWithJC = jsonList.find(stage => stage.staName.startsWith('Journée continue'));
    let childListWithJC = [];
    if (stageWithJC) {
        childListWithJC = stageWithJC.childs;
    }
    for (const stage of jsonList) {
        if (stage.commentaire)
            childList.commentaires.push(stage.commentaire);
        if (!stage.staName.startsWith('Journée continue')) {
            for (const child of stage.childs) {
                if (childListWithJC.find(childJC => childJC.childId === child.childId)) {
                    const newChildList = {
                        id: child.childId,
                        stage: stage.staName,
                        salle1: stage.salle1,
                        salle2: stage.salle2,
                        debut: stage.debut,
                        fin: stage.fin,
                        firstName: child.childFirstName,
                        lastName: child.childLastName,
                        birth: child.birth,
                    };
                    childList.stages.push(newChildList);
                }
            }
        }
    }
    childList.stages.sort((a, b) => {
        if (a.id < b.id) {
            return -1;
        }
        if (a.id > b.id) {
            return 1;
        }
        return 0;
    });
    return childList;
}

function newStageList(editableTable, stageList) {
    [...editableTable.rows].slice(1).forEach((row, index) => {
        if (stageList[index].age) {
        stageList[index].age[0] = row.cells[0].textContent;
        } else {
        stageList[index].age = [row.cells[0].textContent];
        }
        stageList[index].staName = row.cells[1].textContent;
        stageList[index].debut = row.cells[2].textContent;
        stageList[index].fin = row.cells[3].textContent;
        stageList[index].salle1 = row.cells[4].textContent;
        stageList[index].salle2 = row.cells[5].textContent;
        stageList[index].prof1.nom = row.cells[6].textContent;
        stageList[index].prof2.nom = row.cells[7].textContent;
        stageList[index].commentaire = row.cells[8].textContent;
    });
      return stageList;
}

function generateEditableTable(stageLists) {
    const stageList = docsModule.sortStage(stageLists);

    const table = document.createElement('table');
    table.className = 'editable-table';
  
    const headerRow = document.createElement('tr');
    const headers = ['Age', 'Intitulé', 'début', 'fin', 'salle1', 'salle2', 'prof1', 'prof2', 'commentaire'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
  
    stageList.forEach(stage => {
        const row = document.createElement('tr');

        const cell1 = document.createElement('td');
        cell1.contentEditable = true;
        cell1.textContent = stage.age;
        row.appendChild(cell1);

        const cell2 = document.createElement('td');
        cell2.contentEditable = true;
        cell2.textContent = stage.staName; 
        row.appendChild(cell2);

        const cell3 = document.createElement('td');
        cell3.contentEditable = true;
        cell3.textContent = stage.debut; 
        row.appendChild(cell3);

        const cell4 = document.createElement('td');
        cell4.contentEditable = true;
        cell4.textContent = stage.fin;
        row.appendChild(cell4);

        const cell5 = document.createElement('td');
        cell5.contentEditable = true;
        cell5.textContent = stage.salle1;
        row.appendChild(cell5);

        const cell6 = document.createElement('td');
        cell6.contentEditable = true;
        cell6.textContent = stage.salle2;
        row.appendChild(cell6);

        const cell7 = document.createElement('td');
        cell7.contentEditable = true;
        cell7.textContent = stage.prof1.nom;
        row.appendChild(cell7);

        const cell8 = document.createElement('td');
        cell8.contentEditable = true;
        cell8.textContent = stage.prof2.nom;
        row.appendChild(cell8);

        const cell9 = document.createElement('td');
        cell9.contentEditable = true;
        cell9.textContent = stage.commentaire;
        row.appendChild(cell9);

        table.appendChild(row);
    });
  
    return table;
}

function tableComments(comments) {
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
                                docsModule.addText('Commentaires', true, '18pt'),
                            ],
                        })],
                    }),
                ],
            }),
            ...comments.map(comment => new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph({
                            children: [
                                docsModule.addText(comment, false, '14pt', '#ff0000'),
                                new docx.TextRun({ break: 1 }),
                            ],
                        })],
                    }),
                ],
            })),
        ],
    });
    return table;
}

async function tableStage(stageList) {
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
                            docsModule.addText('Titre cours', true, `12pt`),
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
                            docsModule.addText('Salle 1', true, `12pt`),
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
                            docsModule.addText('Salle 2', true, `12pt`),
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
                            docsModule.addText('Heure début', true, `12pt`),
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
                            docsModule.addText('Heure fin', true, `12pt`),
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
                            docsModule.addText('Prénom', true, `12pt`),
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
                            docsModule.addText('Nom', true, `12pt`),
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
                            docsModule.addText('Date de naissance', true, `12pt`),
                        ],
                    }),
                ],
            }),
            ],
        }),
        ...stageList.map(stage => new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.stage, false, `12pt`),
                        ],
                    })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.salle1, false, `12pt`),
                        ],
                    })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.salle2, false, `12pt`),
                        ],
                    })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.debut, false, `12pt`),
                        ],
                    })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.fin, false, `12pt`),
                        ],
                    })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.firstName, false, `12pt`),
                        ],
                    })],
                    columnSpan: 2,
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.lastName, false, `12pt`),
                        ],
                    })],
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [
                            docsModule.addText(stage.birth, false, `12pt`),
                        ],
                    })],
                }),
            ],
        })),
        ],
    });
    return table;
}

async function fillBafaDoc(downloadsPath, stageList, dateDoc1, dateDoc2) {
    const title = docsModule.addTitle(dateDoc1, dateDoc2);
    const header = docsModule.addHeader('version BAFA');
    const footer = docsModule.addFooter('BAFA');
    const ligneVide = new docx.Paragraph({
        children: [
            new docx.TextRun({ break: 2 }),
        ],
    });
    const comments = tableComments(stageList.commentaires);
    const table = await tableStage(stageList.stages);

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
          children: [title, ligneVide, comments, ligneVide, ligneVide, table]
        }]
      });
  
      const fileName = path.join(downloadsPath, `planning_BAFA_semaine_${filterModule.formatDate(dateDoc1)}_au_${filterModule.formatDate(dateDoc2)}.doc`);
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

module.exports = {
    newStageList,
    generateEditableTable,
    customerFillList,
    fillBafaDoc,
};