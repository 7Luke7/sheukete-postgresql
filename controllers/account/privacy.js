import { query } from "../../utils/query.js"

export const get_xelosani_privacy = async (req, res, next) => {
    try {
        const {userId, role} = req.body
        const text = `
            SELECT privacy FROM users
                WHERE role = $2 AND id = $1
        `
        const data = await query(text, [userId, role])

        res.status(200).json(data.rows[0].privacy)
    } catch (error) {
        console.log(error)
        res.status(400).json(error.message)
    }
}

export const update_xelosani_privacy = async (req, res, next) => {
    try {
        const {field, value, userId, role} = req.body
        console.log(field, value, userId)
        const text = `
            UPDATE users 
                SET privacy = jsonb_set(privacy, $1::text[], $2::jsonb)
                WHERE role = $4 AND id = $3
        `
        await query(text, [[field], JSON.stringify(value), userId, role])

        res.status(200).send("success")
    } catch (error) {
        console.log(error)
        res.status(400).json(error.message)
    }
}