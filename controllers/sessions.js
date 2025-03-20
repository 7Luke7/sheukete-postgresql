export const verify_user = async (request) => {
    try {
        const session = request.headers.cookie.split("sessionId=")[1]
        if (!session) {
            throw new Error(401)
        }

        

        if (!user) {
            throw new Error(401)
        }

        return JSON.parse(user)
    } catch (error) {
        if (error.message === "401") {
            return 401
        }
        console.log("VERIFY_USER ERROR", error)
    }
}