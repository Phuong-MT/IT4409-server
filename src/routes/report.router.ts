import express from "express";
import { uploadImage } from "../middlewares/upload";
import { uploadImageBuffer } from "../upload/upload.image";
import { validate } from "../middlewares/validate";
import { createRefundReportSchema } from "../dto/report.dto";
import { auth } from "../middlewares/auth";
import { IRefundReport } from "../shared/models/refund-report-model";
import RefundReportModel from "../models/refund-report-model.mongo";
import { getRefundReportById, getRefundReports, creatReportRefund } from "../services/report.service";
import { verifyRole } from "../middlewares/verifyRole";
import { UserRole } from "../shared/models/user-model";
import OrderModel from "../models/order-model.mongo";
import PaymentModel from "../models/payment-model.mongo";

const ReportRouter = express.Router();

ReportRouter.post(
    "/reports/refund",
    auth,
    verifyRole([UserRole.ADMIN]),
    validate(createRefundReportSchema),
    creatReportRefund
);

ReportRouter.get("/reports/refund/:id", auth,verifyRole([UserRole.ADMIN]), getRefundReportById);
ReportRouter.get("/reports/refund", auth,verifyRole([UserRole.ADMIN]), getRefundReports);

export default ReportRouter;
