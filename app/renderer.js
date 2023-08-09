const { ipcRenderer } = require('electron');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');
const checkboxModule = require('./checkbox');
const filterModule = require('./filter');

document.getElementById('fileInput').addEventListener('change', () => {
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  if (filePath.endsWith('_trie.xlsx')) {
    alert('Le fichier a déjà été trié');
  } else {
    document.getElementById('loadingMessage').style.display = 'block';
    ipcRenderer.send('sortExcelFile', filePath);
  }
});

document.getElementById('printButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');

  if (fileInput.files.length > 0) {
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
  } else {
    alert('Aucun fichier sélectionné');
  }
});

function handleOptionChange(radioButton, groupedData) {
  document.querySelectorAll('.option-label').forEach((label) => {
    label.classList.remove('active');
  });

  const selectedLabel = radioButton.closest('.option-label');
  selectedLabel.classList.add('active');

  switch (radioButton.id) {
    case 'facturation':
      facturationModule.displayFacturation(groupedData);
      break;
    case 'adhesion':
      adhesionModule.displayAdhesion(groupedData);
      break;
    case 'decouverte':
      decouverteModule.displayDecouverte(groupedData);
      break;
    case 'test':
      testModule.displayTest(groupedData);
      break;
    case 'stage':
      stageModule.displayStage(groupedData);
      break;
    default:
      break;
  }
}

ipcRenderer.on('sortingSuccess', (event, groupedData) => {
  document.getElementById('loadingMessage').style.display = 'none';

  if (groupedData.length > 0) {
    const radioGroup = document.getElementsByName("options");

    radioGroup.forEach((radioButton) => {
      radioButton.addEventListener("change", () => {
        if (radioButton.checked) {
          handleOptionChange(radioButton, groupedData);
        }
      });

      if (radioButton.checked) {
        handleOptionChange(radioButton, groupedData);
      }
    });
  } else {
    alert('Aucune donnée détectée');
  }
});

ipcRenderer.on('sortingError', (event, error) => {
  alert(error);
  console.error(error);
});

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
  const checkboxesID = document.querySelectorAll('[type="checkbox"]:checked');

  if (checkboxesID.length > 0) {
    const checkboxes = filterModule.removeDoublons(checkboxesID);
    const globalData = await ipcRenderer.invoke('get-sorted-data');
    const userConfirmed = confirm('Envoyer Email ?');

    if (userConfirmed) {
        document.getElementById('loadingMessage').style.display = 'block';
        try {
            const emailPromises = checkboxes.map(async (checkbox) => {
                    if (checkbox.id === 'facturation') {
                        await facturationModule.manageFacturationEmail(checkbox, globalData);
                    }
                    if (checkbox.id === 'adhesion') {
                        await adhesionModule.manageAdhesionEmail(checkbox, globalData);
                    }
                    if (checkbox.id === 'decouverte') {
                        await decouverteModule.manageDecouverteEmail(checkbox, globalData);
                    }
                    if (checkbox.id === 'test') {
                        await testModule.manageTestEmail(checkbox, globalData);
                    }
                    if (checkbox.id === 'stage') {
                        await stageModule.manageStageEmail(checkbox, globalData);
                    }
            });
            await Promise.all(emailPromises);
            document.getElementById('loadingMessage').style.display = 'none';
            alert('Emails envoyés !');
        } catch (error) {
            alert(error);
            console.error(error);
        }
    }
  } else {
      alert('Aucun client sélectionné');
  }
});