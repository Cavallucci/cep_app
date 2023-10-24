const docsModule = require('./docs');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const docx = require('docx');
const filterModule = require('./filter');

async function customerFillList(jsonList) {
    const allchilds = [];
    const childList = {
        stages: [],
        commentaires: [],
        transports: [],
    };
    const stageWithJC = jsonList.find(stage => stage.staName.startsWith('Journée continue'));
    let childListWithJC = [];
    if (stageWithJC) {
        childListWithJC = stageWithJC.childs;
    }
    for (const stage of jsonList) {
        if (!stage.staName.startsWith('Journée continue')) {
            if (stage.commentaire)
                childList.commentaires.push(stage.commentaire);
            for (const child of stage.childs) {
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
                    allchilds.push(newChildList);
            }
        }
    }
    for (const child of allchilds) {
        const hasConflictingCourse = allchilds.some(stage => {
            const conflict = (
                stage.debut === child.fin &&
                stage.id === child.id &&
                stage.salle1 !== child.salle1
            );
            return conflict;
        });
        if (hasConflictingCourse && !childListWithJC.find(childJC => childJC.childId === child.id)) {
            const conflictingCourse = allchilds.find(stage => {
                return (
                    stage.debut === child.fin &&
                    stage.id === child.id &&
                    stage.salle1 !== child.salle1
                );
            });
            const childPhrase = `À ${child.fin}, l'enfant ${child.firstName} ${child.lastName} doit être emmené de la salle ${child.salle2 ? child.salle2 : '?'} à la salle ${conflictingCourse.salle1 ? conflictingCourse.salle1 : '?'}`;
            childList.transports.push(childPhrase);        
        }
        if (childListWithJC.find(childJC => childJC.childId === child.id))
            childList.stages.push(child);
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

function tableTransports(transports) {
    const table = new docx.Table({
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            ...transports.map(comment => new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [new docx.Paragraph({
                            children: [
                                docsModule.addText(comment, false, '14pt', '#0000FF'),
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
        ...stageList.map(stage => 
            new docx.TableRow({
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
    let transports;
    if (stageList.transports.length > 0)
        transports = tableTransports(stageList.transports);
    else
        transports = new docx.Paragraph({
            children: [
                new docx.TextRun({ break: 1 }),
            ],
        });
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
          children: [title, ligneVide, comments, ligneVide, transports, ligneVide, table]
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
    customerFillList,
    fillBafaDoc,
};