import { query } from "../../utils/query.js";

export const check_xelosani_location = async (req, res, next) => {
    try {
        const {profId} = req.params.profId

        const text = `
            SELECT location_id, schedule_id FROM xelosani
            WHERE xelosani.prof_id = $1
        `

        const data = await query(text, [profId])
        if (!data.rows.length) {
            res.status(400).json({
                error: "ლოკაცია და განრიგი არ არსებობს"
            })   
        } else {
            res.status(200).json(data.rows[0])   
        }
    } catch (error) {
        console.log(error)
    }    
}