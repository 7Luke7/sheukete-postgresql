import { PostgresErrorHandler } from "../../errors/handle_postgres_errors.js";
import { query } from "../../utils/query.js";

export const get_xelosani = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                x.firstname, 
                x.lastname, 
                CASE 
                    WHEN (x.privacy ->> 'email') IS DISTINCT FROM 'დამალვა'
                    THEN x.email
                    ELSE NULL
                END AS email,
                CASE 
                    WHEN (x.privacy ->> 'phone') IS DISTINCT FROM 'დამალვა'
                    THEN x.phone
                    ELSE NULL
                END AS phone,
                CASE 
                    WHEN (x.privacy ->> 'date') IS DISTINCT FROM 'დამალვა'
                    THEN x.date
                    ELSE NULL
                END AS date,
                CASE 
                    WHEN (x.privacy ->> 'location') IS DISTINCT FROM 'დამალვა'
                    THEN ul.place_name_ka
                    ELSE NULL
                END AS place_name_ka,
                 (
                  SELECT COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'main_category', s.main_category,
                        'main_title', s.main_title,
                        'main_description', s.main_description,
                        'main_price', s.main_price,
                        'categories', s.categories,
                        'publicId', s.public_id
                      )
                    ),
                    '[]'
                  )
                  FROM services s
                  LEFT JOIN service_location sl on s.id = sl.service_id
                  WHERE s.xelosani_id = x.id
                  LIMIT 8
                ) AS services,

                COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'main', sk.main,
                        'parent', sk.parent,
                        'child', sk.child,
                        'skills', sk.displayableskills
                      )
                    ),
                    '[]'
                  ) as skillset,
                x.gender, 
                x.created_at, 
                x.privacy, 
                x.about,
                x."stepPercent",
                x.setup_done,
                sc.schedule
                FROM users x
                LEFT JOIN schedule sc ON sc.xelosani_id = x.id
                LEFT JOIN user_location ul ON ul.user_id = x.id
                LEFT JOIN skill sk ON sk.xelosani_id = x.id
                WHERE x.prof_id = $1 AND x.role = 'xelosani'
                GROUP BY 
                  x.id,
                  x.firstname, 
                  ul.place_name_ka,
                  x.location_id,
                  x.lastname, 
                  email, 
                  sc.schedule,
                  x.gender, 
                  phone, 
                  x.created_at, 
                  x.privacy,
                  x.about,
                  date,
                  x."stepPercent",
                  x.setup_done
            `;
    const data = await query(text, [profId]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const get_xelosani_not_authorized = async (req, res, next) => {
  /*
    We could get current user lat/lng and just tell them if the user
    is close to the service location or not :) 
  */
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                x.firstname, 
                x.lastname, 
                CASE 
                    WHEN (x.privacy ->> 'email') IS DISTINCT FROM 'დამალვა'
                    THEN x.email
                    ELSE NULL
                END AS email,
                CASE 
                    WHEN (x.privacy ->> 'phone') IS DISTINCT FROM 'დამალვა'
                    THEN x.phone
                    ELSE NULL
                END AS phone,
                CASE 
                    WHEN (x.privacy ->> 'date') IS DISTINCT FROM 'დამალვა'
                    THEN x.date
                    ELSE NULL
                END AS date,
                CASE 
                    WHEN (x.privacy ->> 'location') IS DISTINCT FROM 'დამალვა'
                    THEN ul.place_name_ka
                    ELSE NULL
                END AS place_name_ka,
                 (
                  SELECT COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'main_category', s.main_category,
                        'main_title', s.main_title,
                        'main_description', s.main_description,
                        'main_price', s.main_price,
                        'categories', s.categories,
                        'publicId', s.public_id
                      )
                    ),
                    '[]'
                  )
                  FROM services s
                  LEFT JOIN service_location sl on s.id = sl.service_id
                  WHERE s.xelosani_id = x.id
                  LIMIT 8
                ) AS services,

                COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'main', sk.main,
                        'parent', sk.parent,
                        'child', sk.child,
                        'skills', sk.displayableskills
                      )
                    ),
                    '[]'
                  ) as skillset,
                x.gender, 
                x.created_at, 
                x.privacy,
                x.about,
                sc.schedule
                FROM users x
                LEFT JOIN schedule sc ON sc.xelosani_id = x.id
                LEFT JOIN user_location ul ON ul.user_id = x.id
                LEFT JOIN skill sk ON sk.xelosani_id = x.id
                WHERE x.prof_id = $1 AND x.role = 'xelosani'
                GROUP BY 
                  x.id,
                  x.firstname, 
                  ul.place_name_ka,
                  x.location_id,
                  x.lastname, 
                  email, 
                  sc.schedule,
                  x.gender, 
                  phone, 
                  x.created_at, 
                  x.about,
                  date,
                  x.privacy
            `;
    const data = await query(text, [profId]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error)
  }
}

