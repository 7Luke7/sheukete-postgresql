import { CustomError } from "../errors/CustomError.js"
import { PostgresErrorHandler } from "../errors/handle_postgres_errors.js"
import { query } from "../utils/query.js"

export const register = async (req, res, next) => {
    try {
        const { firstname, lastname, notification_devices, role, email, password } = req.body;
        const phone = req.body.phone || null;

        await query('BEGIN');
        const check_uniqueness = `
            INSERT INTO unique_users (email, phone, user_id, role)
            VALUES ($1, $2, gen_random_uuid(), $3)
            RETURNING user_id, role;
        `;

        const checkResult = await query(check_uniqueness, [email || null, phone, role]);

        if (checkResult.rowCount === 0) {
            if (phone) {
                return res.status(400).json({
                    field: "phoneEmail",
                    message: "მომხმარებელი მობილურის ნომრით უკვე არსებობს."
                })
            } else {
                return res.status(400).json({
                    field: "phoneEmail",
                    message: "მომხმარებელი მეილით უკვე არსებობს."
                })
            }
        }

        const text = `
            INSERT INTO users (firstname, lastname, password, role, email, phone, id, notificationdevices)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING prof_id;
        `;
        const values = [firstname, lastname, password, role, email || null, phone, checkResult.rows[0].user_id, [notification_devices]];
        const data = await query(text, values);

        if (role === "xelosani") {
            const text1 = `
                INSERT INTO users_xelosani_specific (user_id, role)
                VALUES($1, $2)
            `
            await query(text1, [checkResult.rows[0].user_id, role]);
        }

        await query('COMMIT');
        res.status(200).json({
            prof_id: data.rows[0].prof_id,
            role: checkResult.rows[0].role,
            id: checkResult.rows[0].user_id
        });
    } catch (error) {
        await query('ROLLBACK');
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error();
        res.status(400).json(message);
    }
}

export const login = async (req, res, next) => {
    try {
        const field = Object.keys(req.body).includes("email") ? "email" : "phone"
        const text = `
            SELECT id, role, password, prof_id 
            FROM users
            WHERE ${field} = $1
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