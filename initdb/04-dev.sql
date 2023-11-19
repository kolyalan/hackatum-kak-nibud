-- alter table to have geo point

ALTER TABLE postcode ADD COLUMN geom geometry(Point, 4326);
UPDATE postcode SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE INDEX idx_spatial_postcode ON postcode USING GIST(geom);

ALTER TABLE service_provider_profile ADD COLUMN geom geometry(Point, 4326);
UPDATE service_provider_profile SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE INDEX idx_spatial_service_provider_profile ON service_provider_profile USING GIST(geom);

-- add picture and description scores to the service provider profile

ALTER TABLE service_provider_profile ADD COLUMN profile_picture_score DOUBLE PRECISION, ADD COLUMN profile_description_score DOUBLE PRECISION;
UPDATE service_provider_profile AS spp
SET
    profile_picture_score = qfs.profile_picture_score,
    profile_description_score = qfs.profile_description_score
FROM quality_factor_score AS qfs
WHERE spp.id = qfs.profile_id;

-- find best 20 by index

SELECT 
    postcode,
    s_id,
    (distance_weight * distance_score + (1 - distance_weight) * profile_score) AS _rank
FROM (
    SELECT 
        p.postcode,
        s.id AS s_id,
        (0.4 * s.profile_picture_score + 0.6 * s.profile_description_score) AS profile_score,
        ST_Distance(s.geom::geography, p.geom::geography) AS distance,
        CASE 
            WHEN p.postcode_extension_distance_group = 'group_a' THEN s.max_driving_distance
            WHEN p.postcode_extension_distance_group = 'group_b' THEN s.max_driving_distance + 2000
            WHEN p.postcode_extension_distance_group = 'group_c' THEN s.max_driving_distance + 5000
        END AS max_driving_distance_extension,
        CASE 
            WHEN ST_Distance(s.geom::geography, p.geom::geography) > 80000 THEN 0.01
            ELSE 0.15
        END AS distance_weight,
        (1 - (ST_Distance(s.geom::geography, p.geom::geography) / 80000)) AS distance_score
    FROM 
        service_provider_profile s
    JOIN 
        postcode p ON p.postcode = p.postcode
    WHERE 
        p.postcode = '03054'
) f 
WHERE 
    max_driving_distance_extension > distance
ORDER BY 
    _rank desc
limit 20
;


-- CREATE TABLE provider_to_postcode AS
-- SELECT id provider_id,
--        p.postcode,
--        ST_Distance(provider.geom::geography, p.geom::geography) distance
--     FROM service_provider_profile provider
--         JOIN postcode p
--     ON ST_DWithin(provider.geom::geography, p.geom::geography, provider.max_driving_distance + 5000);
--
-- SELECT * FROM postcode p1 CROSS JOIN postcode p2 GROUP BY min(ST_Distance(p1.geom::geography, p2.geom::geography))
--
-- WITH MinDistances AS (
--     SELECT DISTINCT ON (p1.postcode)
--       p1.postcode AS postcode_1,
--       p2.postcode AS postcode_2,
--       ST_Distance(p1.geom::geography, p2.geom::geography) AS distance
--     FROM
--       postcode p1
--     JOIN
--       postcode p2 ON p1.postcode <> p2.postcode
--     ORDER BY
--       p1.postcode, distance
-- )
-- SELECT
--   MAX(distance) AS max_distance
-- FROM
--   MinDistances;

