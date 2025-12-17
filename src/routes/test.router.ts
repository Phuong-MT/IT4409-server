import express from "express";
import fs from "fs";
import { fileSearchService } from "../file-search/file-search-model/file-search-class";
import path from "path";

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

testRouter.post("/test/query", async (req, res) => {
    try {
        const contents = `
            Tôi muốn tìm 1 chiếc dien thoai chup hinh tot nhat.
        `;
        const prompt = {
            role: "user",
            content: contents,
        };
        const result = await fileSearchService.queryRAG(JSON.stringify(prompt));
        return res.status(200).json(result);
    } catch (err: any) {
        console.log("Query rag error: ", err);
        return res.status(500).json("Error");
    }
});

export default testRouter;
