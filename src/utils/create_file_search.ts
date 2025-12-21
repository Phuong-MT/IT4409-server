import mongoose from "mongoose";
import "dotenv/config";
import { fileSearchService } from "../file-search/file-search-model/file-search-class";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import connectDatabase from "./connectDB";
import CategoryModel, {
    categoryTableName,
} from "../models/category-model.mongo";

const FOLDER_SOURCE_DATA = path.join(process.cwd(), "src/file-search/data");

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
        mkdir(FOLDER_SOURCE_DATA, { recursive: true });

        //step 1: get-data
        console.log("✅ process step 1: get data");
        await connectDatabase();
        console.log("Create file data backup");
        const categories = await CategoryModel.find();
        console.log(`📦 Found ${categories.length} categories`);

        const fileCatePath = path.join(
            FOLDER_SOURCE_DATA,
            `${categoryTableName.toLocaleLowerCase()}.json`
        );
        await writeFile(
            fileCatePath,
            JSON.stringify(categories, null, 2),
            "utf-8"
        );
        /*
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
        */
    } catch (err: any) {
        console.log("Create vector db error", err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

main();
