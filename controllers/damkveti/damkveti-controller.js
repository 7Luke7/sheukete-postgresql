import { PostgresErrorHandler } from "../../errors/handle_postgres_errors.js"
import { query } from "../../utils/query.js"

export const create_damkveti = async (req, res, next) => {
    try {
        const {firstname, lastname, notification_devices, email, password } = req.body
        const text = `INSERT INTO damkveti(firstname, lastname, notification_devices, ${notification_devices}, password) VALUES($1, $2, $3, $4, $5) RETURNING id, prof_id`
        const values = [firstname, lastname, [notification_devices], email || req.body.phone, password]
        const data = await query(text, values)

        console.log(data)
        res.status(200).json(data.rows)
    } catch (error) {
        console.log(error)
        const message = new PostgresErrorHandler(error.code, error.constraint, error.table).identify_error()
        res.status(400).json(message)
    }
}

export const get_damkveti = async (req, res, next) => {
    try {
      const { profId } = req.params;
      const text = `
                  SELECT  
                  d.firstname, 
                  d.lastname, 
                  CASE 
                      WHEN (d.privacy ->> 'email') IS DISTINCT FROM 'დამალვა'
                      THEN d.email
                      ELSE NULL
                  END AS email,
                  CASE 
                      WHEN (d.privacy ->> 'phone') IS DISTINCT FROM 'დამალვა'
                      THEN d.phone
                      ELSE NULL
                  END AS phone,
                  CASE 
                      WHEN (d.privacy ->> 'date') IS DISTINCT FROM 'დამალვა'
                      THEN d.date
                      ELSE NULL
                  END AS date,
                  d.gender, 
                  d.created_at, 
                  d.privacy, 
                  d.about,
                  d."stepPercent",
                  d.setup_done,
                  l.lat, 
                  l.lon,
                  FROM damkveti d
                  LEFT JOIN location_damkveti l ON l.id = d.id
                  WHERE d.prof_id = $1
                  GROUP BY 
                      d.firstname, 
                      d.lastname, 
                      email, 
                      d.gender, 
                      phone, 
                      d.created_at, 
                      d.privacy,
                      d.about,
                      date,
                      d."stepPercent",
                      d.setup_done,
                      l.lat, 
                      l.lon,
              `;
      const data = await query(text, [profId]);
  
      res.status(200).json(data.rows[0]);
    } catch (error) {
      console.log(error);
    }
  };