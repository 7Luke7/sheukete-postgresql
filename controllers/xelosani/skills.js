import { query } from "../../utils/query.js"

export const get_all_xelosani_skills = async (req, res, next) => {
    const {id} = req.params
    try {
        const text = `
            SELECT displayableskills FROM skill s
            INNER JOIN users u ON prof_id = $1 AND u.role = 'xelosani'
            WHERE u.id = s.xelosani_id
        `

        const data = await query(text, [id])

        if (data.rowCount > 0) {
            res.status(200).json({skills: data.rows[0].displayableskills})            
        }
    } catch (error) {
        console.log(error)
    }
}