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
            const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
            
            fs.createReadStream(inputPath, { encoding: 'utf8' })
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Images) {
                        const fileName = path.basename(row.Images);
                        const newImageUrl = imageUrlMap.get(fileName);
                        if (newImageUrl) {
                            row.Images = newImageUrl;
                        }
                    }
                    results.push(row);
                })
                .on('end', () => {
                    const headers = Object.keys(results[0]);
                    writeStream.write(headers.join(',') + '\n');
                    
                    results.forEach(row => {
                        const values = headers.map(header => {
                            const value = row[header] || '';
                            if (value.includes(',') || value.includes('"')) {
                                return `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        });
                        writeStream.write(values.join(',') + '\n');
                    });
                    
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