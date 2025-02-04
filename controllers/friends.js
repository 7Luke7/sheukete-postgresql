import {config} from "dotenv"
config()
import { query } from "../utils/query.js"
import { verify_user } from "./sessions.js"
import { getTimeAgo } from "../utils/time.js"

export const send_xelosani_friend_request = async (req, res, next) => {
    const {targetId} = req.params
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }

        const { rows: [toUserId] } = await query(`
            SELECT id FROM users WHERE role = 'xelosani' AND prof_id = $1
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

        if (data.rowCount > 0) {
            const sender = await query(
                `
                  SELECT firstname, lastname
                  FROM users
                  WHERE role = $1 AND id = $2
                `
            , [user.role, user.userId])
            const notification_insert_query = `
                INSERT INTO notifications (user_id, friend_request_id, type, message)
                VALUES (
                  $1,
                  $2,
                  'FRIEND_REQUEST',
                  $3
                )
                RETURNING id
            `
            const {firstname, lastname} = sender.rows[0]
            const text = `${firstname + " " + lastname} გიგზავნით მეგობრობის მოთხოვნას.`

            const notification_data = await query(notification_insert_query, [toUserId.id, data.rows[0].id, text]) 

            res.status(200).json({ message: "მეგობრობის მოთხოვნა წარმატებით გაიგზავნა.", notification_id: notification_data.rows[0].id, friend_request_id: data.rows[0].id });
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
            SELECT id FROM users WHERE role = 'xelosani' AND prof_id = $1
        `, [req.params.profId]);
        
        if (!toUserId) {
            console.log("user doesn't exist :(.")
            // handle error: one or both not found
        }

        const data = await query(`
            SELECT status, id FROM friends
            WHERE 
            (friends.to_user_id = $1 AND friends.from_user_id = $2)
              OR 
            (friends.to_user_id = $2 AND friends.from_user_id = $1)
        `, [toUserId.id, user.userId]);
  
        if (data.rowCount > 0) {
            const [status, id] = [data.rows[0].status, data.rows[0].id]
            if (status === "pending" || status === "accepted") {
                res.status(200).json({ status, id, });
            } else {
                res.status(200).json({status})
            }
          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "მომხმარებლებს შორის კავშირა არ ყოფილა." });
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
        
        const {friend_request_id} = req.body
        const deleteNotificationsText = `
            DELETE FROM notifications
            WHERE friend_request_id = $1 
            AND (type = 'FRIEND_REQUEST' OR type = 'REQUEST_ACCEPTED')
        `;

        const deleteFriendsText = `
            DELETE FROM friends
            WHERE friends.id = $1
        `;
        await query("BEGIN")

        await query(deleteNotificationsText, [friend_request_id]);

        const friendsResult = await query(deleteFriendsText, [friend_request_id]);
    

        if (friendsResult.rowCount > 0) {
            await query('COMMIT'); 
            res.status(200).json({ message: "მეგობრობის მოთხოვნა უარყოფილია." });
          } else if (friendsResult.rowCount === 0) {
            await query('ROLLBACK'); 
            res.status(400).json({ message: "მეგობრობის მოთხოვნის წაშლა ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        console.log(error)
        await query('ROLLBACK'); 
    }
}

export const check_for_unseen_notifications = async (req, res, next) => {
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }
         
        const text = `
           SELECT EXISTS(
                SELECT 1 FROM notifications
                WHERE seen = false AND user_id = $1
            ) AS exists
        `

        const data = await query(text, [user.userId])

        if (data.rows[0].exists) {
            res.status(200).json({ message: data.rows[0].exists });
          } else if (!data.rows[0].exists) {
            res.status(400).json({ message: data.rows[0].exists });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
        res.status(200)
    } catch (error) {
        console.log(error)
    }
}

