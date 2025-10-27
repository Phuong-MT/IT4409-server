import { sign } from "crypto";
import express from "express";
import { register,login } from "../services/auth.service";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../dto/register.dto";
const AuthRouter = express.Router();

// AuthRouter.post("/auth/login", async (req, res) => {

//     const body = req.body;
//     console.log("body data: ", body);
//     res.status(200).json("success");
// });
AuthRouter.post("/auth/register",validate(registerSchema), register);
AuthRouter.post("/auth/login",validate(loginSchema), login);



export default AuthRouter;
