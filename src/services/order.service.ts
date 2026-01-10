import mongoose from "mongoose";
import { productTableName } from "../models/product-model.mongo";
import OrderModel from "../models/order-model.mongo";
import { IOrder } from "../shared/models/order-model";
import CartModel from "../models/cart-model.mongo";
import ProductModel from "../models/product-model.mongo";
import { IProductItem } from "../shared/models/order-model";
import { Contacts } from "../shared/contacts";

const STATUS_ORDER = Contacts.Status.Order;
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

    async createOrderFromCart(userId: string, toAddress: string, note: string) {
        // Khởi tạo session để dùng MongoDB transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        /**
         * Lấy danh sách sản phẩm trong giỏ hàng của user
         * - Tìm theo userId
         * - populate productId để lấy thông tin chi tiết sản phẩm
         * - gắn session để đảm bảo transaction nhất quán
         */
        try {
            // Lấy giỏ hàng và populate sản phẩm
            const cartItems: any = await CartModel.find({
                userId: new mongoose.Types.ObjectId(userId),
            })
                .populate("productId")
                .session(session);

            if (!cartItems || cartItems.length === 0) {
                throw new Error("Cart is empty");
            }

            let sumPrice = 0;
            const listProduct: IProductItem[] = [];

            for (const item of cartItems) {
                const product = item.productId;

                if (!product) {
                    throw new Error(`Product not found for item ${item._id}`);
                }

                // 2. Tìm Variant cụ thể trong mảng variants của Product
                // item.variantId lấy từ Cart
                const variant = product.variants.find(
                    (v: any) => v._id.toString() === item.variantId.toString()
                );

                if (!variant) {
                    throw new Error(
                        `Variant option no longer exists for product: ${product.title}`
                    );
                }

                await ProductModel.updateOne(
                    {
                        _id: product._id,
                        "variants._id": variant._id, // Tìm đúng variant trong mảng
                    },
                    {
                        $inc: { "variants.$.quantity": -item.quantity }, // Trừ số lượng
                    },
                    { session } // <--- BẮT BUỘC PHẢI CÓ SESSION
                );

                // 3. Lấy giá từ Variant (Ưu tiên giá Sale của variant nếu có)
                const finalPrice =
                    variant.salePrice && variant.salePrice < variant.price
                        ? variant.salePrice
                        : variant.price;

                const itemTotalMoney = finalPrice * item.quantity;
                sumPrice += itemTotalMoney;
                listProduct.push({
                    productId: product._id,
                    variantId: variant._id, // <--- LƯU VARIANT ID VÀO ORDER

                    // Tạo tên đầy đủ: "iPhone 15 - Màu Đỏ (128GB)"
                    title: `${product.title} - ${variant.colorName} (${variant.version})`,

                    description: product.description || "",
                    price: finalPrice, // <--- LƯU GIÁ CỦA VARIANT
                    quantity: item.quantity,
                    discount: 0,
                    totalMoney: itemTotalMoney,
                });
            }

            // Tạo đơn hàng mới
            const newOrders = await OrderModel.create(
                [
                    {
                        userId: userId, // Lưu dạng String theo schema của bạn
                        listProduct: listProduct,
                        sumPrice: sumPrice,
                        note: note || "",
                        toAddress: toAddress,
                        // statusOrder tự động lấy default từ Schema
                    },
                ],
                { session }
            );

            // Xóa giỏ hàng
            await CartModel.deleteMany(
                { userId: new mongoose.Types.ObjectId(userId) },
                { session }
            );

            await session.commitTransaction();
            return newOrders[0]; // Trả về đơn hàng vừa tạo
        } catch (error) {
            await session.abortTransaction();
            throw error; // Ném lỗi ra để Controller bắt
        } finally {
            session.endSession();
        }
    }
    async createOrder(params: IOrder) {
        const {
            _id,
            listProduct,
            userId,
            sumPrice,
            note,
            toAddress,
            numberPhone,
            userName,
            statusOrder,
        } = params;
        const newOrder = await OrderModel.create({
            listProduct,
            userId,
            sumPrice,
            note,
            toAddress,
            numberPhone,
            userName,
            statusOrder: STATUS_ORDER.ORDERED,
        });
        return newOrder;
    }
}

export const orderServices = new OrderService();
