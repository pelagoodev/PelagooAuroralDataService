import { Request, Response } from "express";
import * as fitModel from "../models/fit.model.js";
import * as bikeModel from "../models/gpsbike.model.js";
import moment from "moment-timezone";

export async function fitNR(req: Request, res: Response) {
    try {
        // Get request parameters
        const property = req.params.property;
        const fitId = req.query.fit;
        console.log("property", property);

        // Check if fit id exists
        if (!fitId) {
            return res.status(400).send('Fit id is required');
        }

        // Check if fit id exists in the database
        const fit = await fitModel.FitModelId.findOne({ fitbitId: fitId });
        if (!fit) {
            return res.status(404).send('Fit id not found');
        }

        // Get yesterday's fit data
        const fitSeries = await fitModel.getYesterdayFit(fit.fitbitId);
        if (!fitSeries) {
            return res.status(404).json({});
        }

        if (property == 'getcalories') {
            const calories = fitSeries.calories;
            return res.status(200).send(String(calories ?? -1));
        } else if (property == 'getSteps') {
            const steps = fitSeries.steps;
            return res.status(200).send(String(steps ?? 0));
        } else if (property == 'getheartratefatburn') {
            const fatBurn = fitSeries.heart?.[0]?.heartRateZones?.find((zone: any) => zone.name == 'Fat Burn');
            if (!fatBurn) {
                return res.status(404).send('-1');
            }
            return res.status(200).json({
                min: fatBurn?.min ?? -1,
                max: fatBurn?.max ?? -1
            });
        } else if (property == 'getheartratecardio') {
            const cardio = fitSeries.heart?.[0]?.heartRateZones?.find((zone: any) => zone.name == 'Cardio');
            if (!cardio) {
                return res.status(404).send('-1');
            }
            return res.status(200).json({
                min: cardio?.min ?? -1,
                max: cardio?.max ?? -1
            });
        } else if (property == 'getheartratepeak') {
            const peak = fitSeries.heart?.[0]?.heartRateZones?.find((zone: any) => zone.name == 'Peak');
            if (!peak) {
                return res.status(404).send('-1');
            }
            return res.status(200).json({
                min: peak?.min ?? -1,
                max: peak?.max ?? -1
            });
        } else if (property == 'getheartrateoutofrange') {
            const outOfRange = fitSeries.heart?.[0]?.heartRateZones?.find((zone: any) => zone.name == 'Out of Range');
            if (!outOfRange) {
                return res.status(404).send('-1');
            }
            return res.status(200).json({
                min: outOfRange?.min ?? -1,
                max: outOfRange?.max ?? -1
            });
        } else if (property == 'getsleepefficiency') {
            if (!fitSeries.sleep || !Array.isArray(fitSeries.sleep)) {
                return res.status(404).send('0');
            }
            // Get the sleep with the maximum duration
            const sleep = fitSeries.sleep.reduce((prev: any, current: any) =>
                (prev.duration > current.duration) ? prev : current
            );
            const efficiency = sleep.efficiency;
            return res.status(200).send(String(efficiency ?? 0));
        } else if (property == "getdeepsleepminutes") {
            // Logic for deep sleep minutes
            if (!fitSeries.sleep || !Array.isArray(fitSeries.sleep)) {
                return res.status(404).send('0');
            }
            const deepSleepMinutes = fitSeries.sleep.reduce((prev: number, current: any) =>
                prev + (current?.levels?.summary?.deep?.minutes ?? 0), 0
            );
            return res.status(200).send(String(deepSleepMinutes));
        } else if (property == "getlightsleepminutes") {
            // Logic for light sleep minutes
            if (!fitSeries.sleep || !Array.isArray(fitSeries.sleep)) {
                return res.status(404).send('0');
            }
            const lightSleepMinutes = fitSeries.sleep.reduce((prev: number, current: any) =>
                prev + (current?.levels?.summary?.light?.minutes ?? 0), 0
            );
            return res.status(200).send(String(lightSleepMinutes));
        } else if (property == "getremsleepminutes") {
            // Logic for REM sleep minutes
            if (!fitSeries.sleep || !Array.isArray(fitSeries.sleep)) {
                return res.status(404).send('0');
            }
            const remSleepMinutes = fitSeries.sleep.reduce((prev: number, current: any) =>
                prev + (current?.levels?.summary?.rem?.minutes ?? 0), 0
            );
            return res.status(200).send(String(remSleepMinutes));
        } else if (property == "getwakesleepminutes") {
            // Logic for wake sleep minutes
            if (!fitSeries.sleep || !Array.isArray(fitSeries.sleep)) {
                return res.status(404).send('0');
            }
            const wakeSleepMinutes = fitSeries.sleep.reduce((prev: number, current: any) =>
                prev + (current?.levels?.summary?.wake?.minutes ?? 0), 0
            );
            return res.status(200).send(String(wakeSleepMinutes));
        } else {
            return res.status(400).json({ error: 'Invalid property' });
        }

    } catch (error) {
        console.error("Error in generating fit data", error);
        return res.status(500).send("error in generating fit data");
    }
}

