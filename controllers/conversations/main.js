import { query } from "../../utils/query.js";
import { verify_user } from "../sessions.js";

export const start_conversation = async (req, res, next) => {
  const { prof_id, role } = req.body;
  try {
    if (!prof_id) {
      throw new Error("პროფილის id სავალდებულოა.");
    }
    const user = await verify_user(req);
    if (user === 401) {
      throw new Error("Login first!");
    } else if (user.profId === prof_id) {
      throw new Error("თქვენს თავთან კონვერსაციის დაწყება არ შეიძლება.");
    }

    const text = `
    SELECT id FROM users 
    WHERE prof_id = $1 
      AND role = $2 
    LIMIT 1
`;

    // First get the target user's ID from their profile ID
    const targetUser = await query(text, [prof_id, role]);

    if (!targetUser.rowCount) {
      throw new Error("User not found with this profile ID");
    }

    const targetUserId = targetUser.rows[0].id;

    // Now check for existing conversation
    const conversationCheck = `
    SELECT conversation_id FROM conversations
    WHERE 
        (user_a_id = $1 AND user_b_id = $2)
        OR
        (user_a_id = $2 AND user_b_id = $1)
    LIMIT 1
`;

    const existingConvo = await query(conversationCheck, [
      user.userId,
      targetUserId,
    ]);

    let conversation_id;

    if (!existingConvo.rowCount) {
      // Create new conversation with sorted roles/IDs
      const insertText = `
        INSERT INTO conversations (
            user_a_role, user_a_id, 
            user_b_role, user_b_id
        )
        VALUES (
            $1, $2, $3, $4
        )
        RETURNING conversation_id
    `;

      const newConvo = await query(insertText, [
        user.role,
        user.userId,
        role,
        targetUserId,
      ]);

      conversation_id = newConvo.rows[0].conversation_id;
    } else {
      conversation_id = existingConvo.rows[0].conversation_id;
    }

    res.status(200).json({ redirect_url: `http://localhost:3000/message/${conversation_id}` });
  } catch (error) {
    console.log(error);
  }
};

export const get_conversations = async (req, res, next) => {
    const {userId} = req.params 

    /*
        If it happens that user is not "A" and there is no messages sent 
        we will not display conversation

        -- we should also check if current_user is sender
        to later add 
        
            you: content
            u.firstname: content
    */
    try {
        const text = `
            SELECT 
                u.prof_id AS user_prof_id,
                u.role AS user_role,
                u.firstname,
                u.lastname,
                cs.conversation_id,
                conversation_messages.content AS last_message,
                conversation_messages.created_at AS message_time
            FROM conversations cs
            LEFT JOIN LATERAL (
                SELECT content, created_at FROM messages m
                WHERE m.conversation_id = cs.conversation_id AND role_pair = cs.role_pair
                ORDER BY m.created_at DESC
                LIMIT 1
            ) conversation_messages ON TRUE
            INNER JOIN users u ON 
                u.id = CASE WHEN cs.user_a_id = $1 THEN cs.user_b_id ELSE cs.user_a_id END 
                AND 
                u.role = CASE WHEN cs.user_a_id = $1 THEN cs.user_b_role ELSE cs.user_a_role END 
            WHERE
            (cs.user_a_id = $1)
                OR
            (cs.user_b_id = $1 AND conversation_messages.content IS NOT NULL)
            ORDER BY cs.created_at DESC
            LIMIT 8
        `

        const data = await query(text, [userId])

        if (data.rowCount) {
            res.status(200).json({convos: data.rows})
        }
    } catch (error) {
        console.log(error)
    }
}

export const get_messages = async (req, res, next) => {
    const {conversation_id, userId} = req.params
    try {
        const text = `
            SELECT role_pair, u.firstname, u.lastname, u.role, u.prof_id FROM conversations cs
            LEFT JOIN users u ON 
                u.id = CASE WHEN cs.user_a_id = $2 THEN cs.user_b_id ELSE cs.user_a_id END
                    AND 
                u.role = CASE WHEN cs.user_a_id = $2 THEN cs.user_b_role ELSE cs.user_a_role END  
            WHERE conversation_id = $1
            AND 
            (user_a_id = $2 OR user_b_id = $2)
        `

        const user_data = await query(text, [conversation_id, userId])

        if (!user_data.rowCount) throw new Error("no conversation based on provided id")

        const {role_pair, ...rest} = user_data.rows[0]

        const text_2 = `
            SELECT content, message_id, created_at, sender_id FROM messages
            WHERE conversation_id = $1 AND role_pair = $2
            ORDER BY created_at DESC
            LIMIT 10
        `
        
        const messages = await query(text_2, [conversation_id, role_pair])

        res.status(200).json({
            convos: messages.rows,
            ...rest
        })
    } catch (error) {
        console.log(error)
    }
}