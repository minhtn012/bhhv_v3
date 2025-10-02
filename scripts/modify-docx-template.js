/**
 * DOCX Template Modifier
 *
 * This script safely adds new variables to Word templates by directly
 * manipulating the XML content inside the .docx files.
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Create a Word XML text node
 */
function createTextNode(text) {
  return `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

/**
 * Create a Word paragraph with text
 */
function createParagraph(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr>${createTextNode(text)}</w:p>`;
}

/**
 * Modify a single template file
 */
function modifyTemplate(filename, additionsFn) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 Processing: ${filename}`);
  console.log('='.repeat(70));

  const templatePath = path.join(TEMPLATES_DIR, filename);
  const backupPath = path.join(TEMPLATES_DIR, `${filename}.backup-${Date.now()}`);

  try {
    // Create backup
    fs.copyFileSync(templatePath, backupPath);
    console.log(`✓ Backup created: ${path.basename(backupPath)}`);

    // Read the .docx file (it's a ZIP archive)
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Get the main document XML
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) {
      throw new Error('Could not find word/document.xml in template');
    }

    let xmlContent = documentXml.asText();

    // Apply modifications
    const result = additionsFn(xmlContent, filename);

    if (result.modified) {
      // Update the XML in the archive
      zip.file('word/document.xml', result.xml);

      // Generate the new .docx file
      const newBuffer = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      // Write the modified file
      fs.writeFileSync(templatePath, newBuffer);

      console.log(`✅ Successfully modified ${filename}`);
      result.changes.forEach(change => console.log(`   ✓ ${change}`));

      return true;
    } else {
      console.log(`ℹ️  No modifications needed for ${filename}`);
      // Remove backup if no changes were made
      fs.unlinkSync(backupPath);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`   Backup preserved at: ${path.basename(backupPath)}`);
    return false;
  }
}

/**
 * Add variables to 2ben_vcx.docx
 */
function modify2benVcx(xml, filename) {
  const changes = [];
  let modified = false;

  // Check if variables already exist
  if (xml.includes('{ngayBatDauBaoHiem}') &&
      xml.includes('{ngayKetThucBaoHiem}') &&
      xml.includes('{paymentDeadline}')) {
    return { modified: false, xml, changes };
  }

  // Strategy: Add after {dkbs} section
  // Find the {dkbs} placeholder and add new content after it
  const dkbsPattern = /(<w:t[^>]*>\{dkbs\}<\/w:t>)/;

  if (dkbsPattern.test(xml)) {
    const insertionText = `$1<w:p><w:pPr/><w:r><w:t xml:space="preserve">

Thời hạn bảo hiểm:
Từ: </w:t></w:r><w:r><w:t>{ngayBatDauBaoHiem}</w:t></w:r><w:r><w:t xml:space="preserve">
Đến: </w:t></w:r><w:r><w:t>{ngayKetThucBaoHiem}</w:t></w:r></w:p><w:p><w:pPr/><w:r><w:t xml:space="preserve">

Phí bảo hiểm tự nguyện: thanh toán trước và không muộn hơn ngày </w:t></w:r><w:r><w:t>{paymentDeadline}</w:t></w:r></w:p>`;

    xml = xml.replace(dkbsPattern, insertionText);
    modified = true;
    changes.push('Added ngayBatDauBaoHiem after DKBS');
    changes.push('Added ngayKetThucBaoHiem after DKBS');
    changes.push('Added paymentDeadline after DKBS');
  }

  return { modified, xml, changes };
}

/**
 * Add variables to 2ben_vcx_tnns.docx (same as 2ben_vcx)
 */
function modify2benVcxTnns(xml, filename) {
  return modify2benVcx(xml, filename); // Same logic
}

/**
 * Add variables to 3ben.docx
 */
function modify3ben(xml, filename) {
  const changes = [];
  let modified = false;

  // Check if variables already exist
  if (xml.includes('{dkbs}') &&
      xml.includes('{ngayBatDauBaoHiem}') &&
      xml.includes('{ngayKetThucBaoHiem}') &&
      xml.includes('{paymentDeadline}')) {
    return { modified: false, xml, changes };
  }

  // Strategy: Add after {mucKhauTru}
  const mucKhauTruPattern = /(<w:t[^>]*>\{mucKhauTru\}<\/w:t>)/;

  if (mucKhauTruPattern.test(xml)) {
    const insertionText = `$1<w:p><w:pPr/><w:r><w:t xml:space="preserve">

Điều kiện bảo hiểm:
</w:t></w:r><w:r><w:t>{dkbs}</w:t></w:r></w:p><w:p><w:pPr/><w:r><w:t xml:space="preserve">

Thời hạn bảo hiểm:
Từ: </w:t></w:r><w:r><w:t>{ngayBatDauBaoHiem}</w:t></w:r><w:r><w:t xml:space="preserve">
Đến: </w:t></w:r><w:r><w:t>{ngayKetThucBaoHiem}</w:t></w:r></w:p><w:p><w:pPr/><w:r><w:t xml:space="preserve">

Phí bảo hiểm tự nguyện: thanh toán trước và không muộn hơn ngày </w:t></w:r><w:r><w:t>{paymentDeadline}</w:t></w:r></w:p>`;

    xml = xml.replace(mucKhauTruPattern, insertionText);
    modified = true;
    changes.push('Added dkbs after mucKhauTru');
    changes.push('Added ngayBatDauBaoHiem');
    changes.push('Added ngayKetThucBaoHiem');
    changes.push('Added paymentDeadline');
  }

  return { modified, xml, changes };
}

/**
 * Main function
 */
function main() {
  console.log('\n🔧 DOCX Template Modifier');
  console.log('This script will add new variables to your Word templates.\n');

  const templates = [
    { file: '2ben_vcx.docx', handler: modify2benVcx },
    { file: '2ben_vcx_tnns.docx', handler: modify2benVcxTnns },
    { file: '3ben.docx', handler: modify3ben }
  ];

  let totalModified = 0;

  templates.forEach(({ file, handler }) => {
    if (modifyTemplate(file, handler)) {
      totalModified++;
    }
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ Complete! Modified ${totalModified} template(s).`);
  console.log('='.repeat(70));
  console.log('\n📋 Next Steps:');
  console.log('1. Open templates in LibreOffice to verify the changes');
  console.log('2. If something looks wrong, restore from .backup files');
  console.log('3. Run: node scripts/inspect-templates.js to verify');
  console.log('4. Test by exporting a contract\n');
}

// Run
main();
