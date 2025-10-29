import { Document, Model, model, Schema } from "mongoose";
import { IProduct } from "../shared/models/product-model";
import { Contacts } from "../shared/contacts";
import { categoryTableName } from "./category-model.mongo";

const STATUS_EVALUATION = Contacts.Status.Evaluation;
const ObjectId = Schema.Types.ObjectId;

export const productTableName = "Product";

export interface ProductModelDocument extends IProduct, Document {
    _id: any;
}

export interface IProductModel extends Model<ProductModelDocument> {}

const productSchema = new Schema<ProductModelDocument>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        descriptionDetail: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        categoryId: {
            type: ObjectId as any,
            ref: categoryTableName,
            required: true,
        },
        isHide: {
            type: Number,
            required: false,
            default: STATUS_EVALUATION.CREATE,
        },
        imageUrl: { type: [String], required: false },
    },
    { versionKey: false, timestamps: true }
);

const ProductModel = model<ProductModelDocument, IProductModel>(
    productTableName,
    productSchema
);

export default ProductModel;
