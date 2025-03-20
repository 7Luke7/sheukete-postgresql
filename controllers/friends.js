import { query } from "../utils/query.js";
import { verify_user } from "./sessions.js";
import { getTimeAgo } from "../utils/time.js";
import format from "pg-format";

export const send_user_friend_request = async (req, res, next) => {
  const { targetId, role } = req.params;
  try {
    const user = await verify_user(req);
    if (user === 401) {
      throw new Error("login first");
      // res.header('redirect')
    }

    const {
      rows: [receiver],
    } = await query(
      `
            SELECT id FROM users WHERE role = $2 AND prof_id = $1
        `,
      [targetId, role]
    );

    if (!receiver) {
      console.log("user doesn't exist :(.");
    }
    /* --------------------------------------------------------------------------------- */
    /* 
            This piece of code might be good when user makes direct request to this server
            But for regular use users won't be able to make request on this server on their own
            so for now and performance reasons we could just uncomment it
        */
    // const check = await query(`
    //     SELECT status FROM friends
    //     WHERE friends.to_user_id = $1 AND friends.from_user_id = $2
    //     LIMIT 1
    // `, [toUserId.id, user.userId]);

    // if (check.rowCount === 1) {
    //     throw new Error(410) // user has already send friends request its either "accepted" || "pending"
    // }
    /* -------------------------------------------------------------------------------- */


    const data = await query(
      `
            INSERT INTO friends (from_user_id, to_user_id, role)
            VALUES ($1, $2, $3)
            RETURNING id
        `,
      [user.userId, receiver.id, user.role]
    );

    if (data.rowCount > 0) {
      const sender = await query(
        `
                  SELECT firstname, lastname
                  FROM users
                  WHERE role = $1 AND id = $2
                `,
        [user.role, user.userId]
      );
      const notification_insert_query = `
                INSERT INTO notifications (user_id, friend_request_id, type, message, role, friend_request_status)
                VALUES (
                  $1,
                  $2,
                  'FRIEND_REQUEST',
                  $3, 
                  $4,
                  'pending'
                )
                RETURNING id
            `;
      const { firstname, lastname } = sender.rows[0];
      const text = `${
        firstname + " " + lastname
      } გიგზავნით მეგობრობის მოთხოვნას.`;

      const notification_data = await query(notification_insert_query, [
        receiver.id,
        data.rows[0].id,
        text,
        user.role,
      ]);

      res.status(200).json({
        message: "მეგობრობის მოთხოვნა წარმატებით გაიგზავნა.",
        notification_id: notification_data.rows[0].id,
        friend_request_id: data.rows[0].id,
      });
    } else if (data.rowCount === 0) {
      res
        .status(400)
        .json({ message: "მეგობრობის მოთხოვნის გაგზავნა ვერ მოხერხდა." });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
  } catch (error) {
    if (error.message === "410") {
      res
        .status(400)
        .json({ message: "მეგობრობის მოთხოვნა უკვე გაგზავნილია." });
    }
    console.log(error);
  }
};

export const cancel_friend_request = async (req, res, next) => {
  const { status } = req.params;
  try {
    if (status !== "pending" && status !== "accepted") {
      throw new Error("დაფიქსირდა შეცდომა მეგობრის წაშლისას.");
    }
    const user = await verify_user(req);
    if (user === 401) {
      throw new Error("login first");
      // res.header('redirect')
    }

    const { friend_request_id, sender_role } = req.body;

    let deleteFriendsText = `
      DELETE FROM friends
      WHERE friends.id = $1 AND status = $2
    `

    const values = [friend_request_id, status]

    if (sender_role) {
      deleteFriendsText += " AND role = $3"
      values.push(sender_role)
    }

    const friendsResult = await query(deleteFriendsText, values);

    if (friendsResult.rowCount > 0) {
      res.status(200).json({ message: "მეგობრობის მოთხოვნა უარყოფილია." });
    } else if (friendsResult.rowCount === 0) {
      await query("ROLLBACK");
      res
        .status(400)
        .json({ message: "მეგობრობის მოთხოვნის უარყოფა ვერ მოხერხდა." });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
  } catch (error) {
    console.log(error);
  }
};

export const check_for_unseen_notifications = async (req, res, next) => {
  try {
    const user = await verify_user(req);
    if (user === 401) {
      throw new Error("login first");
      // res.header('redirect')
    }

    const text = `
           SELECT EXISTS(
                SELECT 1 FROM notifications
                WHERE seen = false AND user_id = $1
            ) AS exists
        `;

    const data = await query(text, [user.userId]);

    if (data.rows[0].exists) {
      res.status(200).json({ message: data.rows[0].exists });
    } else if (!data.rows[0].exists) {
      res.status(400).json({ message: data.rows[0].exists });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
    res.status(200);
  } catch (error) {
    console.log(error);
  }
};

export const get_notifications = async (req, res, next) => {
  const { notif_type } = req.params;
  try {
    const user = await verify_user(req);
    if (user === 401) {
      throw new Error("login first");
      // res.header('redirect')
    }

    if (notif_type !== "all" && notif_type !== "unread") {
        throw new Error("Notification type is not correct, force failing request.")
    }

    let queryString = `
        SELECT *
        FROM notifications
        WHERE user_id = $1
    `;
    const params = [user.userId]

    if (notif_type === "unread") {
        queryString += ` AND seen = $2\n`
        params.push(false)
    }

    queryString += "ORDER BY created_at DESC LIMIT 5;"

    const receiver_data = await query(queryString, params);
    if (receiver_data.rowCount > 0) {
      const data = receiver_data.rows;

      const notifications = [];
      for (let i = 0; i < data.length; i++) {
        data[i].created_at = getTimeAgo(data[i].created_at);
        if (data[i].role === "xelosani" || data[i].role === "damkveti") {
          const friend_request_type = data[i].type
          if (friend_request_type === "FRIEND_REQUEST" || friend_request_type === "FRIEND_REQUEST_ACCEPTED") {
            const friend_request_id = data[i].friend_request_id;
            const query_friend_request = format(`
                          SELECT %s as sender_user_id
                          FROM friends
                          WHERE id = $1 AND role = $2
                         `, friend_request_type === "FRIEND_REQUEST" ? "from_user_id" : "to_user_id");

            const friend_request = await query(query_friend_request, [
              friend_request_id,
              data[i].role
            ]);

            if (friend_request.rowCount > 0) {
              const query_sender = `
                SELECT prof_id, firstname, lastname FROM users
                WHERE id = $1
              `;

              const sender_data = await query(query_sender, [friend_request.rows[0].sender_user_id]);

              if (sender_data.rowCount > 0) {
                const { prof_id, firstname, lastname } =
                  sender_data.rows[0];
                const image_url = `${process.env.FILESERVER_SERVER_DOMAIN}:${process.env.FILESERVER_SERVER_PORT}/static/images/${data[i].role}/profile/browse/${prof_id}.webp`;

                const { user_id, ...rest } = data[i];
                notifications.push({
                  ...rest,
                  prof_id,
                  image_url,
                  role: data[i].role,
                  firstname,
                  lastname,
                });
              } else if (sender_data.rowCount === 0) {
                res.status(400).json({
                  message: "მეგობრობის შემომთავაზებლის ექაუნთი ვერ მოიძებნა.",
                });
              } else {
                throw new Error("დაფიქსირდა პრობლემა");
              }
            }
          } else {
            // friend_request არ არის
            notifications.push(data[i]);
          }
        } else if (data[i].role === "admin") {
          /* 
                we could have some images in fileserver dedicated for only admin notifications
                but for now we are using placeholder which is alright I guess
                
                So first I thought I would remove image link that I have for friend notifications
                which links to user profile page but now I think that I can add completly
                different link whcich will link to "სიახლეები" page there user will be able to see
                the news better and its gonna help SEO as well.

                Now I am thinking If I should do "cursor" based pagination for endless scroll
                but wouldn't it be better to make dedicated page for viewing notifications broader
            */
          notifications.push(data[i]);
        } else {
          throw new Error("really unexpected error for real real.");
        }
      }


      res.status(200).json(notifications);
    } else if (receiver_data.rowCount === 0) {
      res.status(400).json({ message: null });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
  } catch (error) {
    console.log(error);
  }
};

export const accept_friend_request = async (req, res, next) => {
  try {
    const user = await verify_user(req);
    if (user === 401) {
      throw new Error("login first");
      // res.header('redirect')
    }

    const { friend_request_id, sender_role, notification_id } = req.body;

    await query( // here we could have "role" as well for faster query
      format(`
              DELETE FROM notifications
              WHERE %I = $1 AND role = $2 AND type = 'FRIEND_REQUEST'
          `, notification_id ? "id" : "friend_request_id"),
      [notification_id || friend_request_id, sender_role]
    );

    const text = `
            UPDATE friends
              SET status = 'accepted'
            WHERE id = $1 AND role = $2 AND status = 'pending'
            RETURNING from_user_id, id, to_user_id
        `;

    const data = await query(text, [friend_request_id, sender_role]);

    if (data.rowCount > 0) {
      const sender = await query(
        `
                  SELECT firstname, lastname
                  FROM users
                  WHERE id = $1 AND role = $2
                `,
        [data.rows[0].to_user_id, user.role]
      );

      const { firstname, lastname } = sender.rows[0];
      const message = `${
        firstname + " " + lastname
      } დაეთანხმა მეგობრობის მოთხოვნას.`;

      await query(
        `
                INSERT INTO notifications (user_id, type, message, friend_request_id, role, friend_request_status)
                VALUES (
                  $1,
                  'FRIEND_REQUEST_ACCEPTED',
                  $2,
                  $3,
                  $4,
                  'accepted'
                )
            `,
        [data.rows[0].from_user_id, message, data.rows[0].id, user.role]
      );
      res.status(200).json({ message: "მეგობარი წარმატებით დაემატა." });
    } else if (data.rowCount === 0) {
      res.status(400).json({ message: "მეგობარის დამატება ვერ მოხერხდა." });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
  } catch (error) {
    console.log(error);
  }
};

export const mark_notification_as_read = async (req, res, next) => {
  try {
    const { notification_id, notification_type, seen, role } = req.body;
    const user = await verify_user(req);
    if (user === 401) {
      // here actually we might check for profId matches yk
      throw new Error("login first");
      // res.header('redirect')
    }

    const text = `
            UPDATE notifications
                SET seen = $3
            WHERE id = $1 AND type = $2 AND role = $4 AND seen = $5
        `;

    const data = await query(text, [notification_id, notification_type, !seen, role, seen]);

    if (data.rowCount > 0) {
      res.status(200).json({ message: "success" });
    } else if (data.rowCount === 0) {
      res.status(400).json({ message: "UPDATE_FAILED" });
    } else {
      throw new Error("დაფიქსირდა შეცდომა");
    }
  } catch (error) {
    console.log(error);
  }
};

export const remove_notification = async (req, res, next) => {
  try {
    const { notification_id, notification_type, seen, role } = req.body;
    const user = await verify_user(req);
    if (user === 401) {
      // here actually we might check for profId matches yk
      throw new Error("login first");
      // res.header('redirect')
    }

    const text = `
      DELETE FROM notifications
      WHERE id = $1 AND type = $2 AND seen = $3 AND role = $4
    `;

    const data = await query(text, [notification_id, notification_type, seen, role]);

    if (data.rowCount > 0) {
      res.status(200).json({ message: "success" });
    } else if (data.rowCount === 0) {
      res.status(400).json({ message: "UPDATE_FAILED" });
    } else {
      throw new Error("დაფიქსირდა შეცდომა");
    }
  } catch (error) {
    console.log(error);
  }
};

export const mark_all_notification_as_read = async (req, res, next) => {
    try {
      const user = await verify_user(req);
      if (user === 401) {
        // here actually we might check for profId matches yk
        throw new Error("login first");
        // res.header('redirect')
      }
        const text = `
            UPDATE notifications
            SET seen = true
            WHERE seen = false AND user_id = $1
        `

        const data = await query(text, [user.userId])

        if (data.rowCount > 0) {
            res.status(200).json({message: "success"})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "failed"})
        } else {
            throw new Error("Someting went wrong.")
        }
    } catch (error) {
        console.log(error)
    }
}

export const mark_specials_as_read = async (req, res, next) => {
  try {
    const user = await verify_user(req);
      if (user === 401) {
        // here actually we might check for profId matches yk
        throw new Error("login first");
        // res.header('redirect')
      }
        const text = `
          UPDATE notifications
            SET seen = true
          WHERE seen = false AND user_id = $1 AND role = 'admin'
        `

        const data = await query(text, [user.userId])

        if (data.rowCount > 0) {
            res.status(200).json({message: "success"})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "failed"})
        } else {
            throw new Error("Someting went wrong.")
        }
  } catch (error) {
    console.log(error)
  }
}

export const mark_users_as_read = async (req, res, next) => {
  try {
    const user = await verify_user(req);
      if (user === 401) {
        // here actually we might check for profId matches yk
        throw new Error("login first");
        // res.header('redirect')
      }
        const text = `
          UPDATE notifications
          SET seen = true
          WHERE seen = false AND user_id = $1 AND (role = 'xelosani' OR role = 'damkveti')
        `

        const data = await query(text, [user.userId])

        if (data.rowCount > 0) {
            res.status(200).json({message: "success"})
        } else if (data.rowCount === 0) {
            res.status(400).json({message: "failed"})
        } else {
            throw new Error("Someting went wrong.")
        }
  } catch (error) {
    console.log(error)
  }
}

export const get_friends_home = async (req, res, next) => {
  const {userId} = req.body

  /*
    in damkveti you may know
    check for if cities/neighbourhood of both users intersect
    check if they worked together
    check if they have mutual friends 
  */
  try {
    const text = `
        WITH current_user_friends AS (
    SELECT 
        CASE 
            WHEN from_user_id = $1 THEN to_user_id
            ELSE from_user_id
        END AS friend_id
    FROM friends
    WHERE (from_user_id = $1 OR to_user_id = $1)
      AND status = 'accepted'
)
SELECT
    u.prof_id,
    u.firstname,
    u.lastname,
    f.id AS friend_request_id,
    fr.mutual_friends,
    u.role
FROM friends f
INNER JOIN users u 
    ON f.from_user_id = u.id AND u.role = f.role
LEFT JOIN LATERAL (
    SELECT 
        JSONB_BUILD_OBJECT(
            'friends', COALESCE(
                JSONB_AGG(
                    JSONB_BUILD_OBJECT('role', amf.role, 'prof_id', amf.prof_id)
                ) FILTER (WHERE idx <= 2),
                '[]'::jsonb
            ),
            'mutual_friend_count', COUNT(*)
        ) AS mutual_friends
    FROM (
        SELECT 
            uf.role,
            uf.prof_id,
            ROW_NUMBER() OVER (ORDER BY uf.prof_id) AS idx
        FROM (
            SELECT 
                CASE 
                    WHEN from_user_id = f.from_user_id THEN to_user_id
                    ELSE from_user_id
                END AS friend_id
            FROM friends
            WHERE (from_user_id = f.from_user_id OR to_user_id = f.from_user_id)
              AND status = 'accepted'
        ) sender_friends
        INNER JOIN current_user_friends cuf 
            ON cuf.friend_id = sender_friends.friend_id
        INNER JOIN users uf 
            ON uf.id = sender_friends.friend_id
    ) amf
) fr ON TRUE
WHERE f.to_user_id = $1 
  AND f.status = 'pending'
LIMIT 4;
    `

    const data = await query(text, [userId])

    if (data.rowCount > 0) {
      res.status(200).json({friends: data.rows})
    } else if (data.rowCount === 0) {
      res.status(400).json({message: "მეგობრობის მოთხოვნები ცარიელია."})
    } else {
      throw new Error("something went wrong")
    }
  } catch (error) {
    console.log(error);
  }
};

export const get_mutual_friends = async (req, res, next) => {
  let {target_user, cursor} = req.body
  try {
    const user = await verify_user(req)
    if (user === 401) {
      throw new Error("Login first!")
    }

    /* 
      take further look at this later
      We could have friend.id instead of target_user
      and then we may alter the query to make it faster
      I am just trying to have better security while keeping
      performance fairly fast
    */
    const text = `
    WITH viewing_user_friends AS (
    SELECT
        CASE 
            WHEN from_user_id = $3 THEN to_user_id
            ELSE from_user_id
        END AS friend_id
    FROM friends
    WHERE (from_user_id = $3 OR to_user_id = $3)
      AND status = 'accepted'
    )
    SELECT 
        mutual_friends.*
    FROM users
    INNER JOIN LATERAL (
        SELECT 
            u.role,
            u.firstname,
            u.lastname,
            u.prof_id,
            u.id,
            JSONB_BUILD_OBJECT(
                'mutual_friends', COALESCE(mf.mutual_friends, '[]'::jsonb),
                'mutual_friends_count', COALESCE(mf.mutual_friends_count, 0)
            ) AS mutual_friends
        FROM (
            SELECT
                CASE 
                    WHEN f.to_user_id = users.id THEN f.from_user_id
                    ELSE f.to_user_id
                END AS friend_id
            FROM friends f
            INNER JOIN viewing_user_friends vus
                ON ((vus.friend_id = f.to_user_id AND f.from_user_id = users.id) 
                OR (vus.friend_id = f.from_user_id AND f.to_user_id = users.id))
            WHERE f.status = 'accepted'
        ) mutual_friend
        INNER JOIN users u ON mutual_friend.friend_id = u.id
        LEFT JOIN LATERAL (
            SELECT 
                JSONB_AGG(friend) FILTER (WHERE idx <= 2) AS mutual_friends,
                COUNT(*) AS mutual_friends_count
            FROM (
                SELECT 
                    JSONB_BUILD_OBJECT('role', u.role, 'prof_id', u.prof_id) AS friend,
                    ROW_NUMBER() OVER (ORDER BY u.prof_id) AS idx
                FROM (
                    SELECT 
                        CASE 
                            WHEN f.from_user_id = mutual_friend.friend_id THEN f.to_user_id
                            ELSE f.from_user_id
                        END AS mutual_friend_id
                    FROM friends f
                    INNER JOIN viewing_user_friends vus 
                        ON ((f.to_user_id = vus.friend_id AND f.from_user_id = mutual_friend.friend_id) 
                        OR (f.from_user_id = vus.friend_id AND f.to_user_id = mutual_friend.friend_id))
                    WHERE f.status = 'accepted'
                ) umf
                INNER JOIN users u ON umf.mutual_friend_id = u.id
            ) amf
        ) mf ON TRUE
    ) mutual_friends ON TRUE
    WHERE users.role = $1 
      AND users.prof_id = $2
    LIMIT 10;
`
    const data = await query(text, [target_user.role, target_user.prof_id, user.userId])

    if (data.rowCount > 0) {
      res.status(200).json({mutual_friends: data.rows})
    }
  } catch (error) {
    console.log(error)
  }
} 

export const get_friend_requests = async (req, res, next) => {
  try {
    const user = await verify_user(req)
    if (user === 401) {
      throw new Error("Login first!")
    }

    const text = `
      SELECT 
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'prof_id', u.prof_id, 
            'role', u.role, 
            'firstname', u.firstname, 
            'lastname', u.lastname, 
            'created_at', friends.created_at,
            'mutual_friends', mutual_friends
          )
        ) AS users,
        COUNT(*) AS friend_requests_count
      FROM friends
      INNER JOIN users u ON u.id = from_user_id AND u.role = friends.role
      INNER JOIN LATERAL (  
          SELECT JSONB_BUILD_OBJECT(
          'mutual_friends', JSONB_AGG(JSONB_BUILD_OBJECT('prof_id', ufs.prof_id, 'role', ufs.role)) FILTER (WHERE idx <= 2),
          'mutual_friends_count', COUNT(*)
        ) as mutual_friends
          FROM (
            SELECT 
              CASE WHEN f.from_user_id = u.id THEN f.to_user_id ELSE f.from_user_id END AS friend_id,
              ROW_NUMBER() OVER (ORDER BY u.prof_id) AS idx
            FROM friends f
            WHERE (u.id = f.from_user_id OR u.id = to_user_id)
            AND status = 'accepted'
          ) muff
          INNER JOIN friends uf ON ((uf.to_user_id = $1 AND uf.from_user_id = muff.friend_id) OR (uf.to_user_id = muff.friend_id AND uf.from_user_id = $1))
          AND status = 'accepted'
          INNER JOIN users ufs ON ufs.id = muff.friend_id
      ) mutual_friends ON TRUE
      WHERE friends.to_user_id = $1
      AND friends.status = 'pending'
      LIMIT 10
    `
  
    const data = await query(text, [user.userId])
    
    if (data.rowCount) {
      res.status(200).json(data.rows[0])
    }
  } catch (error) {
    console.log(error)
  }
}

export const get_all_friends = async (req, res, next) => {
  const {cursor} = req.body
  try {
    const user = await verify_user(req)
    if (user === 401) {
      throw new Error("Login first!")
    }

    //btw when querying users later try to add role as well
    const text = `
      SELECT 
        JSONB_AGG(JSONB_BUILD_OBJECT(
          'prof_id', u.prof_id,
          'role', u.role,
          'firstname', u.firstname,
          'lastname', u.lastname,
          'created_at', friends.created_at,
          'id', friends.id,
          'mutual_friends', mutual_friends.umf,
          'mutual_friends_count', mutual_friends.mutual_friends_count
        )) AS users,
        COUNT(*) as friend_count
      FROM friends
      INNER JOIN users u ON u.id = CASE WHEN to_user_id = $1 THEN from_user_id ELSE to_user_id END
      LEFT JOIN LATERAL (
        SELECT 
          JSONB_AGG(JSONB_BUILD_OBJECT('prof_id', users.prof_id, 'role', users.role)) AS umf,
          COUNT(*) AS mutual_friends_count
        FROM (
          SELECT 
            CASE WHEN fr.from_user_id = u.id 
            THEN fr.to_user_id 
            ELSE fr.from_user_id END AS friend_id
          FROM friends fr
          WHERE (fr.from_user_id = u.id OR fr.to_user_id = u.id) AND status = 'accepted'
        ) mutual_friend
        INNER JOIN friends ON ((friends.from_user_id = $1 AND friends.to_user_id = mutual_friend.friend_id) OR 
          (friends.from_user_id = mutual_friend.friend_id  AND friends.to_user_id = $1))
        INNER JOIN users ON users.id = mutual_friend.friend_id
        AND status = 'accepted' 
      ) mutual_friends ON TRUE
      WHERE (from_user_id = $1 OR to_user_id = $1) AND friends.status = 'accepted'
    `

    const data = await query(text, [user.userId])

    console.log(data.rows[0].users)
    if (data.rowCount) {
      res.status(200).json(data.rows[0])
    }
  } catch (error) {
    console.log(error)
  }
}

export const get_sent_requests = async (req, res, next) => {
  const {cursor} = req.body
  try {
    const user = await verify_user(req)
    if (user === 401) {
      throw new Error("Login first!")
    }

    const text = `
      SELECT 
        ru.prof_id,
        ru.role, 
        ru.firstname, 
        ru.lastname, 
        friends.id,
        friends.created_at,
        mutual_friends.mutual_friends,
        mutual_friends.mutual_friends_count
      FROM friends
      INNER JOIN users ru ON to_user_id = ru.id
      LEFT JOIN LATERAL (
        SELECT 
          JSONB_AGG(JSONB_BUILD_OBJECT('prof_id', u.prof_id, 'role', u.role)) FILTER (WHERE idx <= 2) AS mutual_friends,
          COUNT(*) AS mutual_friends_count
        FROM (
          SELECT 
            CASE WHEN muf.from_user_id = ru.id THEN muf.to_user_id ELSE muf.from_user_id END AS friend_id,
            ROW_NUMBER() OVER (ORDER BY ru.prof_id) AS idx
          FROM friends muf
          WHERE muf.status = 'accepted' AND (muf.to_user_id = ru.id OR muf.from_user_id = ru.id)
        ) AS sub
        INNER JOIN friends umf ON (umf.to_user_id = friend_id AND umf.from_user_id = $1) OR (umf.from_user_id = friend_id AND umf.to_user_id = $1)
        AND status = 'accepted'
        INNER JOIN users u ON u.id = friend_id
      ) AS mutual_friends ON TRUE
      WHERE from_user_id = $1 AND status = 'pending' AND friends.role = $2
    `
    const data = await query(text, [user.userId, user.role]) 

    if (data.rowCount) {
      res.status(200).json(data.rows)
    }
  } catch (error) {
    console.log(error)
  }
}