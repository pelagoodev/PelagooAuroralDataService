# FILE: README.md

# Pelagoo Auroral Data Sercice

This project is a Node.js application built with TypeScript, Express, and Mongoose. It serves as a data service for handling requests and processing data.

## Project Structure

- **src/app.ts**: Entry point of the application. Sets up the Express app, middleware, MongoDB connection, and routes.
- **src/controllers/index.ts**: Contains controller functions for handling requests.
- **src/models/fit.model.ts**: Defines the Mongoose model for the "fit" timeseries collection, including TypeScript types.
- **src/routes/index.ts**: Defines the application routes and uses controller functions to handle requests.
- **src/types/index.ts**: Exports TypeScript types and interfaces used throughout the application.
- **nodemon.json**: Configures Nodemon to watch for changes in TypeScript files and automatically restart the server.
- **package.json**: Configuration file for npm, listing dependencies, scripts, and metadata.
- **tsconfig.json**: TypeScript configuration file specifying compiler options and files to include.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd my-nodejs-project
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=<your-mongodb-uri>
   ```

5. Start the application using Nodemon:
   ```
   npm run dev
   ```

## Usage

The application listens for incoming requests on the specified port (default: 3002). You can access the API documentation at `/api-docs`.

## License

This project is licensed under the MIT License.