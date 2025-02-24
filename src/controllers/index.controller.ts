import { NextFunction, Request, Response } from "express";
import * as fitModel from "../models/fit.model.js";
import * as gpsBikeModel from "../models/gpsbike.model.js";

export async function getData(req: Request, res: Response, next: NextFunction) {
    const data = await gpsBikeModel.GPSBikeModel.find();
    await fitModel.FitModelId.find();
    res.json({
        "succes": "data retrieved",
    });
}