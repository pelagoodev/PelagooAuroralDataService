import cron from 'node-cron';
import * as fitModel from '../models/fit.model.js';
import axios from 'axios';
import moment from 'moment-timezone';



async function processDailyMeasurements(measurementDate: Date) {
    try {
        console.log(`[${moment().format()}] Starting daily fit measurements for ${measurementDate.toISOString()}`);

        const fitUsers = await fitModel.FitModelId.find({ 'archived': { $ne: true } });

        for (const user of fitUsers) {
            const fitbitRefreshToken = user.fitbitRefreshToken;

            const refreshedTokens = await refreshFitbitToken(fitbitRefreshToken);
            user.fitbitRefreshToken = refreshedTokens.refresh_token;
            user.fitbitToken = refreshedTokens.access_token;
            await user.save();

            const fitbitId = user.fitbitId;
            const fitbitToken = user.fitbitToken;

            const dailyData = await fetchDailyMeasurements(fitbitId, fitbitToken, measurementDate);
            await fitModel.saveFitSeries(dailyData, fitbitId, measurementDate);
        }
    } catch (error) {
        console.error('Error processing daily measurements:', error);
        throw error;
    }
}

async function fetchUserProfile(fitbitId: string, fitbitToken: string) {
    try {
        const response = await axios.get(
            `https://api.fitbit.com/1/user/${fitbitId}/profile.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.error(`Token expired when fetching profile for user ${fitbitId}`);
        }
        throw error;
    }
}

export async function processUserProfiles(): Promise<any[]> {
    try {
        // Retrieve all active users
        const fitUsers = await fitModel.FitModelId.find({ archived: { $ne: true } });
        const profiles: any[] = [];

        for (const user of fitUsers) {
            // Refresh token for each user
            const refreshedTokens = await refreshFitbitToken(user.fitbitRefreshToken);
            user.fitbitRefreshToken = refreshedTokens.refresh_token;
            user.fitbitToken = refreshedTokens.access_token;
            await user.save();

            const fitbitId = user.fitbitId;
            const fitbitToken = user.fitbitToken;
            const profile = await fetchUserProfile(fitbitId, fitbitToken);
            profiles.push(profile);
        }
        return profiles;
    } catch (error) {
        console.error('Error processing user profiles:', error);
        throw error;
    }
}



// Cron job that calls the processing function
export function cronFitSchedule(): cron.ScheduledTask {
    return cron.schedule('5 0 * * *', async () => {
        try {
            const yesterday = moment().tz('UTC')
                .subtract(1, 'days')
                .toDate();

            await processDailyMeasurements(yesterday);
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });
}

export async function getDirectlyFit() {
    // return cron.schedule('* * * * *', async () => {
    try {
        const yesterday = moment().tz('UTC')
            .subtract(1, 'days').startOf('day').toDate();
        await processDailyMeasurements(yesterday);
    } catch (error) {
        console.error('Error in cron job:', error);
    }
    // }, {
    //     scheduled: true,
    //     timezone: "Europe/Athens"
    // });
}

async function fetchDailyMeasurements(fitbitId: string, fitbitToken: string, date: Date) {


    try {
        // Format date to YYYY-MM-DD
        const formattedDate = moment(date).tz('UTC').format('YYYY-MM-DD');

        //refresh token if needed


        // Get steps data
        const response = await axios.get(
            `https://api.fitbit.com/1/user/${fitbitId}/activities/steps/date/${formattedDate}/1d.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        const steps = response.data?.['activities-steps']?.[0]?.value;


        //get calories data
        const responseCalories = await axios.get(
            `https://api.fitbit.com/1/user/${fitbitId}/activities/calories/date/${formattedDate}/1d.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        const calories = responseCalories.data?.['activities-calories']?.[0]?.value;


        //get heart rate data
        const responseHeart = await axios.get(
            `https://api.fitbit.com/1/user/${fitbitId}/activities/heart/date/${formattedDate}/1d.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        const heart = responseHeart.data?.['activities-heart']?.[0]?.value;

        //get hrv data
        const responseHrv = await axios.get(
            `https://api.fitbit.com/1/user/${fitbitId}/hrv/date/${formattedDate}.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        const hrv = responseHrv.data?.['hrv']?.[0]?.value;

        //get sleep data
        const responseSleep = await axios.get(
            `https://api.fitbit.com/1.2/user/${fitbitId}/sleep/date/${formattedDate}.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        const sleep = responseSleep.data?.['sleep'];

        //get spo2 data
        const responseSpo2 = await axios.get(
            `https://api.fitbit.com/1/user/${fitbitId}/spo2/date/${formattedDate}.json`,
            {
                headers: {
                    'Authorization': `Bearer ${fitbitToken}`,
                    'Accept': 'application/json'
                }
            }
        );
        const spo2 = responseSpo2.data?.value;


        return {
            steps,
            calories,
            heart,
            hrv,
            sleep,
            spo2
        };


    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Handle token refresh here if needed
            console.error('Token expired, needs refresh');
        }
        throw error;
    }

}

async function refreshFitbitToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
}> {
    try {
        const refreshResponse = await axios.post(
            'https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(
                        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
                    ).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Update user's tokens in database
        await fitModel.FitModelId.findOneAndUpdate(
            { fitbitRefreshToken: refreshToken },
            {
                fitbitToken: refreshResponse.data.access_token,
                fitbitRefreshToken: refreshResponse.data.refresh_token
            }
        );

        return {
            access_token: refreshResponse.data.access_token,
            refresh_token: refreshResponse.data.refresh_token
        };
    } catch (error) {
        console.error('Token refresh failed:', error);
        throw error;
    }
}