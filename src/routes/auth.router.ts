import { sign } from "crypto";
import express from "express";
import { signUp,signIn } from "../services/auth.service";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../dto/register.dto";
const AuthRouter = express.Router();

// AuthRouter.post("/auth/login", async (req, res) => {

//     const body = req.body;
//     console.log("body data: ", body);
//     res.status(200).json("success");
// });
AuthRouter.post("/auth/register",validate(registerSchema), signUp);
AuthRouter.post("/auth/login",validate(loginSchema), signIn);



export default AuthRouter;
