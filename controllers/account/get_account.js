import { query } from "../../utils/query.js"

export const get_account = async (req, res, next) => {
    try {
        const {userId} = req.body
        console.log(userId)
        const text = `
            SELECT firstname, lastname, email, phone
                FROM users
                WHERE role = 'xelosani' AND id = $1
            ` 
        const data = await query(text, [userId])

        console.log(data.rows)
        res.status(200).json(data.rows[0])
    } catch (error) {
        console.log(error)
    }
}