import { PostgresErrorHandler } from "../../errors/handle_postgres_errors.js"
import { query } from "../../utils/query.js"

export const create_damkveti = async (req, res, next) => {
    try {
        const {firstname, lastname, notification_devices, email, password } = req.body
        const text = `INSERT INTO damkveti(firstname, lastname, notification_devices, ${notification_devices}, password) VALUES($1, $2, $3, $4, $5) RETURNING id, prof_id`
        const values = [firstname, lastname, [notification_devices], email || req.body.phone, password]
        const data = await query(text, values)

        console.log(data)
        res.status(200).json(data.rows)
    } catch (error) {
        console.log(error)
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}