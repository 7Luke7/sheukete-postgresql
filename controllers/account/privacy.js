import { query } from "../../utils/query.js"

export const get_xelosani_privacy = async (req, res, next) => {
    try {
        const {userId} = req.body
        const text = `
            SELECT privacy FROM xelosani
                WHERE id = $1
        `
        const data = await query(text, [userId])

        res.status(200).json(data.rows[0].privacy)
    } catch (error) {
        console.log(error)
        res.status(400).json(error.message)
    }
}

export const update_xelosani_privacy = async (req, res, next) => {
    try {
        const {field, value, userId} = req.body
        const text = `
            UPDATE xelosani 
                SET privacy = jsonb_set(privacy, $1::text[], $2::jsonb)
                WHERE id = $3
        `
        const data = await query(text, [[field], JSON.stringify(value), userId])

        res.status(200).send("success")
    } catch (error) {
        console.log(error)
        res.status(400).json(error.message)
    }
}