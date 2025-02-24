// src/app.ts

import express, { Request } from 'express';
import { setupRoutes } from './routes/index.router.js';
import * as net from 'net';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processTeltonikaData } from './services/teltonikaProcessor.service.js';
import { cronFitSchedule, getDirectlyFit,  } from './services/fitCron.service.js';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

declare module 'http' {
    interface IncomingMessage {
        rawBody?: string | Buffer;
    }
}
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());

app.use(express.static(join(__dirname, 'map')));

dotenv.config();
//connect to mongoose
try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "");
    console.log('--------- Connected to MongoDB ---------');

    db.connection.on('error', (error) => {
        console.error('MongoDB error:', error);
    })
    db.connection.on('disconnected', () => {
        console.error('MongoDB disconnected');
    })
} catch (error) {
    console.error('Error connecting to MongoDB:', error);
}



app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    },
}));

// Middleware to parse URL-encoded data and capture raw body
app.use(express.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    },
}));

// Middleware to parse raw data and capture raw body
app.use(express.raw({
    type: '*/*',
    verify: (req, res, buf) => {
        req.rawBody = buf; // Buffer
    },
}));

// Middleware to parse text data and capture raw body
app.use(express.text({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    },
}));

// Custom middleware to log the request
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Raw Body:', req.rawBody);
    next();
});

// Path to your swagger.yaml file
const swaggerPath = join(__dirname, '..', 'swagger.yaml');
const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
const swaggerDocument = yaml.load(swaggerFile);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument as any,{ customSiteTitle: 'Auroral Pelagoo Data Service API' }));

// Setup routes
setupRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}).on("request", (req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    req.on('data', chunk => {
        console.log('Data:', chunk.toString());
    }

    )
    // Log the request body



});

//create tcp socket server
const tcpServer = net.createServer(socket => {
    processTeltonikaData(socket);
});

tcpServer.listen(5321, () => {
    console.log('TCP Server listening on port 5321');
});

const scheduleFit = cronFitSchedule();






// getDirectlyFit();
// 

