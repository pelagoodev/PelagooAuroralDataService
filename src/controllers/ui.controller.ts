import { NextFunction, Request, Response } from "express"
import { FitModelSeries } from "../models/fit.model.js";
import { GPSBikeModelSeries } from "../models/gpsbike.model.js";

export async function getLastTrips(req: Request, res: Response, next: NextFunction) {

    try {
        const trips = await GPSBikeModelSeries.aggregate([
            {
                "$match": {
                    $expr: {
                        $gte: [
                            "$timestamp",
                            {
                                $dateSubtract: {
                                    startDate: "$$NOW",
                                    unit: "hour",
                                    amount: 120
                                }
                            }

                        ]
                    },
                    "GPS.latitude": {
                        $ne: 0
                    },
                    "GPS.longitude": {
                        $ne: 0
                    }

                }

            },
            {
                $sort: {
                    "timestamp": -1
                }
            },
            {
                "$group": {
                    _id: "$IMEI",
                    trips: {
                        $push: {
                            latitude: "$GPS.latitude",
                            longitude: "$GPS.longitude"
                        }
                    }

                }
            }
        ]).exec();

        res.json(trips);


    } catch (error) {
        console.error('Error fetching last trips:', error);
        next(error);
    }

}

export async function getLastKnownPosition(req: Request, res: Response, next: NextFunction) {
    try {
        const positions = await GPSBikeModelSeries.aggregate([
            {
                "$match": {
                    "GPS.latitude": {
                        $ne: 0
                    },
                    "GPS.longitude": {
                        $ne: 0
                    }

                }

            },
            {
                $sort: {
                    "timestamp": -1
                }
            },
            {
                "$group": {
                    _id: "$IMEI",
                    latitude: {
                        $first: "$GPS.latitude"
                    },
                    longitude: {
                        $first: "$GPS.longitude"
                    }

                }
            }
        ]).exec();

        res.json(positions);

    } catch (error) {
        console.error('Error fetching last known position:', error);
        next(error);
    }

}