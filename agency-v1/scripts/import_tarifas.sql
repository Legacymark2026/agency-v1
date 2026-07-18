CREATE TEMP TABLE tmp_tarifas (
  id text,
  company_id text,
  codigo_id text,
  nombre_servicio text,
  categoria text,
  tipo_formato text,
  tiempo_estimado text,
  herramientas text,
  descripcion text,
  precio_base double precision,
  iva_porcentaje double precision,
  retefuente_porc double precision,
  reteiva_porc double precision,
  ica_porc double precision,
  precio_urgente double precision,
  isExpress boolean,
  estado text,
  order_index integer,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  ica_valor double precision,
  iva_valor double precision,
  retefuente_valor double precision,
  reteiva_valor double precision,
  subtotal double precision,
  col_schema_version integer,
  col_deleted_at timestamp with time zone
);

COPY tmp_tarifas FROM '/tmp/tarifas.csv' WITH (FORMAT CSV, HEADER);

INSERT INTO tbl_service_prices (
  id,
  company_id,
  nombre_servicio,
  categoria,
  precio_base,
  estado,
  created_at,
  col_schema_version,
  col_deleted_at
)
SELECT 
  id,
  '20a98979-b955-41e6-b84c-4646f34a8a0a' AS company_id,
  nombre_servicio,
  categoria,
  precio_base,
  estado,
  created_at,
  col_schema_version,
  col_deleted_at
FROM tmp_tarifas
ON CONFLICT (id) DO NOTHING;

DROP TABLE tmp_tarifas;
