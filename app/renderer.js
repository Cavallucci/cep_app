const { ipcRenderer } = require('electron');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');
const filterModule = require('./filter');

let dateAsk = new Date(0);

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

document.getElementById('dateInput').addEventListener('change', async () => {
  const dateInput = document.getElementById('dateInput');
  const date = new Date(dateInput.value);
  if (dateAsk.getTime() !== 0 || date.getTime() !== 0) {
    dateAsk = date;
    const groupedData = await ipcRenderer.invoke('get-sorted-data');
    testModule.displayTest(groupedData);
  }
});

document.addEventListener('displayBlock', async () => {
  if (dateAsk.getTime() !== 0) {
    const groupedData = await ipcRenderer.invoke('get-sorted-data');
    testModule.displayTest(groupedData);
  }
  else {
    const container = document.getElementById('displayContainer');
    container.innerHTML = '';
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
  document.getElementById('dateInputContainer').style.display = 'none';
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
        document.getElementById('dateInputContainer').style.display = 'block';
        const customEvent = new Event('displayBlock');
        document.dispatchEvent(customEvent);
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
    
      let isSending = false;
      let lenght = checkboxes.length;

      let time = 0;
      if (lenght < 50) {
        time = 1000;
      }
      else if (lenght < 100) {
        time = 2000;
      }
      else if (lenght < 200) {
        time = 3000;
      }
      else if (lenght < 300 ) {
        time = 4000;
      }
      else if (lenght < 400) {
        time = 5000;
      }
      else if (lenght < 500) {
        time = 6000;
      }
      else if (lenght > 500) {
        time = 7000;
      }
      totalTime = (time / 1000) * lenght;
      totalTime = Math.floor(totalTime / 60);
      alert('Vous êtes sur le point d\'envoyer ' + lenght + ' emails, temps estimé : ' + totalTime + ' minutes \n Veuillez ne pas fermer l\'application');


      try {
        for (const checkbox of checkboxes) {
          if (!isSending && checkbox.id !== 'selectAllCheckbox') {
            isSending = true; 
            let module;
    
            if (checkbox.id === 'facturation') {
              module = facturationModule;
            } else if (checkbox.id === 'adhesion') {
              module = adhesionModule;
            } else if (checkbox.id === 'decouverte') {
              module = decouverteModule;
            } else if (checkbox.id === 'test') {
              module = testModule;
            } else if (checkbox.id === 'stage') {
              module = stageModule;
            }
    
            try {
              await module.manageEmail(checkbox, globalData).then(response => {
                console.log(response);
              }
              ).catch(error => {
                console.error(error);
                customerID = checkbox.getAttribute('data-customer-id');
                alert('Erreur lors de l\'envoi de l\'email au customerID ' + customerID);
              });
              await new Promise(resolve => setTimeout(resolve, time)); 
            } catch (error) {
              alert(error);
              console.error(error);
            }
            isSending = false;
          }
        }
    
        document.getElementById('loadingMessage').style.display = 'none';
        alert('Fin d\'envois !');
      } catch (error) {
        alert(error);
        console.error(error);
      }
    }  
  } else {
      alert('Aucun client sélectionné');
  }
});