// import { jwtDecodeToken } from "../utils/jwt-token";

// export const auth = (req, res, next) => {
//     const token = req.cookies["access_token"];
//     if (!token) {
//         return res.status(401).send({
//             error: "Authentication required",
//         });
//     }
//     try {
//         const decoded: any = jwtDecodeToken(token);
//         if (!decoded) {
//             return res.status(401).send({
//                 error: "Invalid token",
//             });
//         }

//         req.user = decoded;
//         next();
//     } catch (error) {
//         console.log("originalUrl ", req.originalUrl, " req.ip ", req.ip);
//         res.status(401).send({
//             error: "Invalid token",
//         });
//     }
// };
// src/middlewares/auth.ts
import { jwtDecodeToken } from "../utils/jwt-token";

export const auth = (req, res, next) => {
    // ... phần lấy token giữ nguyên ...
    const token = req.cookies["access_token"]; // Hoặc lấy từ header tùy bạn

    if (!token) return res.status(401).send({ error: "Authentication required" });

    try {
        const decoded: any = jwtDecodeToken(token);
        if (!decoded) {
            return res.status(401).send({ error: "Invalid token (Decoding failed)" });
        }
        req.user = decoded;
        next();
    } catch (error: any) {
        // --- SỬA ĐOẠN NÀY ĐỂ DEBUG ---
        console.log("🔥 AUTH ERROR DETAILS:", error.message); 
        // -----------------------------
        
        return res.status(401).send({
            error: "Invalid token",
            details: error.message // Trả về client để xem cho dễ (xóa khi production)
        });
    }
};