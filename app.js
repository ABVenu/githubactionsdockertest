// const cron = require('node-cron');

// cron.schedule('*/30 * * * * *', () => {
//   console.log('running a task every 30 seconds');
// });

const PDFDocument = require('pdfkit');
const fs = require('fs');
const report = `This is sample report
created for testing`
// Create a document
const doc = new PDFDocument();

// Pipe its output somewhere, like to a file or HTTP response
// See below for browser usage
doc.pipe(fs.createWriteStream('./reports/output.pdf'));

// Embed a font, set the font size, and render some text
doc.fontSize(25).text(report, 100, 100);

// Add another page


// Finalize PDF file
doc.end();