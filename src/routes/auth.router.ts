import { sign } from "crypto";
import express from "express";
import { register,login } from "../services/auth.service";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../dto/auth.dto";
const AuthRouter = express.Router();


AuthRouter.post("/auth/register",validate(registerSchema), register);
AuthRouter.post("/auth/login",validate(loginSchema), login);
// AuthRouter.post("/auth/refresh-token", refreshToken);
// AuthRouter.post("/auth/logout", logout);



export default AuthRouter;
