import { sign } from "crypto";
import express from "express";
import { signUp } from "../controllers/authController";

const LoginRouter = express.Router();

LoginRouter.post("/auth/login", async (req, res) => {
    
    const body = req.body;
    console.log("body data: ", body);
    res.status(200).json("success");
});
LoginRouter.post("/auth/register", signUp);


export default LoginRouter;
