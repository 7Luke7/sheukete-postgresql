import { query } from "../../../utils/query.js";

/*
    --- GENREAL MARKINGS ---

        -- SEO considerations --

            - We might get whole length of the category that user is looking for and the put it in 
            - meta tags
*/
export const get_browse_initial_services = async (req, res, next) => {
  const {
    category,
    priceFrom,
    priceTo,
    sort,
    region,
    city,
    distanceTo,
  } = req.query;
    let order = null 
    let pag = null
    console.log(req.query)
    if (sort) {
        if (sort.startsWith("longitude.")) {
          const parts = sort.split(",");
          if (parts.length === 2 && parts[0].startsWith("long.") && parts[1].startsWith("lat.")) {
            const userLng = parts[0].substring(10).trim();                                     
            const userLat = parts[1].substring(10).trim();
            
            order = `
              ORDER BY ST_Distance(
                ST_SetSRID(ST_MakePoint(sl.longitude, sl.latitude),4326),
                ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}),4326)
              ) ASC
            `;
          }
        } else {
          switch (sort) {
            case "main_price-desc":
              const last_service_main_price = req.query["lastservice-main_price"]
              order = "ORDER BY s.main_price DESC";
              if (last_service_main_price) {
                pag = `s.main_price <= ${Number(last_service_main_price)}`
              }
              break;
            case "main_price-asc":
              order = "ORDER BY s.main_price ASC";
              break;
            case "created_at-asc":
              order = "ORDER BY s.created_at ASC";
              break;
            case "completed_count":
              order = "ORDER BY s.completed_count DESC";
              break;
            case "avgrating":
              order = "ORDER BY s.ratings DESC";
              break;
            default:
              order = "ORDER BY s.created_at DESC";
              const last_service_created_at = req.query["lastservice-created_at-desc"]
              if (last_service_created_at) {
                pag = `s.created_at <= ${last_service_created_at}::timestamptz`
              }
              break;
          }
        }
      } else {
        order = "ORDER BY s.created_at DESC";
        if (req.query["lastservice-created_at-desc"]) {
          req.query["lastservice-created_at-desc"] = req.query["lastservice-created_at-desc"].replace(" ", "+")
          pag = `s.created_at < '${req.query["lastservice-created_at-desc"]}'::timestamptz`
        }
      }
    let text = `
            SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                    'main_category', s.main_category,
                    'main_title', s.main_title,
                    'main_description', s.main_description,
                    'main_price', s.main_price,
                    'categories', s.categories,
                    'publicId', s.public_id,
                    'city', sl.city,
                    'place_name_ka', sl.place_name_ka, 
                    'center', sl.center,
                    'bbox', sl.bbox,
                    'longitude', sl.longitude,
                    'region', sl.region,
                    'street', sl.street_name_ka,
                    'latitude', sl.latitude,
                    'neighbourhood', sl.neighbourhood,
                    'firstname', u.firstname,
                    'lastname', u.lastname,
                    'avgrating', uxs.avgrating,
                    'completed_jobs', uxs.jobs_completed,
                    'completed_count', s.completed_count,
                    'created_at', s.created_at,
                    'profId', u.prof_id
                    )
                    ${order ? order : ""}
                ) AS "services"
            FROM services s
            LEFT JOIN users u
                ON u.role = 'xelosani'
                AND u.id = s.xelosani_id
            LEFT JOIN users_xelosani_specific uxs ON uxs.user_id = u.id  
            LEFT JOIN service_location sl 
            ON sl.service_id = s.id
        `;

    let conditions = [];
    let values = [];

    if (category) {
      conditions.push(`$${conditions.length + 1} = ANY(s.categories)`);
      values.push(category);
    }

    if (priceFrom) {
      conditions.push(`s.main_price >= $${conditions.length + 1}`);
      values.push(priceFrom);
    }

    if (priceTo) {
      conditions.push(`s.main_price <= $${conditions.length + 1}`);
      values.push(priceTo);
    }

    if (city && city !== "ყველა") {
      conditions.push(`sl.city = $${conditions.length + 1}`);
      values.push(city);
    }
    
    if (region && region !== "ყველა") {
        conditions.push(`sl.region = $${conditions.length + 1}`);
        values.push(region);
    }

    if (conditions.length > 0) {
      text += `
        WHERE ${conditions.join(" AND ")} ${pag ? `AND ${pag}` : ""}
      `;
    }

    /*
      ABOUT PAGINATION
        SO I WONT USE THE LIMIT OFFSET

        APPROACH IN MY MIND IS CURSOR PAGINATION 
        WE WILL TRACK LAST PRODUCT COLUMNS BASED ON SORTING WE HAVE
        SO IF USER SORTS USING "ratings" WE WILL TRACK LAST SERVICE
        "ratings" COLUMN AND WE WILL SAY ratings > "previous ratings" 
    */

    // if (Number(page) && Number(page) !== 1) {
      // conditions.push(`OFFSET $${values.length + 1}`)
      // values.push((Number(page) * 16) / 2)
    // }
    
    text += `\nLIMIT 16;`;

    console.log(text)
  try {
    const data = await query(text, values);

    console.log(data.rows[0])
    if (data.rowCount > 0) {
        const total_count = await get_services_amount(conditions, values)
        res.status(200).json({services: data.rows[0].services, total_count});
    } else if (data.rowCount === 0) {
      res.status(400).json(data.rows[0]);
    } else {
      throw new Error("0");
    }
  } catch (error) {
    console.log(error);
  }
};

const get_services_amount = async (conditions, values) => {
    let text = `
            SELECT COUNT(*) AS total_count
            FROM services s
            LEFT JOIN service_location sl ON sl.service_id = s.id
        `;

        if (conditions.length > 0) {
            text += `WHERE ${conditions.join(" AND ")}`
        }
    try {
        const data = await query(text, values)

        if (data.rowCount > 0) {
            return data.rows[0].total_count
        } else if (data.rowCount === 0) {
            throw new Error("300")
        } else {
            throw new Error("400")
        }
    } catch (error) {
        console.log(error)
    }
}