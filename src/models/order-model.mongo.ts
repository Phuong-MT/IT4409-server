import { Document, Model, Schema, model } from "mongoose";
import { IOrder } from "../shared/models/order-model";
import { IProduct } from "../shared/models/order-model";


export interface OrderDocument extends IOrder, Document {
    _id: any;
}


export interface IOrderModel extends Model<OrderDocument> {}


const productSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false } 
);

const orderSchema = new Schema<OrderDocument>(
  {
    listProduct: { type: [productSchema], required: true },
    userId: { type: String, required: true },
    sumPrice: { type: Number, required: true },
    note: { type: String },
    toAddress: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);


const OrderModel = model<OrderDocument, IOrderModel>("Order", orderSchema);

export default OrderModel;
