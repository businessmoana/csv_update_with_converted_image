const { Storage } = require('@google-cloud/storage');
const path = require('path');

class GCSService {
    constructor(bucketName, projectId, keyFilePath) {
        this.storage = new Storage({
            projectId,
            keyFilename: keyFilePath
        });
        this.bucket = this.storage.bucket(bucketName);
    }

    async uploadImage(localFilePath, destinationFileName) {
        try {
            const options = {
                destination: destinationFileName,
                metadata: {
                    cacheControl: 'no-cache'
                },
            };

            await this.bucket.upload(localFilePath, options);
            return destinationFileName;
        } catch (error) {
            console.error(`Error uploading file ${localFilePath}:`, error);
            throw error;
        }
    }

    async getSignedUrl(fileName, expiresInMinutes = 15) {
        const options = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresInMinutes * 60 * 1000,
        };

        const [url] = await this.bucket
            .file(fileName)
            .getSignedUrl(options);
            
        return url;
    }
}

module.exports = GCSService;