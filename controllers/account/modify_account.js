import { query } from "../../utils/query.js"

export const modify_sensitive_xelosani_fields = async (req, res, next) => {
    try {
        const {userId, firstname, lastname, email, phone} = req.body
        const text = `
            UPDATE xelosani
                SET 
                    firstname = COALESCE($1, firstname),
                    lastname = COALESCE($2, lastname),
                    email = COALESCE($3, email),
                    phone = COALESCE($4, phone),
                    "stepPercent" = "stepPercent" + 12.5

                WHERE id = $5
            ` 
        const data = await query(text, [firstname, lastname, email, phone, userId])

        console.log(data)
        res.status(200).json("success")
    } catch (error) {
        console.log(error)
    }
} 