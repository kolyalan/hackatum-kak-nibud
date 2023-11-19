DROP TABLE IF EXISTS provider_to_postcode;

create table provider_to_postcode
(
    provider_id integer REFERENCES service_provider_profile(id) NOT NULL,
    postcode    varchar(5) REFERENCES postcode(postcode) NOT NULL,
    distance    double precision NOT NULL
);

\copy provider_to_postcode(provider_id, postcode, distance) FROM '/docker-entrypoint-initdb.d/provider_to_postcode.csv' DELIMITER ',' CSV HEADER

CREATE INDEX postcode_to_providers ON provider_to_postcode (postcode);

CREATE INDEX prov_id ON provider_to_postcode (provider_id);
