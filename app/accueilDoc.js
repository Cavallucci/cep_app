const docsModule = require('./docs');

function newStageList(editableTable, stageList) {
    [...editableTable.rows].slice(1).forEach((row, index) => {
        stageList[index].age[0] = row.cells[0].textContent;
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
        cell9.textContent = stage.comment;
        row.appendChild(cell9);

        table.appendChild(row);
    });
  
    return table;
  }

module.exports = {
    newStageList,
    generateEditableTable
};