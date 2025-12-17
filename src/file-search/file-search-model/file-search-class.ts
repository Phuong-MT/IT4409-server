import { GoogleGenAI } from "@google/genai";
import { GenAIClientManager } from "./gen-ai-client-manager";
import FileSearchModel from "../../models/file-search.mongo";
import fs from "fs";

class FileSearchService {
    private client: GoogleGenAI;
    private store: {
        storeName: string;
        storeDisplay: string;
    } = {
        storeName: "",
        storeDisplay: "",
    };

    constructor() {
        this.client = GenAIClientManager.getInstance();
    }

    async initStoreOnce(storeName: string) {
        const existed = await FileSearchModel.findOne({
            storeDisplayName: storeName,
        });

        if (existed) {
            this.store = {
                storeName: existed.storeName,
                storeDisplay: existed.storeDisplayName,
            };
            console.log("Store existed:", existed.storeName);
            return;
        }

        const store = await this.client.fileSearchStores.create({
            config: { displayName: storeName },
        });

        console.log("create: ", store);
        console.log("upload to db");
        this.store = {
            storeName: store.name || this.store.storeName,
            storeDisplay: store.displayName || this.store.storeDisplay,
        };

        await FileSearchModel.create({
            version: 0,
            storeName: store.name,
            storeDisplayName: store.displayName,
            fileId: [],
        });
    }

    getStoreName() {
        return this.store.storeName;
    }

    async uploadFile(filePath: string, fileName: string, typeFile?: string) {
        if (this.store?.storeName.length > 0) {
            const buffer = fs.readFileSync(filePath);

            const blob = new Blob([buffer], {
                type: "application/json",
            });

            console.log(blob);

            let operation =
                await this.client.fileSearchStores.uploadToFileSearchStore({
                    file: blob,
                    fileSearchStoreName: this.store.storeName,
                    config: {
                        displayName: fileName,
                    },
                });

            while (!operation.done) {
                await new Promise((r) => setTimeout(r, 1000));
                operation = await this.client.operations.get({ operation });
            }

            if (operation.error) {
                console.error("Upload failed:", operation.error);
                return;
            }

            console.log("✅ Upload OK");
            console.log(
                "Response:",
                JSON.stringify(operation.response, null, 2)
            );
            await FileSearchModel.findOneAndUpdate(
                { storeName: this.store.storeName },
                {
                    $push: {
                        fileId: {
                            name: fileName,
                            idFile: operation.response?.documentName,
                        },
                    },
                },
                { new: true }
            );
        } else {
            console.log("Upload file to store error");
        }
    }

    async queryRAG(contents: string) {
        const response = await this.client.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [this.store.storeName],
                        },
                    },
                ],
            },
        });
        return response.text;
    }

    async queryRAGWithStream(contents: string, schemaResponse?: any) {
        const stream = await this.client.models.generateContentStream({
            model: "gemini-1.5-flash",
            contents,
            config: {
                responseSchema: schemaResponse,
                tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [this.store.storeName],
                        },
                    },
                ],
            },
        });
        return stream;
    }
}

export const fileSearchService = new FileSearchService();
