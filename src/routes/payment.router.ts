import express from "express";
import Stripe from "stripe";
import { stripeService } from "../services/stripe.services";
import OrderModel from "../models/order-model.mongo";
import { Contacts } from "../shared/contacts";
import mongoose from "mongoose";
import { productTableName } from "../models/product-model.mongo";

const PaymentRouter = express.Router();

PaymentRouter.post("/payment/creator", async (req, res) => {
    try {
        const method = req.query["method"];
        const orderId = String(req.query.order ?? "");
        if (!orderId) {
            return res.status(400).json("order_id is required");
        }
        if (!method) {
            return res.status(400).json("method is required");
        }

        const agg = [
            { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
            {
                $lookup: {
                    from: productTableName.toLowerCase() + "s",
                    localField: "listProduct.productId",
                    foreignField: "_id",
                    as: "productInfo",
                },
            },
            {
                $addFields: {
                    listProduct: {
                        $map: {
                            input: "$listProduct",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        productDetail: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$productInfo",
                                                        as: "p",
                                                        cond: {
                                                            $eq: [
                                                                "$$p._id",
                                                                "$$item.productId",
                                                            ],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },

            { $project: { productInfo: 0 } },
        ];
        const orderRes = await OrderModel.aggregate(agg);
        if (!orderRes || orderRes[0].listProduct.length === 0) {
            return res.status(400).json("Order not found");
        }

        const totleMemony = orderRes[0].sumPrice;
        const listProduct = orderRes[0].listProduct;

        let urlRedric = "";
        switch (method) {
            case "stripe":
                const lineItem = listProduct.map((e) => {
                    return {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: e.title,
                                description: e.description,
                                // images: [
                                //     "https://storage.googleapis.com/worksheetzone/test-upload/621446303dbe963974acb3e5/my-word-search-title-w1000-h1291-preview-0.png",
                                // ],
                            },
                            unit_amount: e.price - e.discount,
                        },
                        quantity: e.quantity,
                    };
                });
                const stripeMethod = await stripeService.createCheckoutSession(
                    lineItem
                );
                urlRedric = stripeMethod.url;
                break;
            default:
                break;
        }
        //update status order
        await OrderModel.findByIdAndUpdate(
            new mongoose.Types.ObjectId(orderId),
            {
                statusOrder: Contacts.Status.Order.PROCESSING,
            }
        );

        return res.redirect(303, urlRedric);
    } catch (err: any) {
        // stripe
        if (err instanceof Stripe.errors.StripeCardError) {
            // Lỗi thanh toán do thẻ
            return res.status(400).json({
                message: err.message,
                type: "card_error",
            });
        }

        if (err instanceof Stripe.errors.StripeInvalidRequestError) {
            // Lỗi gọi API sai tham số
            return res.status(400).json({
                message: err.message,
                type: "invalid_request_error",
            });
        }

        if (err instanceof Stripe.errors.StripeAPIError) {
            return res.status(500).json({
                message: "Stripe API error",
            });
        }

        if (err instanceof Stripe.errors.StripeConnectionError) {
            return res.status(502).json({
                message: "Connection error to Stripe",
            });
        }

        if (err instanceof Stripe.errors.StripeAuthenticationError) {
            return res.status(401).json({
                message: "Invalid Stripe API key",
            });
        }

        if (err instanceof Stripe.errors.StripeRateLimitError) {
            return res.status(429).json({
                message: "Too many requests to Stripe",
            });
        }

        // === DEFAULT ERROR ===
        return res.status(500).json({
            message: "Unknown server error",
            error: err.message,
        });
    }
});

export default PaymentRouter;
