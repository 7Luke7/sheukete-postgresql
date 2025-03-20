import { query } from "../../../utils/query.js";
import format from "pg-format";

export const get_all_special_notifications = async (req, res, next) => {
    const { userId, id, created_at, page = 0, total_count} = req.query;
    try {
        let text = format(`
            SELECT * %s FROM notifications
            WHERE role = 'admin' AND user_id = $1
        `, !total_count ? ', COUNT(*) OVER() AS total_count' : "")
        const conditions = [];
        const values = [userId];

        if (id && id !== "null" && created_at && created_at !== "null") {
            conditions.push("(created_at, id) < ($2::timestamptz, $3)");
            values.push(created_at, id);
        }

        if (conditions.length > 0) {
            text += " AND " + conditions.join(" AND ");
        }

        text += " \n ORDER BY created_at DESC LIMIT 8";

        const data = await query(text, values);

        if (data.rowCount > 0) {
            let hasMore
            if (total_count) {
                hasMore = (Number(total_count) - ((Number(page) + 1) * 8)) > 0 ? 
                true : false
                res.status(200).json({ notifications: data.rows, hasMore});
            } else if (data.rows[0].total_count) {
                const totalCount = data.rows[0].total_count
                const notifications = data.rows.map(row => {
                    const { total_count, ...notification } = row;
                    return notification;
                });
                hasMore = Number(totalCount) > 8
                res.status(200).json({ notifications, totalCount: data.rows[0].total_count, hasMore});
            }
        } else if (data.rowCount === 0) {
            res.status(400).json({ message: "empty" });
        } else {
            throw new Error("Unexpected {id} parameter.");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const get_all_unread_special_notifications = async (req, res, next) => {
    const { userId, id, created_at, page = 0, total_count} = req.query;
    try {
        let text = format(`
            SELECT * %s FROM notifications
            WHERE role = 'admin' AND user_id = $1 AND seen = false
        `, !total_count ? ', COUNT(*) OVER() AS total_count' : "")
        const conditions = [];
        const values = [userId];

        if (id && id !== "null" && created_at && created_at !== "null") {
            conditions.push("(created_at, id) < ($2::timestamptz, $3)");
            values.push(created_at, id);
        }

        if (conditions.length > 0) {
            text += " AND " + conditions.join(" AND ");
        }

        text += " \n ORDER BY created_at DESC LIMIT 8";

        const data = await query(text, values);

        if (data.rowCount > 0) {
            let hasMore
            if (total_count) {
                hasMore = (Number(total_count) - ((Number(page) + 1) * 8)) > 0 ? 
                true : false
                res.status(200).json({ notifications: data.rows, hasMore});
            } else if (data.rows[0].total_count) {
                const totalCount = data.rows[0].total_count
                const notifications = data.rows.map(row => {
                    const { total_count, ...notification } = row;
                    return notification;
                });
                hasMore = Number(totalCount) > 8
                res.status(200).json({ notifications, totalCount: data.rows[0].total_count, hasMore});
            }
        } else if (data.rowCount === 0) {
            res.status(400).json({ message: "empty" });
        } else {
            throw new Error("Unexpected {id} parameter.");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." });
    }
}
export const get_all_users_notifications = async (req, res, next) => {
    const {userId, id, created_at, role, page = 0, total_count} = req.query
    try {
        let text = format(`
            SELECT %s,
                n.id,
                n.role,
                user_id,
                friend_request_id,
                type,
                message,
                n.friend_request_status,
                n.created_at,
                status,
                f.from_user_id,
                f.to_user_id,
                u.firstname,
                u.lastname,
                u.prof_id,
                n.seen
            FROM notifications n
            LEFT JOIN friends f ON f.id = n.friend_request_id
            LEFT JOIN users u ON u.id = CASE 
                WHEN f.from_user_id = user_id AND status = 'accepted'
                    THEN f.to_user_id
                    ELSE f.from_user_id
                END
            AND u.role = n.role
        `, !total_count ? "COUNT(*) OVER() AS total_count" : "")
        const conditions = [`WHERE n.user_id = $1`]
        const values = [userId]

        if (id && id !== "null" && created_at && created_at !== "null") {
            conditions.push(`AND (n.created_at, n.id) < ($${conditions.length + 1}::timestamptz, $${conditions.length + 1})`)
            values.push(created_at, id)
        }

        if (role === "damkveti" || role === "xelosani") {
            conditions.push(`\n AND n.role = $${conditions.length + 1}`)
            values.push(role)
        } else if (!role) {
            conditions.push(`\n AND n.role != 'admin'`)
        }

        if (conditions.length > 0) {
            text += conditions.join(' ')
        }

        text += " \n ORDER BY n.created_at DESC LIMIT 8"

        const data = await query(text, values)

        if (data.rowCount > 0) {
            for (let i = 0; i < data.rows.length; i++) {
                const { role, prof_id } = data.rows[i];
                const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${role}/profile/browse/${prof_id}.webp`;

                data.rows[i]["image_url"] = image_url
            }
            let hasMore
            if (total_count) {
                hasMore = (Number(total_count) - ((Number(page) + 1) * 8)) > 0 ? 
                true : false
            } else if (data.rows[0].total_count) {
                const totalCount = data.rows[0].total_count
                hasMore = Number(totalCount) > 8
            }
            res.status(200).json({notifications: data.rows, hasMore})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "empty"})
        } else {
            throw new Error("Unexpected {id} parameter.")
        }
    } catch (error) {
        console.log(error)
    }
}

export const get_all_unread_users_notifications = async (req, res, next) => {
    const {userId, id, created_at, role, page = 0, total_count} = req.query
    try {
        let text = format(`
            SELECT %s,
                n.id,
                n.role,
                user_id,
                friend_request_id,
                type,
                message,
                n.friend_request_status,
                n.created_at,
                status,
                f.from_user_id,
                f.to_user_id,
                u.firstname,
                u.lastname,
                u.prof_id,
                n.seen
            FROM notifications n
            LEFT JOIN friends f ON f.id = n.friend_request_id
            LEFT JOIN users u ON u.id = CASE 
                WHEN f.from_user_id = user_id AND status = 'accepted'
                    THEN f.to_user_id
                    ELSE f.from_user_id
                END
            AND u.role = n.role
        `, !total_count ? "COUNT(*) OVER() AS total_count" : "")
        const conditions = [`WHERE n.user_id = $1 AND n.seen = false`]
        const values = [userId]

        if (id && id !== "null" && created_at && created_at !== "null") {
            conditions.push(`AND (n.created_at, n.id) < ($${conditions.length + 1}::timestamptz, $${conditions.length + 1})`)
            values.push(created_at, id)
        }

        if (role === "damkveti" || role === "xelosani") {
            conditions.push(`\n AND n.role = $${conditions.length + 1}`)
            values.push(role)
        } else if (!role) {
            conditions.push(`\n AND n.role != 'admin'`)
        }

        if (conditions.length > 0) {
            text += conditions.join(' ')
        }

        text += " \n ORDER BY n.created_at DESC LIMIT 8"
        console.log(text)

        const data = await query(text, values)

        if (data.rowCount > 0) {
            for (let i = 0; i < data.rows.length; i++) {
                const { role, prof_id } = data.rows[i];
                const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${role}/profile/browse/${prof_id}.webp`;

                data.rows[i]["image_url"] = image_url
            }
            let hasMore
            if (total_count) {
                hasMore = (Number(total_count) - ((Number(page) + 1) * 8)) > 0 ? 
                true : false
            } else if (data.rows[0].total_count) {
                const totalCount = data.rows[0].total_count
                hasMore = Number(totalCount) > 8
            }
            res.status(200).json({notifications: data.rows, hasMore})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "empty"})
        } else {
            throw new Error("Unexpected {id} parameter.")
        }
    } catch (error) {
        console.log(error)
    }
}

export const get_all_notifications = async (req, res, next) => {
    const {userId} = req.params
    try {
        const text = `
            SELECT
                (SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                    'id', id,
                    'type', type,
                    'message', message,
                    'created_at', created_at,
                    'seen', seen
                    )
                )
                    FROM notifications 
                    WHERE user_id = $1 AND role = 'admin' 
                LIMIT 4) AS admin_notifications,
                (SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', n.id,
                            'type', n.type,
                            'role', n.role,
                            'friend_request_id', n.friend_request_id,
                            'friend_request_status', n.friend_request_status,
                            'message', n.message,
                            'created_at', n.created_at,
                            'seen', n.seen,
                            'prof_id', u.prof_id,
                            'firstname', u.firstname,
                            'lastname', u.lastname
                        )
                    )
                    FROM notifications n
                    LEFT JOIN friends f ON f.id = n.friend_request_id
                    LEFT JOIN users u ON u.id = CASE 
						WHEN f.from_user_id = user_id AND status = 'accepted'
							THEN f.to_user_id
							ELSE f.from_user_id
						END
                    AND u.role = n.role
                    WHERE user_id = $1 AND n.role != 'admin' 
                LIMIT 4) AS user_notifications;
        `

        const data = await query(text, [userId])
        if (data.rowCount > 0) {
            const user_notifications = data.rows[0].user_notifications
            if (user_notifications) {
                for (let i = 0; i < user_notifications.length; i++) {
                    const { role, prof_id } =
                    user_notifications[i];
                    const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${role}/profile/browse/${prof_id}.webp`;

                    user_notifications[i]["image_url"] = image_url
                }
            } 
            res.status(200).json({notifications: data.rows[0]})
        } else if (data.rowCount === 0) {
            res.status(400).json({ message: "empty" });
        } else {
            throw new Error("Unexpected {id} parameter.");
        }
    } catch (error) {
        console.log(error)
    }
}