const { ipcRenderer, app } = require('electron');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');
const decouverteModule = require('./decouverte');
const stageModule = require('./stage');
const testModule = require('./tests');
const filterModule = require('./filter');
const docsModule = require('./docs');
const accueilDocModule = require('./accueilDoc');
const profDocModule = require('./profDoc');
const todayCourseModule = require('./todayCourse');
const checkboxModule = require('./checkbox');
const path = require('path');

let dateAsk = new Date(0);
let dateDoc1 = new Date(0);
let dateDoc2 = new Date(0);

document.getElementById('fileInput').addEventListener('change', async () => {
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  if (filePath.endsWith('_trie.xlsx')) {
    alert('Le fichier a déjà été trié');
  } else {
    document.getElementById('loadingMessage').style.display = 'block';
    ipcRenderer.send('sortExcelFile', filePath);
  }
});

document.getElementById('fileDocInput').addEventListener('change', () => {
  const fileInput = document.getElementById('fileDocInput');
  const filePath = fileInput.files[0].path;
  document.getElementById('loadingMessage').style.display = 'block';
  ipcRenderer.send('sortDocFile', filePath);
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

document.getElementById('dateInputDoc1').addEventListener('change', async () => {
  const dateInput = document.getElementById('dateInputDoc1');
  const date = new Date(dateInput.value);
  dateDoc1 = date;
  if (dateDoc1.getTime() !== 0 && dateDoc2.getTime() !== 0) {
    document.getElementById('printDocOptions').style.display = 'block';
  }
});

document.getElementById('dateInputDoc2').addEventListener('change', async () => {
  const dateInput = document.getElementById('dateInputDoc2');
  const date = new Date(dateInput.value);
  dateDoc2 = date;
  if (dateDoc1.getTime() !== 0 && dateDoc2.getTime() !== 0) {
    document.getElementById('printDocOptions').style.display = 'block';
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

document.getElementById('printDoc').addEventListener('click', async () => {
    const container = document.getElementById('displayContainer');
    container.innerHTML = '';
    document.getElementById('containerPlanningStage').style.display = 'block';
    document.getElementById('fileWithComments').style.display = 'none';
    document.getElementById('dateInputContainer1').style.display = 'block';
    document.getElementById('dateInputContainer2').style.display = 'block';
});

document.getElementById('printDocAccueil').addEventListener('click', async () => {
  if (dateDoc1.getTime() !== 0 && dateDoc2.getTime() !== 0) {
      const fileInput = document.getElementById('fileInput');
      if (fileInput.files.length > 0) {
        const groupedData = await ipcRenderer.invoke('get-sorted-data');
        const checkStageListJson = await accueilDocModule.checkStageListJson(dateDoc1, dateDoc2);
        let stageList = [];
        if (checkStageListJson.length > 0) {
          const response = confirm('Un fichier a déjà été enregistré pour ces dates, voulez-vous l\'utiliser ?');
          if (response)
            stageList = checkStageListJson;
          else
            stageList = await docsModule.customerFillList(groupedData, dateDoc1, dateDoc2);
        } else {
          stageList = await docsModule.customerFillList(groupedData, dateDoc1, dateDoc2);
        }
        const editableTable = accueilDocModule.generateEditableTable(stageList);
        const container = document.getElementById('document-preview');
        container.style.display = 'block';
        container.innerHTML = '';
        container.appendChild(editableTable);

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Enregistrer et imprimer';
        saveButton.addEventListener('click', async () => {
          const newstageList = accueilDocModule.newStageList(editableTable, stageList);
          await accueilDocModule.saveDocAccueil(newstageList, dateDoc1, dateDoc2);
          ipcRenderer.send('printDocAccueil', dateDoc1, dateDoc2, newstageList);
        });

        container.appendChild(saveButton);
      }
  }
});

document.getElementById('printDocProf').addEventListener('click', async () => {
  if (dateDoc1.getTime() !== 0 && dateDoc2.getTime() !== 0) {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
      const groupedData = await ipcRenderer.invoke('get-sorted-data');
      const checkStageListJson = await accueilDocModule.checkStageListJson(dateDoc1, dateDoc2);
      let stageList = [];
      if (checkStageListJson.length > 0) {
        stageList = await profDocModule.customerFillList(checkStageListJson);
        // const editableTable = profDocModule.generateEditableTable(stageList);
        const container = document.getElementById('document-preview');
        container.style.display = 'block';
        container.innerHTML = '';
        // container.appendChild(editableTable);

        const printButton = document.createElement('button');
        printButton.textContent = 'Imprimer';
        printButton.addEventListener('click', async () => {
          const copyOfStageList = [...stageList];
          //const newstageList = profDocModule.newStageList(editableTable, stageList);
          ipcRenderer.send('printDocProf', dateDoc1, dateDoc2, copyOfStageList);
        });

        container.appendChild(printButton);
      } else {
        alert('Aucun fichier enregistré pour ces dates');
      }
    }
  }     
});

document.getElementById('printButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');

  if (fileInput.files.length > 0) {
    const filePath = fileInput.files[0].path;
    const dataSorted = [];
    const globalData = await ipcRenderer.invoke('get-sorted-data');

    const facturationList = await facturationModule.fillCustomersList(globalData);
    const adhesionList = await adhesionModule.fillCustomersList(globalData);
    const decouverteList = await decouverteModule.fillCustomersList(globalData);
    const testList = await testModule.fillCustomersList(globalData);
    const stageList = await stageModule.fillCustomersList(globalData);

    dataSorted.push(facturationList, adhesionList, decouverteList, testList, stageList);

    ipcRenderer.send('printExcelFile', filePath, dataSorted);
  } else {
    alert('Aucun fichier sélectionné');
  }
});

function handleOptionChange(radioButton, groupedData) {
  document.getElementById('containerPlanningStage').style.display = 'none';
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

document.getElementById('printTodayCourse').addEventListener('click', async() => {
  try {
    const groupedData = await ipcRenderer.invoke('get-sorted-data');
    await todayCourseModule.printTodayCourse(groupedData);
  }
  catch (error) {
    alert(error);
    console.error(error);
  }
});

document.getElementById('buttonRelances').addEventListener('click', async () => {
  document.getElementById('containerFeuillesAppel').style.display = 'none';
  document.getElementById('containerRelances').style.display = 'block';
  const groupedData = await ipcRenderer.invoke('get-sorted-data');
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

document.getElementById('buttonFeuillesAppel').addEventListener('click', async () => {
  document.getElementById('containerRelances').style.display = 'none';
  document.getElementById('containerFeuillesAppel').style.display = 'block';
});

ipcRenderer.on('sortingSuccess', (event) => {
  document.getElementById('loadingMessage').style.display = 'none';
  document.getElementById('buttonRelances').style.display = 'block';
  document.getElementById('buttonFeuillesAppel').style.display = 'block';
});

ipcRenderer.on('sortingError', (event, error) => {
  alert(error);
  console.error(error);
});

ipcRenderer.on('printSuccess', () => {
  alert('Impression de l\'Excel trié réussie !');
  console.log('Impression de l\'Excel trié réussie !');
});

ipcRenderer.on('printDocSuccess', () => {
  alert('Fichier enregistré dans le dossier Téléchargements.');
  console.log('Fichier enregistré dans le dossier Téléchargements.');
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

document.getElementById('modifyEmail').addEventListener('click', async () => {
  const container = document.getElementById('displayContainer');
  container.innerHTML = '';
  let filePath = '';
  const userDataPath = await ipcRenderer.invoke('get-user-path');

  if (document.getElementById('adhesion').checked) {
    filePath = path.join(userDataPath, 'emails/adhesionEmail.html');
  } else if (document.getElementById('decouverte').checked) {
    filePath = path.join(userDataPath, 'emails/decouverteEmail.html');
  } else if (document.getElementById('facturation').checked) {
    filePath = path.join(userDataPath, 'emails/facturationEmail.html');
  } else if (document.getElementById('test').checked) {
    filePath = path.join(userDataPath, 'emails/testEmail.html');
  } else if (document.getElementById('stage').checked) {
    filePath = path.join(userDataPath, 'emails/stageEmail.html');
  }

  try {
    const myHTML = fs.readFileSync(filePath, 'utf8');

    const emailContent = document.createElement('div');
    emailContent.innerHTML = myHTML;
    emailContent.setAttribute('contenteditable', 'true');
    container.appendChild(emailContent);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Enregistrer les modifications';
    saveButton.addEventListener('click', () => {
      const modifiedHTML = emailContent.innerHTML;
      try {
        fs.writeFileSync(filePath, modifiedHTML, 'utf8');
        ipcRenderer.send('reload-window');
        alert('Email enregistré avec succès !');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du fichier :', error);
      }
    });
    container.appendChild(saveButton);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier :', error);
  }
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
      let time = filterModule.setTimeWaiting(lenght);
      let totalTime = (time / 1000) * lenght;
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

module.exports = {
  handleOptionChange,
};