import ES from "@elastic/elasticsearch";
import "dotenv/config";

const configObject = {
    ip: process.env.IP_ELASTIC || "localhost",
    port: process.env.HTTP_ELASTIC || 9200,
    user: process.env.USER_ELASTIC || "elastic",
    pass: process.env.PASS_ELASTIC || "changeme",
};
const { ip, port, user, pass } = configObject;
export class ElasticSearch {
    private static readonly esClient: ES.Client = new ES.Client({
        node: `https://${ip}:${port || 9200}`,
        auth: {
            username: user,
            password: pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
        sniffOnStart: false,
        sniffInterval: false,
        sniffOnConnectionFault: false,
    });
    static async connected(successCallback?: Function) {
        try {
            await this.esClient.ping();
            console.log("elasticsearch connected");
            if (successCallback) {
                successCallback();
            }
        } catch (error) {
            console.log("connected error ", error);
        }
    }
    static async createIndex(indexName: string, body: any) {
        try {
            const exists = await this.esClient.indices.exists({
                index: indexName,
            });
            if (exists) {
                console.log(`Index "${indexName}" already exists.`);
                return;
            }

            await this.esClient.indices.create({
                index: indexName,
                body,
            });
            console.log(`Index "${indexName}" created successfully.`);
        } catch (err) {
            console.log("create index elasticsearch error: ", err);
        }
    }
    static async deleteIndex(indexName: string) {
        await this.esClient.indices.delete({ index: indexName });
        console.log("Index products removed");
    }
    static async insertDoc(indexName, _id, data) {
        return await this.esClient.index({
            index: indexName,
            id: _id,
            document: data,
        });
    }
    static async deleteDoc(indexName, _id) {
        try {
            await this.esClient.delete({
                index: indexName,
                id: _id,
            });
        } catch (err) {
            console.log("deleteDoc error ", err);
        }
    }
    static async updateDoc(indexName, _id, data) {
        await this.esClient.update({
            index: indexName,
            id: _id,
            body: {
                doc: data,
            },
            doc_as_upsert: true,
        });
    }
    static async searchAll() {
        const result = await this.esClient.search({
            index: "products",
            query: { match_all: {} }, // lấy tất cả document
        });
        return result;
    }
    static async getAllIndex() {
        const indices = await this.esClient.cat.indices({
            format: "json",
        });
        console.log("Numbers index:", indices.length);
        console.log(indices.map((i) => i.index));
    }
}
