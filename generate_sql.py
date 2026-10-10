import re
import sys
import subprocess

months = {
    'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02',
    'maret': '03', 'mar': '03', 'april': '04', 'apr': '04', 'apri': '04',
    'mei': '05', 'juni': '06', 'jun': '06', 'juli': '07', 'jul': '07',
    'agustus': '08', 'agu': '08', 'agust': '08',
    'september': '09', 'sep': '09', 'oktober': '10', 'okt': '10',
    'november': '11', 'nov': '11', 'desember': '12', 'des': '12',
    'desembeer': '12'
}

def parse_ttl(ttl):
    ttl = ttl.strip()
    m = re.search(r'^(.*?)[,\s]+(\d{1,2})\s*([a-zA-Z]+)\s*(\d{4})$', ttl)
    if not m:
        m = re.search(r'^(.*?)[,\s]+(\d{1,2})\s*([a-zA-Z]+?)(\d{4})$', ttl)
    if m:
        place = m.group(1).rstrip(',. ').strip()
        day = int(m.group(2))
        month_name = m.group(3).strip().lower()
        year = int(m.group(4))
        mon_str = months.get(month_name, '01')
        dob = f"{year:04d}-{mon_str}-{day:02d}"
        return place, dob
    return "Bojonegoro", "1990-01-01"

def parse_name(full_name):
    full_name = full_name.strip()
    # If starts with dr.
    parts = full_name.split(' ')
    if len(parts) == 1:
        return parts[0], ""
    if parts[0].lower() in ['dr.', 'apt.', 'apt']:
        if len(parts) >= 3:
            first_name = parts[0] + " " + parts[1]
            last_name = " ".join(parts[2:])
            return first_name, last_name
        else:
            return parts[0], parts[1]
    return parts[0], " ".join(parts[1:])

def map_job_category(jabatan):
    j = jabatan.upper().strip()
    if 'DOKTER SPESIALIS' in j:
        return 2 # Dokter Spesialis
    if 'DOKTER UMUM' in j or 'DOKTER' in j:
        return 1 # Dokter Umum
    if 'PERAWAT' in j or 'NCC' in j:
        return 3 # Perawat
    if 'BIDAN' in j:
        return 4 # Bidan
    if 'APOTEKER' in j:
        return 5 # Apoteker
    if 'TTK' in j or 'FARMASI' in j:
        return 6 # Asisten Apoteker
    if 'ANALIS' in j or 'LABORAT' in j:
        return 7 # Analis Kesehatan
    if 'RADIOLOGI' in j or 'RADIGRAFER' in j or 'RADIOGRAFER' in j:
        return 8 # Radiografer
    if 'RM' in j or 'REKAM MEDIS' in j:
        return 9 # Rekam Medis
    if 'KEUANGAN' in j or 'KASIR' in j:
        return 11 # Keuangan
    if 'IT' in j:
        return 12 # IT
    if 'SECURITY' in j:
        return 13 # Security
    if 'CS' in j or 'JURU MASAK' in j or 'GIZI' in j:
        return 14 # Cleaning Service / RT
    if 'DRIVER' in j:
        return 15 # Driver
    return 10 # Administrasi

def map_org_unit(jabatan):
    j = jabatan.upper().strip()
    if 'DOKTER' in j:
        return 19 # Pelayanan Medis
    if 'PERAWAT' in j or 'NCC' in j:
        return 24 # Unit Rawat Inap
    if 'BIDAN' in j:
        return 25 # Unit Rawat Jalan dan Kamar Bersalin
    if 'APOTEKER' in j or 'TTK' in j or 'FARMASI' in j:
        return 29 # Unit Farmasi
    if 'ANALIS' in j or 'LABORAT' in j:
        return 26 # Unit Laboratorium
    if 'RADIOLOGI' in j or 'RADIGRAFER' in j or 'RADIOGRAFER' in j:
        return 27 # Unit Radiologi
    if 'RM' in j or 'REKAM MEDIS' in j:
        return 28 # Unit Rekam Medis
    if 'KEUANGAN' in j or 'KASIR' in j:
        return 21 # Keuangan
    if 'IT' in j:
        return 34 # Unit Pengelola Data Elektronik
    if 'GIZI' in j or 'JURU MASAK' in j:
        return 30 # Unit Gizi
    if 'CS' in j or 'DRIVER' in j or 'SECURITY' in j:
        return 33 # Unit Rumah Tangga
    if 'BINROH' in j:
        return 31 # Unit Administrasi dan Dakwah Citra
    return 18 # Administrasi Dan Umum