export const check_xelosani_about = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                FROM users x
                WHERE x.role = 'xelosani' AND prof_id = $1 AND x.about IS NOT NULL
            `;
    const data = await query(text, [profId]);

    if (data.rowCount > 0) {
      res.status(200).json({ message: "აღწერა დამატებულია." });
    } else {
      res.status(400).json({ message: "აღწერა არ არის დამატებული." });
    }
  } catch (error) {
    console.log(error);
  }
};

export const get_xelosani_step_percent = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                "stepPercent",
                setup_done
                FROM users x
                WHERE x.role = 'xelosani' AND prof_id = $1
            `;
    const data = await query(text, [profId]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const handle_xelosani_about = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { about } = req.body;
    console.log(about)
    const text = `
                UPDATE users x
                SET 
                about = $2,
                "stepPercent" = "stepPercent" + 12.5
                WHERE x.role = 'xelosani' AND prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, about]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const get_xelosani_step_data = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const text = `
                SELECT  
                CASE WHEN x.email IS NOT NULL THEN true ELSE false END AS email_exists,
                CASE WHEN x.gender IS NOT NULL THEN true ELSE false END AS gender_exists,
                CASE WHEN x.phone IS NOT NULL THEN true ELSE false END AS phone_exists,
                CASE WHEN x.about IS NOT NULL THEN true ELSE false END AS about_exists,
                CASE WHEN x.date IS NOT NULL THEN true ELSE false END AS date_exists,
                CASE WHEN x.location_id IS NOT NULL THEN true ELSE false END AS location_exists,
                CASE WHEN uxs.skills_id IS NOT NULL THEN true ELSE false END AS skills_exists,
                CASE WHEN uxs.schedule_id IS NOT NULL THEN true ELSE false END AS schedule_exists
                FROM users x
                LEFT JOIN users_xelosani_specific uxs ON uxs.user_id = x.id 
                WHERE x.role = 'xelosani' AND x.id = $1
            `;
    const data = await query(text, [userId]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_contact = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
    CASE WHEN x.email IS NOT NULL THEN true ELSE false END AS email_exists,
    CASE WHEN x.phone IS NOT NULL THEN true ELSE false END AS phone_exists
FROM users x
WHERE x.role = 'xelosani' AND prof_id = $1;
            `;
    const data = await query(text, [profId]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

/*
  I don't think allowing users to update email is a good idea!
*/
export const update_xelosani_email = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { email } = req.body;
    const checkText = `
        SELECT id FROM damkveti 
        WHERE email = $1
        LIMIT 1
    `;
    const checkResult = await query(checkText, [email]);

    if (checkResult.rowCount > 0) {
      return res.status(400).json({
          message: "მომხმარებელი მეილით უკვე არსებობს."
      })
    }

    const text = `
                UPDATE xelosani
                SET 
                email = $2,
                "stepPercent" = "stepPercent" + 12.5
                WHERE prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, email]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error)
    const message = new PostgresErrorHandler(
      error.code,
      error.constraint,
      error.table
    ).identify_error();
    res.status(400).json(message);
  }
};

/*
  I don't think this is a good idea eiher
*/

export const update_xelosani_phone = async (req, res, next) => {
  try {
    const { phone, userId } = req.body;

    await query('BEGIN');
        const check_uniqueness = `
            UPDATE unique_users 
              SET phone = $1
            WHERE user_id = $2 
        `;

        const checkResult = await query(check_uniqueness, [phone, userId]);

        if (checkResult.rowCount === 0) {
          return res.status(400).json({
              field: "phoneEmail",
              message: "მომხმარებელი მობილურის ნომრით უკვე არსებობს."
          })
        }

    const text = `
                UPDATE users
                SET 
                  phone = $2,
                  "stepPercent" = "stepPercent" + 12.5  
                WHERE role = 'xelosani' AND id = $1
                RETURNING "stepPercent"
            `;
    const data = await query(text, [userId, phone]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    await query('COMMIT');
    res.status(200).json(data.rows[0]);
  } catch (error) {
    const message = new PostgresErrorHandler(
      error.code,
      error.constraint,
      error.table
    ).identify_error();
    res.status(400).json(message);
  }
};

export const check_xelosani_age = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
            SELECT  
            FROM users x
            WHERE x.role = 'xelosani' AND prof_id = $1 AND x.date IS NOT NULL
        `;
    const data = await query(text, [profId]);

    if (data.rowCount > 0) {
      res.status(200).json({ message: "ასაკი დამატებულია." });
    } else {
      res.status(400).json({ message: "ასაკი არ არის დამატებული." });
    }
  } catch (error) {
    console.log(error);
  }
};

