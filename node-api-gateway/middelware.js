import { JWTDecoded } from "./helper.js";
import axios from "axios";
import dotenv from "@dotenvx/dotenvx";
dotenv.config()


export const AuthVerify = async(req,res,next)=>{
    try {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(500).json({ status: "failed", message: "Authentication credentials not provided" });
        }

        const decoded = await JWTDecoded(token)

        console.log(decoded,"checking token")

        if (decoded.status === "failed" && decoded.message === "jwt expired") {
            return res.status(401).json({ message: "Your session has expired. Please log in again", status: "session_expired" });
        }
        if (decoded.status === "failed") {
            return res.status(401).json({ message: decoded.message, status: "session_expired" })
        }

        await axios.get(`${process.env.auth}/roles/${decoded.role_id}`)
        .then((response)=>{
            req.headers['user'] = JSON.stringify({...decoded,role:response.data.role})
            console.log(req.headers['user'] ,"checking user seted")
            next()
        })
        .catch((err)=>{
            console.log(err.message,"role route not founded")
            res.status(404).json({ status: "failed", message: "role axios issuse, role not found", data: null });
        })


    } catch (error) {
        res.status(500).json({ status: "failed", message: error.message, data: null });
    }
}