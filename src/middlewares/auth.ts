import { jwtDecodeToken } from "../utils/jwt-token";

export const auth = (req, res, next) => {
    const token = req.cookies["access_token"];
    if (!token) {
        return res.status(401).send({
            error: "Authentication required",
        });
    }
    try {
        const decoded: any = jwtDecodeToken(token);
        if (!decoded) {
            return res.status(401).send({
                error: "Invalid token",
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log("originalUrl ", req.originalUrl, " req.ip ", req.ip);
        res.status(401).send({
            error: "Invalid token",
        });
    }
};
