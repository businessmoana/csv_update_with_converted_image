const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

class FileService {
    constructor() {
        this.imageMapping = new Map();
    }

    async loadExcelMapping(excelPath) {
        try {
            const workbook = XLSX.readFile(excelPath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            data.forEach(row => {
                const originalName = row['Image Name'];
                const translatedName = row['Converted Image Name'];
                if (originalName && translatedName) {
                    this.imageMapping.set(originalName, translatedName);
                }
            });

            return this.imageMapping;
        } catch (error) {
            console.error('Error loading Excel mapping:', error);
            throw error;
        }
    }

    async processCSV(inputPath, outputPath, imageUrlMap) {
        return new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream(inputPath, { encoding: 'utf-8' })
                .pipe(csv())
                .on('data', (row) => {
                    const imageUrl = row.Images;
                    if (imageUrl) {
                        const fileName = path.basename(imageUrl);
                        row.Images = imageUrlMap.get(fileName) || imageUrl;
                    }
                    results.push(row);
                })
                .on('end', async () => {
                    try {
                        const headers = Object.keys(results[0]);
                        const csvWriter = createObjectCsvWriter({
                            path: outputPath,
                            header: headers.map(header => ({ id: header, title: header })),
                            encoding: 'utf-8'
                        });

                        await csvWriter.writeRecords(results);
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    getLocalImagePath(imageName) {
        return path.join(__dirname, '..', 'images', imageName);
    }
}

module.exports = FileService; 