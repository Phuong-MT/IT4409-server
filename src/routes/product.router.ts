import express from "express";
import { createProduct, updateProduct, getAllProducts, deleteProduct, getProductById } from '../services/product.service';
import { auth } from "../middlewares/auth";
import { verifyRole } from "../middlewares/verifyRole";

const ProductRouter = express.Router();

ProductRouter.post("/products", auth, verifyRole("USER"), createProduct);
ProductRouter.get("/products", getAllProducts);
ProductRouter.put("/products/:id", auth, verifyRole("USER"), updateProduct);
ProductRouter.delete("/products/:id", auth, verifyRole("USER"), deleteProduct);
ProductRouter.get("/products/:id", getProductById);

export default ProductRouter;
