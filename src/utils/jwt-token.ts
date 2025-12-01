import jwt from "jsonwebtoken";

export const jwtDecodeToken = function (token: string): string | object | null {
    const jwtSecret = process.env.ACCESS_TOKEN_SECRET || "jwtSecretV1";
    try {
        let decoded = jwt.verify(token, jwtSecret);
        if (decoded && typeof decoded === "object") {
            return decoded;
        }
    } catch (err) {
        try {
            let decoded = jwt.verify(token, "jwtSecretV1");
            if (decoded && typeof decoded === "object") {
                return decoded;
            }
        } catch (error) {
            return null;
        }
    }
    return null;
};
