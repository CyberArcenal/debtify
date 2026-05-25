//@ts-check
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFGenerator {
  /**
     * @param {{ [s: string]: any; } | ArrayLike<any>} agreementData
     * @param {string} outputPath
     */
  async generateLoanAgreement(agreementData, outputPath) {
    const templatePath = path.join(__dirname, '../templates/loan_agreement.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(agreementData)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(template);
    await page.pdf({ path: outputPath, format: 'A4' });
    await browser.close();
    return outputPath;
  }
}
module.exports = new PDFGenerator();