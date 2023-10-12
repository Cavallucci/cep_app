const docsModule = require('./docs');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

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
    const profList = [];
    for (const stage of jsonList) {
        const existingProf = profList.find(prof => prof.nom === stage.prof1.nom);
        const tmp = { ...stage };

        tmp.fin = modifyHours('fin', stage);

        if (existingProf) {
            existingProf.stage.push(tmp);
        } else {
            const newProf = {
                id: stage.prof1.id,
                nom: stage.prof1.nom,
                stage: [tmp], 
            };
            profList.push(newProf);
        }

        if (stage.prof2 && stage.prof2.nom !== stage.prof1.nom) {
            const existingProf2 = profList.find(prof => prof.nom === stage.prof2.nom);
            const tmp2 = { ...stage }; 

            tmp2.debut = modifyHours('debut', stage);

            if (existingProf2) {
                existingProf2.stage.push(tmp2);
            } else {
                const newProf2 = {
                    id: stage.prof2.id,
                    nom: stage.prof2.nom,
                    stage: [tmp2], 
                };
                profList.push(newProf2);
            }
        }
    }
    for (const prof of profList) {
        const debutSort = prof.stage.sort((a, b) => {
            if (a.debut < b.debut) {
                return -1;
            }
            if (a.debut > b.debut) {
                return 1;
            }
            return 0;
        });
        prof.stage = debutSort;
    }
    console.log(profList);
    return profList;
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

module.exports = {
    newStageList,
    generateEditableTable,
    customerFillList,
};