import { PostgresErrorHandler } from "../../errors/handle_postgres_errors.js";
import { query } from "../../utils/query.js";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const get_xelosani = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                x.firstname, 
                x.lastname, 
                x.email, 
                x.gender, 
                x.phone, 
                x.created_at, 
                x.privacy, 
                x.about,
                x.date,
                x."stepPercent",
                x.setup_done,
                l.lat, 
                l.lon,
                se.main_category,
                se.main_title,
                CASE 
                    WHEN sc.xelosani_id IS NOT NULL 
                    THEN JSON_AGG(
                        json_build_object(
                            'schedule_id', sc.id,
                            'xelosani_id', sc.xelosani_id,
                            'available_from', to_char(sc.available_from, 'HH24:MI'),
                            'available_to', to_char(sc.available_to, 'HH24:MI'),
                            'day_of_week', sc.day_of_week
                        )
                    )
                END AS schedules,     
                skill.main,
                skill.parent,
                skill.child,
                skill.displayableskills as skills
                FROM xelosani x
                LEFT JOIN location_xelosani l ON l.id = x.id
                LEFT JOIN services se ON se.xelosani_id = x.id
                LEFT JOIN skill ON skill.xelosani_id = x.id
                LEFT JOIN schedule sc ON sc.xelosani_id = x.id
                WHERE x.prof_id = $1
                GROUP BY 
                    sc.xelosani_id,
                    x.firstname, 
                    x.lastname, 
                    x.email, 
                    x.gender, 
                    x.phone, 
                    x.created_at, 
                    x.privacy,
                    x.about,
                    x.date,
                    x."stepPercent",
                    x.setup_done,
                    l.lat, 
                    l.lon,
                    se.main_category,
                    se.main_title,
                    skill.main,
                    skill.parent,
                    skill.child,
                    skill.displayableskills;
            `;
    const data = await query(text, [profId]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_about = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                FROM xelosani x
                WHERE prof_id = $1 AND x.about IS NOT NULL
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
                x."stepPercent",
                x.setup_done
                FROM xelosani x
                WHERE prof_id = $1
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
    const text = `
                UPDATE xelosani
                SET 
                about = $2,
                "stepPercent" = "stepPercent" + 12.5
                WHERE prof_id = $1
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
    const { profId } = req.params;
    const text = `
                SELECT  
                x.email, 
                x.gender, 
                x.phone,
                x.about,
                x.date,
                l.id,
                sk.id,
                sc.id
                FROM xelosani x
                JOIN location_xelosani l ON l.id = x.id
                JOIN skill sk ON sk.xelosani_id = x.id
                JOIN schedule sc ON sc.xelosani_id = x.id
                WHERE x.prof_id = $1
            `;
    const data = await query(text, [profId]);

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
FROM xelosani x
WHERE prof_id = $1;
            `;
    const data = await query(text, [profId]);

    console.log("Contanct check data: ", data)
    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const update_xelosani_contact = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { phone } = req.body;
    const text = `
      UPDATE xelosani
      SET 
      phone = $2,
      "stepPercent" = "stepPercent" + 12.5
      WHERE prof_id = $1
      RETURNING "stepPercent", prof_id
    `;
    const data = await query(text, [profId, phone]);

    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const update_xelosani_email = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { email } = req.body;
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
    const message = new PostgresErrorHandler(
      error.code,
      error.constraint,
      error.table
    ).identify_error();
    res.status(400).json(message);
  }
};

export const update_xelosani_phone = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { phone } = req.body;
    const text = `
                UPDATE xelosani
                SET 
                phone = $2,
                "stepPercent" = "stepPercent" + 12.5                
                WHERE prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, phone]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

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
            FROM xelosani x
            WHERE prof_id = $1 AND x.date IS NOT NULL
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
                UPDATE xelosani
                SET 
                date = $2,
                "stepPercent" = "stepPercent" + 12.5                
                WHERE prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, date]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    console.log(data);
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
            FROM xelosani x
            WHERE prof_id = $1 AND x.gender IS NOT NULL
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
                UPDATE xelosani
                SET 
                gender = $2,
                "stepPercent" = "stepPercent" + 12.5                
                WHERE prof_id = $1
                RETURNING "stepPercent", prof_id
            `;
    const data = await query(text, [profId, gender]);

    if (!data.rowCount) {
      throw new Error("hi");
    }

    console.log(data);
    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_skills = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
            SELECT  
            FROM xelosani x
            WHERE prof_id = $1 AND skills_id IS NOT NULL
        `;
    const data = await query(text, [profId]);

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
    const { profId } = req.params;
    const { skills } = req.body;
    await query("BEGIN");
    const skill_data = await query(
      `
                INSERT INTO skill (xelosani_id, displayableSkills, main, parent, child)
                    VALUES ((SELECT id FROM xelosani WHERE prof_id = $1), $2::jsonb, $3, $4, $5)
                    RETURNING id
                    `,
      [
        profId,
        JSON.stringify(skills.displayableSkills),
        skills.main,
        skills.parent,
        skills.child,
      ]
    );
    const xelosani_update = await query(
      `
                UPDATE xelosani
                SET 
                    "stepPercent" = "stepPercent" + 12.5,
                    skills_id = $2               
                WHERE prof_id = $1
                RETURNING "stepPercent", prof_id;
            `,
      [profId, skill_data.rows[0].id]
    );
    await query("COMMIT");

    res.status(200).json(xelosani_update.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_schedule = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
            SELECT  
            FROM xelosani x
            WHERE prof_id = $1 AND x.schedule_id IS NOT NULL
        `;
    const data = await query(text, [profId]);

    if (data.rowCount > 0) {
      res.status(200).json({ message: "განრიგი დამატებულია." });
    } else {
      res.status(400).json({ message: "განრიგი არ არის დამატებული." });
    }
    res.status(200).json({ schedule: data.rows[0] });
  } catch (error) {
    console.log(error);
  }
};
export const insert_xelosani_schedule = async (req, res, next) => {
  const { profId } = req.params;
  const { schedule, xelosaniId } = req.body;

  let tempFilePath;
  const __filename = fileURLToPath(import.meta.url);
  const uniqueId = randomUUID();
  const __dirname = path.dirname(__filename);
  await query("BEGIN");
  try {
    tempFilePath = path.join(
      __dirname + "/temporary_schedule_values_csv",
      `schedule_${uniqueId}.csv`
    );

    const writeStream = fs.createWriteStream(tempFilePath);

    schedule.forEach(({ startTime, endTime, day }) => {
      writeStream.write(`${xelosaniId},${startTime},${endTime},${day}\n`);
    });

    writeStream.end();

    writeStream.on("finish", async () => {
      try {
        await query(
          `COPY schedule (xelosani_id, available_from, available_to, day_of_week) FROM '${tempFilePath}' DELIMITER ',' CSV;`
        );
        const data = await query(
          `
                    UPDATE xelosani
SET 
    "stepPercent" = "stepPercent" + 12.5,
    schedule_id = sc.id
FROM schedule sc
WHERE sc.xelosani_id = xelosani.id
AND prof_id = $1
RETURNING "stepPercent", prof_id;

                `,
          [profId]
        );
        await query("COMMIT;");
        console.log(data)
        res.status(200).json(data.rows[0]);
      } catch (error) {
        console.error("Error inserting schedules:", error);
      } finally {
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            console.error("Error deleting temporary file:", err);
          } else {
            console.log("Temporary file deleted successfully.");
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
};

export const insert_xelosani_service = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const { skills } = req.body;
    const id = xelosani_update.rows[0].id;
    await query(
      `
                INSERT INTO skill (
                main_category, public_id, tags, categories, main_title, main_description, xelosani_id
                )
                VALUES ((SELECT id FROM xelosani WHERE prof_id = $1))
            `,
      [profId]
    );

    res.status(200).json(xelosani_update.rows[0]);
  } catch (error) {
    console.log(error);
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
                VALUES ((SELECT id FROM xelosani WHERE prof_id = $1))
            `,
      [profId]
    );

    res.status(200).json(xelosani_update.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const check_xelosani_location = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const text = `
                SELECT  
                FROM xelosani x
                WHERE prof_id = $1 AND x.location_id IS NOT NULL  
            `;
    const data = await query(text, [profId]);
    if (data.rowCount > 0) {
      res.status(200).json({ message: "ლოკაცია დამატებულია." });
    } else {
      res.status(400).json({ message: "ლოკაცია არ არის დამატებული." });
    }
    res.status(200).json(data.rows[0]);
  } catch (error) {
    console.log(error);
  }
};
