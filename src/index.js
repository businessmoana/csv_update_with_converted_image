require('dotenv').config();
const path = require('path');
const fs = require('fs');
const GCSService = require('./gcsService');
const FileService = require('./fileService');

const outDir = path.join(__dirname, '..', 'result');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function findFiles() {
    const csvDir = path.join(__dirname, '..', 'csv');
    const excelDir = path.join(__dirname, '..', 'excel');
    // Find all CSV files
    const csvFiles = fs.readdirSync(csvDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(csvDir, file));

    // Find all Excel files
    const excelFiles = fs.readdirSync(excelDir)
        .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
        .map(file => path.join(excelDir, file));

    if (csvFiles.length === 0) {
        throw new Error('No CSV files found in the csv directory');
    }
    if (excelFiles.length === 0) {
        throw new Error('No Excel files found in the excel directory');
    }

    return {
        csvFiles,
        excelFiles
    };
}

async function processFilePair(csvPath, excelPath, gcsService, fileService) {
    try {
        const csvFileName = path.basename(csvPath, '.csv');
        const outputPath = path.join(outDir, `${csvFileName}.csv`);

        console.log(`\nProcessing files:`);
        console.log(`CSV: ${csvFileName}`);
        console.log(`Excel: ${path.basename(excelPath)}`);

        // Load Excel mapping
        console.log('Loading Excel mapping...');
        const imageMapping = await fileService.loadExcelMapping(excelPath);
        console.log(`Loaded ${imageMapping.size} image mappings`);

        // Upload images and create URL mapping
        console.log('Uploading images to GCS...');
        const imageUrlMap = new Map();
        for (const [originalName, translatedName] of imageMapping.entries()) {
            const localPath = fileService.getLocalImagePath(translatedName);
            if (fs.existsSync(localPath)) {
                const fileName  = await gcsService.uploadImage(localPath, translatedName);
                const tempUrl = await gcsService.getSignedUrl(fileName, 60);
                imageUrlMap.set(originalName, tempUrl);
                console.log(`Uploaded ${translatedName} -> ${tempUrl}`);
            } else {
                console.warn(`Warning: Local image not found for ${translatedName}`);
            }
        }

        // Process CSV
        console.log('Processing CSV file...');
        const results = await fileService.processCSV(csvPath, outputPath, imageUrlMap);
        console.log(`Processed ${results.length} rows`);
        console.log(`Output saved to: ${outputPath}`);

        return true;
    } catch (error) {
        console.error(`Error processing files:`, error);
        return false;
    }
}
async function main() {
    try {
        // Configuration
        const config = {
            bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilePath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            imagesDir: path.join(__dirname, '..', 'images')
        };

        // Initialize services
        const gcsService = new GCSService(config.bucketName, config.projectId, config.keyFilePath);
        const fileService = new FileService();

        // Find all CSV and Excel files
        const { csvFiles, excelFiles } = await findFiles();
        console.log(`Found ${csvFiles.length} CSV files and ${excelFiles.length} Excel files`);

        // Process each CSV file with each Excel file
        let successCount = 0;
        let failureCount = 0;

        for (const csvFile of csvFiles) {
            for (const excelFile of excelFiles) {
                const success = await processFilePair(csvFile, excelFile, gcsService, fileService);
                if (success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            }
        }

        console.log('\nProcessing Summary:');
        console.log(`Successfully processed: ${successCount} file pairs`);
        console.log(`Failed to process: ${failureCount} file pairs`);

    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Check for required environment variables
const requiredEnvVars = ['GOOGLE_CLOUD_BUCKET_NAME', 'GOOGLE_CLOUD_PROJECT_ID', 'GOOGLE_APPLICATION_CREDENTIALS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please set these variables in your environment or .env file');
    process.exit(1);
}

main(); 