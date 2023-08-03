const { ipcRenderer } = require('electron');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');

document.getElementById('fileInput').addEventListener('change', () => {
  console.log('Clic sur le bouton "Trier"');
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  console.log('Chemin du fichier Excel :', filePath);

  ipcRenderer.send('sortExcelFile', filePath);
});

document.getElementById('printButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;

  const dataSorted = [];
  const globalData = await ipcRenderer.invoke('get-sorted-data');

  const facturationList = facturationModule.fillCustomersList(globalData);
  const adhesionList = adhesionModule.fillCustomersList(globalData);
  const decouverteList = decouverteModule.fillCustomersList(globalData);
  const testList = testModule.fillCustomersList(globalData);
  const stageList = stageModule.fillCustomersList(globalData);

  dataSorted.push(facturationList, adhesionList, decouverteList, testList, stageList);

  ipcRenderer.send('printExcelFile', filePath, dataSorted);
});

ipcRenderer.on('sortingSuccess', (event, groupedData) => {
  if (groupedData.length > 0) {
    const radioGroup = document.getElementsByName("options");
    radioGroup.forEach((radioButton) => {
      radioButton.addEventListener("change", () => {
        if (radioButton.checked) {
          if (radioButton.id === 'facturation') {
            facturationModule.displayFacturation(groupedData);
          }
          else if (radioButton.id === 'adhesion') {
            adhesionModule.displayAdhesion(groupedData);
          }
          else if (radioButton.id === 'decouverte') {
            decouverteModule.displayDecouverte(groupedData);
          }
          else if (radioButton.id === 'test') {
            testModule.displayTest(groupedData);
          }
          else if (radioButton.id === 'stage') {
            stageModule.displayStage(groupedData);
          }
        }
      });
    });
  }
  else {
    alert('Aucune donnée détecté');
  }
});

ipcRenderer.on('sortingError', (event, error) => {
  alert(error);
  console.error(error);
});

// Écouter l'événement 'printSuccess'
ipcRenderer.on('printSuccess', () => {
  alert('Impression de l\'Excel trié réussie !');
  console.log('Impression de l\'Excel trié réussie !');
});

ipcRenderer.on('printError', (event, error) => {
  alert(error);
  console.error(error);
});