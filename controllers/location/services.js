import { query } from "../../utils/query"

export const get_service_location = async (req, res, next) => {
    const {serviceId} = req.params
    try {
        const text = `
        SELECT * FROM service_location
        WHERE service_id = $1
      `

      const data = await query(text, [serviceId])

      if (data.rowCount > 0) {
        res.status(200).json(data.rows[0])
      } else if (data.rowCount === 0){
        res.status(400).json({
          message: "ლოკაცია ვერ მოიძებნა."
        })
      } else {
        throw new Error("დაფიქსირდა პრობლემა");
      }
    } catch (error) {
        console.log(error)
    }
}