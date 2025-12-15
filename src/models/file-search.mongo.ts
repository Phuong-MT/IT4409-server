import { model, Schema } from "mongoose";

export const fileSearchTableName = "FileSearch";

const FileSearchName = new Schema(
    {
        name: { type: String, required: true }, // name file in folder data
        idFile: { type: String, required: true }, // id of gemini
    },
    { _id: false }
);

const fileSearchSchema = new Schema(
    {
        version: { type: Number, required: true },
        storeName: { type: String, required: true },
        storeDisplayName: { type: String, required: true },
        fileId: { type: [FileSearchName], required: true },
    },
    { timestamps: true, versionKey: false }
);

const FileSearchModel = model(fileSearchTableName, fileSearchSchema);

export default FileSearchModel;
