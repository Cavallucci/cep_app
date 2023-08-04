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
                const customer = t_customers.find((customer) => customer.childId === customerId);
                console.log('Customer info :', customer);
            }
        });
    });
}

function sendEmailFacturation(customer) {
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

function sendEmailAdhesion(customer) {
    const myHTML = fs.readFileSync("./app/emails/adhesionEmail.html", "utf8");
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

module.exports = {
    setupCheckboxListeners,
    sendEmailFacturation,
    sendEmailAdhesion
  };