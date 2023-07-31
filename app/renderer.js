const { ipcRenderer } = require('electron');
const facturationModule = require('./facturation');
const adhesionModule = require('./adhesion');


document.getElementById('fileInput').addEventListener('change', () => {
  console.log('Clic sur le bouton "Trier"');
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  console.log('Chemin du fichier Excel :', filePath);

  ipcRenderer.send('sortExcelFile', filePath);
});

document.getElementById('printButton').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;

  ipcRenderer.send('printExcelFile', filePath);
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