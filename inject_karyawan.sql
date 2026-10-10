-- Script to inject 86 employee records from data_karyawan.txt
BEGIN;

-- Link existing employee id 3 (Eko Budi Laksono) to NIK KTP
UPDATE employees SET nik = '3522082611860003' WHERE id = 3;

INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2003.09.09.018', 'Ida', 'Farida, S.E', '3522086910800002', 'female', 'Bojonegoro', '1980-10-29',
    11, 1, 21, 'KEUANGAN',
    '2003-09-09', 8, 'S1 Ekonomi 2018', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2003.09.03.020', 'Heni', 'Suskamdani A.Md.Keb', '3522085012780002', 'female', 'Bojonegoro', '1978-12-10',
    4, 1, 25, 'BIDAN',
    '2003-09-03', 6, 'D3 Kebidanan 2012', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2003.09.12.021', 'Suyoto', '', '352208071680000', 'male', 'Bojonegoro', '1968-11-07',
    8, 1, 27, 'AST RADIOLOGI',
    '2003-09-12', 3, 'SMA 2009', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2007.02.12.023', 'Hartono', '', '3522081911840002', 'male', 'Bojonegoro', '1984-11-19',
    14, 1, 33, 'CS',
    '2007-02-12', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2009.03.02.029', 'Antik', 'Dwi Susiana, A.Md.Kep', '3522084303820003', 'female', 'Bojonegoro', '1981-02-04',
    3, 1, 24, 'PERAWAT',
    '2009-03-02', 8, 'S1 Keperawatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2009.09.05.034', 'Titin', 'Hendrayani A.Md.AK', '3522085708820006', 'female', 'Gresik', '1982-08-17',
    7, 1, 26, 'ANALIS LABORAT',
    '2009-09-05', 6, 'D3 Analis Kesehatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2010.01.02.035', 'Eko', 'Budi Laksono, S.Kep., Ns', '3522082611860003', 'male', 'Bojonegoro', '1986-11-26',
    3, 1, 24, 'PERAWAT',
    '2010-01-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2010.01.09.037', 'Pravita', 'Pridiana Wati', '3522086401910004', 'female', 'Bojonegoro', '1991-01-24',
    11, 1, 21, 'KEUANGAN',
    '2010-01-09', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2010.08.02.040', 'Eri', 'Kuswaningsih, S.Kep,Ns', '3522085911850002', 'female', 'Bojonegoro', '1985-11-19',
    3, 1, 24, 'PERAWAT',
    '2010-08-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2010.09.02.043', 'Yoyok', 'Mariyadi, A.Md.Kep', '3522071002830002', 'male', 'Bojonegoro', '1983-02-10',
    3, 1, 24, 'PERAWAT',
    '2010-09-02', 8, 'S1 Keperawatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2011.04.02.044', 'M.', 'Zaki Zamani A.Md.Kep', '3522121310880002', 'male', 'Bojonegoro', '1988-10-13',
    3, 1, 24, 'NCC',
    '2011-04-02', 6, 'D3 Keperawatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2012.01.12.048', 'Didik', 'Harianto', '3522082808860008', 'male', 'Bojonegoro', '1986-08-28',
    14, 1, 33, 'CS',
    '2012-01-12', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2012.11.01.055', 'dr. M.', 'Thayyib Sp.PD', '3372012111700004', 'male', 'Surakarta', '1970-11-21',
    2, 2, 19, 'DOKTER SPESIALIS DALAM',
    '2012-11-01', 11, 'Dokter Spesialis Penyakit Dalam', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2014.04.02.059', 'Arif', 'Suparman A.Md.Kep', '3522073112910008', 'male', 'Bojonegoro', '1991-12-31',
    3, 1, 24, 'PERAWAT',
    '2014-04-02', 8, 'S1 Keperawatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2014.04.02.060', 'Moh.', 'Miftahul Huda, S.Kep,Ns', '3522121307900007', 'male', 'Bojonegoro', '1990-07-13',
    3, 1, 24, 'PERAWAT',
    '2014-04-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2014.10.09.062', 'Ayuk', 'Saputri Mudiani, S.E', '3522085711940002', 'female', 'Bojonegoro', '1994-11-17',
    11, 1, 21, 'KEUANGAN',
    '2014-10-09', 8, 'S1 Ekonomi 2017', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2015.05.12.068', 'Yuhan', 'Efendi', '3522080505890007', 'male', 'Bojonegoro', '1989-05-05',
    15, 2, 33, 'DRIVER',
    '2015-05-12', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2017.02.05.076', 'Eriesta', 'Dwi Estiyani, A.Md.AK', '3522085801960002', 'female', 'Bojonegoro', '1996-01-18',
    7, 1, 26, 'ANALIS LABORAT',
    '2017-02-05', 6, 'D3 Analis Kesehatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2017.02.02.082', 'Septy', 'Kartika Sari, S.Kep,Ns', '3522097009930004', 'female', 'Bojonegoro', '1993-09-30',
    3, 1, 24, 'PERAWAT',
    '2017-02-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2017.06.08.083', 'Dina', 'Anita Sari, A.Md.Gz', '352208641250000', 'female', 'Bojonegoro', '1995-12-24',
    14, 1, 30, 'GIZI',
    '2017-06-08', 6, 'D3 Gizi', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2018.01.03.085', 'Deni', 'Erliya Sari, A.Md.Keb', '3522086703880005', 'female', 'Bojonegoro', '1988-03-27',
    4, 1, 25, 'BIDAN',
    '2018-01-03', 6, 'D3 Kebidanan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2018.01.08.087', 'Agik', 'Suluh Wicaksana', '3522131008940000', 'male', 'Bojonegoro', '1994-08-10',
    14, 1, 30, 'JURU MASAK',
    '2018-01-08', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2015.02.05.094', 'Galuh', 'Romadhon kamiswari,A.Md.Kes', '3522121301980002', 'male', 'Bojonegoro', '1998-01-13',
    7, 1, 26, 'ANALIS LABORAT',
    '2015-02-05', 6, 'D3 Analis Kesehatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2018.05.01.098', 'dr.Eka', 'Pradana Frendy Afriyan', '3522111904910004', 'male', 'Bojonegoro', '1991-04-09',
    1, 2, 19, 'DOKTER UMUM',
    '2018-05-01', 8, 'S1 Kedokteran Umum', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2018.05.01.099', 'dr.Gagak', 'Ismanoe Sp.B', '3525141806700004', 'male', 'Surabaya', '1970-06-18',
    2, 2, 19, 'DOKTER SPESIALIS BEDAH',
    '2018-05-01', 11, 'Dokter Spesialis Bedah', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2019.01.09.105', 'Nilla', 'Elvyna Rahmawati', '3522086505960001', 'female', 'Bojonegoro', '1996-05-25',
    11, 1, 21, 'KEUANGAN',
    '2019-01-09', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2019.04.09.109', 'Alin', 'Erlinda Sari', '3522085703990002', 'female', 'Bojonegoro', '1999-03-17',
    11, 1, 21, 'KEUANGAN',
    '2019-04-09', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2019.09.12.111', 'Yudianto', '', '3522081401770003', 'male', 'Bojonegoro', '1977-01-14',
    14, 2, 33, 'CS',
    '2019-09-12', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.02.12.115', 'Mutoliah', 'Hidayati', '3522085508680002', 'female', 'Sidoarjo', '1968-08-15',
    10, 2, 31, 'BINROH',
    '2020-02-12', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.02.01.118', 'Andri', 'Susanto', '3522082311920003', 'male', 'Bojonegoro', '1992-11-23',
    14, 2, 33, 'CS',
    '2020-02-01', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.05.12.124', 'Ahmad', 'David al-farizi', '3522101607010004', 'male', 'Bojonegoro', '2001-07-16',
    10, 1, 18, 'ADMINISTRASI',
    '2020-05-12', 3, 'SMA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.11.01.126', 'dr. Avif', 'Irkhamil Sativa', '3522074804950002', 'female', 'Bojonegoro', '1995-04-08',
    1, 1, 19, 'DOKTER UMUM',
    '2020-11-01', 8, 'S1 Kedokteran Umum', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.12.12.129', 'Alif', 'Helmi Afrissa, S. Kes', '3522242503970002', 'male', 'Bojonegoro', '1997-03-25',
    10, 1, 18, 'ADMINISTRASI',
    '2020-12-12', 8, 'S1 Administrasi RS', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.12.02.131', 'Lulut', 'Ardiansyah, S.Kep,Ns', '3524011906960001', 'male', 'LAMONGAN', '1996-06-19',
    3, 1, 24, 'PERAWAT',
    '2020-12-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2020.12.09.132', 'Riski', 'Novita Amilia,A.Md.Keb', '3506185902950001', 'female', 'Kediri', '1995-02-19',
    11, 1, 21, 'KEUANGAN',
    '2020-12-09', 6, 'D3 Kebidanan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.02.12.141', 'Andris', 'Tri Cahyono', '3522082501920004', 'male', 'Bojonegoro', '1992-01-25',
    14, 2, 33, 'CS',
    '2022-02-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.02.04.142', 'Muhammad', 'Syamsuddin, S.farm', '3522070501940001', 'male', 'Bojonegoro', '1994-01-05',
    6, 2, 29, 'TENAGA TTK FARMASI',
    '2022-02-04', 8, 'S1 farmasi', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.02.10.144', 'Rizki', 'septian Nurhadi, A.Md.Rad', '3523180109940001', 'male', 'Tuban', '1994-07-07',
    8, 2, 27, 'RADIGRAFER',
    '2022-02-10', 6, 'D3 radiografer', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.02.08.145', 'Winarti', '', '3522084508770004', 'female', 'Bojonegoro', '1977-08-05',
    14, 2, 30, 'JURU MASAK',
    '2022-02-08', 2, 'SMP', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.06.12.148', 'Findia', 'Rumhaini,S. Kes., M.M', '3522086302000003', 'female', 'Bojonegoro', '2000-02-23',
    10, 2, 18, 'ADMINISTRASI',
    '2022-06-12', 8, 'S1 Administrasi RS', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.06.01.149', 'dr. Suhasta', 'Nova,Sp.A', '3522040811830001', 'male', 'Bojonegoro', '1983-11-08',
    2, 2, 19, 'DOKTER SPESIALIS ANAK',
    '2022-06-01', 11, 'Dokter Spesialis Anak', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2022.09.01.151', 'dr. Yusron', 'Abdurrohman', '3522092406940003', 'male', 'Bojonegoro', '1994-06-24',
    1, 2, 19, 'DOKTER UMUM',
    '2022-09-01', 8, 'S1 KEDOKTERAN UMUM', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.01.02.157', 'Intan', 'Yuniar, S Kep,Ns', '3522124606980002', 'female', 'Bojonegoro', '1998-06-06',
    3, 1, 24, 'PERAWAT',
    '2023-01-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.01.07.159', 'Oktavio', 'Firdaus Efendi,A.Md.RMIK', '3522133010010003', 'male', 'Bojonegoro', '2001-10-30',
    9, 2, 28, 'TENAGA RM',
    '2023-01-07', 6, 'D3 Rekam medis', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.01.12.162', 'Dimas', 'Wisnu Wirawan', '3522061101010001', 'male', 'Bojonegoro', '2001-01-11',
    12, 1, 34, 'TENAGA IT',
    '2023-01-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.02.03.163', 'Lutfi', 'Linggarwati, A.Md.Keb', '3522125809900001', 'female', 'Bojonegoro', '1990-09-18',
    4, 1, 25, 'Bidan',
    '2023-02-03', 6, 'D3 Kebidanan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.03.04.164', 'Doni', 'Firman Pratama, A.Md .Farm', '352209260401000', 'male', 'Bojonegoro', '2001-04-26',
    6, 2, 29, 'Tenaga TTK FARMASI',
    '2023-03-04', 6, 'D3 Farmasi', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.07.03.167', 'Dhevy', 'Nurfita Agustina, A.Md.Keb', '3522086108910003', 'female', 'Bojonegoro', '1991-08-21',
    4, 2, 25, 'Bidan',
    '2023-07-03', 6, 'D3 Kebidanan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.07.01.171', 'dr. Eko', 'Ardianto Margiono', '3515182602840001', 'male', 'Surabaya', '1984-02-26',
    2, 2, 19, 'DOKTER SPESIALIS RADIOLOGI',
    '2023-07-01', 11, 'Dokter Spesialis Radiologi', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.09.12.173', 'Ahmad', 'Yusuf Fendi Pradana', '3522080510000007', 'male', 'Bojonegoro', '2000-10-05',
    8, 2, 27, 'AST RADIOLOGI',
    '2023-09-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.10.02.174', 'Elvina', 'Lia Fatmawati, S.Kep,Ns', '3522086809000001', 'female', 'Bojonegoro', '2000-09-28',
    3, 2, 24, 'PERAWAT',
    '2023-10-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2023.10.12.175', 'Nanda', 'Emiliya, S.E', '3522085806980002', 'female', 'Bojonegoro', '1998-06-18',
    11, 2, 21, 'KASIR',
    '2023-10-12', 8, 'S1 EKONOMI', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.02.11.179', 'Dedi', 'efendi, A.Md.Kes', '3522130910010002', 'male', 'Bojonegoro', '2001-10-09',
    10, 2, 18, 'KESLING',
    '2024-02-11', 6, 'D3 Kesling', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.02.04.180', 'Apt.', 'Diana,S.Farm', '3522114912980001', 'female', 'Bojonegoro', '1998-12-09',
    5, 1, 29, 'APOTEKER',
    '2024-02-04', 9, 'APOTEKER', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.02.12.181', 'Bambang', 'Supriyadi', '3522081507870009', 'male', 'Bojonegoro', '1987-07-15',
    12, 2, 34, 'SECURITY',
    '2024-02-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.04.04 185', 'Apt.Rhanuga', 'Harmusyanto, S.Farm.M.Si', '3522131204880001', 'male', 'Bojonegoro', '1988-04-12',
    5, 2, 29, 'APOTEKER',
    '2024-04-04', 9, 'APOTEKER', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2018.09.01.100', 'dr. Akhmad', 'Ikhwan Baidlowi, Sp.OG', '3522070905900001', 'male', 'BOJONEGORO', '1990-05-09',
    2, 1, 19, 'Dokter Spesialis Obgyn',
    '2018-09-01', 11, 'Dokter Spesialis Obgyn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.06.03.186', 'Nur', 'Ismatul ''Azizah, A.Md.Keb', '3522085305940002', 'female', 'Bojonegoro', '1994-05-13',
    4, 2, 25, 'BIDAN',
    '2024-06-03', 6, 'D3 KEBIDANAN', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.06.02.187', 'Tri', 'Heni Rahayu, S.Kep,Ns', '3522087108960001', 'female', 'Bojonegoro', '1996-08-31',
    3, 2, 24, 'PERAWAT',
    '2024-06-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.08.08.188', 'Muhamad', 'Samhari', '3316040202890000', 'male', 'Blora', '1989-02-02',
    14, 2, 30, 'JURU MASAK',
    '2024-08-08', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.09.07.189', 'Naning', 'Nur Utami', '3522096205010001', 'female', 'Bojonegoro', '2001-05-22',
    10, 2, 18, 'PENDAFTARAN',
    '2024-09-07', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.09.07.190', 'Lindawati', 'Nur Azizah,A.Md.RMIK', '3522085905020003', 'female', 'Bojonegoro', '2002-05-19',
    9, 2, 28, 'RM',
    '2024-09-07', 6, 'D3 Rekam medis', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.09.12.191', 'Pirawati', 'Wulandari', '3522074407030001', 'female', 'Bojonegoro', '2003-07-04',
    11, 2, 21, 'KASIR',
    '2024-09-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.10.05.192', 'Devi', 'Triana Wulandari,A.Md.Kes', '3522084910030003', 'female', 'Bojonegoro', '2003-10-09',
    7, 2, 26, 'ANALIS LABORAT',
    '2024-10-05', 6, 'D3 Analis Kesehatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.10.03.194', 'Kisatul', 'Ulya Kasanah, A.Md.Keb.', '3522075601020004', 'female', 'Bojonegoro', '2002-01-16',
    4, 2, 25, 'BIDAN',
    '2024-10-03', 6, 'D3 KEBIDANAN', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.10.12.195', 'Muhammad', 'Iqbal, S.Kom', '3522082302020005', 'male', 'Bojonegoro', '2002-02-23',
    12, 2, 34, 'IT',
    '2024-10-12', 8, 'S1 TEKNOLOGI INFORMATIKA', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.10.02.196', 'Lilik', 'Maria Ulfa, S Kep. Ns', '3524206109960001', 'female', 'Lamongan', '1996-09-21',
    3, 2, 24, 'PERAWAT',
    '2024-10-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.10.02.197', 'Vernanda', 'Auliyatul Fitri, S. Kep,Ns', '3522115008000001', 'female', 'Bojonegoro', '2000-08-10',
    3, 2, 24, 'PERAWAT',
    '2024-10-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2024.12.12.201', 'Mirza', 'Alfarizi', '3522080101960006', 'male', 'Bojonegoro', '1996-01-01',
    12, 2, 34, 'SECURITY',
    '2024-12-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2025.02.02.205', 'Siti', 'Khusnul Khotimah,S.Kep.Ns', '3522126806010002', 'female', 'Bojonegoro', '2001-06-28',
    3, 2, 24, 'PERAWAT',
    '2025-02-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2025.02.02.207', 'Ayu', 'astutika Anggraini,S.Kep.Ns', '3522096809000001', 'female', 'Bojonegoro', '2000-09-28',
    3, 2, 24, 'PERAWAT',
    '2025-02-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2025.02.02.209', 'Septika', 'bahnonik,S.Kep.Ns', '3522084209020004', 'female', 'Bojonegoro', '2002-09-02',
    3, 2, 24, 'PERAWAT',
    '2025-02-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2025.02.07.210', 'Anisa', 'Febriyanti', '3522206402000001', 'female', 'Bojonegoro', '2000-02-24',
    10, 2, 18, 'PENDAFTARAN',
    '2025-02-07', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2025.04.01.216', 'dr. Dzulfikri', 'Aulia Akbar', '3517090703990001', 'male', 'Jombang', '1999-03-07',
    1, 1, 19, 'DOKTER UMUM',
    '2025-04-01', 8, 'S1 KEDOKTERAN', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2025.04.01.217', 'dr. Ahmad', 'Bagus Rifai', '3523110810960001', 'male', 'Tuban', '1996-10-26',
    1, 1, 19, 'DOKTER UMUM',
    '2025-04-01', 8, 'S1 KEDOKTERAN', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.01.02.219', 'Lya', 'Afriasih,S.Kep.Ns', '3522086204030001', 'female', 'Bojonnegoro', '2003-04-22',
    3, 2, 24, 'PERAWAT',
    '2026-01-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.01.02.220', 'Valentia', 'Dwi PS,A.Md.Kep', '3522086402000004', 'female', 'Bojonegoro', '2000-02-24',
    3, 2, 24, 'PERAWAT',
    '2026-01-02', 6, 'D3 Keperawatan', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.01.04.221', 'Dhigitha', 'Rahayu,A.Md.Farm', '3522075402010002', 'female', 'Bojonegoro', '2001-02-14',
    6, 2, 29, 'TTK',
    '2026-01-04', 6, 'D3 Farmasi', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.01.04.222', 'Intan', 'Faradilla,A.Md.Farm', '3522124301020002', 'female', 'Bojonegoro', '2002-01-03',
    6, 2, 29, 'TTK',
    '2026-01-04', 6, 'D3 Farmasi', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.01.12.223', 'Aisyah', 'Agustina', '3522086408000002', 'female', 'Bojonegoro', '2001-08-24',
    11, 2, 21, 'KASIR',
    '2026-01-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.01.01.224', 'dr.Aufal', 'Mari''e Hidayati', '3522125912970005', 'female', 'Bojonegoro', '1997-12-19',
    1, 1, 19, 'DOKTER UMUM',
    '2026-01-01', 8, 'S1 KEDOKTERAN', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.05.12.228', 'M.Ibadurrohman', 'Assya''bana', '3522120610030002', 'male', 'Bojonegoro', '2003-10-06',
    15, 2, 33, 'DRIVER',
    '2026-05-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.05.12.229', 'Okta', 'Aprilia Nur Hikmah', '3522081404030003', 'male', 'Bojonegoro', '2003-04-14',
    12, 2, 34, 'SECURITY',
    '2026-05-12', 3, 'SMU', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.05.02.230', 'Bella', 'Safira, S.Kep.Ns', '3522074505010002', 'female', 'Bojonegoro', '2001-05-05',
    3, 2, 24, 'PERAWAT',
    '2026-05-02', 9, 'S1 Ners', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.06.01.231', 'dr. Diony', 'Sintia  Sp.PD', '3404026111890002', 'female', 'Sleman', '1989-11-21',
    2, 2, 19, 'DOKTER SPESIALIS DALAM',
    '2026-06-01', 11, 'Dokter Spesialis Penyakit Dalam', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '2026.06.07.232', 'Melisa', 'Audia Raswandika,AMd.RMIK', '3524015112030001', 'female', 'Lamongan', '2003-12-11',
    9, 2, 28, 'RM',
    '2026-06-07', 6, 'D3 Rekam medis', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (nik) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    place_of_birth = EXCLUDED.place_of_birth,
    date_of_birth = EXCLUDED.date_of_birth,
    job_category_id = EXCLUDED.job_category_id,
    employment_status_id = EXCLUDED.employment_status_id,
    organization_unit_id = EXCLUDED.organization_unit_id,
    position = EXCLUDED.position,
    join_date = EXCLUDED.join_date,
    education_level_id = EXCLUDED.education_level_id,
    education_major = EXCLUDED.education_major,
    updated_at = CURRENT_TIMESTAMP;
COMMIT;
