import express from "express";
import { uploadImage } from "../middlewares/upload";
import { uploadImageBuffer } from "../upload/upload.image";
import { validate } from "../middlewares/validate";
import { createRefundReportSchema } from "../dto/report.dto";
import { auth } from "../middlewares/auth";
import { IRefundReport } from "../shared/models/refund-report-model";
import RefundReportModel from "../models/refund-report-model.mongo";
import { getRefundReportById, getRefundReports } from "../services/report.service";
import { verifyRole } from "../middlewares/verifyRole";
import { UserRole } from "../shared/models/user-model";
import OrderModel from "../models/order-model.mongo";
import PaymentModel from "../models/payment-model.mongo";

const ReportRouter = express.Router();

ReportRouter.post(
    "/reports/refund",
    auth,
    verifyRole([UserRole.ADMIN]),
    uploadImage.single("file"),
    validate(createRefundReportSchema),
    async (req, res) => {
        try {
            const result = await uploadImageBuffer(
                req.file!,
                (req as any).user.id,
                "report"
            );
            const images = [result.secure_url];

            const {
                orderId,
                paymentId,
                cusName,
                cusMail,
                cusPhone,
                refundBy,
                reason,
                amount
            } = req.body;
            const [order, payment] = await Promise.all([
                OrderModel.findOne({ orderId }),
                PaymentModel.findOne({ paymentId })
            ]);
            const customerDetail = {
                name: cusName,
                email: cusMail,
                phone: cusPhone
            };
            // if (!order) {
            //     return res.status(400).json({ message: "Không tìm thấy đơn hàng" });
            // }
            // if (!payment) {
            //     return res.status(400).json({ message: "Không tìm thấy thanh toán" });
            // }
            // Validate required fields
            const createdReport = await RefundReportModel.create({
                orderId,
                paymentId,
                customerDetail,
                refundBy,
                reason,
                amount,
                images,
            });
            return res.status(200).json(createdReport);

        } catch (err) {
            console.log("upload image error: ", err);
            return res.status(500).json("Internal server error");
        }
    }
);

ReportRouter.get("/reports/refund/:id", auth,verifyRole([UserRole.ADMIN]), getRefundReportById);
ReportRouter.get("/reports/refund", auth,verifyRole([UserRole.ADMIN]), getRefundReports);

export default ReportRouter;
