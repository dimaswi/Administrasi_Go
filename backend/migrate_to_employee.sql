-- 1. Add new columns
ALTER TABLE roster_schedules ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE shift_exchanges ADD COLUMN IF NOT EXISTS requesting_employee_id INTEGER REFERENCES employees(id);
ALTER TABLE shift_exchanges ADD COLUMN IF NOT EXISTS target_employee_id INTEGER REFERENCES employees(id);

-- 2. Map existing data from users to employees
UPDATE roster_schedules r
SET employee_id = e.id
FROM employees e
WHERE r.user_id = e.user_id;

UPDATE shift_exchanges s
SET requesting_employee_id = e.id
FROM employees e
WHERE s.requesting_user_id = e.user_id;

UPDATE shift_exchanges s
SET target_employee_id = e.id
FROM employees e
WHERE s.target_user_id = e.user_id;

-- 3. Drop old columns
ALTER TABLE roster_schedules DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE shift_exchanges DROP COLUMN IF EXISTS requesting_user_id CASCADE;
ALTER TABLE shift_exchanges DROP COLUMN IF EXISTS target_user_id CASCADE;
