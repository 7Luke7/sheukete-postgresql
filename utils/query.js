import { pool } from "../index.js"

export const query = async (text, params, callback) => {
    return pool.query(text, params, callback)
}  