import { CustomError } from "../errors/CustomError.js"
import { PostgresErrorHandler } from "../errors/handle_postgres_errors.js"
import { query } from "../utils/query.js"
 
export const register_xelosani = async (req, res, next) => {
    try {
        const {firstname, lastname, notification_devices, email, password} = req.body
        const text = `INSERT INTO xelosani 
            (firstname, lastname, password, notificationdevices, role, email, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING prof_id, role, id
        `
        const values = [firstname, lastname, password, [notification_devices], "xelosani", email || null, req.body.phone || null]
        const data = await query(text, values)

        res.status(200).json(data.rows[0])
    } catch (error) {
        console.log(error)
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}

export const register_damkveti = async (req, res, next) => {
    try {
        const {firstname, lastname, notification_devices, email, password} = req.body
        const text = `INSERT INTO damkveti 
            (firstname, lastname, password, notificationdevices, role, email, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING prof_id, role, id`
        const values = [firstname, lastname, password, [notification_devices], "damkveti", email || null, req.body.phone || null]
        const data = await query(text, values)

        res.status(200).json(data.rows[0])
    } catch (error) {
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}

export const login = async (req, res, next) => {
    try {
        const field = Object.keys(req.body).includes("email") ? "email" : "phone"
        const text = `
            SELECT u.user_id, u.role, u.password, u.prof_id 
            FROM users u
            WHERE u.${field} = $1
        `
        const data = await query(text, [req.body[field]])
        if (!data.rows.length) throw new CustomError("4400", field, "მომხმარებელი")

        res.status(200).json({...data.rows[0]})
    } catch (error) {
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}

export const change_user_password = async (req, res, next) => {
    try {
        const text = `
            UPDATE users
                SET password = $1
                WHERE prof_id = $2
        `
        await query(text, [req.body.password, req.params.profId])

        res.status(200).json("success")
    } catch (error) {
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table, "/resetpassword").identify_error()
        res.status(400).json(message)
    }
}