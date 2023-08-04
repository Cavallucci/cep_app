const { ipcRenderer } = require('electron');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');
const checkboxModule = require('./checkbox');

document.getElementById('fileInput').addEventListener('change', () => {
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  if (filePath.endsWith('_trie.xlsx')) {
    alert('Le fichier a déjà été trié');
  } else {
    ipcRenderer.send('sortExcelFile', filePath);
  }
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

document.getElementById('selectAllCheckbox').addEventListener('change', () => {
  const isChecked = selectAllCheckbox.checked;
  const customerCheckboxes = document.querySelectorAll('[type="checkbox"][data-customer-id]');
  customerCheckboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
  });
});

document.getElementById('sendEmailButton').addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('[type="checkbox"]:checked');

  if (checkboxes.length > 0) {
    const globalData = await ipcRenderer.invoke('get-sorted-data');
    const userConfirmed = confirm('Envoyer Email ?');

    if (userConfirmed) {
      checkboxes.forEach((checkbox) => {
        if (checkbox.id === 'facturation') {
          facturationModule.manageFacturationEmail(checkbox, globalData);
        }
        if (checkbox.id === 'adhesion') {
          adhesionModule.manageAdhesionEmail(checkbox, globalData);
        }
        if (checkbox.id === 'decouverte') {
          decouverteModule.manageDecouverteEmail(checkbox, globalData);
        }
        if (checkbox.id === 'test') {
          testModule.manageTestEmail(checkbox, globalData);
        }
        if (checkbox.id === 'stage') {
          stageModule.manageStageEmail(checkbox, globalData);
        }
      });
    }
  }
});