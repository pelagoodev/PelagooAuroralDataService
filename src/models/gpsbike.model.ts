import mongoose, { Schema, model } from 'mongoose';

const GPSBikeSchema = new Schema({
    IMEI: { type: String, required: true, index: true, unique: true },
    details: {
        type: Schema.Types.Mixed

    }
}, {
    timestamps: true
});

const GPSBikeSeriesSchema = new Schema({
    IMEI: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true },
    GPS: {
        longitude: Number,
        latitude: Number,
        altitude: Number,
        angle: Number,
        satellites: Number,
        speed: Number
    },
    speed: Number,
    batteryLevel: Number,
    totalOdometer: Number
}, {
    timestamps: true,
    timeseries: {
        timeField: 'timestamp',
        metaField: 'IMEI',
        granularity: 'minutes'
    }
});

export const GPSBikeModel = mongoose.model('GPSBike', GPSBikeSchema);

export const GPSBikeModelSeries = mongoose.model('GPSBikeSeries', GPSBikeSeriesSchema);

export const saveGPSBike = async (data: any) => {

    const gpsBike = new GPSBikeModel(data);
    await gpsBike.save();
    return gpsBike;
}

