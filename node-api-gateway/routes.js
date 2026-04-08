import express from "express"
import dotenv from "@dotenvx/dotenvx"
dotenv.config()
import {createProxyMiddleware} from "http-proxy-middleware"
import httpServer from "http"
import { AuthVerify } from "./middelware.js"

const routes = express.Router()

const agent = new httpServer.Agent({
    keepAlive:true,
    maxSockets:50,
    maxFreeSockets:20,
    rejectUnauthorized:false,
})

routes.use("/auth",createProxyMiddleware({
    target:process.env.auth,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/institute", AuthVerify,createProxyMiddleware({
    target:process.env.institute,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/training", AuthVerify,createProxyMiddleware({
    target:process.env.training,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/telecalling", AuthVerify,createProxyMiddleware({
    target:process.env.telecalling,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/reception", AuthVerify,createProxyMiddleware({
    target:process.env.reception,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/openvidu", AuthVerify,createProxyMiddleware({
    target:process.env.openvidu,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/notifylog", AuthVerify,createProxyMiddleware({
    target:process.env.notify,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/ticket", AuthVerify,createProxyMiddleware({
    target:process.env.ticket,
    changeOrigin:true,
    agent,
    secure:true,
    proxyTimeout:10000,
    timeout:10000,
}))

routes.use("/resources", AuthVerify, createProxyMiddleware({
    target:process.env.content,
    changeOrigin:true,
    agent,
    secure:true,
}))


export default routes