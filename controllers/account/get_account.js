import { query } from "../../utils/query.js"

export const get_account = async (req, res, next) => {
    try {
        const {userId} = req.body
        const text = `
            SELECT firstname, lastname, email, phone
                FROM xelosani 
                WHERE id = $1
            ` 
        const data = await query(text, [userId])

        res.status(200).json(data.rows[0])
    } catch (error) {
        console.log(error)
    }
}