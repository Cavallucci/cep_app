const stageModule = require('./stage');
const docx = require('docx');

function customerFillList(groupedData) {
    const t_customers = [];

    for (let i = 0; i < groupedData.length; i++) {
        const customerData = groupedData[i];
        let existingCustomer = t_customers.find((t_customer) => t_customer.childId === customerData[18]);

        if (existingCustomer) {
            if (customerData[7] && customerData[7].startsWith('STA')) {
                existingCustomer.sta.push(customerData[8]);
                existingCustomer.dateStage.push(customerData[7]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                existingCustomer.tk.push(customerData[8]);
            }
            existingCustomer.courses.push(customerData[8]);
            existingCustomer.sku.push(customerData[7]);
        } else {
            const newCustomer = {
                childId: customerData[18],
                childFirstName: customerData[19],
                childLastName: customerData[20],
                customerId: customerData[4],
                customerFirstName: customerData[5],
                customerLastName: customerData[6],
                customerEmail: customerData[27],
                courses: [customerData[8]],
                sku: [customerData[7]],
                dateStage: [],
                sta: [],
                tk: [],
            };
            if (customerData[7] && customerData[7].startsWith('STA')) {
                newCustomer.sta.push(customerData[8]);
                newCustomer.dateStage.push(customerData[7]);
            }
            else if (customerData[7] && customerData[7].startsWith('TK')) {
                newCustomer.tk.push(customerData[8]);
            }
            t_customers.push(newCustomer);
        }
    }
    const customerWithSTA = t_customers.filter((customer) => {
        const hasSTASKU = customer.sku.some((sku) => sku && sku.startsWith('STA'));
        return hasSTASKU;
    });

    const customerWithDate = findMatchingDate(customerWithSTA); 

    return customerWithDate;
}

function findMatchingDate(customersWithSTA) {
    const customersWithoutMatch = [];
    let today = new Date();

    for (const customer of customersWithSTA) { //STA_TOUSS22_24OCT_018_2022
        for (const date of customer.dateStage) {
            completeDateSTA = stageModule.replaceDateStage(date);
            customer.dateStage = completeDateSTA;
            if (completeDateSTA > today) {
                customersWithoutMatch.push(customer);
                break;
            }
        }
    }
    return customersWithoutMatch;
}

function fillAccueilDoc(workbook, stageList, sortedData) {
    // Ajouter le titre
    const title = new docx.Paragraph({
      children: [
        new docx.TextRun({
          text: 'Titre : STAGES du 17 au 21 juillet 23',
          bold: true,
          size: 28,
        }),
      ],
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    });

    workbook.addSection({
        children: [title]
      })
    //workbook.addParagraph(title);
  
    // Ajouter le tableau avec les noms et prénoms
    // const table = new docx.Table({
    //   rows: [
    //     new docx.TableRow({
    //       children: [
    //         new docx.TableCell({
    //           children: [new docx.Paragraph('Non réglé ou à checker')],
    //         }),
    //       ],
    //     }),
    //     ...stageList.map(person => {
    //       return new docx.TableRow({
    //         children: [
    //           new docx.TableCell({
    //             children: [new docx.Paragraph(person.firstName)],
    //           }),
    //           new docx.TableCell({
    //             children: [new docx.Paragraph(person.lastName)],
    //           }),
    //         ],
    //       });
    //     }),
    //   ],
    // });
  
    //workbook.addTable(table);
  }
  

module.exports = {
    customerFillList,
    fillAccueilDoc
  };