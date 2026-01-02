import express from "express";
import { auth } from "../middlewares/auth";
import { verifyRole } from "../middlewares/verifyRole";
import { UserRole } from "../shared/models/user-model";
import {
  addToWishlist,
  getWishlist,
  checkWishlist,
  removeFromWishlist,
} from "../services/wishList.service";

const WishListRouter = express.Router();


WishListRouter.get(
  "/wish-list",
  auth,
  verifyRole([UserRole.USER]),
  getWishlist
);


WishListRouter.post(
  "/wish-list",
  auth,
  verifyRole([UserRole.USER]),
  addToWishlist
);


WishListRouter.get(
  "/wish-list/:productId",
  auth,
  verifyRole([UserRole.USER]),
  checkWishlist
);


WishListRouter.delete(
  "/wish-list",
  auth,
  verifyRole([UserRole.USER]),
  removeFromWishlist
);

export default WishListRouter;
