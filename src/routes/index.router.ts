import { Express } from 'express';
import fitbitRouter from './fitbit.router.js';
import noderedRouter from './nodered.router.js';
import uiRouter from './ui.router.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export function setupRoutes(app: Express) {
    
    app.get("/map",(req,res)=>{
     res.sendFile(join(__dirname,'..', 'map', 'index.html'));

    })

    app.use('/fitbit', fitbitRouter);

    app.use('/nr',noderedRouter);

    app.use('/ui',uiRouter);

  

    

    //default non found route
    app.use((req, res) => {
        res.status(404).json({ message: 'Not found' });
    });
}