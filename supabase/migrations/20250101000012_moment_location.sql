-- Add location fields to moments table
ALTER TABLE moments ADD COLUMN location_name text;
ALTER TABLE moments ADD COLUMN location_lat double precision;
ALTER TABLE moments ADD COLUMN location_lng double precision;
