const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { isNumberObject } = require('util/types');
const config = require(path.join(__dirname, '../config.json'));

const transporter = nodemailer.createTransport({
    pool: true,
    service: 'Gmail',
    auth: {
      user: config.SMTP_USERNAME,
      pass: config.SMTP_PASSWORD,
    },
    name: 'clubdesenfantsparisiens.com',
    tls: {
      rejectUnauthorized: false
    }
});

async function sendEmailFacturation(customer) {
    const userDataPath = await ipcRenderer.invoke('get-user-path');
    const myHTML = fs.readFileSync(path.join(userDataPath, 'emails/facturationEmail.html'), 'utf8');
    htmlWithCode = myHTML.replace("{{totalPxVente}}", customer.totalPxVente);
    htmlWithCode = htmlWithCode.replace("{{totalRestantDu}}", customer.totalRestantDu);

    const list = Array.from(customer.childCourses.keys()).map(childFirstName => {
      const courses = customer.childCourses.get(childFirstName);
      const coursesList = courses.map(course => `<ul>${course}</ul>`).join('');
      return `<li>${childFirstName}:<br> ${coursesList}</li>`;
  }).join('');

    htmlWithCode = htmlWithCode.replace("{{childCourses}}", list);
    if (customer.childsFirstName.length > 1) {
      htmlWithCode = htmlWithCode.replace("{{votre/vos}}", "vos enfants");
      htmlWithCode = htmlWithCode.replace("{{votre/vos}}", "vos enfants");
    }
    else {
      htmlWithCode = htmlWithCode.replace("{{votre/vos}}", "votre enfant");
      htmlWithCode = htmlWithCode.replace("{{votre/vos}}", "votre enfant");
    }

    const phrase = `<img src="cid:logo" width="200" height="100"></img>`;
    htmlWithCode = htmlWithCode.replace("{{logo}}", phrase);
    lienSystemPay = `<a href="${customer.lienSystemPay}">ici</a>`;
    htmlWithCode = htmlWithCode.replace("{{lienSystemPay}}", lienSystemPay);

    const mailOptions = {
      to: `${customer.customerEmail}`,
      from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
      subject: "Solde restant dû pour les activités de vos enfants + IBAN pour règlement",
      text: "Facturation",
      html: htmlWithCode,
      attachments: [{
        filename: 'logo_docs.png',
        path: path.join(__dirname, '../icons/logo_docs.png'),
        cid: 'logo'
      },
      {
        filename: 'RIB.pdf',
        path: path.join(__dirname, '../icons/RIB.pdf')
      }]
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info.response);
        }
      });
    });
}

async function sendEmailAdhesion(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const userDataPath = await ipcRenderer.invoke('get-user-path');
  const myHTML = fs.readFileSync(path.join(userDataPath, 'emails/adhesionEmail.html'), 'utf8');

  let htmlWithCode = myHTML.replace("{{childFirstNames}}", childFirstNames.join(' et '));
  htmlWithCode = htmlWithCode.replace("{{childFirstNames}}", childFirstNames.join(' et '));
  htmlWithCode = htmlWithCode.replace("{{childFirstNames}}", childFirstNames.join(' et '));

  if (childFirstNames.length > 1) {
    htmlWithCode = htmlWithCode.replace("{{les/l'}}", "les ");
    htmlWithCode = htmlWithCode.replace("{{cette/ces}}", "ces adhésions n'ont");
    htmlWithCode = htmlWithCode.replace("{{ée/ées}}", "ées");
  }
  else {
    htmlWithCode = htmlWithCode.replace("{{les/l'}}", "l'");
    htmlWithCode = htmlWithCode.replace("{{cette/ces}}", "cette adhésion n'a");
    htmlWithCode = htmlWithCode.replace("{{ée/ées}}", "ée");
  }

  const phrase = `<img src="cid:logo" width="200" height="100"></img>`;
  htmlWithCode = htmlWithCode.replace("{{logo}}", phrase);

  const mailOptions = {
    to: `${customerEmail}`,
    from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
    subject: "Votre inscription aux activités 2023/2024 du Club : adhésion(s) annuelle(s) manquante(s) !",
    text: "Adhésion",
    html: htmlWithCode,
    attachments: [{
      filename: 'logo_docs.png',
      path: path.join(__dirname, '../icons/logo_docs.png'),
      cid: 'logo'
    }]
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info.response);
      }
    });
  });
}

async function sendEmailDecouverte(customerGroup) {
  const { customerEmail , month}= customerGroup[0];
  const childsFirstNames = customerGroup.map(child => child.childFirstName);
  const userDataPath = await ipcRenderer.invoke('get-user-path');
  const myHTML = fs.readFileSync(path.join(userDataPath, 'emails/decouverteEmail.html'), 'utf8');

    let htmlWithCode = myHTML.replace("{{childsFirstNames}}", childsFirstNames.join(' et '));
    htmlWithCode = htmlWithCode.replace("{{childsFirstNames}}", childsFirstNames.join(' et '));

    const date = new Date(month);
    const monthString = date.toLocaleString('default', { month: 'long' });
    htmlWithCode = htmlWithCode.replace("{{mois}}", monthString);

    if (childsFirstNames.length > 1) {
      htmlWithCode = htmlWithCode.replace("{{vos/votre}}", "Vos enfants");
      htmlWithCode = htmlWithCode.replace("{{a/ont}}", "ont");
      htmlWithCode = htmlWithCode.replace("{{lui/leur}}", "leur");
      htmlWithCode = htmlWithCode.replace("{{l’/les}}", "les ");
    }
    else {
      htmlWithCode = htmlWithCode.replace("{{vos/votre}}", "Votre enfant");
      htmlWithCode = htmlWithCode.replace("{{a/ont}}", "a");
      htmlWithCode = htmlWithCode.replace("{{lui/leur}}", "lui");
      htmlWithCode = htmlWithCode.replace("{{l’/les}}", "l'");
    }

    const phrase = `<img src="cid:logo" width="200" height="100"></img>`;
    htmlWithCode = htmlWithCode.replace("{{logo}}", phrase);

    const mailOptions = {
      to: `${customerEmail}`,
      from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
      subject: "Cours de découverte : envie de vous inscrire aux cours annuels 23/24?",
      text: "Cours de découverte",
      html: htmlWithCode,
      attachments: [{
        filename: 'logo_docs.png',
        path: path.join(__dirname, '../icons/logo_docs.png'),
        cid: 'logo'
      }]
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info.response);
        }
      });
    });
}

