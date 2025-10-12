import express from "express";

const LoginRouter = express.Router();

LoginRouter.post("/auth/login", async (req, res) => {
    const body = req.body;
    console.log("body data: ", body);
    res.status(200).json("success");
});

export default LoginRouter;
