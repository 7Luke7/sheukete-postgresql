import { query } from "../../utils/query.js";

function getBoundingBox(zoom, x, y) {
    const n = Math.pow(2, zoom);
    const lon_left = x / n * 360.0 - 180.0;
    const lon_right = (x + 1) / n * 360.0 - 180.0;
    const lat_top = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * (180 / Math.PI);
    const lat_bottom = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * (180 / Math.PI);
    
    return { min_x: lon_left, min_y: lat_bottom, max_x: lon_right, max_y: lat_top };
}

export const get_tiles = async (req, res, next) => {
  try {
    const text = `
    SELECT ST_AsGeoJSON(geom) AS geojson
    FROM lines
    WHERE ST_Intersects(
        geom,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
    );
`;
        const { min_x, min_y, max_x, max_y } = getBoundingBox(req.query.zoom, req.query.x, req.query.y);

    const values = [min_x, min_y, max_x, max_y];
    const res = await query(text, values);

    console.log(res);
    if (res.rows.length > 0) {
      return res.rows[0].tile_image; // Return the tile image as a PNG
    } else {
      throw new Error("Tile not found");
    }
  } catch (error) {
    console.log(error);
  }
};
