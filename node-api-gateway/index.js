
import express from "express";
import cors from "cors";
import dotenv from "@dotenvx/dotenvx"
import routes from "./routes.js";
dotenv.config()


const server = express()

server.use(cors())

server.use('/',routes)

const PORT = process.env.PORT

server.listen(PORT,(error)=>{
    if (error) {
       return console.error("api gateway running error:",error)
    }
    console.log("api gateway running at", PORT)
})