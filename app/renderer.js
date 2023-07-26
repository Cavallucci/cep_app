const { ipcRenderer } = require('electron');

document.getElementById('sortButton').addEventListener('click', () => {
  console.log('Clic sur le bouton "Trier"');
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  console.log('Chemin du fichier Excel :', filePath);

  ipcRenderer.send('sortExcelFile', filePath);
  alert('Le fichier a bien été chargé !');
});