export const get_notifications = async (req, res, next) => {
    try {
        const user = await verify_user(req)
        if (user === 401) {
            throw new Error("login first")
            // res.header('redirect')
        }
        
        const query_receiver = `
            SELECT 
                *
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 5;
        ` // *Increase limit on scroll* //

        // await query(
        // `
        //     UPDATE notifications
        //     SET seen = true
        //     WHERE user_id = $1 AND seen = false
        //     AND (type = 'FRIEND_REQUEST' OR type = 'REQUEST_ACCEPTED') 
        // `, [user.userId])

        const receiver_data = await query(query_receiver, [user.userId])
        if (receiver_data.rowCount > 0) {
            /*
                We could add role to friends table so we know which table to query leading to better
                performance
            */
            const notifications = []
            for (let i = 0; i < receiver_data.rows.length; i++) {
                receiver_data.rows[i].created_at = getTimeAgo(receiver_data.rows[i].created_at)
                if (receiver_data.rows[i].type === "FRIEND_REQUEST") {
                   const friend_request_id = receiver_data.rows[i].friend_request_id
                   const query_friend_request = `
                    SELECT from_user_id 
                    FROM friends
                    WHERE id = $1
                   `

                   const friend_request = await query(query_friend_request, [friend_request_id])
                   if (friend_request.rowCount > 0) {
                    const query_sender = `
                      SELECT role, prof_id, firstname, lastname FROM users
                      WHERE id = $1
                    ` 

                    const sender_data = await query(query_sender, [friend_request.rows[0].from_user_id]) 
                    
                    if (sender_data.rowCount > 0) {
                        const {role, prof_id, firstname, lastname} = sender_data.rows[0] 
                        const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${role}/profile/${prof_id}.webp`

                        const {user_id, ...rest} = receiver_data.rows[i]
                        notifications.push({ ...rest, prof_id, image_url, role, firstname, lastname})
                      } else if (sender_data.rowCount === 0) {
                        res.status(400).json({ message: "მეგობრობის შემომთავაზებლის ექაუნთი ვერ მოიძებნა." });
                      } else {
                        throw new Error("დაფიქსირდა პრობლემა");
                    }
                   }
                } else if (receiver_data.rows[i].type === "REQUEST_ACCEPTED") {
                    const friend_request_id = receiver_data.rows[i].friend_request_id
                    const query_friend_request = `
                        SELECT to_user_id
                        FROM friends
                        WHERE id = $1
                    `

                   const friend_request = await query(query_friend_request, [friend_request_id])
                   if (friend_request.rowCount > 0) {
                    const accepter_query = `
                      SELECT role, prof_id, firstname, lastname FROM users
                      WHERE id = $1
                    ` 

                    const accpeter_data = await query(accepter_query, [friend_request.rows[0].to_user_id]) 
                    
                    if (accpeter_data.rowCount > 0) {
                        const {role, prof_id, firstname, lastname} = accpeter_data.rows[0] 
                        const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${role}/profile/${prof_id}.webp`

                        const {user_id, ...rest} = receiver_data.rows[i]
                        notifications.push({ ...rest, prof_id, image_url, role, firstname, lastname})
                      } else if (accpeter_data.rowCount === 0) {
                        res.status(400).json({ message: "მეგობრობის შემომთავაზებლის ექაუნთი ვერ მოიძებნა." });
                      } else {
                        throw new Error("დაფიქსირდა პრობლემა");
                    }
                   }
                } else {
                    // friend_request არ არის
                    notifications.push(receiver_data.rows[i])
                }
            }

            res.status(200).json(notifications);
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

        const {friend_request_id, notification_id} = req.body

        const text = `
            UPDATE friends
              SET status = 'accepted'
            WHERE id = $1 
            RETURNING from_user_id, id, to_user_id
        `

        const data = await query(text, [friend_request_id])

        if (data.rowCount > 0) {
            await query(`
                DELETE FROM notifications
                WHERE id = $1
            `, [notification_id])
            const sender = await query(
                `
                  SELECT firstname, lastname
                  FROM users
                  WHERE id = $1
                `
            , [data.rows[0].to_user_id])

            const {firstname, lastname} = sender.rows[0]
            const message = `${firstname + " " + lastname} დაეთანხმა მეგობრობის მოთხოვნას.`

            await query(`
                INSERT INTO notifications (user_id, friend_request_id, type, message)
                VALUES (
                  $1,
                  $2,
                  'REQUEST_ACCEPTED',
                  $3
                )
            `, [data.rows[0].from_user_id, data.rows[0].id, message])
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

export const mark_notification_as_read = async (req, res, next) => {
    try {
        const {notification_id, notification_type} = req.body
        const user = await verify_user(req)
        if (user === 401) { // here actually we might check for profId matches yk
            throw new Error("login first")
            // res.header('redirect')
        }

        const text = `
            UPDATE notifications
            SET seen = true
            WHERE id = $1 AND type = $2
        `

        const data = await query(text, [notification_id, notification_type])

        if (data.rowCount > 0) {
            res.status(200).json({message: "success"})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "UPDATE_FAILED"})
        } else {
            throw new Error("დაფიქსირდა შეცდომა")
        }
    } catch (error) {
        console.log(error)
    }
}

export const mark_notification_as = async (req, res, next) => {
    try {
        const {notification_id, notification_type, seen} = req.body
        const user = await verify_user(req)
        if (user === 401) { // here actually we might check for profId matches yk
            throw new Error("login first")
            // res.header('redirect')
        }

        const text = `
            UPDATE notifications
            SET seen = $3
            WHERE id = $1 AND type = $2
        `

        const data = await query(text, [notification_id, notification_type, !seen])

        if (data.rowCount > 0) {
            res.status(200).json({message: "success"})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "UPDATE_FAILED"})
        } else {
            throw new Error("დაფიქსირდა შეცდომა")
        }
    } catch (error) {
        console.log(error)
    }
}

export const remove_notification = async (req, res, next) => {
    try {
        const {notification_id, notification_type} = req.body
        const user = await verify_user(req)
        if (user === 401) { // here actually we might check for profId matches yk
            throw new Error("login first")
            // res.header('redirect')
        }

        const text = `
            DELETE FROM notifications
            WHERE id = $1 AND type = $2
        `

        const data = await query(text, [notification_id, notification_type])

        if (data.rowCount > 0) {
            res.status(200).json({message: "success"})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "UPDATE_FAILED"})
        } else {
            throw new Error("დაფიქსირდა შეცდომა")
        }
    } catch (error) {
        console.log(error)
    }
}