import {MongoClient, Db, Collection} from "mongodb";

import {DB} from "../config/config";
import {log} from "../config/log";
import {HashObject, HashNumber} from "../../common/interfaces/baseTypes";

const
    collections: HashObject<Collection> = {},
    counts: HashNumber = {};

export {
    connectDb,
    disconnectDb,
    getDbStats,
    replaceId,
    collections,
    counts
}

let database: Promise<Db> = null;

function connectDb(): Promise<Db> {
    if (database)
        return database;
    return database = MongoClient.connect(DB.URL).then(db => Promise.all(["users"]
        .filter(collectionName => db.collection(collectionName))
        .map(collectionName => db.collection(collectionName).count({}).then(count => {
            collections[collectionName] = db.collection(collectionName);
            return counts[collectionName] = count;
        }))).then(() => db));
}

function disconnectDb(): Promise<void> {
    return connectDb().then(db => db.close());
}

function getDbStats() {
    return connectDb()
        .then(db => ['users', 'questions'].map(collectionName => db.collection(collectionName)
            ? db.collection(collectionName).count({}).then(count => log.info("collection", collectionName, "has", count, "items"))
            : null));
}

function replaceId<T>(result: T): T {
    if (result) {
        result["id"] = result["_id"];
        delete result["_id"];
    }
    return result;
}
