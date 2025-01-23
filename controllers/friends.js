import {config} from "dotenv"
config()
import { query } from "../utils/query.js"
import { verify_user } from "./sessions.js"

export const send_xelosani_friend_request = async (req, res, next) => {
    const {targetId} = req.params
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }

        const { rows: [toUserId] } = await query(`
            SELECT id FROM users WHERE prof_id = $1
        `, [targetId]);
        
        if (!toUserId) {
            console.log("user doesn't exist :(.")
        }
        const check = await query(`
            SELECT status FROM friends
            WHERE friends.to_user_id = $1 AND friends.from_user_id = $2
            LIMIT 1
        `, [toUserId.id, user.userId]);
        
        if (check.rowCount === 1) {
            throw new Error(410)
        }

        const data = await query(`
            INSERT INTO friends (from_user_id, to_user_id)
            VALUES ($1, $2)
            RETURNING id
        `, [user.userId, toUserId.id]);

        console.log(data)
        if (data.rowCount > 0) {
            const notification_insert_query = `
                INSERT INTO notifications (user_id, friend_request_id, type, message)
                VALUES (
                $1,
                $2,
                'FRIEND_REQUEST',
                'User X sent you a friend request'
                );

            `

            await query(notification_insert_query, [toUserId.id, data.rows[0].id]) 
            res.status(200).json({ message: "მეგობრობის მოთხოვნა წარმატებით გაიგზავნა.", friend_request_id: data.rows[0].id });
          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "მეგობრობის მოთხოვნის გაგზავნა ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        if (error.message === "410") {
            res.status(400).json({message: "მეგობრობის მოთხოვნა უკვე გაგზავნილია."})
        }
        console.log(error)
    }
}

export const friend_request_status = async (req, res, next) => {
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }

        const { rows: [toUserId] } = await query(`
            SELECT id FROM xelosani WHERE prof_id = $1
        `, [req.params.profId]);
        
        if (!toUserId) {
            console.log("user doesn't exist :(.")
            // handle error: one or both not found
        }

        const data = await query(`
            SELECT status, id FROM friends
            WHERE friends.to_user_id = $1 AND friends.from_user_id = $2
        `, [toUserId.id, user.userId]);
  
        if (data.rowCount > 0) {
            const [status, id] = [data.rows[0].status, data.rows[0].id]
            console.log(status, id)
            if (status === "pending") {
                res.status(200).json({ status, id, });
            } else if(data.rows[0].status === "accepted") {
                res.status(200).json({status, id})
            } else {
                res.status(200).json({status})
            }
          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "მეგობრობის მოთხოვნის გაგზავნა ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        console.log(error)
    }
}

export const cancel_friend_request = async (req, res, next) => {
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }
        
        const text = `
            DELETE FROM friends
            WHERE friends.id = $1
        `

        const data = await query(text, [req.params.requestId])

        if (data.rowCount > 0) {
            res.status(200).json({ message: "მეგობრობის მოთხოვნა წარმატებით წაიშალა." });
          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "მეგობრობის მოთხოვნის წაშლა ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        console.log(error)
    }
}

export const get_pending_and_other_user_accepted_friend_requests = async (req, res, next) => {
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }
        
        const query_receiver = `
            SELECT * FROM friends
            WHERE friends.to_user_id = $1 AND friends.status = 'pending'
        `

        const query_accepted_request = `
            SELECT * FROM friends
            WHERE friends.from_user_id = $1 AND friends.status = 'accepted'
        `

        const receiver_data = await query(query_receiver, [user.userId])
        const accepted_request_data = await query(query_accepted_request, [user.userId])
        if (receiver_data.rowCount > 0) {
            /*
                We could add role to friends table so we know which table to query leading to better
                performance
            */

            const notifications = []
            for (let i = 0; i < receiver_data.rows.length; i++) {
                const sender_id = receiver_data.rows[i].from_user_id
                const query_sender = `
                    SELECT role, prof_id, firstname, lastname FROM users
                    WHERE users.id = $1
                `

                const sender_data = await query(query_sender, [sender_id]) 
                if (sender_data.rowCount > 0) {
                    const {role, prof_id, firstname, lastname} = sender_data.rows[0] 
                    const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${role}/profile/${prof_id}.webp`

                    notifications.push({ prof_id, image_url, id: receiver_data.rows[i].id, role, firstname, lastname, status: receiver_data.rows[i].status})
                  } else if (sender_data.rowCount === 0) {
                    res.status(400).json({ message: "მეგობრობის შემომთავაზებლის ექაუნთი ვერ მოიძებნა." });
                  } else {
                    throw new Error("დაფიქსირდა პრობლემა");
                }
            }

            res.status(200).json({count: receiver_data.rowCount, notifications});
          } else if (receiver_data.rowCount === 0) {
            res.status(400).json({ message: "თქვენი ექაუნთი ვერ მოიძებნა სცადეთ თავიდან." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        console.log(error)
    }
}

export const accept_friend_request = async (req, res, next) => {
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }

        const text = `
            UPDATE friends
            SET status = 'accepted'
            WHERE friends.id = $1 
        `

        const data = await query(text, [req.params.requestId])

        if (data.rowCount > 0) {
            res.status(200).json({ message: "მეგობარი წარმატებით დაემატა." });
          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "მეგობარის დამატება ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        console.log(error)
    }
}