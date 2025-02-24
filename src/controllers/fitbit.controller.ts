// src/controllers/fitbit.controller.ts
import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import * as fitModel from '../models/fit.model.js';

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('hex');
}

export async function getAuthUrl(req: Request, res: Response) {
    try {

        const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
        authUrl.searchParams.append('client_id', process.env.FITBIT_CLIENT_ID!);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', 'activity heartrate location nutrition profile sleep oxygen_saturation temperature');


        // return res.json({ authorization_url: authUrl.toString() });
        return res.redirect(authUrl.toString());
    } catch (error) {
        return res.status(500).json({ error: 'Failed to generate auth URL' });
    }
}

export async function handleCallback(req: Request, res: Response) {
    try {
        const { code } = req.query;
        console.log('code:', code);

        const tokenResponse = await axios.post('https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                client_id: process.env.FITBIT_CLIENT_ID!,
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: process.env.FITBIT_REDIRECT_URI!
            }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
                ).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }




        });

        //get response
        const fitbitUserId = tokenResponse.data.user_id;
        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token;
        const scope = tokenResponse.data.scope;
        //find user exists 
        const user = await fitModel.FitModelId.findOne({ fitbitId: fitbitUserId });
        if (!user) {
            const newUser = new fitModel.FitModelId({
                fitbitId: fitbitUserId,
                fitbitToken: accessToken,
                fitbitRefreshToken: refreshToken,
                scope: scope
            });

            await newUser.save();
        } else {
            user.fitbitToken = accessToken;
            user.fitbitRefreshToken = refreshToken;
            user.scope = scope;
            await user.save();
        }

        const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>Fitbit Connection Success</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
        }
        .success-card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .success-title {
            color: #4CAF50;
            margin-bottom: 1rem;
        }
        .success-message {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="success-card">
        <h1 class="success-title">Connection Successful!</h1>
        <p class="success-message">Your Fitbit account has been successfully connected.</p>
    </div>
</body>
</html>`;

        return res.send(htmlResponse);
    } catch (error) {
        return res.status(500).json({ error: 'Token exchange failed' });
    }
}

export async function refreshToken(req: Request, res: Response) {
    try {
        const { refresh_token } = req.query;

        const refreshResponse = await axios.post('https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token as string
            }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
                ).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return res.json(refreshResponse.data);
    } catch (error) {
        return res.status(500).json({ error: 'Token refresh failed' });
    }
}