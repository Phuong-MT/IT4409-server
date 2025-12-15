import { GoogleGenAI } from "@google/genai";
import FileSearchModel from "../models/file-search.mongo";
import path from "path";
import fs from "fs";

const ai = new GoogleGenAI({
    apiKey: "AIzaSyDUUXeva58AzMMVeuCIocy2nYIec-dgmhQ",
});

export async function initStoreOnce(storeName: string) {
    const existed = await FileSearchModel.findOne({
        storeDisplayName: storeName,
    });

    if (existed) {
        console.log("Store existed:", existed.storeName);
        return;
    }

    const store = await ai.fileSearchStores.create({
        config: { displayName: storeName },
    });

    console.log("create: ", store);
    await FileSearchModel.create({
        version: 0,
        storeName: store.name,
        storeDisplayName: store.displayName,
        fileId: [],
    });
}

export async function testUploadOneFile() {
    const filePath = path.resolve(
        process.cwd(),
        "src/file-search/data/test.json"
    );

    // ✅ ĐỌC NỘI DUNG FILE
    const buffer = fs.readFileSync(filePath);

    // ✅ TẠO BLOB TỪ NỘI DUNG
    const blob = new Blob([buffer], {
        type: "application/json",
    });

    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: blob,
        fileSearchStoreName: "fileSearchStores/apexstore-7r3oz79d2pis",
        config: {
            displayName: "test-file-v1",
        },
    });

    while (!operation.done) {
        await new Promise((r) => setTimeout(r, 1000));
        operation = await ai.operations.get({ operation });
    }

    if (operation.error) {
        console.error("Upload failed:", operation.error);
        return;
    }

    console.log("✅ Upload OK");
    console.log("Response:", JSON.stringify(operation.response, null, 2));
}

export async function listDocumentName() {
    let documentPager = await ai.fileSearchStores.documents.list({
        parent: "fileSearchStores/apexstore-7r3oz79d2pis",
    });
    console.log(documentPager);
}

export async function testSearchFile() {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: "Cho tôi biết trong dữ liệu bạn có có những gì không.",
                    },
                ],
            },
        ],
        config: {
            tools: [
                {
                    fileSearch: {
                        fileSearchStoreNames: [
                            "fileSearchStores/apexstore-7r3oz79d2pis",
                        ],
                    },
                },
            ],
        },
    });

    console.log("🔍 Search result:");
    console.log(response.text);
}
