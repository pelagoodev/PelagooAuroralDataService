import * as net from 'net';
import * as gpsBikeModel from '../models/gpsbike.model.js';

export async function processTeltonikaData(
    socket: net.Socket) {

    let imei = '';
    socket.on('data', async (data) => {


        //check if Imei exists in db
        try {


            if (data.length >= 2 && data[0] === 0x00 && data[1] === 0x0F) {
                console.log("IMEI:", data.toString('ascii', 2, 17));
                imei = data.toString('ascii', 2, 17);

                const bikeDoc = await gpsBikeModel.GPSBikeModel.findOne({ IMEI: imei });

                if (!bikeDoc) {
                    console.log('IMEI not found in db, saving to db');
                    console.log({ IMEI: imei, details: {} })
                    //save to db
                    gpsBikeModel.saveGPSBike({ IMEI: imei, details: {} });
                }

                // Send acknowledgment 0x01
                socket.write(Buffer.from([0x01]));
            } else if (data.length >= 8 &&
                data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x00 && data[3] === 0x00) {
                // Handle data
                socket.write(Buffer.from([data[9]]));
                const timestamp = data.subarray(10, 18);
                const hexTimestamp = timestamp.toString('hex');
                const timestampValue = parseInt(hexTimestamp, 16);
                const date = new Date(timestampValue);
                const gpsStart = 19; // Position after timestamp
                const gps = {
                    longitude: 0,
                    latitude: 0,
                    altitude: 0,
                    angle: 0,
                    satellites: 0,
                    speed: 0
                };

                // Extract longitude (4 bytes)
                const longBytes = data.subarray(gpsStart, gpsStart + 4);
                const longHex = longBytes.toString('hex');
                let longitude = parseInt(longHex, 16);
                if ((longitude & 0x80000000) !== 0) {
                    longitude = -(~longitude + 1);
                }
                gps.longitude = longitude / 10000000;

                // Extract latitude (4 bytes)
                const latBytes = data.subarray(gpsStart + 4, gpsStart + 8);
                const latHex = latBytes.toString('hex');
                let latitude = parseInt(latHex, 16);
                if ((latitude & 0x80000000) !== 0) {
                    latitude = -(~latitude + 1);
                }
                gps.latitude = latitude / 10000000;

                // Extract remaining elements
                gps.altitude = parseInt(data.subarray(gpsStart + 8, gpsStart + 10).toString('hex'), 16);
                gps.angle = parseInt(data.subarray(gpsStart + 10, gpsStart + 12).toString('hex'), 16);
                gps.satellites = data[gpsStart + 12];
                gps.speed = parseInt(data.subarray(gpsStart + 13, gpsStart + 15).toString('hex'), 16);

                const ioStart = gpsStart + 15;
                const totalElements = data[ioStart + 1]; // N
                const n1Elements = data[ioStart + 2]; // N1
                let currentPos = ioStart + 3; // Start of 1-byte elements

                const result = {
                    speed: 0,
                    batteryLevel: 0,
                    totalOdometer: 0,
                    GPS: { ...gps },
                    IMEI: imei,
                    timestamp: date
                };

                // Parse 1-byte elements
                for (let i = 0; i < n1Elements; i++) {
                    const ioId = data[currentPos];
                    const ioValue = data[currentPos + 1];
                    if (ioId === 113) { // Battery level
                        result.batteryLevel = ioValue;
                    }
                    currentPos += 2; // Move to next element (ID + value)
                }

                // Get N2 (2-byte elements)
                const n2Elements = data[currentPos];
                currentPos++;

                // Parse 2-byte elements
                for (let i = 0; i < n2Elements; i++) {
                    const ioId = data[currentPos];
                    if (ioId === 24) { // Speed
                        const speedHex = data.subarray(currentPos + 1, currentPos + 3).toString('hex');
                        result.speed = parseInt(speedHex, 16);
                    }
                    currentPos += 3; // Move to next element (ID + 2 value bytes)
                }

                // Get N4 (4-byte elements)
                const n4Elements = data[currentPos];
                currentPos++;

                // Parse 4-byte elements
                for (let i = 0; i < n4Elements; i++) {
                    const ioId = data[currentPos];
                    if (ioId === 16) { // Total Odometer
                        const odometerHex = data.subarray(currentPos + 1, currentPos + 5).toString('hex');
                        result.totalOdometer = parseInt(odometerHex, 16);
                    }
                    currentPos += 5; // Move to next element (ID + 4 value bytes)
                }

                console.log(result);
                //save to db
                const gpsBikeSeries = new gpsBikeModel.GPSBikeModelSeries(result);
                await gpsBikeSeries.save();

                console.log('result:', result);
                //current timestamp
                const currentTimestamp = new Date();

                console.log(`[${currentTimestamp.toISOString()}]  ${result.timestamp} IMEI ${result.IMEI} saved to db`);
                //close connection
                socket.end();
            } else {
                // Handle other data
                console.log('ERROR Data received:', data.toString('hex'));
                console.log('ERROR ASCII:', data.toString('ascii'));
                socket.end();
            }
        }
        catch (error) {
            console.error('Error from teltonika processing data:', error);
        }

    });
}