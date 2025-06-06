# CSV Update with Converted Image

A Node.js tool that processes CSV files containing product data, updates image URLs, and uploads images to Google Cloud Storage.

## Features

- Automatically processes all CSV and Excel files in their respective directories
- Processes CSV files containing product data and image URLs
- Reads image name mappings from Excel files
- Uploads local images to Google Cloud Storage
- Generates public URLs for uploaded images
- Updates CSV files with new image URLs
- Provides detailed logging and error handling

## Prerequisites

- Node.js v16 or higher
- Google Cloud Platform account with Storage API enabled
- Service account key file with Storage permissions

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   GCS_BUCKET_NAME=your-bucket-name
   GCS_PROJECT_ID=your-project-id
   GCS_KEY_FILE_PATH=./gcs-key.json
   ```

## Project Structure

```
.
├── src/
│   ├── index.js           # Main application file
│   ├── gcsService.js      # Google Cloud Storage service
│   └── fileService.js     # File processing service
├── csv/                   # Directory for CSV files
├── excel/                 # Directory for Excel mapping files
├── images/               # Local images directory
├── package.json
└── README.md
```

## Input Files

### CSV Files
Place any number of CSV files in the `csv` directory. Each file must contain at least these columns:
- ID: Product identifier
- Images: Current image URL

### Excel Files
Place any number of Excel files in the `excel` directory. Each file must contain these columns:
- Image Name: Original filename
- Translated Image Name: Corresponding filename in the images folder

### Images Folder
Contains image files with names matching the "Translated Image Name" from the Excel files.

## Usage

1. Place your files in the appropriate directories:
   - Put your CSV files in the `csv` directory
   - Put your Excel mapping files in the `excel` directory
   - Put your images in the `images` directory

2. Run the application:
   ```bash
   npm start
   ```

3. The application will:
   - Find all CSV files in the `csv` directory
   - Find all Excel files in the `excel` directory
   - Process each CSV file with each Excel file
   - Generate output files named `output_<original-filename>.csv` in the `csv` directory

## Processing Details

- The application processes each CSV file with each Excel file found in their respective directories
- For each successful processing, a new output CSV file is created
- The application provides a summary of successful and failed processing attempts
- If an image is not found in the `images` directory, the process continues with a warning

## Error Handling

The application includes comprehensive error handling:
- Validates required environment variables
- Checks for missing or invalid files
- Logs detailed error messages
- Continues processing even if some images are missing
- Provides a summary of successful and failed operations

## License

MIT 