import { Document, Model, model, Schema } from "mongoose";
import { IProductVariant } from "../shared/models/product-variant-model";
import { Contacts } from "../shared/contacts";
import { productTableName } from "./product-model.mongo";

const STATUS_EVALUATION = Contacts.Status.Evaluation;
const ObjectId = Schema.Types.ObjectId;

export const productVariantTableName = "Product Variant";

export interface ProductVariantModelDocument extends IProductVariant, Document {
    _id: any;
}

export interface IProductVariantModel extends Model<ProductVariantModelDocument> {}

const productVariantSchema = new Schema<ProductVariantModelDocument>(
    {   
        sku: { type: String, required: true },
        color: { type: [{ name: String, hexCode: String, image: [String] }], required: true },
        version: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        productId: {
            type: ObjectId as any,
            ref: productTableName,
            required: true,
        },
    },
    { versionKey: false, timestamps: true }
);                              
        

const ProductVariantModel = model<ProductVariantModelDocument, IProductVariantModel>(
    productVariantTableName,
    productVariantSchema
);

export default ProductVariantModel; 