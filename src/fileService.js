const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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
            const writeStream = fs.createWriteStream(outputPath);
            let headers = null;
            
            fs.createReadStream(inputPath)
                .pipe(csv())
                .on('data', (row) => {
                    if (!headers) {
                        headers = Object.keys(row);
                        writeStream.write(headers.join(',') + '\n');
                    }
                    
                    const imageUrl = row.Images;
                    if (imageUrl) {
                        const fileName = path.basename(imageUrl);
                        row.Images = imageUrlMap.get(fileName) || imageUrl;
                    }
                    
                    results.push(row);
                    writeStream.write(headers.map(header => row[header]).join(',') + '\n');
                })
                .on('end', () => {
                    writeStream.end();
                    resolve(results);
                })
                .on('error', (error) => {
                    writeStream.end();
                    reject(error);
                });
        });
    }

    getLocalImagePath(imageName) {
        return path.join(__dirname, '..', 'images', imageName);
    }
}

module.exports = FileService; 