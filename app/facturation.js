function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.customerId === customerData[4]);

        if (existingCustomer) {
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.totalRestantDu += customerData[3];
        } else {
            const newCustomer = {
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                totalRestantDu: customerData[3],
                courses: [customerData[8]]
            };
        if (newCustomer.totalRestantDu > 0)
            t_customers.push(newCustomer);
        }
    }
    return t_customers;
}
  
function displayFacturation(groupedData) {
    const container = document.getElementById('displayContainer');
    container.innerHTML = ''; // Reset the content of the container

    const t_customers = fillCustomersList(groupedData);

    for (let i = 0; i < t_customers.length; i++) {
        const customerInfo = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `customerCheckbox_${t_customers[i].customerId}`; // Unique ID for each checkbox
        customerInfo.appendChild(checkbox);

        const label = document.createElement('label');
        label.textContent = `Le customer ${t_customers[i].customerFirstName} ${t_customers[i].customerLastName} numéro ${t_customers[i].customerId} a un total de ${t_customers[i].totalRestantDu}€ restant du pour les cours suivants : ${t_customers[i].courses}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
}

module.exports = {
    displayFacturation,
    fillCustomersList
  };