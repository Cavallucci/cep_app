const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

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
    htmlWithCode = myHTML.replace("{{customerFirstName}}", customer.customerFirstName);
    htmlWithCode = htmlWithCode.replace("{{totalPxVente}}", customer.totalPxVente);

    const mailOptions = {
      to: `${customer.customerEmail}`,
      from: "laura.cllucci@gmail.com",
      subject: "Club des Enfants Parisiens: Facturation",
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
  const childLastNames = customerGroup.map(child => child.childLastName);
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/adhesionEmail.html'), 'utf8');

    let htmlWithCode = myHTML.replace("{{customerFirstName}}", customerFirstName);
    htmlWithCode = htmlWithCode.replace("{{childFirstName}}", childFirstNames);
    htmlWithCode = htmlWithCode.replace("{{childLastName}}", childLastNames);

    const mailOptions = {
      to: `${customerEmail}`,
      from: "laura.cllucci@gmail.com",
      subject: "Club des Enfants Parisiens: Adhesion",
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
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/decouverteEmail.html'), 'utf8');

    let htmlWithCode = myHTML.replace("{{customerFirstName}}", customerFirstName);
    htmlWithCode = htmlWithCode.replace("{{childFirstName}}", childFirstNames);
    htmlWithCode = htmlWithCode.replace("{{childLastName}}", childLastNames);

    const mailOptions = {
      to: `${customerEmail}`,
      from: "laura.cllucci@gmail.com",
      subject: "Club des Enfants Parisiens: Cours de découverte",
      text: "Cours de découverte",
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

async function sendEmailTest(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/testEmail.html'), 'utf8');

    let htmlWithCode = myHTML.replace("{{customerFirstName}}", customerFirstName);
    htmlWithCode = htmlWithCode.replace("{{childFirstName}}", childFirstNames);
    htmlWithCode = htmlWithCode.replace("{{childLastName}}", childLastNames);

    const mailOptions = {
      to: `${customerEmail}`,
      from: "laura.cllucci@gmail.com",
      subject: "Club des Enfants Parisiens: Cours de test",
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

async function sendEmailStage(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);
  const myHTML = fs.readFileSync(path.join(__dirname, 'emails/stageEmail.html'), 'utf8');

    let htmlWithCode = myHTML.replace("{{customerFirstName}}", customerFirstName);
    htmlWithCode = htmlWithCode.replace("{{childFirstName}}", childFirstNames);
    htmlWithCode = htmlWithCode.replace("{{childLastName}}", childLastNames);

    const mailOptions = {
      to: `${customerEmail}`,
      from: "laura.cllucci@gmail.com",
      subject: "Club des Enfants Parisiens: Stages",
      text: "Stages",
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

module.exports = {
    setupCheckboxListeners,
    sendEmailFacturation,
    sendEmailAdhesion,
    sendEmailDecouverte,
    sendEmailTest,
    sendEmailStage
  };