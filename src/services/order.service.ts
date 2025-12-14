import mongoose from "mongoose";
import { productTableName } from "../models/product-model.mongo";
import OrderModel from "../models/order-model.mongo";
import { IOrder } from "../shared/models/order-model";

class OrderService {
    async orderInfoWidthListProductDetail(orderId: string) {
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
            {
                $project: {
                    _id: { $toString: "$_id" }, // orderId
                    listProduct: {
                        $map: {
                            input: "$listProduct",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        productId: {
                                            $toString: "$$item.productId",
                                        },
                                        productDetail: {
                                            $mergeObjects: [
                                                "$$item.productDetail",
                                                {
                                                    _id: {
                                                        $toString:
                                                            "$$item.productDetail._id",
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    sumPrice: 1,
                },
            },
        ];
        return await OrderModel.aggregate(agg);
    }

    async updateOrder(params: Partial<IOrder>, orderId: string) {
        await OrderModel.findByIdAndUpdate(
            new mongoose.Types.ObjectId(orderId),
            {
                ...params,
            }
        );
    }
}

export const orderServices = new OrderService();
