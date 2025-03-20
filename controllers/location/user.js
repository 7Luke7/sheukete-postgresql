import { query } from "../../utils/query.js";

export const check_user_location = async (req, res, next) => {
  try {
    const { userId, role } = req.params;

    const text = `
        SELECT EXISTS(
            SELECT 1
            FROM user_location
            WHERE user_id = $1 AND user_role = $2
        ) AS exists
    `;

    const data = await query(text, [userId, role]);
    if (!data.rows[0].exists) {
      res.status(400).json({
        error: "ლოკაცია და განრიგი არ არსებობს",
      });
    } else {
      res.status(200).json(data.rows[0]);
    }
  } catch (error) {
    console.log(error);
  }
};

export const create_user_location = async (req, res, next) => {
  try {
    const {userId, role} = req.params;
    const location = req.body.location;

    await query("BEGIN");

    const locaiton_query = `
    INSERT INTO user_location(
        user_id, user_role, longitude, latitude, bbox,
        center, location, city,
        region, place_name_ka,
        place_name_en, place_name_ru, street_name_en,
        street_name_ka, street_name_ru
    ) VALUES (
        $1, $2, $3, $4, $5,
        $6, ST_SetSRID(ST_MakePoint($3, $4), 4326), $7, $8, $9,
        $10, $11, $12, $13, $14
    ) RETURNING id
`;

    const location_data = await query(locaiton_query, [
      userId, // $1: user_id
      role, // $2: user_role
      location.longitude, // $3: longitude
      location.latitude, // $4: latitude
      location.bbox, // $5: bbox
      location.center, // $6: center (should be a double precision array)
      location.city, // $7: city
      location.region, // $8: region
      location.placeNameKa, // $9: place_name_ka
      location.placeNameEn, // $10: place_name_en
      location.placeNameRu, // $11: place_name_ru
      location.streetNameEn, // $12: street_name_en
      location.streetNameKa, // $13: street_name_ka
      location.streetNameRu, // $14: street_name_ru
    ]);

    if (location_data.rowCount > 0) {
      const user_step_percent_update_query = `
          UPDATE users
              SET 
              "stepPercent" = "stepPercent" + 12.5,
              location_id = $2
          WHERE role = $3 AND id = $1
          RETURNING "stepPercent"
      `;

      const data = await query(user_step_percent_update_query, [
        userId,
        location_data.rows[0].id,
        role
      ]);
      await query("COMMIT");
      res.status(200).json({ stepPercent: data.stepPercent });
    }
  } catch (error) {
    await query("ROLLBACK");
    console.log(error);
  }
};
