import express from "express";
import fs from "fs";
import { fileSearchService } from "../file-search/file-search-model/file-search-class";
import path from "path";
import { getUserPromptQuerySearchProduct } from "../utils/prompt/user/query-search-user-prompt";
import { cleanHTMLChunk } from "../utils";

const testRouter = express.Router();

testRouter.post("/test/upload-file", async (req, res) => {
    try {
        const filePath = path.resolve(
            process.cwd(),
            "src/file-search/data/mobile.json"
        );
        await fileSearchService.uploadFile(filePath, "mobile");
        return res.status(200).json("oke");
    } catch (err: any) {
        console.log("upload file error: ", err);
        return res.status(500).json("Error");
    }
});

// testRouter.post("/test/query", async (req, res) => {
//     try {
//         const result = await fileSearchService.queryRAG(
//             `Nhiệm vụ của bạn là cung cấp các sản phầm theo yêu cầu của người dùng. Bạn chỉ được trả về dưới dạng JSON với cấu trúc: [{
//             title: **tên sản phẩm**,
//             price: ** giá sảm phẩm **
//         },...]
//             `,
//             "Tôi cần tìm các sản phầm về Iphone 15"
//         );
//         return res.status(200).json(result);
//     } catch (err: any) {
//         console.log("Query rag error: ", err);
//         return res.status(500).json("Error");
//     }
// });
testRouter.post("/test/query", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json("invalid");
        }
        const systemPrompt = fs.readFileSync(
            path.join(
                process.cwd(),
                "src/utils/prompt/system/query-search-system-prompt.txt"
            ),
            "utf-8"
        );

        const userPrompt = getUserPromptQuerySearchProduct({ text });
        const result = await fileSearchService.queryRAG(
            systemPrompt,
            userPrompt,
            {
                type: "array",
                items: {
                    type: "object",
                    required: ["_id", "title", "brand", "categoryId"],
                    properties: {
                        _id: { type: "string" },
                        title: { type: "string" },
                        brand: { type: "string" },
                        categoryId: { type: "string" },
                    },
                    additionalProperties: false,
                },
            }
        );
        console.log("result: ", cleanHTMLChunk(result ?? ""));
        return res.status(200).json(cleanHTMLChunk(result ?? ""));
    } catch (err: any) {
        console.log("Query rag error: ", err);
        return res.status(500).json("Error");
    }
});

export default testRouter;
