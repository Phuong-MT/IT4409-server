import express from "express";
import { addProduct, updateProduct, getAllProducts, deleteProduct, getProductById } from '../services/product.service';
import { auth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { productSchema } from "../dto/product.dto";
import { verifyRole } from "../middlewares/verifyRole";

const ProductRouter = express.Router();

ProductRouter.get("/products", getAllProducts);
ProductRouter.put("/products/:id", auth, verifyRole("USER"), updateProduct);
ProductRouter.delete("/products/:id", auth, verifyRole("USER"), deleteProduct);
ProductRouter.get("/products/:id", getProductById);

ProductRouter.post("/product",auth,validate(productSchema), addProduct);




export default ProductRouter;
