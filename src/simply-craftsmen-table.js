const { query } = require('express');
const { getDatabaseClient } = require('./database-client');

const TABLE_CRAFTSMEN = 'service_provider_profile';
const COLUMNS_ID = 'id';
const COLUMNS_FIRSTNAME = 'first_name';
const COLUMNS_LASTNAME = 'last_name';
const COLUMNS_PICTURE_SCORE = 'profile_picture_score';
const COLUMNS_DESCRIPTION_SCORE = 'profile_description_score'
const COLUMNS_COMMON_SCORE = 'ranking_score';
const COLUMNS_LIST = `${COLUMNS_ID}, ${COLUMNS_FIRSTNAME}, ${COLUMNS_LASTNAME}, 0.4*${COLUMNS_PICTURE_SCORE} + 0.6*${COLUMNS_DESCRIPTION_SCORE} as ${COLUMNS_COMMON_SCORE}`

const ensureTableAndGetClient = async () => {  
  const client = await getDatabaseClient();
  return client;
}

const getCraftsmen = async (postalCode, page) => {
  const client = await ensureTableAndGetClient();

  const query = !!postalCode ?
    ` select 
          provider_id,
          ${COLUMNS_FIRSTNAME},
          ${COLUMNS_LASTNAME},
          ${COLUMNS_COMMON_SCORE},
          (distance_weight * distance_score + (1 - distance_weight) * ${COLUMNS_COMMON_SCORE}) AS _rank
      from (
            select ptp.provider_id,
                  ${COLUMNS_FIRSTNAME},
                  ${COLUMNS_LASTNAME},
                  (0.4 * s.profile_picture_score + 0.6 * s.profile_description_score) AS ${COLUMNS_COMMON_SCORE},
                  ptp.distance,
                  CASE
                      WHEN p.postcode_extension_distance_group = 'group_a' THEN s.max_driving_distance
                      WHEN p.postcode_extension_distance_group = 'group_b' THEN s.max_driving_distance + 2000
                      WHEN p.postcode_extension_distance_group = 'group_c' THEN s.max_driving_distance + 5000
                      END                                                             AS max_driving_distance_extension,
                  CASE
                      WHEN ptp.distance > 80000 THEN 0.01
                      ELSE 0.15
                      END                                                             AS distance_weight,
                  (1 - (ptp.distance) / 80000)                                        AS distance_score
            from provider_to_postcode ptp
                    left join postcode p on p.postcode = ptp.postcode
                    left join service_provider_profile s on ptp.provider_id = s.id
            where ptp.postcode = '${postalCode}'
        ) f
      WHERE max_driving_distance_extension > distance
      ORDER BY _rank desc
      LIMIT 20 OFFSET ${page}*20;`:
    `SELECT ${COLUMNS_LIST} FROM ${TABLE_CRAFTSMEN} LIMIT 20 OFFSET ${page}*20;`;

  const result = await client.query(query);
  client.release();

  return result.rows;
};

const updateRanking = async (craftsmanId, maxDrivingDistance, profilePictureScore, profileDescriptionScore) => {
  const client = await ensureTableAndGetClient();
  console.log(maxDrivingDistance);
  console.log(profilePictureScore);
  console.log(profileDescriptionScore);
  let set_expr = "";
  if (!Number.isNaN(maxDrivingDistance)) {
    set_expr += `max_driving_distance=${maxDrivingDistance}`
  }
  if (!Number.isNaN(profilePictureScore)) {
    if (set_expr != "") {
      set_expr += ", ";
    }
    set_expr += `profile_picture_score=${profilePictureScore}`
  }
  if (!Number.isNaN(profileDescriptionScore)) {
    if (set_expr != "") {
      set_expr += ", ";
    }
    set_expr += `profile_description_score=${profileDescriptionScore}`
  }
  if (set_expr == "") {
    return undefined;
  }
  let query = `UPDATE ${TABLE_CRAFTSMEN} SET ${set_expr} WHERE id=${craftsmanId} RETURNING id,
                    ${COLUMNS_FIRSTNAME},
                    ${COLUMNS_LASTNAME},
                    (0.4 * profile_picture_score + 0.6 * profile_description_score) AS ${COLUMNS_COMMON_SCORE};`;
  console.log(query);
  const result = await client.query(query);

  if (!Number.isNaN(maxDrivingDistance)) {
    query = `DELETE FROM provider_to_postcode where provider_id = ${craftsmanId};`;
    const result2 = await client.query(query);
    query = ` INSERT INTO provider_to_postcode
              SELECT id provider_id,
                    p.postcode,
                    ST_Distance(provider.geom::geography, p.geom::geography) distance
                  FROM service_provider_profile provider
                      JOIN postcode p
                  ON provider.id = ${craftsmanId} AND ST_DWithin(provider.geom::geography, p.geom::geography, provider.max_driving_distance + 5000);`
    const result3 = await client.query(query);
  }
  
  client.release();

  return result.rows[0];
};

module.exports = {
  getCraftsmen,
  updateRanking
}