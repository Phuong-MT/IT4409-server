import express from "express"

const CategoryRouter = express.Router();

import { createCategory, getAllCategories } from "../services/category.service";

CategoryRouter.post("/api/categories", createCategory);
CategoryRouter.get("/categories", getAllCategories);

export default CategoryRouter;
