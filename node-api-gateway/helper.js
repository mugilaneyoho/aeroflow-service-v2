import jwt from "jsonwebtoken"

export const JWTDecoded = async(data)=>{
    try {       
        const token = jwt.verify(data,'auth-key')
        return token
    } catch (error) {
        if (error.message === "jwt expired") {
            return { status: "failed", message: error.message }
        }
        return { status: "failed", message: error.message, data: null }
    }
}