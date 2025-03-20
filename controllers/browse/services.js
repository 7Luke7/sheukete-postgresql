import format from "pg-format"
import { query } from "../../utils/query.js";

/*
    --- GENREAL MARKINGS ---

        -- SEO considerations --

            - We might get whole length of the category that user is looking for and the put it in 
            - meta tags

        --- uniqueness ---
            - Includes both public_id and sort_key in orderby so if sort_key is same 
            - the public_id will break the sequence meaning it will not allow to return same
            - kind of thing
*/

/* 
  If user is paginating back we want to grab first service id
*/

/*
  So we could combine both KEYSET pagination and OFFSET pagination when user skips the page
*/
/*
  figure out the way to cache total count of services rows
*/
export const get_browse_initial_services = async (req, res, next) => {
  const {
    category,
    priceFrom,
    priceTo,
    sort, 
    region,
    page,
    city,
    tsc,
  } = req.query;
    let order = null
    const is_skipped = page.includes("skipped")
    const is_next = page.includes("next")
    const is_prev = page.includes("prev")

    let dir = sort.split('-')[1];
    const column = sort.split('-')[0]

    let op = null;
    if (!is_skipped) {
      if (dir === "DESC") {
        if (is_next) {
          op = "<"
        } else if (is_prev) {
          op = ">"
          dir = "ASC"
        } else {
          op = "<"
        }
      } else {
        // If ascending: next page might use '>' and previous page '<'
        if (is_next) {
          op = ">"
        } else if (is_prev) {
          op = "<"
          dir = "DESC"
        } else {
          op = ">"
        }
      }
    }

    const allowedColumns = ['main_price', 'created_at', 'completed_count', 'avgrating'];
    if (!allowedColumns.includes(column) && !column.startsWith("longitude.")) {
      throw new Error('Invalid column specified');
    }

    if (sort.startsWith("longitude.")) {
      // const parts = sort.split(",");
      // if (parts.length === 2 && parts[0].startsWith("long.") && parts[1].startsWith("lat.")) {
      //   const userLng = parts[0].substring(10).trim();                                     
      //   const userLat = parts[1].substring(10).trim();
        
      //   order = `
      //     ORDER BY ST_Distance(
      //       ST_SetSRID(ST_MakePoint(obj.longitude, obj.latitude),4326),
      //       ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}),4326)
      //     ) ASC
      //   `;
      // }
    } else {
      order = format(`ORDER BY %I %s, "publicId" %s`, column, dir, dir);
    }

    let text = format(`
        SELECT
        JSON_AGG(obj %s) AS "services"
        %s
        FROM (
          SELECT
              s.main_category,
              s.main_title,
              s.main_description,
              s.main_price,
              s.categories,
              s.public_id AS "publicId",
              sl.city,
              sl.place_name_ka,
              sl.center,
              sl.bbox,
              sl.longitude,
              sl.region,
              sl.street_name_ka AS street,
              sl.latitude,
              sl.neighbourhood,
              u.firstname,
              u.lastname,
              uxs.avgrating,
              uxs.jobs_completed AS completed_jobs,
              s.completed_count,
              s.created_at,
              u.prof_id AS "profId"
          FROM services s
          LEFT JOIN service_location sl ON sl.service_id = s.id
          INNER JOIN users u ON u.role = 'xelosani' AND u.id = s.xelosani_id
          INNER JOIN users_xelosani_specific uxs ON uxs.user_id = u.id
        `, order ? order : "", Number(tsc) === 0 ? ", \n(SELECT COUNT(*) FROM services WHERE $1 = ANY(categories) AND main_price >= $2 AND main_price <= $3) AS total_count" : "")

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
    
    if (!is_skipped && req.query[`service-${column}`] && req.query["service-pid"]) {
      let cast = "";
      if (column === "created_at") {
        cast = "::timestamptz";
        req.query[`service-${column}`] = req.query[`service-${column}`].replace(" ", "+");
      } else if (column === "main_price") {
        cast = "::numeric";
      }

      conditions.push(
        format(
          "(s.%I, s.public_id) %s ($%s%s, $%s)",
          column,
          op,
          conditions.length + 1,
          cast,
          conditions.length + 2
        )
      );
      values.push(req.query[`service-${column}`]);
      values.push(req.query["service-pid"]);
    }

    // if (order) {
    //   text += `\n ${order}`
    // }
    if (conditions.length > 0) {
      text += `WHERE ${conditions.join(" AND ")}`;
    }

    if (is_skipped) {      
      text += `\nLIMIT 16\n`;
      text += `OFFSET ($${conditions.length + 1} - 1) * 16) obj;`
      values.push(Number(page.split("_")[1]))
    } else {
      text += `\nLIMIT 16\n ) obj;`;
    }

  try {
    const data = await query(text, values);
    
    if (data.rowCount > 0) {
      if (is_prev && !is_skipped) {
        data.rows[0].services.reverse()
      }
      //4d82d535-f916-4974-af39-4be678222ebd
      if (Number(tsc) === 0) {
        res.status(200).json({services: data.rows[0].services, total_count: data.rows[0].total_count});
      } else {
        res.status(200).json({services: data.rows[0].services, total_count: tsc});
      }
    } else if (data.rowCount === 0) {
      res.status(400).json(data.rows[0]);
    } else {
      throw new Error("0");
    }
  } catch (error) {
    console.log(error);
  }
};

// const get_services_amount = async (count_conditions, values) => {
//   console.log("hi")
//     let text = `
//             SELECT COUNT(*) AS total_count
//             FROM services s
//             LEFT JOIN service_location sl ON sl.service_id = s.id
//         `;

//         if (count_conditions.length > 0) {
//             text += `WHERE ${count_conditions.join(" AND ")}`
//         }
//     try {
//         const data = await query(text, values)

//         if (data.rowCount > 0) {
//             return data.rows[0].total_count
//         } else if (data.rowCount === 0) {
//             throw new Error("300")
//         } else {
//             throw new Error("400")
//         }
//     } catch (error) {
//         console.log(error)
//     }
// }