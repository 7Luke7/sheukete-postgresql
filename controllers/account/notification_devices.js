import { query } from "../../utils/query.js"

export const update_notification_devices = async (req, res, next) => {
    try {
        const {userId, target, role} = req.body
        const text = `
            WITH notif_target_check AS (
                SELECT CASE 
                WHEN $1 = ANY(notificationdevices) 
                THEN ARRAY_REMOVE(notificationdevices, $1)
                ELSE ARRAY_APPEND(notificationdevices, $1)
            END AS updatedDevices
            FROM users
            WHERE role = $3 AND id = $2
            )
            UPDATE users
            SET notificationdevices = (SELECT updatedDevices FROM notif_target_check)
            WHERE role = $3 AND id = $2;
        `
        const data = await query(text, [target, userId, role])

        console.log(data)
        res.status(200).json({message: "hi"})
    } catch (error) {
        console.log(error)
    }
}

export const get_targeted_notification_devices = async (req, res, next) => {
    try {
        const {userId, role} = req.body
        const text = `
            SELECT notificationdevices
                FROM users
                WHERE role = $2 AND id = $1
        `
        const data = await query(text, [userId, role])

        console.log(data.rows[0])
        res.status(200).json(data.rows[0])
    } catch (error) {
        console.log(error)
    }
}