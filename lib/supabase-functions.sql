-- Function to drop tables if they exist
CREATE OR REPLACE FUNCTION drop_tables_if_exist(tables text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || table_name || ' CASCADE';
  END LOOP;
END;
$$;

-- Function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$; 