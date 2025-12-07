import express from "express"

const CategoryRouter = express.Router();

import { createCategory, getAllCategories, getCategoryById, updateCategory } from "../services/category.service";
import { verifyRole } from "../middlewares/verifyRole";
import { auth } from "../middlewares/auth";
CategoryRouter.post("/categories",auth, verifyRole("USER"), createCategory);
CategoryRouter.get("/categories", getAllCategories);
CategoryRouter.put("/categories/:id", auth, verifyRole("USER"), updateCategory);
CategoryRouter.get("/categories/:id", getCategoryById);

export default CategoryRouter;
