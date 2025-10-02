/**
 * Automatic Template Variable Adder
 *
 * This script automatically adds the new variables to Word templates by:
 * 1. Extracting the .docx file (which is a ZIP archive)
 * 2. Modifying the document.xml to add new variables
 * 3. Rebuilding the .docx file
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Add variables to template by finding and replacing content
 */
function addVariablesToTemplate(filename, modifications) {
  console.log(`\n📝 Processing: ${filename}`);
  console.log('-'.repeat(60));

  try {
    const templatePath = path.join(TEMPLATES_DIR, filename);
    const backupPath = path.join(TEMPLATES_DIR, `${filename}.backup`);

    // Create backup
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(templatePath, backupPath);
      console.log(`✓ Backup created: ${filename}.backup`);
    }

    // Read the .docx file
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Get document.xml
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) {
      throw new Error('Could not find document.xml');
    }

    let xmlContent = documentXml.asText();
    let modified = false;

    // Apply each modification
    modifications.forEach(({ searchText, replacement, description }) => {
      if (xmlContent.includes(searchText)) {
        xmlContent = xmlContent.replace(searchText, replacement);
        console.log(`✓ Added: ${description}`);
        modified = true;
      } else {
        console.log(`⚠ Not found: "${searchText}" - ${description}`);
      }
    });

    if (modified) {
      // Update the XML in the zip
      zip.file('word/document.xml', xmlContent);

      // Generate new .docx
      const newBuffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Write the modified template
      fs.writeFileSync(templatePath, newBuffer);
      console.log(`✅ Template updated successfully!`);
    } else {
      console.log(`ℹ No modifications made - search text not found`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filename}: ${error.message}`);
  }
}

/**
 * Smart search and replace in XML
 * This handles the case where Word might split text across multiple tags
 */
function addVariableToXml(xmlContent, marker, newVariable) {
  // Try to find the marker text and add the variable after it
  // This is a simplified approach - you might need to adjust based on actual XML structure

  const searchPattern = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

  if (searchPattern.test(xmlContent)) {
    return xmlContent.replace(searchPattern, (match) => {
      return match + '\n' + newVariable;
    });
  }

  return xmlContent;
}

/**
 * Main function
 */
function main() {
  console.log('\n🔧 Automatic Template Variable Adder');
  console.log('='.repeat(60));

  // Modifications for 2ben_vcx.docx
  console.log('\n📄 Template: 2ben_vcx.docx');
  const modifications2benVcx = [
    {
      searchText: '{dkbs}',
      replacement: '{dkbs}\n\nThời hạn bảo hiểm:\nTừ: {ngayBatDauBaoHiem}\nĐến: {ngayKetThucBaoHiem}\n\nPhí bảo hiểm tự nguyện: thanh toán trước và không muộn hơn ngày {paymentDeadline}',
      description: 'Insurance period and payment deadline after DKBS'
    }
  ];

  // Modifications for 2ben_vcx_tnns.docx
  console.log('\n📄 Template: 2ben_vcx_tnns.docx');
  const modifications2benVcxTnns = [
    {
      searchText: '{dkbs}',
      replacement: '{dkbs}\n\nThời hạn bảo hiểm:\nTừ: {ngayBatDauBaoHiem}\nĐến: {ngayKetThucBaoHiem}\n\nPhí bảo hiểm tự nguyện: thanh toán trước và không muộn hơn ngày {paymentDeadline}',
      description: 'Insurance period and payment deadline after DKBS'
    }
  ];

  // Modifications for 3ben.docx
  console.log('\n📄 Template: 3ben.docx');
  const modifications3ben = [
    {
      searchText: '{mucKhauTru}',
      replacement: '{mucKhauTru}\n\nĐiều kiện bảo hiểm:\n{dkbs}\n\nThời hạn bảo hiểm:\nTừ: {ngayBatDauBaoHiem}\nĐến: {ngayKetThucBaoHiem}\n\nPhí bảo hiểm tự nguyện: thanh toán trước và không muộn hơn ngày {paymentDeadline}',
      description: 'DKBS, insurance period and payment deadline after deductible'
    }
  ];

  console.log('\n⚠️  NOTE: This is a simple text replacement.');
  console.log('If the search text is not found, you may need to add variables manually.');
  console.log('\nBackups will be created as .backup files.\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to proceed? (yes/no): ', (answer) => {
    readline.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Operation cancelled.');
      return;
    }

    console.log('\n🚀 Starting modifications...\n');

    // Process each template
    addVariablesToTemplate('2ben_vcx.docx', modifications2benVcx);
    addVariablesToTemplate('2ben_vcx_tnns.docx', modifications2benVcxTnns);
    addVariablesToTemplate('3ben.docx', modifications3ben);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Done!');
    console.log('\n📋 Next steps:');
    console.log('1. Open templates in LibreOffice to verify changes');
    console.log('2. If changes look wrong, restore from .backup files');
    console.log('3. Test by exporting a contract to Word');
    console.log('='.repeat(60) + '\n');
  });
}

// Run the script
main();
