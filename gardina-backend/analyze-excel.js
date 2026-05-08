import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeExcelFile() {
  try {
    const filePath = '/Users/nurdauletakhmatov/Downloads/Склад товар.xlsx';

    console.log('📊 Analyzing Excel file:', filePath);
    console.log('='.repeat(80));

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);

    console.log('\n📋 Available sheets:', workbook.SheetNames.join(', '));
    console.log('='.repeat(80));

    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📄 Sheet ${index + 1}: "${sheetName}"`);
      console.log('-'.repeat(80));

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length === 0) {
        console.log('   ⚠️  Empty sheet');
        return;
      }

      // Show headers (first row)
      const headers = data[0];
      console.log('\n   📌 Columns (Headers):');
      headers.forEach((header, idx) => {
        console.log(`      ${idx + 1}. ${header}`);
      });

      // Show number of rows
      console.log(`\n   📊 Total rows (including header): ${data.length}`);
      console.log(`   📊 Data rows: ${data.length - 1}`);

      // Show first 3 data rows as examples
      console.log('\n   📝 Sample data (first 3 rows):');
      const sampleRows = data.slice(1, 4);
      sampleRows.forEach((row, idx) => {
        console.log(`\n      Row ${idx + 1}:`);
        headers.forEach((header, colIdx) => {
          const value = row[colIdx] || '(empty)';
          console.log(`         ${header}: ${value}`);
        });
      });

      // Convert to JSON for detailed analysis
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Analyze data types and unique values for each column
      console.log('\n   🔍 Column Analysis:');
      if (jsonData.length > 0) {
        const firstRow = jsonData[0];
        Object.keys(firstRow).forEach(key => {
          const values = jsonData.map(row => row[key]).filter(v => v !== undefined && v !== null && v !== '');
          const uniqueCount = new Set(values).size;
          const sampleValues = [...new Set(values)].slice(0, 5);

          console.log(`\n      "${key}":`);
          console.log(`         - Non-empty values: ${values.length}`);
          console.log(`         - Unique values: ${uniqueCount}`);
          console.log(`         - Sample values: ${sampleValues.join(', ')}`);
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error.message);
    console.error(error.stack);
  }
}

analyzeExcelFile();
