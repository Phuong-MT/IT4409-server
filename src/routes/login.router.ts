import { sign } from "crypto";
import express from "express";
import { signUp } from "../services/login.service";
import { validate } from "../middlewares/validate";
import { registerSchema } from "../dto/register.dto";
const LoginRouter = express.Router();

LoginRouter.post("/auth/login", async (req, res) => {
    
    const body = req.body;
    console.log("body data: ", body);
    res.status(200).json("success");
});
LoginRouter.post("/auth/register",validate(registerSchema), signUp);


export default LoginRouter;
