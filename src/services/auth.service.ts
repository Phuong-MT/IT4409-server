import express from 'express';
import { User } from '../shared/models/user-model';
import UserModel from '../models/user-model.mongo';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import SessionModel from '../models/session-model.mongo';
const dotenv = require("dotenv");
const result = dotenv.config();
const ACCESS_TOKEN_TTL = '15m'; 
const TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-default-secret';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

export const register = async (req: any, res: any) => {
    try {
         const body = req.body;
         const { username, password, email, phoneNumber, dateOfBirth, address } = body;

         // Check if user already exists (pseudo code)
        const userExists = await UserModel.findOne({ email });
        if(userExists) {
            return res
            .status(403)                    
            .json({ 
                message: "User already exists" 
            });
        }
        // hash password (pseudo code)
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user (pseudo code)
        await UserModel.create({
            userName: username,
            password: hashedPassword,
            email: email,
            phoneNumber: phoneNumber,
            dateOfBirth: dateOfBirth,
            address: address || [] 
        });
        return res
            .status(201)
            .json({ 
                message: "User registered successfully" 
            });

    } catch (error) {
        console.error("Error in signUp:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const login = async (req: any, res: any) => {
    try {
         const body = req.body;
         const { email, password } = body;

         // Find user by email (pseudo code)
        const user = await UserModel.findOne({ email });

        if(!user) {
            return res
            .status(401)
            .json({ 
                message: "Invalid email or password" 
            });
        }
        // Compare password (pseudo code)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res
            .status(401)
            .json({ 
                message: "Invalid email or password" 
            });
        }
        // Generate token (pseudo code)
        const accessToken = jwt.sign(
            {userID: user._id}, 
            TOKEN_SECRET, 
            {expiresIn: ACCESS_TOKEN_TTL}
        );// Replace with actual token generation logic
        
        const refreshToken = crypto.randomBytes(64).toString('hex'); // Example refresh token generation
        
        await SessionModel.create({
            userId: user._id,
            refreshToken: refreshToken,
            expireAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });

        // trả refreshToken trong httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Chỉ gửi cookie qua HTTPS trong môi trường production
            sameSite: 'none', // deploy backend va frontend khac domain
            maxAge: REFRESH_TOKEN_TTL,
        });
        return res.status(200).json({ message: "Login successful", accessToken: accessToken }); 

    } catch (error) {
        console.error("Error in signIn:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}