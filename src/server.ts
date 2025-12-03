import "dotenv/config";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { AddressInfo } from "net";
import AuthRouter from "./routes/auth.router";
import CategoryRouter from "./routes/category.router";
import ProductRouter from "./routes/product.router";
import connectDatabase from "./utils/connectDB";


const app = express();
app.use(cors({ origin: "*" }));
app.use(cookieParser());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type");
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
    );
    next();
});
app.use(bodyParser.json({ limit: "500mb" }));
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
        },
    })
);
app.set("trust proxy", true);

try {
    app.use("/api", AuthRouter);
    app.use("/api", CategoryRouter);
    app.use("/api", ProductRouter);
    app.use("/api", async function (req, res) {
        res.status(200).json("hello");
    });
} catch (error: any) {
    console.log("error ", error);
}
const server = app.listen(process.env.PORT || 4001, function () {
    //start server
    const addressInfo: string | AddressInfo | null = server.address();
    const port =
        typeof addressInfo === "string"
            ? addressInfo
            : addressInfo
            ? addressInfo.port
            : "";
    console.log("Server listening on port " + port);
    connectDatabase();
    // connectRedis(() => {
    //     listOkay.push("redis");
    //     checkAllService(listOkay);
    // });
});
