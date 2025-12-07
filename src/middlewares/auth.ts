import { jwtDecodeToken } from "../utils/jwt-token";

export const auth = (req, res, next) => {
    let token = req.cookies && req.cookies["access_token"];
    
    if (!token && req.headers.authorization) {
        // Cắt bỏ chữ "Bearer " để lấy token
        token = req.headers.authorization.split(" ")[1];
    }
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

