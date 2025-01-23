import { query } from "../../utils/query.js"

export const update_notification_devices = async (req, res, next) => {
    try {
        const {userId, target} = req.body
        console.log(userId, target)
        const text = `
            WITH notif_target_check AS (
                SELECT CASE 
                WHEN $1 = ANY(notificationdevices) 
                THEN ARRAY_REMOVE(notificationdevices, $1)
                ELSE ARRAY_APPEND(notificationdevices, $1)
            END AS updatedDevices
            FROM xelosani
            WHERE id = $2
            )
            UPDATE xelosani
            SET notificationdevices = (SELECT updatedDevices FROM notif_target_check)
            WHERE id = $2;
        `
        const data = await query(text, [target, userId])

        console.log(data)
        res.status(200).json({message: "hi"})
    } catch (error) {
        console.log(error)
    }
}

export const get_targeted_notification_devices = async (req, res, next) => {
    try {
        const {userId} = req.body
        console.log(userId)
        const text = `
            SELECT notificationdevices
                FROM xelosani
                WHERE id = $1
        `
        const data = await query(text, [userId])

        console.log(data.rows[0])
        res.status(200).json(data.rows[0])
    } catch (error) {
        console.log(error)
    }
}