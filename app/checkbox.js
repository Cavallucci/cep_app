const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'laura.cllucci@gmail.com',
      pass: 'ftyutjwvrdrdawlz',
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
    const myHTML = fs.readFileSync("./app/emails/facturationEmail.html", "utf8");
    htmlWithCode = myHTML.replace("{{customerFirstName}}", customer.customerFirstName);

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
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
        }
      });
}

async function sendEmailAdhesion(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);

    const myHTML = fs.readFileSync("./app/emails/adhesionEmail.html", "utf8");
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
          alert('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
          alert('E-mail envoyé avec succès:', info.response);
        }
      });
}

async function sendEmailDecouverte(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);

    const myHTML = fs.readFileSync("./app/emails/decouverteEmail.html", "utf8");
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
          alert('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
          alert('E-mail envoyé avec succès:', info.response);
        }
      });
}

async function sendEmailTest(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);

    const myHTML = fs.readFileSync("./app/emails/testEmail.html", "utf8");
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
          alert('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
          alert('E-mail envoyé avec succès:', info.response);
        }
      });
}

async function sendEmailStage(customerGroup) {
  const { customerEmail, customerLastName, customerFirstName } = customerGroup[0];
  const childFirstNames = customerGroup.map(child => child.childFirstName);
  const childLastNames = customerGroup.map(child => child.childLastName);

    const myHTML = fs.readFileSync("./app/emails/stageEmail.html", "utf8");
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
          alert('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
          console.log('E-mail envoyé avec succès:', info.response);
          alert('E-mail envoyé avec succès:', info.response);
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