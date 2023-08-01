function fillCustomersList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.sku.push(customerData[7]);
        } else {
            const newCustomer = {
                childId: customerData[18],
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                courses: [customerData[8]],
                sku: [customerData[7]],
            };
            t_customers.push(newCustomer);
        }
    }
    const customersWithoutTKAndAdSKU = t_customers.filter((customer) => {
        const hasTKSKU = customer.sku.some((sku) => sku.startsWith('TK'));
        const hasAdSKU = customer.sku.some((sku) => sku.startsWith('Ad'));
        return hasTKSKU && !hasAdSKU;
    });

    return customersWithoutTKAndAdSKU;
}
  
function displayAdhesion(groupedData) {
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
        label.textContent = `L'enfant ${t_customers[i].childId} n'a pas pris son adhésion pour les cours suivants : ${t_customers[i].courses}`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
}

module.exports = {
    displayAdhesion,
    fillCustomersList
  };