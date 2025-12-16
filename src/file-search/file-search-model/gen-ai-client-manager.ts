import { GoogleGenAI } from "@google/genai";

export class GenAIClientManager {
    private static instance: GoogleGenAI | null = null;

    private constructor() {} // chặn new bên ngoài

    public static getInstance(): GoogleGenAI {
        if (!GenAIClientManager.instance) {
            GenAIClientManager.instance = new GoogleGenAI({
                apiKey: process.env.GOOGLE_GENAI_API_KEY || "your-api-key",
            });
        }

        return GenAIClientManager.instance;
    }
}

// export async function testUploadOneFile() {
//     const filePath = path.resolve(
//         process.cwd(),
//         "src/file-search/data/test.json"
//     );
//     const buffer = fs.readFileSync(filePath);
//     const blob = new Blob([buffer], {
//         type: "application/json",
//     });

//     let operation = await ai.fileSearchStores.uploadToFileSearchStore({
//         file: blob,
//         fileSearchStoreName: "fileSearchStores/apexstore-7r3oz79d2pis",
//         config: {
//             displayName: "test-file-v1",
//         },
//     });

//     while (!operation.done) {
//         await new Promise((r) => setTimeout(r, 1000));
//         operation = await ai.operations.get({ operation });
//     }

//     if (operation.error) {
//         console.error("Upload failed:", operation.error);
//         return;
//     }

//     console.log("✅ Upload OK");
//     console.log("Response:", JSON.stringify(operation.response, null, 2));
// }

// export async function listDocumentName() {
//     let documentPager = await ai.fileSearchStores.documents.list({
//         parent: "fileSearchStores/apexstore-7r3oz79d2pis",
//     });
//     console.log(documentPager);
// }

// export async function testSearchFile() {
//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: [
//             {
//                 role: "user",
//                 parts: [
//                     {
//                         text: "Cho tôi biết trong dữ liệu bạn có có những gì không.",
//                     },
//                 ],
//             },
//         ],
//         config: {
//             tools: [
//                 {
//                     fileSearch: {
//                         fileSearchStoreNames: [
//                             "fileSearchStores/apexstore-7r3oz79d2pis",
//                         ],
//                     },
//                 },
//             ],
//         },
//     });

//     console.log("🔍 Search result:");
//     console.log(response.text);
// }
