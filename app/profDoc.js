const docsModule = require('./docs');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

function modifyHours(name, stage) {
    console.log('name = ',name);
    if (stage.prof2 && stage.prof2.nom !== stage.prof1.nom) {
        if (name === 'fin') {
            // const newFin = stage.fin.split(':')[0];
            // const minFin = stage.fin.split(':')[1];
            // const hourFin = parseInt(newFin, 10) - 1;
            // const hours = `${hourFin}:${minFin}`;
            // return hours;
            const newDebut = stage.debut.split(':')[0];
            const minDebut = stage.debut.split(':')[1];
            const hourDebut = parseInt(newDebut, 10) + 1;
            const hours = `${hourDebut}:${minDebut}`;
            return hours;
        }
        else if (name === 'debut') {
            // const newDebut = stage.debut.split(':')[0];
            // const minDebut = stage.debut.split(':')[1];
            // const hourDebut = parseInt(newDebut, 10) + 1;
            // const hours = `${hourDebut}:${minDebut}`;
            // return hours;
            const newDebut = stage.fin.split(':')[0];
            const minDebut = stage.fin.split(':')[1];
            const hourDebut = parseInt(newDebut, 10) - 1;
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

            console.log('tmp2 before = ',tmp2.debut);
            tmp2.debut = modifyHours('debut', stage);
            console.log('tmp2 after = ',tmp2.debut);
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
    for (const prof of profList) {
        for (const stage of prof.stage) {
            const ageSort = stage.childs.sort((a, b) => docsModule.customBirthComparison(a.birth, b.birth));
            stage.childs = ageSort;
        }
    }
    return profList;
}

module.exports = {
    customerFillList,
    modifyHours
};