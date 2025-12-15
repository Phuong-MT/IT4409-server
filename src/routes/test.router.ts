import express from "express";
import {
    listDocumentName,
    testSearchFile,
    testUploadOneFile,
} from "../file-search";

const testRouter = express.Router();

testRouter.post("/test/upload-file-search", async (req, res) => {
    try {
        await testUploadOneFile();
        return res.status(200).json("Oke");
    } catch (err) {
        console.log(err);
        return res.status(500).json("upload file search error");
    }
});
testRouter.post("/test/file-list", async (req, res) => {
    try {
        await listDocumentName();
        return res.status(200).json("Oke");
    } catch (err) {
        console.log(err);
        return res.status(500).json("list file name error");
    }
});

testRouter.post("/test/query-search", async (req, res) => {
    try {
        await testSearchFile();
        return res.status(200).json("Oke");
    } catch (error) {
        console.log(error);
        return res.status(500).json("query-search error");
    }
});
export default testRouter;
