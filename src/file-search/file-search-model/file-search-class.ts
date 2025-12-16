import { GoogleGenAI } from "@google/genai";
import { GenAIClientManager } from "./gen-ai-client-manager";
import FileSearchModel from "../../models/file-search.mongo";

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

    // async searchFile(query: string) {
    //     return this.client.models.generateContent({
    //         model: "models/gemini-1.5-flash",
    //         contents: query,
    //     });
    // }

    async searchByFileId(fileId: string, query: string) {
        // implement logic search theo file
    }
}

export const fileSearchService = new FileSearchService();
