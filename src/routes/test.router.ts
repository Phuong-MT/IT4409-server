import express from "express";
import { uploadImage } from "../middlewares/upload";
import { uploadImageBuffer } from "../upload/upload.image";
import { auth } from "../middlewares/auth";
import { notificationService } from "../services/notification.service";
const TestRouter = express.Router();

TestRouter.post(
    "/test/image",
    auth,
    uploadImage.single("file"),
    async (req, res) => {
        try {
            const result = await uploadImageBuffer(
                req.file!,
                (req as any).user.id,
                "test"
            );

            res.json({
                url: result.secure_url,
                publicId: result.public_id,
            });
        } catch (err) {
            console.log("upload image error: ", err);
            return res.status(500).json("Internal server error");
        }
    }
);
TestRouter.post("/test-trigger-notif", async (req, res) => {
    
    // Gọi hàm push notification giả lập
    await notificationService.pushNotification(
        "TEST_TYPE",
        "🔔 Test Tiêu đề",
        "Đây là tin nhắn test từ Postman",
        { link: "/admin/dashboard" } // Data kèm theo
    );

    res.json({ message: "Đã bắn thông báo! Kiểm tra socket đi sếp!" });
});
export default TestRouter;
