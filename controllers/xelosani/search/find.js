import { CustomError } from "../../../errors/CustomError.js"
import { PostgresErrorHandler } from "../../../errors/handle_postgres_errors.js"
import { query } from "../../../utils/query.js"

export const find_user_by_phone_email = async (req, res, next) => {
    try {
        const field = Object.keys(req.body).includes("email") ? "email" : "phone"
        const text = `
            SELECT firstname, role, lastname, prof_id FROM users
                WHERE ${field} = $1
        `
        const data = await query(text, [req.body[field]])
        if (!data.rows.length) throw new CustomError("4400", field, "მომხმარებელი")

        res.status(200).json(data.rows[0])
    } catch (error) {
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}

export const get_email_by_profId = async (req, res, next) => {
    try {
        const profId = req.params.profId
        const text = `
            SELECT email FROM users
                WHERE prof_id = $1
        `
        const data = await query(text, [profId])

        res.status(200).json(data.rows[0])
    } catch (error) {
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}