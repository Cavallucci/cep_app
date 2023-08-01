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
        const hasCDDSKU = customer.sku.some((sku) => sku.startsWith('CDD'));
        return !hasTKSKU && hasCDDSKU;
    });

    return customersWithoutTKAndAdSKU;
}
  
function displayStage(groupedData) {
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
        label.textContent = `L'enfant ${t_customers[i].childId} a fait un cours de découverte : ${t_customers[i].courses}, mais ne s'est pas inscrit à l'année`;
        customerInfo.appendChild(label);

        container.appendChild(customerInfo);
    }
}

module.exports = {
    displayStage,
    fillCustomersList
  };