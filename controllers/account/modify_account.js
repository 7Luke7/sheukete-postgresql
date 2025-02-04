import { query } from "../../utils/query.js"

export const modify_sensitive_xelosani_fields = async (req, res, next) => {
    try {
        const {userId, firstname, lastname, email, phone} = req.body
        if (!email && !phone) {
            const text = `
            UPDATE users
                SET 
                    firstname = COALESCE($1, firstname),
                    lastname = COALESCE($2, lastname)
                WHERE role = 'xelosani' AND id = $3
            ` 
            await query(text, [firstname, lastname, userId])
            return res.status(200).json({
                message: "მომხმარებელი წარმატებით განახლდა."
            })
        } 

        // take a look at this later
        if (email && !phone) {
            const checkText = `
                SELECT id FROM damkveti 
                WHERE email = $1
                LIMIT 1
            `;
            const check_email_existance = await query(checkText, [email]);

            if (check_email_existance.rowCount > 0) {
                const text = `
                    UPDATE xelosani
                    SET 
                        firstname = COALESCE($1, firstname),
                        lastname = COALESCE($2, lastname)
                    WHERE id = $3
                ` 
                await query(text, [firstname, lastname, userId])
                return res.status(400).json({
                    message: "მომხმარებელი მეილით უკვე არსებობს.-მეილი"
                })    
            }
            const text = `
                UPDATE xelosani
                    SET 
                        firstname = COALESCE($1, firstname),
                        lastname = COALESCE($2, lastname),
                        email = COALESCE($3, email),
                        "stepPercent" = "stepPercent" + 12.5 
                    WHERE id = $4
                ` 

            await query(text, [firstname, lastname, email, userId])
            return res.status(200).json({
                message: "მომხმარებელი წარმატებით განახლდა."
            })    
        }
        if (phone && !email) {
            const checkText = `
                SELECT id FROM damkveti 
                WHERE phone = $1
                LIMIT 1
            `;
            const check_phone_existence = await query(checkText, [phone]);

            if (check_phone_existence.rowCount > 0) {
                const text = `
                    UPDATE xelosani
                    SET 
                        firstname = COALESCE($1, firstname),
                        lastname = COALESCE($2, lastname)
                    WHERE id = $3
                ` 
                await query(text, [firstname, lastname, userId])
                return res.status(400).json({
                    code: 11000,
                    message: "მომხმარებელი მობილურის ნომრით უკვე არსებობს.-მობილური"
                })    
            }
            const text = `
                UPDATE xelosani
                    SET 
                        firstname = COALESCE($1, firstname),
                        lastname = COALESCE($2, lastname),
                        phone = COALESCE($3, phone),
                        "stepPercent" = "stepPercent" + 12.5
                    WHERE id = $4
                ` 

            await query(text, [firstname, lastname, phone, userId])
            return res.status(200).json({
                message: "მომხმარებელი წარმატებით განახლდა."
            })    
        }
        
        return res.status(400).json({
            message: "დაფიქსირდა შეცდომა სცადეთ ხელახლა."
        })
    } catch (error) {
        console.log(error)
    }
} 