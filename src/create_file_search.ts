import mongoose from "mongoose";
import "dotenv/config";
import { fileSearchService } from "./file-search/file-search-model/file-search-class";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const IP = process.env.IP_DB || "localhost";
const PORT = process.env.PORT_DB || 27017;
const DATABASE = process.env.DATABASE_NAME || "TEST_DB";
const AUTH_DATABASE = process.env.AUTH_DATABASE || process.env.DATABASE_NAME;
const USER = process.env.USER_DB || "";
const PASS = process.env.PASS_DB || "";

const FOLDER_SOURCE_DATA = path.join(process.cwd(), "src/file-search/data");

async function connectDB() {
    const DB_URL = `mongodb://${IP}:${PORT}`;
    try {
        await mongoose.connect(DB_URL, {
            dbName: DATABASE,
            auth: {
                username: USER,
                password: PASS,
            },
            authSource: AUTH_DATABASE,
        });

        console.log("MongoDB connected:", new Date());
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}

async function getFileChunk(folderName: string) {
    const entries = await readdir(folderName, { withFileTypes: true });
    console.log("folder data: ", entries);
    return entries
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map((e) => e.name);
}

async function processUploadFile(chunkName) {
    const filePath = path.join(FOLDER_SOURCE_DATA, chunkName);
    console.log("process upload file: ", chunkName);
    await fileSearchService.uploadFile(filePath, chunkName);
}

async function main() {
    try {
        //step 1: get-data
        console.log("✅ process step 1: get data");
        await connectDB();
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("MongoDB database is not initialized");
        }
        const productModel = db.collection("products");
        const categoryModel = db.collection("categories");

        const products = await productModel.find({}).toArray();
        const categories = categoryModel.find({}).toArray();
        console.log("Create file data backup");
        console.log("Create file categories.json to collection categoryModel");
        //create file

        //base chunk data products
        console.log("Create file products json of chunks");

        console.log("✅ process step 1: Oke");

        //step 2: create store vector db
        console.log("✅ process step 2: create store vector database");
        await fileSearchService.initStoreOnce("apex-store");
        console.log("✅ process step 2: Oke");

        //step 3: Upload file data to store vector database
        console.log(
            "✅ process step 3: upload files data to store vector database"
        );
        const fileChunks = await getFileChunk(FOLDER_SOURCE_DATA);
        console.log("File chunks length: ", fileChunks.length);

        for (const chunk of fileChunks) {
            await processUploadFile(chunk);
        }
    } catch (err: any) {
        console.log("Create vector db error", err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

main();
