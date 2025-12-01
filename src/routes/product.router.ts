import express from "express";
import { auth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { productSchema } from "../dto/product.dto";
import { addProduct } from "../services/product.service";
const ProductRouter = express.Router();

ProductRouter.post("/product",auth,validate(productSchema), addProduct);




export default ProductRouter;