export async function bikeNR(req: Request, res: Response) {
    try {
        //get

        const property = req.params.property;
        const imei = req.query.imei;
        console.log("property", property);

        // Check if fit id exists
        if (!imei) {
            return res.status(400).send('IMEI is required');
        }

        // Check if Imei id exists in the database
        const bike = await bikeModel.GPSBikeModel.findOne({ IMEI: imei });
        if (!bike) {
            return res.status(404).send('IMEI not found');
        }
        if (property == "getlatitude") {
            //get last data from bike series and return latitude
            const bikeSeries = await bikeModel.GPSBikeModelSeries.findOne({ IMEI: imei }).sort({ timestamp: -1 });
            if (!bikeSeries) {
                return res.status(200).send('0');
            }
            return res.status(200).send(String(bikeSeries?.GPS?.latitude ?? 0));
            

        }
        else if (property == "getlongitude") {
            //get last data from bike series and return longitude
            const bikeSeries = await bikeModel.GPSBikeModelSeries.findOne({ IMEI: imei }).sort({ timestamp: -1 });
            if (!bikeSeries) {
                return res.status(200).send('0');
            }
             
            return res.status(200).send(String(bikeSeries?.GPS?.longitude ?? 0));
            // return res.status(200).send(String(20.929242));
        }
        else if (property == "gettodaydistance") {
            const today = moment.utc().startOf('day');

            const result = await bikeModel.GPSBikeModelSeries.aggregate([
                {
                    $match: {
                        IMEI: imei,
                        timestamp: { $gte: today.toDate() }
                    }
                },
                {
                    $sort: { timestamp: 1 } // Sort by timestamp in ascending order
                },
                {
                    $group: {
                        _id: null,
                        firstOdometer: { $first: "$totalOdometer" },
                        lastOdometer: { $last: "$totalOdometer" }
                    }
                }
            ]);

            if (result.length === 0 || result[0].firstOdometer == null || result[0].lastOdometer == null) {
                return res.status(200).send('0');
            }

            const distance = (result[0].lastOdometer - result[0].firstOdometer)/1000;
            return res.status(200).send(String(distance));

        } else if (property == "getmonthlydistance") {
            const today = moment.utc().startOf('day');
            const firstDayOfMonth = moment.utc().startOf('month');

            const result = await bikeModel.GPSBikeModelSeries.aggregate([
                {
                    $match: {
                        IMEI: imei,
                        timestamp: { $gte: firstDayOfMonth.toDate(), $lt: today.toDate() }
                    }
                },
                {
                    $sort: { timestamp: 1 } // Sort by timestamp in ascending order
                },
                {
                    $group: {
                        _id: null,
                        firstOdometer: { $first: "$totalOdometer" },
                        lastOdometer: { $last: "$totalOdometer" }
                    }
                }
            ]);

            if (result.length === 0 || result[0].firstOdometer == null || result[0].lastOdometer == null) {
                return res.status(200).send('0');
            }

            const distance = (result[0].lastOdometer - result[0].firstOdometer)/1000;
            return res.status(200).send(String(distance));
        } else if (property == "getyeardistance") {
            const today = moment.utc().startOf('day');
            const firstDayOfYear = moment.utc().startOf('year');

            const result = await bikeModel.GPSBikeModelSeries.aggregate([
                {
                    $match: {
                        IMEI: imei,
                        timestamp: { $gte: firstDayOfYear.toDate(), $lt: today.toDate() }
                    }
                },
                {
                    $sort: { timestamp: 1 } // Sort by timestamp in ascending order
                },
                {
                    $group: {
                        _id: null,
                        firstOdometer: { $first: "$totalOdometer" },
                        lastOdometer: { $last: "$totalOdometer" }
                    }
                }
            ]);

            if (result.length === 0 || result[0].firstOdometer == null || result[0].lastOdometer == null) {
                return res.status(200).send('0');
            }

            const distance = (result[0].lastOdometer - result[0].firstOdometer)/1000;
            return res.status(200).send(String(distance));
        } else {
            return res.status(400).json({ error: 'Invalid property' });
        }
    

    }
    catch (error) {
        console.error("Error in generating bike data", error);
        return res.status(500).send("error in generating bike data");
    }
}