import mongoose, { PipelineStage } from "mongoose";
import { productTableName } from "../models/product-model.mongo";
import OrderModel from "../models/order-model.mongo";
import { IOrder } from "../shared/models/order-model";
import CartModel from "../models/cart-model.mongo";
import ProductModel from "../models/product-model.mongo";
import { IProductItem } from "../shared/models/order-model";
import { Contacts } from "../shared/contacts";
import { notificationService } from "./notification.service";

const STATUS_ORDER = Contacts.Status.Order;
const PAYMENT_STATUS = Contacts.Status.Payment;
const PAYMENT_METHOD = Contacts.PaymentMethod;

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

                // if (!product) {
                //     throw new Error(`Product not found for item ${item._id}`);
                // }
                if (!product) {
                    console.warn(`⚠️ Skip cart item ${item._id}: product deleted`);
                    continue;
                }

                // 2. Tìm Variant cụ thể trong mảng variants của Product
                // item.variantId lấy từ Cart
                const variant = product.variants.find(
                    (v: any) => v._id.toString() === item.variantId.toString()
                );

                // if (!variant) {
                //     throw new Error(
                //         `Variant option no longer exists for product: ${product.title}`
                //     );
                // }
                if (!variant) {
                    console.warn(`⚠️ Skip cart item ${item._id}: variant deleted`);
                    continue;
                }

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
                        userId: new mongoose.Types.ObjectId(userId), // Lưu dạng String theo schema của bạn
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
            // --- BẮT ĐẦU ĐOẠN BẮN THÔNG BÁO ---
            const createdOrder = newOrders[0]; // Lấy object đơn hàng ra khỏi mảng
            
            // Không cần await để logic chạy nền, trả response cho khách cho nhanh
            notificationService.pushNotification(
                "ORDER_CREATED",
                "📦 Đơn hàng mới từ Giỏ hàng!",
                `Đơn hàng #${createdOrder._id} trị giá ${createdOrder.sumPrice.toLocaleString()}đ vừa được tạo.`,
                { 
                    orderId: createdOrder._id,
                    link: `admin/orders/${createdOrder._id}` // Link để Admin click vào nhảy tới đơn
                }
            );
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
            userId: new mongoose.Types.ObjectId(userId),
            sumPrice,
            note,
            toAddress,
            numberPhone,
            userName,
            statusOrder: STATUS_ORDER.ORDERED,
        });
        return newOrder;
    }
    async userVisibleOrders(userId: string) {
        const arg: PipelineStage[] = [
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "payments",
                    localField: "_id",
                    foreignField: "orderId",
                    as: "payment",
                },
            },
            {
                $unwind: {
                    path: "$payment",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $match: {
                    $or: [
                        {
                            "payment.method": PAYMENT_METHOD.COD,
                            statusOrder: {
                                $in: [
                                    STATUS_ORDER.PROCESSING,
                                    STATUS_ORDER.SHIPPING,
                                    STATUS_ORDER.DELIVERED,
                                    STATUS_ORDER.RETURNED,
                                ],
                            },
                        },
                        {
                            "payment.method": PAYMENT_METHOD.STRIPE,
                            "payment.status": PAYMENT_STATUS.PAID,
                        },
                    ],
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ];
        return await OrderModel.aggregate(arg);
    }
    async getUserCancelledOrders(userId: string) {
        return OrderModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    statusOrder: Contacts.Status.Order.CANCELLED,
                },
            },
            {
                $lookup: {
                    from: "payments",
                    localField: "_id",
                    foreignField: "orderId",
                    as: "payment",
                },
            },
            {
                $unwind: {
                    path: "$payment",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
        ]);
    }
    async getUserReturnOrder(userId: string) {
        const arg: PipelineStage[] = [
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    statusOrder: Contacts.Status.Order.RETURNED,
                },
            },
            {
                $lookup: {
                    from: "payments",
                    localField: "_id",
                    foreignField: "orderId",
                    as: "payment",
                },
            },
            {
                $unwind: {
                    path: "$payment",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
        ];
        return await OrderModel.aggregate(arg);
    }

    /**
     * [ADMIN] Lấy tất cả đơn hàng HỢP LỆ 
     * - Logic hợp lệ:
     * + COD: Phải nằm trong các trạng thái cho phép (ORDERED, PROCESSING...)
     * + Stripe: Bắt buộc Payment Status phải là PAID (Đã trả tiền)
     */
    async getAllOrders(page: number = 1, limit: number = 10, search?: string, status?: string) {
        try {
            const skip = (page - 1) * limit;

            // 1. Pipeline cơ bản: Join với bảng Payments để kiểm tra độ uy tín
            const basePipeline: PipelineStage[] = [
                // Nối bảng Payment
                {
                    $lookup: {
                        from: "payments",
                        localField: "_id",
                        foreignField: "orderId",
                        as: "payment",
                    },
                },
                {
                    $unwind: {
                        path: "$payment",
                        preserveNullAndEmptyArrays: true, // Giữ lại đơn COD (thường chưa có record payment hoặc null)
                    },
                },
                // --- BỘ LỌC CHỐNG SPAM ---
                {
                    $match: {
                        $or: [
                            // Trường hợp 1: COD (Thanh toán khi nhận hàng)
                            {
                                "payment.method": PAYMENT_METHOD.COD,
                                statusOrder: {
                                    $in: [
                                        STATUS_ORDER.ORDERED, // Admin cần thấy đơn mới để duyệt
                                        STATUS_ORDER.PROCESSING,
                                        STATUS_ORDER.SHIPPING,
                                        STATUS_ORDER.DELIVERED,
                                        STATUS_ORDER.RETURNED,
                                        STATUS_ORDER.CANCELLED 
                                    ],
                                },
                            },
                            // Trường hợp 2: Stripe (Thanh toán Online)
                            // Chỉ lấy đơn đã thanh toán thành công (PAID)
                            // Đơn bấm nút mà không trả tiền (PENDING/UNPAID) sẽ bị loại bỏ
                            {
                                "payment.method": PAYMENT_METHOD.STRIPE,
                                "payment.status": PAYMENT_STATUS.PAID,
                            },
                        ],
                    },
                },
            ];

            // 2. Xử lý Lọc theo Trạng thái & Tìm kiếm từ Admin
            const matchStage: any = {};

            // Nếu Admin lọc theo tab (ví dụ: Đang giao, Đã giao...)
            if (status && status !== 'ALL') {
                matchStage.statusOrder = status;
            }

            // Nếu Admin tìm kiếm theo mã đơn hàng
            if (search) {
                if (mongoose.Types.ObjectId.isValid(search)) {
                    matchStage._id = new mongoose.Types.ObjectId(search);
                } else {
                    // Nếu mã tìm kiếm không hợp lệ -> Trả về rỗng luôn
                     return {
                        orders: [],
                        total: 0,
                        currentPage: page,
                        totalPages: 0
                    };
                }
            }

            // Đẩy điều kiện lọc vào pipeline nếu có
            if (Object.keys(matchStage).length > 0) {
                basePipeline.push({ $match: matchStage });
            }

            // 3. Thực thi Query song song (Lấy dữ liệu + Đếm tổng số trang)
            // Dùng $facet để chạy 1 lần DB lấy được cả 2
            const result = await OrderModel.aggregate([
                ...basePipeline,
                {
                    $facet: {
                        // Nhánh 1: Lấy danh sách đơn hàng
                        orders: [
                            { $sort: { createdAt: -1 } }, // Mới nhất lên đầu
                            { $skip: skip },
                            { $limit: limit },
                            // Join bảng User để lấy tên, email người mua
                            {
                                $lookup: {
                                    from: "users", 
                                    localField: "userId",
                                    foreignField: "_id",
                                    as: "userInfo"
                                }
                            },
                            {
                                $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true }
                            },
                            // Chỉ lấy các trường cần thiết để hiển thị bảng
                            {
                                $project: {
                                    _id: 1,
                                    statusOrder: 1,
                                    sumPrice: 1,
                                    createdAt: 1,
                                    toAddress: 1,
                                    "payment.method": 1,
                                    "payment.status": 1,
                                    listProducts: 1,
                                    // Thông tin user Flatten ra cho dễ dùng
                                    "userId": {
                                        _id: "$userInfo._id",
                                        email: "$userInfo.email",
                                        fullName: "$userInfo.userName",
                                        phone: "$userInfo.phoneNumber"
                                    }
                                }
                            }
                        ],
                        // Nhánh 2: Đếm tổng số lượng (sau khi đã lọc sạch rác)
                        totalCount: [
                            { $count: "count" }
                        ]
                    }
                }
            ]);

            const orders = result[0].orders;
            const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

            return {
                orders,
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                itemsPerPage: limit
            };

        } catch (error) {
            throw error;
        }
    }
}

export const orderServices = new OrderService();
