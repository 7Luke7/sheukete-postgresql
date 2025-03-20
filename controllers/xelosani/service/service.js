import { query } from "../../../utils/query.js"
import crypto from "crypto"

/*
  Since we don't check user authorization on main server we should check it here
  for now its ok but take a look at it later!
*/

export const add_service = async (req, res, next) => {
  // make ids for each child services
  // add ids of childs to services table
    try {
        const {_creator, categories,
            tags, mainTitle, mainCategory, 
            availability, mainDescription, mainPrice, childServices, location} = req.body
        
        for (let i = 0; i < req.body["childServices"].length; i++) {
          req.body["childServices"][i]["id"] = crypto.randomUUID()
        }
        await query("BEGIN")
        const text = `
            INSERT INTO services (xelosani_id, categories, tags, main_title, main_category, availability, main_description, main_price, child_services)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
            RETURNING public_id, id
        `
        const data = await query(text, [_creator, categories, tags, mainTitle, mainCategory, JSON.stringify(availability), mainDescription, mainPrice, JSON.stringify(childServices)])

        if (data.rowCount > 0) {
            const locaiton_query = `
              INSERT INTO service_location(
                service_id, longitude, latitude, bbox,
                center, location, city,
                region, place_name_ka,
                place_name_en, place_name_ru, street_name_en,
                street_name_ka, street_name_ru
              ) VALUES (
                $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($2, $3), 4326), $6, $7, $8, $9,
                $10, $11, $12, $13
              )
            `

            const location_data = await query(locaiton_query, [
              data.rows[0].id,
              location.longitude,
              location.latitude,
              location.bbox,
              location.center,
              location.city,
              location.region,
              location.placeNameKa,
              location.placeNameEn,
              location.placeNameRu,
              location.streetNameEn,
              location.streetNameKa,
              location.streetNameRu,
            ])
            

            if (location_data.rowCount > 0) {
              await query("COMMIT")
              res.status(200).json({ id: data.rows[0].public_id });              
            }

          } else if (data.rowCount === 0) {
            res.status(400).json({ message: "სერვისების დამატება ვერ მოხერხდა." });
          } else {
            throw new Error("დაფიქსირდა პრობლემა");
        }
    } catch (error) {
        await query("ROLLBACK")              
        console.log(error)
    }
}

export const get_xelosani_services_profile_page = async (req, res, next) => {
  try {
    const text = `
      SELECT * FROM services
      LEFT JOIN service_location on id = service_location.service_id
      WHERE xelosani_id = $1
      LIMIT 4
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
  const {service_public_id} = req.params
  try {
    const text = `
      SELECT
       main_description,
       main_title, 
       main_price,
       tags,
       center,
       main_category,
       categories,
       availability,
       child_services,
       place_name_ka,
       longitude,
       latitude,
       u.role,
       s.created_at AS "service_created_at",
       s.completed_count AS "service_completed_count",
       s.ratings,
       u.prof_id,
       u.firstname,
       sl.city,
       s.public_id,
       uxs.avgrating AS "user_avg_rating",
       uxs.jobs_completed AS "user_jobs_completed_count",
       u.lastname
      FROM services s
      INNER JOIN users u ON u.role = 'xelosani' AND u.id = s.xelosani_id
      INNER JOIN users_xelosani_specific uxs ON uxs.user_id = s.xelosani_id
      LEFT JOIN service_location sl ON sl.service_id = s.id 
      WHERE s.public_id = $1
    `

    const data = await query(text, [service_public_id])

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
      availability, mainDescription, mainPrice, childServices, location} = req.body

      await query("BEGIN")
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
        RETURNING id
    `

    const data = await query(text, [public_id, categories, tags, mainTitle, mainCategory, JSON.stringify(availability), mainDescription, mainPrice, JSON.stringify(childServices)])

    if (data.rowCount > 0) {
      
      const locaiton_query = `
        UPDATE service_location
          SET 
            longitude = $2,
            latitude = $3,
            bbox = $4,
            center = $5,
            location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
            city = $6,
            region = $7,
            place_name_ka = $8,
            place_name_en = $9,
            place_name_ru = $10,
            street_name_en = $11,
            street_name_ka = $12,
            street_name_ru = $13
        WHERE service_id = $1
      `

      const location_data = await query(locaiton_query, [
        data.rows[0].id,
        location[0],
        location[1],
        location.bbox,
        location.center,
        location.city,
        location.region,
        location.placeNameKa,
        location.placeNameEn,
        location.placeNameRu,
        location.streetNameEn,
        location.streetNameKa,
        location.streetNameRu,
      ])

      if (location_data.rowCount > 0) {
        await query("COMMIT")
        res.status(200).json({ message: "წარმატება" });              
      }
    } else if (data.rowCount === 0) {
      res.status(400).json({ message: "სერვისების განახლება ვერ მოხერხდა." });
    } else {
      throw new Error("დაფიქსირდა პრობლემა");
  }
  } catch (error) {
    await query("ROLLBACK")
    console.log(error)
  }
}

export const get_all_user_service = async (req, res, next) => {
  try {
    const {cursor, prof_id} = req.query

    console.log(cursor, prof_id)
    const text = `
      SELECT * FROM services s
      INNER JOIN users u ON u.prof_id = $1 AND u.role = 'xelosani'
      WHERE s.xelosani_id = u.id
      ORDER BY s.created_at DESC
    `

    const data = await query(text, [prof_id])

    if (data.rowCount > 0) {
      res.status(200).json({services: data.rows})
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