import { Document, Model, Schema, model } from "mongoose";
import { IPayment, METHOD, DELIVERY } from "../shared/models/payment-model";

export interface PaymentDocument extends IPayment, Document {
  _id: any;
}

export interface IPaymentModel extends Model<PaymentDocument> {}

const paymentSchema = new Schema<PaymentDocument>(
  {
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    method: { type: String, enum: Object.values(METHOD), required: true },
    totalMoney: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    delivery: { type: String, enum: Object.values(DELIVERY), required: true }
  },
  { timestamps: true, versionKey: false }
);

const PaymentModel = model<PaymentDocument, IPaymentModel>("Payment", paymentSchema);

export default PaymentModel;