def map_education(edu_str):
    e = edu_str.upper().strip()
    if 'SPESIALIS' in e:
        return 11 # Spesialis
    if 'S2' in e or 'MAGISTER' in e or 'M.M' in e:
        return 10 # Magister (S2)
    if 'NERS' in e or 'APOTEKER' in e or 'PROFESI' in e:
        return 9 # Profesi
    if 'S1' in e:
        return 8 # Sarjana (S1)
    if 'D4' in e:
        return 7 # D4
    if 'D3' in e or 'AMD' in e or 'A.MD' in e:
        return 6 # D3
    if 'SMP' in e:
        return 2 # SMP
    if 'SMA' in e or 'SMU' in e or 'SMK' in e:
        return 3 # SMA/SMK
    return 3 # default SMA

def map_employment_status(stat_str):
    s = stat_str.upper().strip()
    if 'TETAP' in s:
        return 1 # Karyawan Tetap
    return 2 # Karyawan Kontrak

def main():
    with open('e:/Golang/Administrasi_Go/data_karyawan.txt', 'r', encoding='utf-8') as f:
        lines = [l.strip() for l in f if l.strip()]

    header = lines[0].split('\t')
    print("Parsing records from data_karyawan.txt...")

    records = []
    for idx, line in enumerate(lines[1:], 1):
        parts = line.split('\t')
        no = parts[0].strip()
        nama = parts[1].strip()
        lp = parts[2].strip().upper()
        gender = 'male' if lp == 'L' else 'female'
        no_ktp = parts[3].strip()
        ttl = parts[4].strip()
        nik_karyawan = parts[5].strip()
        usia = parts[6].strip()
        pendidikan = parts[7].strip()
        jabatan = parts[8].strip()
        mulai_kerja = parts[9].strip()
        status_karyawan = parts[10].strip()

        place, dob = parse_ttl(ttl)
        first_name, last_name = parse_name(nama)

        # parse join_date from NIK or mulai_kerja
        m = re.match(r'^(\d{4})[\.\-](\d{2})[\.\-](\d{2})', nik_karyawan)
        if m:
            join_date = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
        else:
            join_date = f"{mulai_kerja}-01-01" if len(mulai_kerja) == 4 else "2024-01-01"

        job_cat_id = map_job_category(jabatan)
        org_unit_id = map_org_unit(jabatan)
        edu_id = map_education(pendidikan)
        emp_status_id = map_employment_status(status_karyawan)

        records.append({
            'no': no,
            'name': nama,
            'first_name': first_name,
            'last_name': last_name,
            'employee_id': nik_karyawan,
            'nik': no_ktp,
            'gender': gender,
            'place_of_birth': place,
            'date_of_birth': dob,
            'job_category_id': job_cat_id,
            'employment_status_id': emp_status_id,
            'organization_unit_id': org_unit_id,
            'position': jabatan,
            'join_date': join_date,
            'education_level_id': edu_id,
            'education_major': pendidikan,
            'status': 'active'
        })

    print(f"Total parsed records: {len(records)}")
    
    # Generate SQL file
    sql_lines = []
    sql_lines.append("-- Script to inject 86 employee records from data_karyawan.txt\n")
    sql_lines.append("BEGIN;\n\n")

    # Link existing employee id 3 (Eko Budi Laksono) to his NIK so ON CONFLICT updates row 3 instead of duplicating
    sql_lines.append("-- Link existing employee id 3 (Eko Budi Laksono) to NIK KTP\n")
    sql_lines.append("UPDATE employees SET nik = '3522082611860003' WHERE id = 3;\n\n")

    for r in records:
        # Check if existing by NIK or name
        # We use ON CONFLICT (nik) DO UPDATE or insert
        # Clean quotes
        fname = r['first_name'].replace("'", "''")
        lname = r['last_name'].replace("'", "''")
        emp_id = r['employee_id'].replace("'", "''")
        nik = r['nik'].replace("'", "''")
        pob = r['place_of_birth'].replace("'", "''")
        pos = r['position'].replace("'", "''")
        edu_maj = r['education_major'].replace("'", "''")

        sql = f"""
INSERT INTO employees (
    employee_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth,
    job_category_id, employment_status_id, organization_unit_id, position,
    join_date, education_level_id, education_major, status, created_at, updated_at
) VALUES (
    '{emp_id}', '{fname}', '{lname}', '{nik}', '{r['gender']}', '{pob}', '{r['date_of_birth']}',
    {r['job_category_id']}, {r['employment_status_id']}, {r['organization_unit_id']}, '{pos}',
    '{r['join_date']}', {r['education_level_id']}, '{edu_maj}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
"""
        sql_lines.append(sql.strip() + "\n")

    sql_lines.append("COMMIT;\n")

    with open('e:/Golang/Administrasi_Go/inject_karyawan.sql', 'w', encoding='utf-8') as f:
        f.writelines(sql_lines)

    print("SQL generated successfully: e:/Golang/Administrasi_Go/inject_karyawan.sql")

if __name__ == '__main__':
    main()
