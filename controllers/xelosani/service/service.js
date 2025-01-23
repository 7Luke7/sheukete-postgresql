import { query } from "../../../utils/query.js"
import crypto from "crypto"

export const add_service = async (req, res, next) => {
  // make ids for each child services
  // add ids of childs to services table
    try {
        const {_creator, categories,
            tags, mainTitle, mainCategory, 
            availability, mainDescription, mainPrice, childServices} = req.body

        for (let i = 0; i < req.body["childServices"].length; i++) {
          req.body["childServices"][i]["id"] = crypto.randomUUID()
        }
        const text = `
            INSERT INTO services (xelosani_id, categories, tags, main_title, main_category, availability, main_description, main_price, child_services)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
            RETURNING public_id
        `
        const data = await query(text, [_creator, categories, tags, mainTitle, mainCategory, JSON.stringify(availability), mainDescription, mainPrice, JSON.stringify(childServices)])

        if (data.rowCount > 0) {
            res.status(200).json({ id: data.rows[0].public_id });
          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "სერვისების დამატება ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        console.log(error)
    }
}

export const get_xelosani_services_profile_page = async (req, res, next) => {
  try {
    const text = `
      SELECT * FROM services
      WHERE xelosani_id = $1
      LIMIT 8
    `

    const data = await query(text, [req.params.id])

    if (data.rowCount > 0) {
      res.status(200).json(data.rows[0])
    } else if (data.rowCount === 0){
      res.status(400).json({
        message: "სერვისების ჩატვირთვა ვერ მოხერხდა."
      })
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
  } catch (error) {
    console.log("Error while getting service: ", error)
  }
}

export const get_xelosani_service = async (req, res, next) => {
  const {publicId} = req.body
  try {
    const text = `
      SELECT * FROM services
      WHERE services.public_id = $1
    `

    const data = await query(text, [publicId])

    if (data.rowCount > 0) {
      res.status(200).json(data.rows[0])
    } else if (data.rowCount === 0){
      res.status(400).json({
        message: "სერვისების ჩატვირთვა ვერ მოხერხდა."
      })
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
    }
  } catch (error) {
    console.log(error)
  }
}

export const update_service = async (req, res, next) => {
  try {
    const {public_id, categories,
      tags, mainTitle, mainCategory, 
      availability, mainDescription, mainPrice, childServices} = req.body

    const text = `
        UPDATE services 
        SET
        categories = $2, 
        tags = $3, 
        main_title = $4, 
        main_category = $5, 
        availability = $6, 
        main_description = $7, 
        main_price = $8, 
        child_services = $9
        WHERE public_id = $1
    `

    const data = await query(text, [public_id, categories, tags, mainTitle, mainCategory, JSON.stringify(availability), mainDescription, mainPrice, JSON.stringify(childServices)])

    if (data.rowCount > 0) {
      res.status(200).json({ message: "success" });
    } else if (data.rowCount === 0) {
      res.status(400).json({ message: "სერვისების განახლება ვერ მოხერხდა." });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
  }
  } catch (error) {
    console.log(error)
  }
}