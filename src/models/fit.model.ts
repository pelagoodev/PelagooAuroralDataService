import moment from 'moment-timezone';
import mongoose, { InferRawDocType, Schema } from 'mongoose';


const FitIdSchema = new Schema({
    fitbitId: {
        type: String,
        required: true,
        unique: true

    },
    fitbitToken: { type: String, required: true },
    fitbitRefreshToken: { type: String, required: true },
    scope: { type: String, required: false }
}, {
    timestamps: true
});

export const FitModelId = mongoose.model('FitId', FitIdSchema);
const SleepLevelDataSchema = new Schema({
    dateTime: { type: String, required: true },
    level: { type: String, required: true },
    seconds: { type: Number, required: true }
});

const SleepSummaryDetailSchema = new Schema({
    count: { type: Number, required: true },
    minutes: { type: Number, required: true },
    thirtyDayAvgMinutes: { type: Number }
});

const SleepLevelsSchema = new Schema({
    data: [SleepLevelDataSchema],
    shortData: [SleepLevelDataSchema],
    summary: {
        deep: SleepSummaryDetailSchema,
        light: SleepSummaryDetailSchema,
        rem: SleepSummaryDetailSchema,
        wake: SleepSummaryDetailSchema
    }
});

const SleepSchema = new Schema({
    dateOfSleep: { type: String, required: true },
    duration: { type: Number, required: true },
    efficiency: { type: Number, required: true },
    endTime: { type: String, required: true },
    infoCode: { type: Number, required: true },
    isMainSleep: { type: Boolean, required: true },
    levels: SleepLevelsSchema,
    logId: { type: Number, required: true },
    logType: { type: String, required: true },
    minutesAfterWakeup: { type: Number, required: true },
    minutesAsleep: { type: Number, required: true },
    minutesAwake: { type: Number, required: true },
    minutesToFallAsleep: { type: Number, required: true },
    startTime: { type: String, required: true },
    timeInBed: { type: Number, required: true },
    type: { type: String, required: true }
});

const fitSeriesSchemaDefinition = {
    fitId: {
        type: String, required: true
    },
    fitUser: {
        type: Schema.Types.ObjectId,
        ref: 'FitId'
    },
    steps: Number,
    calories: Number,
    heart: [{
        customHeartRateZones: [Schema.Types.Mixed],
        heartRateZones: [{
            max: Number,
            min: Number,
            name: String
        }]
    }],
    hrv: {
        dailyRmssd: Number,
        deepRmssd: Number
    },
    sleep: [SleepSchema],
    spo2: {
        avg: Number,
        min: Number,
        max: Number
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
};

const FitSeriesSchema = new Schema(fitSeriesSchemaDefinition, {
    timestamps: true,
    timeseries: {
        timeField: 'timestamp',
        metaField: 'fitId',
        granularity: 'hours'
    }
});



export const FitModelSeries = mongoose.model('FitSeries', FitSeriesSchema);

export async function saveFitId(fitId: string) {
    const fit = new FitModelId(fitId);
    await fit.save();
}

export async function saveFitSeries(dailyData: any, fitId: string, date: Date) {
    // console.log(dailyData);
    console.log(date);
    const fitSeries = new FitModelSeries({ ...dailyData, fitId, timestamp: date });
    await fitSeries.save();
}

type RawFitSeriesDoc = InferRawDocType<typeof fitSeriesSchemaDefinition>;

export const getYesterdayFit = async (fitId: string): Promise<RawFitSeriesDoc|null> => {
    const fitSeries = await FitModelSeries.findOne({
        fitId: fitId,
        timestamp: {
            $gte: moment().tz("UTC").subtract(1, 'days').startOf('day').toDate(),
            $lt: moment().tz("UTC").subtract(1, 'days').endOf('day').toDate(),
        }
    });
    return fitSeries
    // return fitSeries;
}