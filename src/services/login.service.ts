import express from 'express';
import { User } from '../shared/models/user-model';
import UserModel from '../models/user-model.mongo';
import bcrypt from 'bcrypt';

export const signUp = async (req: any, res: any) => {
    try {
         const body = req.body;
         const { username, password, email, phoneNumber, dateOfBirth, address } = body;

         // Check if user already exists (pseudo code)
        const userExists = await UserModel.findOne({ username });
        if(userExists) {
            return res
            .status(409)
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