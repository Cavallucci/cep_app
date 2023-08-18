const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '../config.json'));

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: config.SMTP_USERNAME,
      pass: config.SMTP_PASSWORD,
    },
});

function setupCheckboxListeners(t_customers) {
    const checkboxes = document.querySelectorAll('[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                const customerId = checkbox.getAttribute('data-customer-id'); 
                const customer = t_customers.find((customer) => customer.customerId === customerId);
                console.log('Customer email :', customer.customerEmail);
            }
        });
    });
}

async function sendEmailFacturation(customer) {
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/facturationEmail.html'), 'utf8');
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
    const mailOptions = {
      to: `${customer.customerEmail}`,
      from: "CEP: Solde facturation <laura.cllucci@gmail.com>",
      subject: "Solde restant dû et lien de paiement",
      text: "Facturation",
      html: htmlWithCode,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
          return error;
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
          return info.response;
        }
      });
}

async function sendEmailAdhesion(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/adhesionEmail.html'), 'utf8');

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
  const mailOptions = {
    to: `${customerEmail}`,
    from: "CEP: Adhésion Manquante <laura.cllucci@gmail.com>",
    subject: "Votre inscription aux activités 2023/2024 du Club : adhésion(s) annuelle(s) manquante(s) !",
    text: "Adhésion",
    html: htmlWithCode,
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
        return error;
      } else {
        console.log('E-mail envoyé avec succès:', info.response);
        return info.response;
      }
    });
}

async function sendEmailDecouverte(customerGroup) {
  const { customerEmail , month}= customerGroup[0];
  const childsFirstNames = customerGroup.map(child => child.childFirstName);
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/decouverteEmail.html'), 'utf8');

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

    const mailOptions = {
      to: `${customerEmail}`,
      from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
      subject: "Cours de découverte : envie de vous inscrire aux cours annuels 23/24?",
      text: "Cours de découverte",
      html: htmlWithCode,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('E-mail envoyé avec succès:', info.response);
      return info.response;
    } catch (error) {
      console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
      throw error; 
  }
}

async function sendEmailTest(customerGroup, storeLinks) {
  const { customerEmail } = customerGroup[0];
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/testEmail.html'), 'utf8');
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
    for (const testCourse of customer.sku) {
      const testWords = testCourse.split('_');
      const wordAfterTest = testWords[1];
      if (storeLinks.has(wordAfterTest) && !courses.includes(testCourse)) {
        courses.push(testCourse);
        linksForSkus.push(`<a href="${storeLinks.get(wordAfterTest)}">${storeLinks.get(wordAfterTest)}</a>`);
      }
    }
  }
  htmlWithCode = htmlWithCode.replace("{{storeLinks}}", linksForSkus.join('<br>'));
  
  const mailOptions = {
    to: `${customerEmail}`,
    from: "CEP: Cours d'essai <laura.cllucci@gmail.com>",
    subject: "Après votre cours d’essai, inscriptions aux cours annuels 23/24?",
    text: "Cours de test",
    html: htmlWithCode,
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
        return error;
      } else {
        console.log('E-mail envoyé avec succès:', info.response);
        return info.response;
      }
    });
}

async function sendEmailStage(customerGroup, listToPrint) {
  const { customerEmail } = customerGroup[0];
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/stageEmail.html'), 'utf8');
  let htmlWithCode;

  if (customerGroup.length > 1) {
    htmlWithCode = myHTML.replace("{{votre/vos}}", "vos enfants ont");
    htmlWithCode = htmlWithCode.replace("{{il/ils}}", "ils ont adoré leurs");
    htmlWithCode = htmlWithCode.replace("{{a/ont}}", "ont");
  }
  else {
    htmlWithCode = myHTML.replace("{{votre/vos}}", "votre enfant a");
    htmlWithCode = htmlWithCode.replace("{{il/ils}}", "il a adoré ses");
    htmlWithCode = htmlWithCode.replace("{{a/ont}}", "a");
  }

  htmlWithCode = htmlWithCode.replace("{{stageLinks}}", listToPrint.join('<br>'));

  const mailOptions = {
    to: `${customerEmail}`,
    from: "Club des Enfants Parisiens <contact@clubdesenfantsparisiens.com>",
    subject: "Retrouvez les activités de stages de vacances sous forme de cours annuels 23/24",
    text: "Stages",
    html: htmlWithCode,
  };

  try {
    const info = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
          reject(error);
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
          resolve(info.response);
        }
      });
    });

    return info;
  } catch (error) {
    return error;
  }
}

module.exports = {
    setupCheckboxListeners,
    sendEmailFacturation,
    sendEmailAdhesion,
    sendEmailDecouverte,
    sendEmailTest,
    sendEmailStage
  };