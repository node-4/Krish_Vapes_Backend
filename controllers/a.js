
// exports.placeOrder1 = async (req, res) => {
//         try {
//                 let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId })
//                 if (findUserOrder) {
//                         let attachments = [], items = [], orderId = findUserOrder.orderId
//                         for (let i = 0; i < findUserOrder.Orders.length; i++) {
//                                 let findu = await order.findOne({ _id: findUserOrder.Orders[i]._id }).populate('userId categoryId subcategoryId productId productColorId');
//                                 let obj = {
//                                         product: findu.productId.name,
//                                         description: findu.productId.description,
//                                         ProductColor: findu.productColorId.color,
//                                         productSize: findu.productSize,
//                                         productPrice: findu.productPrice,
//                                         quantity: findu.quantity,
//                                         tax: findu.tax,
//                                         totalTax: findu.totalTax,
//                                         paidAmount: findu.paidAmount
//                                 }
//                                 items.push(obj)
//                         }
//                         let invoice = {
//                                 shipping: {
//                                         address: findUserOrder.address.address,
//                                         addressComplement: findUserOrder.addressComplement,
//                                         city: findUserOrder.city,
//                                         pincode: findUserOrder.pincode,
//                                         country: findUserOrder.country
//                                 },
//                                 items: items,
//                                 totalTax: findUserOrder.tax,
//                                 subtotal: findUserOrder.total,
//                                 paid: findUserOrder.paidAmount,
//                                 invoice_nr: orderId,
//                         };
//                         await generateInvoiceTable(doc1, invoice)
//                         await generateCustomerInformation(doc1, invoice)
//                         await generateHeader(doc1)
//                         await generateFooter(doc1)
//                         function generateCustomerInformation(doc, invoice) {
//                                 const shipping = invoice.shipping;
//                                 doc.text(`Invoice Number: ${invoice.invoice_nr}`, 50, 200)
//                                         .text(`Invoice Date: ${new Date()}`, 50, 215)
//                                         .text(`Tax: ${invoice.totalTax}`, 50, 130)
//                                         .text(`Sub Total Due: ${invoice.subtotal}`, 50, 130)
//                                         .text(`Total: ${invoice.paid}`, 50, 130)
//                                         .text(shipping.name, 400, 200)
//                                         .text(shipping.address, 400, 215)
//                                         .text(`${shipping.city}, ${shipping.country} (${shipping.pincode})`, 300, 130,)
//                                         .moveDown();
//                         }
//                         function generateTableRow(doc, y, c1, c2, c3, c4, c5) {
//                                 doc.fontSize(10)
//                                         .text(c1, 50, y)
//                                         .text(c2, 150, y)
//                                         .text(c3, 280, y, { width: 90, align: 'right' })
//                                         .text(c4, 370, y, { width: 90, align: 'right' })
//                                         .text(c5, 0, y, { align: 'right' });
//                         }
//                         function generateInvoiceTable(doc, invoice) {
//                                 let i, invoiceTableTop = 330;
//                                 for (i = 0; i < invoice.items.length; i++) {
//                                         const item = invoice.items[i];
//                                         const position = invoiceTableTop + (i + 1) * 30;
//                                         generateTableRow(
//                                                 doc,
//                                                 position,
//                                                 item.product,
//                                                 item.ProductColor,
//                                                 item.description,
//                                                 item.productSize,
//                                                 item.productPrice,
//                                                 item.quantity,
//                                                 item.tax,
//                                                 item.totalTax,
//                                                 item.paidAmount,
//                                         );
//                                 }
//                         }
//                         function generateHeader(doc) {
//                                 // doc.image('logo.png', 50, 45, { width: 50 })
//                                 doc.fillColor('#444444')
//                                         .fontSize(20)
//                                         .text('ACME Inc.', 110, 57)
//                                         .fontSize(10)
//                                         .text('123 Main Street', 200, 65, { align: 'right' })
//                                         .text('New York, NY, 10025', 200, 80, { align: 'right' })
//                                         .moveDown();
//                         }
//                         function generateFooter(doc) {
//                                 doc.fontSize(
//                                         10,
//                                 ).text(
//                                         'Payment is due within 15 days. Thank you for your business.',
//                                         50,
//                                         780,
//                                         { align: 'center', width: 500 },
//                                 );
//                         }

//                         const pdfBuffer = await new Promise((resolve) => {
//                                 const chunks = [];
//                                 doc1.on('data', (chunk) => chunks.push(chunk));
//                                 doc1.on('end', () => resolve(Buffer.concat(chunks)));
//                                 doc1.end();
//                         });
//                         let obj = {
//                                 filename: 'document.pdf',
//                                 content: pdfBuffer,
//                                 contentType: 'application/pdf',
//                         }
//                         console.log("1094==============", obj);
//                         attachments.push(obj)
//                         // }
//                         console.log("===========", attachments);
//                         var transporter = nodemailer.createTransport({
//                                 service: 'gmail',
//                                 auth: {
//                                         "user": "vcjagal1994@gmail.com",
//                                         "pass": "iyekdwwhkrthvklq"
//                                 }
//                         });
//                         const mailOptions = {
//                                 from: 'vcjagal1994@gmail.com',
//                                 to: 'vcjagal1994@gmail.com',
//                                 subject: 'PDF Attachment',
//                                 text: 'Please find the attached PDF.',
//                                 attachments: attachments,
//                         };
//                         transporter.sendMail(mailOptions, function (error, info) {
//                                 console.log("error in common====>", error, info)
//                                 if (error) {
//                                         callback(error, null)
//                                 } else {
//                                         res.status(200).json({ message: "Payment success.", status: 200, data: update });
//                                 }
//                         });
//                 } else {
//                         return res.status(404).json({ message: "No data found", data: {} });
//                 }
//         } catch (error) {
//                 console.log(error);
//                 res.status(501).send({ status: 501, message: "server error.", data: {}, });
//         }
// };
