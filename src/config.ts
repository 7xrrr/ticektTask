import { findProjectRoot } from "./utils/tools.js";
import path from "path";

export default {
    token: process.env.token || "", // Bot token from https://discord.com/developers/applications
    color: "903EB8", // Default color for embeds
    prefix: "-", // Bot prefix its not used in the bot
    debugMode: false, // Debug mode for the bot this allow only developers to use the bot
    developers: ["622486784038666242"], // Developer IDs for the bot

    // u can use only one database at a time
    database: {
        mongoDB: {
            useMongoDB: true,
            mongoDB: "mongodb://127.0.0.1:27017/ticket",
        },
        mySQL: {
            useMySQL: false, // set to true if you want to use MySQL
            host: "localhost",
            port: 3306,
            user: "root",
            password: "",
            database: "ticket",
        },
        sqlite: {
            useSQLite: false,
            storage: path.join(findProjectRoot(), "database", "database.sqlite")
        }
    }






};
