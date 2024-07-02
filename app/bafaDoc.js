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
            const childPhrase = `A ${child.fin}, l'enfant ${child.firstName} ${child.lastName} doit être emmené de la salle ${child.salle2 ? child.salle2 : '?'} à la salle ${conflictingCourse.salle1 ? conflictingCourse.salle1 : '?'}`;
            childList.transports.push(childPhrase);        
        }
        // if (childListWithJC.find(childJC => childJC.childId === child.id))
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
        borders: {
            top: { style: docx.BorderStyle.NONE,},
            bottom: { style: docx.BorderStyle.NONE,},
            left: { style: docx.BorderStyle.NONE,},
            right: { style: docx.BorderStyle.NONE,},
        },
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        rows: [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        borders: {
                            top: { style: docx.BorderStyle.NONE,},
                            bottom: { style: docx.BorderStyle.NONE,},
                            left: { style: docx.BorderStyle.NONE,},
                            right: { style: docx.BorderStyle.NONE,},
                        },
                        children: [new docx.Paragraph({
                            children: [
                                docsModule.addText('Commentaires', true, '18pt'),
                            ],
                        })],
                    }),
                ],
            }),
            ...Array.from(comments.keys()).map((key, index) => new docx.TableRow({
                children: [
                  new docx.TableCell({
                    borders: {
                        top: { style: docx.BorderStyle.NONE,},
                        bottom: { style: docx.BorderStyle.NONE,},
                        left: { style: docx.BorderStyle.NONE,},
                        right: { style: docx.BorderStyle.NONE,},
                    },
                    children: [
                      new docx.Paragraph({
                        children: [
                          docsModule.addText(key, true, '14pt', 'FF0000'),
                          new docx.TextRun({ break: 1 }),
                          ...comments.get(key).map(comment => [
                            docsModule.addText(comment, false, '14pt'),
                            new docx.TextRun({ break: 1 }),
                          ]).flat(),
                        ],
                      }),
                    ],
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
                                docsModule.addText(comment, false, '14pt'),
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
            }),
        ),
    ],
    });
    return table;
}

function analyseComments(comments, mapComments) {
    if (!mapComments)
        mapComments = new Map();
    for (const comment of comments) {
        const match = /(\d{2}:\d{2}), (.*)/.exec(comment);
        const time = match[1] ? match[1] : '';
        if (!mapComments.has(time)) {
            mapComments.set(time, []);
        }
        const firstHalf = comment.split(',')[0];
        const newComment = comment.replace(`${firstHalf},`, '');
        mapComments.get(time).push(newComment);
    }
    mapComments = new Map([...mapComments.entries()].sort());
    return mapComments;
}

async function fillBafaDoc(downloadsPath, stageList, dateDoc1, dateDoc2) {
    const header = docsModule.addHeader('version BAFA', dateDoc1, dateDoc2);;
    const footer = docsModule.addFooter('BAFA');
    const ligneVide = new docx.Paragraph({
        children: [
            new docx.TextRun({ break: 2 }),
        ],
    });
    const comments = analyseComments(stageList.commentaires, null);
    const transports = analyseComments(stageList.transports, comments)
    const resum = tableComments(transports);
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
          children: [resum, ligneVide, table]
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