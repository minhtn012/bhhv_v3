/**
 * Template Inspection Script
 *
 * This script extracts and displays the content and variables from Word template files.
 * It helps identify what placeholders are currently being used and where to add new ones.
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

const templateFiles = [
  '2ben_vcx.docx',
  '2ben_vcx_tnns.docx',
  '3ben.docx'
];

/**
 * Extract variables/placeholders from template content
 */
function extractVariables(content) {
  const variableRegex = /\{([^}]+)\}/g;
  const matches = content.matchAll(variableRegex);
  const variables = new Set();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables).sort();
}

/**
 * Inspect a single template file
 */
function inspectTemplate(filename) {
  console.log('\n' + '='.repeat(80));
  console.log(`📄 Template: ${filename}`);
  console.log('='.repeat(80));

  try {
    const templatePath = path.join(TEMPLATES_DIR, filename);

    if (!fs.existsSync(templatePath)) {
      console.log(`❌ File not found: ${templatePath}`);
      return;
    }

    // Read the .docx file
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Extract document.xml which contains the main content
    const documentXml = zip.file('word/document.xml');

    if (!documentXml) {
      console.log('❌ Could not find document.xml in the template');
      return;
    }

    const xmlContent = documentXml.asText();

    // Extract all variables
    const variables = extractVariables(xmlContent);

    console.log(`\n📊 Found ${variables.length} unique variables:\n`);

    if (variables.length === 0) {
      console.log('   No variables found (or they might be split across XML tags)');
    } else {
      variables.forEach((variable, index) => {
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. {${variable}}`);
      });
    }

    // Check for new variables we want to add
    console.log('\n✅ New Variables Status:');
    const newVariables = ['dkbs', 'ngayBatDauBaoHiem', 'ngayKetThucBaoHiem', 'paymentDeadline'];

    newVariables.forEach(varName => {
      const exists = variables.includes(varName);
      const status = exists ? '✓ Already exists' : '✗ Need to add';
      console.log(`   {${varName.padEnd(25, ' ')}} ${status}`);
    });

    // Save extracted XML for manual inspection if needed
    const outputPath = path.join(TEMPLATES_DIR, `${filename}.extracted.xml`);
    fs.writeFileSync(outputPath, xmlContent, 'utf-8');
    console.log(`\n💾 Full XML saved to: ${path.basename(outputPath)}`);

  } catch (error) {
    console.error(`❌ Error inspecting template: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  console.log('\n🔍 Word Template Inspector');
  console.log('This tool helps you understand what variables are currently in your templates.\n');

  templateFiles.forEach(inspectTemplate);

  console.log('\n' + '='.repeat(80));
  console.log('📝 Next Steps:');
  console.log('='.repeat(80));
  console.log(`
1. Open each template file in Microsoft Word or LibreOffice Writer
2. Add the missing variables where needed:

   For DKBS (Insurance Conditions):
   {dkbs}

   For Insurance Period:
   Từ: {ngayBatDauBaoHiem}
   Đến: {ngayKetThucBaoHiem}

   For Payment Deadline:
   Phí bảo hiểm tự nguyện: thanh toán trước và không muộn hơn ngày {paymentDeadline}

3. Save the template files
4. Test by exporting a contract to Word

Note: Make sure variables are typed as plain text without any formatting
breaks, or Word might split them across XML tags.
`);
}

// Run the script
main();