export const update_xelosani_age = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { date } = req.body;
    const text = `
                UPDATE users x
                SET 
                date = $2,
                "stepPercent" = "stepPercent" + 12.5                
                WHERE x.role = 'xelosani' AND prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, date]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_gender = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
            SELECT
            FROM users x
            WHERE x.role = 'xelosani' AND prof_id = $1 AND x.gender IS NOT NULL
        `;
    const data = await query(text, [profId]);

    if (data.rowCount > 0) {
      res.status(200).json({ message: "გენდერი დამატებულია." });
    } else {
      res.status(400).json({ message: "გენდერი არ არის დამატებული." });
    }
  } catch (error) {
    console.log(error);
  }
};

export const update_xelosani_gender = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { gender } = req.body;
    const text = `
                UPDATE users x
                SET 
                gender = $2,
                "stepPercent" = "stepPercent" + 12.5                
                WHERE x.role = 'xelosani' AND prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, gender]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_skills = async (req, res, next) => {
  try {
    const {userId} = req.params
    const text = `
            SELECT  
            1
            FROM users_xelosani_specific x
            WHERE user_id = $1 AND skills_id IS NOT NULL
        `;
    const data = await query(text, [userId]);

    
    if (data.rowCount > 0) {
      res.status(200).json({ message: "სქილები დამატებულია." });
    } else if (data.rowCount === 0) {
      res.status(400).json({ message: "სქილები არ არის დამატებული." });
    } else {
      throw new Error("Column has unexpected count of rows.");
    }
  } catch (error) {
    console.log(error);
  }
};

export const insert_xelosani_skills = async (req, res, next) => {
  try {
    // Still Think about the relationship between xelosani do we want 
    // two-way relationship or just one way. For now I think we should
    // have two-way relationship we might filter out xelosani by skills later
    // or just get skills that certain xelosani has so for now this looks alright.
    const { skills, userId } = req.body;

    await query("BEGIN");
    const skill_data = await query(
      `
                INSERT INTO skill (xelosani_id, displayableSkills, main, parent, child)
                    VALUES ($1, $2::jsonb, $3, $4, $5)
                    RETURNING id, xelosani_id
                    `,
      [
        userId,
        JSON.stringify(skills.displayableSkills),
        skills.main,
        skills.parent,
        skills.child,
      ]
    );
    const xelosani_update = await query(
      `
                UPDATE users
                SET 
                    "stepPercent" = "stepPercent" + 12.5
                WHERE role = 'xelosani' AND id = $1
                RETURNING "stepPercent", prof_id;
            `,
      [userId]
    );

    //add_skill_id_to_specific_xelosani
    await query(
      `
        UPDATE users_xelosani_specific
        SET 
          skills_id = $2      
        WHERE user_id = $1
      `, [userId, skill_data.rows[0].id])
    await query("COMMIT");

    res.status(200).json(xelosani_update.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_schedule = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const text = `
            SELECT EXISTS(
              SELECT 1
              FROM schedule sc
              WHERE sc.xelosani_id = $1
            )
        `;
    const data = await query(text, [userId]);

    console.log(data)
    if (data.rows[0].exists) {
      res.status(200).json({ message: "განრიგი დამატებულია." });
    } else {
      res.status(400).json({ message: "განრიგი არ არის დამატებული." });
    }
  } catch (error) {
    console.log(error);
  }
};
export const insert_xelosani_schedule = async (req, res, next) => {
  const { schedule, xelosaniId } = req.body;

  try {
    const text = `
        WITH inserted_schedule AS (
          INSERT INTO schedule (xelosani_id, schedule) 
          VALUES ($1, $2)
          RETURNING id
        ),
        updated_xelosani AS (
          UPDATE users
          SET "stepPercent" = "stepPercent" + 12.5
          WHERE role = 'xelosani' AND id = $1
          RETURNING "stepPercent"
        ),
        updated_users_xelosani_specific AS (
          UPDATE users_xelosani_specific
          SET 
            schedule_id = (SELECT id FROM inserted_schedule)
            WHERE user_id = $1
        )
        SELECT "stepPercent" FROM updated_xelosani;
    `;

    const { rows } = await query(text, [xelosaniId, JSON.stringify(schedule)]);

    if (rows.length > 0) {
      console.log(rows[0])
      res.status(200).json(rows[0])
    } else {
      throw new Error('Failed to insert schedule or fetch stepPercent.');
    }
  } catch (error) {
    console.log(error)
  }
};

export const insert_xelosani_location = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { location } = req.body;
    const id = xelosani_update.rows[0].id;
    await query(
      `
                INSERT INTO location_xelosani (
                  main_category, public_id, tags, categories, main_title, main_description, xelosani_id
                )
                VALUES ((SELECT id FROM users WHERE role = 'xelosani' AND prof_id = $1))
            `,
      [profId]
    );

    res.status(200).json(xelosani_update.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const modify_xelosani_age = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { date } = req.body;

    const text = `
      UPDATE users
      SET date = $1
      WHERE role = 'xelosani' AND prof_id = $2
    `;
    const data = await query(text, [new Date(date), profId]);

    if (data.rowCount > 0) {
      return res.status(200).json({ message: "ასაკი წარმატებით განახლდა." });
    } else {
      return res
        .status(400)
        .json({ message: "ასაკის განახლება ვერ მოხერხდა, სცადეთ თავიდან." });
    }
  } catch (error) {
    console.log(error);
  }
};

export const modify_xelosani_schedule = async (req, res, next) => {
  const { schedule, xelosaniId } = req.body;

  try {
    const text = `
        UPDATE schedule
        SET 
        schedule = $2
        WHERE xelosani_id = $1
    `;

    const data = await query(text, [xelosaniId, JSON.stringify(schedule)]);

    if (data.rowCount > 0) {
      res.status(200).json("განრიგი წარმატებით შეიცვალა.")
    } else {
      throw new Error('დაფიქსირდა შეცდომა განრიგის შეცვლისას.');
    }
  } catch (error) {
    console.log(error)
  }
};

export const modify_xelosani_skills = async (req, res, next) => {
  try {
    const { skills, userId } = req.body;

    const text = `
      UPDATE skill
      SET 
      main = $2,
      child = $3,
      parent = $4,
      displayableskills = $5
      WHERE xelosani_id = $1
    `;
    const data = await query(text, [
      userId,
      skills.main,
      skills.child,
      skills.parent,
      JSON.stringify(skills.displayableSkills),
    ]);

    if (data.rowCount > 0) {
      return res.status(200).json({ message: "ასაკი წარმატებით განახლდა." });
    } else {
      return res
        .status(400)
        .json({ message: "ასაკის განახლება ვერ მოხერხდა, სცადეთ თავიდან." });
    }
  } catch (error) {
    console.log(error);
  }
};

export const modify_xelosani_about = async (req, res, next) => {
  try {
    const { about, userId } = req.body;

    const text = `
      UPDATE users
      SET 
      about = $1
      WHERE role = 'xelosani' AND id = $2
    `;
    const data = await query(text, [about, userId]);

    if (data.rowCount > 0) {
      return res.status(200).json({ message: "ასაკი წარმატებით განახლდა." });
    } else {
      return res
        .status(400)
        .json({ message: "ასაკის განახლება ვერ მოხერხდა, სცადეთ თავიდან." });
    }
  } catch (error) {
    console.log(error);
  }
};

export const increment_xelosani_step_percent = async (req, res, next) => {
  try {
    const {profId} = req.params 

    const text = `
      UPDATE users
        SET "stepPercent" = "stepPercent" + 12.5
        WHERE role = 'xelosani' AND prof_id = $1
      RETURNING "stepPercent"
    `
    const data = await query(text, [profId])
    res.status(200).send(data.rows[0])
  } catch (error) {
    console.log(error)
  }
}

export const mark_user_as_setup_done = async (req, res, next) => {
  try {
    const {profId} = req.params
    const text = `
      UPDATE users
      SET setup_done = true
      WHERE role = 'xelosani' AND prof_id = $1
    `
    await query(text, [profId])
    res.status(200).send("success")
  } catch (error) {
    console.log(error)
  }
}