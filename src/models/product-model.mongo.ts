import { Document, Model, model, Schema } from "mongoose";
import { IProduct } from "../shared/models/product-model";
import { Contacts } from "../shared/contacts";
import { categoryTableName } from "./category-model.mongo";

const STATUS_EVALUATION = Contacts.Status.Evaluation;
const ObjectId = Schema.Types.ObjectId;

export const productTableName = "Product";

export interface ISpecItem {
  key: string; 
  value: string; 
}
export interface IColorVariant {
    colorName: string;
    hexcode: string;
    images: string[];
    quantity: number;
}
const colorVariantSchema = new Schema<IColorVariant>({
    colorName: { type: String, required: true },
    hexcode: { type: String, required: true },
    images: [{ type: String }],
    quantity: { type: Number, default: 0 }
}, { _id: false });
export interface IProductVariant{
    version: string;
    price: number;
    sku: string;
    options: IColorVariant[];
}

const productVariantSchema = new Schema<IProductVariant>({
    version: { type: String, required: true },
    price: { type: Number, required: true },
    sku: { type: String },
    options: [colorVariantSchema]
})
export interface ProductModelDocument extends IProduct, Document {
    _id: any;
    brand: string;
    specifications?: ISpecItem[]
    variants: IProductVariant[]
}

export interface IProductModel extends Model<ProductModelDocument> {}


const productSchema = new Schema<ProductModelDocument>(
    {
        title: { type: String, required: true },
        brand: { type: String, required: true },
        description: { type: String, required: true },
        specifications: { type: [{ key: String, value: String }], required: false, default: [], _id: false },

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
        variants: {
            type: [productVariantSchema], 
            default: []
        }
    },
    { versionKey: false, timestamps: true }
);

const ProductModel = model<ProductModelDocument, IProductModel>(
    productTableName,
    productSchema
);

export default ProductModel;