async function sendEmailTest(customerGroup, storeLinks) {
  const { customerEmail } = customerGroup[0];
  const userDataPath = await ipcRenderer.invoke('get-user-path');
  const myHTML = fs.readFileSync(path.join(userDataPath, 'emails/testEmail.html'), 'utf8');
  let htmlWithCode;

  if (customerGroup.length > 1) {
    htmlWithCode = myHTML.replace("{{vos/votre}}", "Vos enfants ont");
    htmlWithCode = htmlWithCode.replace("{{lui/leur}}", "leur");
    htmlWithCode = htmlWithCode.replace("{{l’/les}}", "les ");
  }
  else {
    htmlWithCode = myHTML.replace("{{vos/votre}}", "Votre enfant a");
    htmlWithCode = htmlWithCode.replace("{{lui/leur}}", "lui");
    htmlWithCode = htmlWithCode.replace("{{l’/les}}", "l'");
  }

  const childCoursesMap = new Map();
  customerGroup.forEach(child => {
      childCoursesMap.set(child.childFirstName, child.tests);
  });

  const list = Array.from(childCoursesMap.keys()).map(childFirstName => {
    const courses = childCoursesMap.get(childFirstName);
    const coursesList = courses.map(course => `<ul>${course}</ul>`).join('');
    return `<li>${childFirstName}:<br> ${coursesList}</li>`;
}).join('');

  htmlWithCode = htmlWithCode.replace("{{childFirstName}}", list);

  const linksForSkus = [];
  const courses = [];
  for (const customer of customerGroup) {
    let nbtest = 0;
    for (const testCourse of customer.sku) {
      const testWords = testCourse.split('_');
      const wordAfterTest = testWords[1];
      if (storeLinks.has(wordAfterTest) && !courses.includes(testCourse)) {
        courses.push(testCourse);
        nbtest += 1;
        const liencomplet = storeLinks.get(wordAfterTest).split('/');
        const partieSouhaitee = liencomplet[3]; 
        const premierChiffre = partieSouhaitee.match(/\d/); 
        const positionPremierChiffre = partieSouhaitee.indexOf(premierChiffre[0]);
        const jusquauPremierChiffre = partieSouhaitee.substring(0, positionPremierChiffre);
        const sansDernierCaractere = jusquauPremierChiffre.slice(0, -1);
        linksForSkus.push(`<a href="${storeLinks.get(wordAfterTest)}">${sansDernierCaractere}</a>`);
      }
    }
  }
  htmlWithCode = htmlWithCode.replace("{{storeLinks}}", linksForSkus.join('<br>'));
  
  const phrase = `<img src="cid:logo" width="200" height="100"></img>`;
  htmlWithCode = htmlWithCode.replace("{{logo}}", phrase);

  const mailOptions = {
    to: `${customerEmail}`,
    from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
    subject: "Après votre cours d’essai, inscription aux cours annuels 23/24?",
    text: "Cours de test",
    html: htmlWithCode,
    attachments: [{
      filename: 'logo_docs.png',
      path: path.join(__dirname, '../icons/logo_docs.png'),
      cid: 'logo'
    }]
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info.response);
      }
    });
  });
}

async function sendEmailStage(customerGroup, listToPrint) {
  const { customerEmail } = customerGroup[0];
  const userDataPath = await ipcRenderer.invoke('get-user-path');
  const myHTML = fs.readFileSync(path.join(userDataPath, 'emails/stageEmail.html'), 'utf8');
  let htmlWithCode;

  if (customerGroup.length > 1) {
    htmlWithCode = myHTML.replace("{{votre/vos}}", "Vos enfants ont");
    htmlWithCode = htmlWithCode.replace("{{il/ils}}", "ils ont adoré leurs");
    htmlWithCode = htmlWithCode.replace("{{a/ont}}", "ont");
  }
  else {
    htmlWithCode = myHTML.replace("{{votre/vos}}", "Votre enfant a");
    htmlWithCode = htmlWithCode.replace("{{il/ils}}", "il a adoré ses");
    htmlWithCode = htmlWithCode.replace("{{a/ont}}", "a");
  }

  htmlWithCode = htmlWithCode.replace("{{stageLinks}}", listToPrint.join('<br>'));

  const phrase = `<img src="cid:logo" width="200" height="100"></img>`;
  htmlWithCode = htmlWithCode.replace("{{logo}}", phrase);
  
  const mailOptions = {
    to: `${customerEmail}`,
    from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
    subject: "Retrouvez les activités de stages de vacances sous forme de cours annuels 23/24",
    text: "Stages",
    html: htmlWithCode,
    attachments: [{
      filename: 'logo_docs.png',
      path: path.join(__dirname, '../icons/logo_docs.png'),
      cid: 'logo'
    }]
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info.response);
      }
    });
  });
}

module.exports = {
    sendEmailFacturation,
    sendEmailAdhesion,
    sendEmailDecouverte,
    sendEmailTest,
    sendEmailStage
  };