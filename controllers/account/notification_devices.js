import { query } from "../../utils/query.js"

export const update_notification_devices = async (req, res, next) => {
    try {
        const {userId, target} = req.body
        const text = `
            WITH notif_target_check AS (
                SELECT CASE 
                WHEN $1 = ANY("notificationDevices") 
                THEN ARRAY_REMOVE("notificationDevices", $1)
                ELSE ARRAY_APPEND("notificationDevices", $1)
            END AS updatedDevices
            FROM xelosani
            WHERE id = $2
            )
            UPDATE xelosani
            SET "notificationDevices" = (SELECT updatedDevices FROM notif_target_check)
            WHERE id = $2;
        `
        const data = await query(text, [target, userId])

        res.status(200).json()
    } catch (error) {
        console.log(error)
    }
}

export const get_targeted_notification_devices = async (req, res, next) => {
    try {
        const {userId} = req.body
        const text = `
            SELECT "notificationDevices" 
                FROM xelosani
                WHERE id = $1
        `
        const data = await query(text, [userId])

        res.status(200).json(data.rows[0])
    } catch (error) {
        console.log(error)
    }
}