package seeder

import (
	"log"

	"github.com/jmoiron/sqlx"
)

type PermDef struct {
	Name        string
	DisplayName string
	Description string
	Module      string
}

var AllPermissions = []PermDef{
	// 1. Dashboard & Presensi Mandiri
	{"dashboard.view", "Lihat Dashboard", "Dapat mengakses dashboard utama", "Dashboard"},
	{"attendance.my_attendance", "Presensi Mandiri", "Dapat melakukan presensi masuk dan pulang mandiri", "Presensi Mandiri"},
	{"attendance.early_leave_request", "Ajukan Pulang Cepat", "Dapat mengajukan izin pulang cepat mandiri", "Presensi Mandiri"},
	{"leave.my_leave", "Ajukan Cuti Mandiri", "Dapat mengajukan permohonan cuti mandiri", "Presensi Mandiri"},
	{"shift_exchange.my_request", "Ajukan Tukar Shift Mandiri", "Dapat mengajukan penukaran shift kerja mandiri", "Presensi Mandiri"},

	// 2. Karyawan (HR - Data Karyawan)
	{"employee.view", "Lihat Data Karyawan", "Dapat melihat daftar dan profil karyawan", "Data Karyawan"},
	{"employee.create", "Tambah Karyawan Baru", "Dapat mendaftarkan pegawai/karyawan baru", "Data Karyawan"},
	{"employee.edit", "Edit Data Karyawan", "Dapat mengubah data profil dan biodata karyawan", "Data Karyawan"},
	{"employee.delete", "Hapus Karyawan", "Dapat menghapus data karyawan dari sistem", "Data Karyawan"},
	{"employee.manage_account", "Kelola Akun User Karyawan", "Dapat membuat, menautkan, dan mereset password akun user karyawan", "Data Karyawan"},
	{"employee.face_register", "Pendaftaran Face AI", "Dapat mendaftarkan dan memperbarui foto AI Face karyawan", "Data Karyawan"},

	// 3. Jadwal & Roster Shift (HR - Roster Schedule)
	{"roster.view", "Lihat Jadwal Roster", "Dapat melihat jadwal kerja dan kalender roster shift karyawan", "Jadwal & Roster"},
	{"roster.create", "Tambah Jadwal Roster", "Dapat menambahkan penugasan shift roster karyawan", "Jadwal & Roster"},
	{"roster.edit", "Edit Jadwal Roster", "Dapat mengubah penugasan shift roster karyawan", "Jadwal & Roster"},
	{"roster.delete", "Hapus Jadwal Roster", "Dapat menghapus jadwal roster shift karyawan", "Jadwal & Roster"},
	{"roster.auto_generate", "Auto-Generate Roster", "Dapat menggunakan fitur generate otomatis jadwal roster", "Jadwal & Roster"},
	{"employee_schedule.view", "Lihat Jadwal Mingguan", "Dapat melihat pola jadwal shift mingguan karyawan", "Jadwal & Roster"},
	{"employee_schedule.manage", "Atur Jadwal Mingguan", "Dapat mengatur dan menyimpan pola jadwal shift mingguan karyawan", "Jadwal & Roster"},

	// 4. Tukar Shift (HR - Shift Exchange)
	{"shift_exchange.view", "Lihat Tukar Shift", "Dapat melihat daftar pengajuan tukar shift seluruh karyawan", "Tukar Shift"},
	{"shift_exchange.create", "Buat Pengajuan Tukar Shift", "Dapat membuat pengajuan tukar shift antar karyawan", "Tukar Shift"},
	{"shift_exchange.approve", "Persetujuan (ACC) Tukar Shift", "Dapat menyetujui (ACC) atau menolak pengajuan tukar shift", "Tukar Shift"},

	// 5. Riwayat Absensi & Pulang Cepat (HR - Attendance Admin)
	{"attendance.view", "Lihat Riwayat Absensi Admin", "Dapat melihat rekap riwayat presensi seluruh karyawan", "Riwayat Absensi (Admin)"},
	{"attendance.create", "Input Absensi Manual", "Dapat mencatat atau memasukkan data absensi secara manual", "Riwayat Absensi (Admin)"},
	{"attendance.edit", "Edit Data Absensi", "Dapat mengoreksi jam masuk/pulang presensi karyawan", "Riwayat Absensi (Admin)"},
	{"attendance.delete", "Hapus Data Absensi", "Dapat menghapus catatan presensi karyawan", "Riwayat Absensi (Admin)"},
	{"attendance.approve_early_leave", "Persetujuan (ACC) Pulang Cepat", "Dapat menyetujui pengajuan pulang cepat karyawan", "Riwayat Absensi (Admin)"},

	// 6. Izin & Cuti Karyawan (HR - Leaves)
	{"leave.view", "Lihat Izin & Cuti Karyawan", "Dapat melihat daftar seluruh pengajuan izin & cuti karyawan", "Izin & Cuti Karyawan"},
	{"leave.create", "Buat Pengajuan Cuti", "Dapat menginputkan permohonan cuti karyawan", "Izin & Cuti Karyawan"},
	{"leave.approve", "Persetujuan (ACC) Cuti", "Dapat menyetujui (ACC) atau menolak permohonan cuti", "Izin & Cuti Karyawan"},
	{"leave.delete", "Hapus Pengajuan Cuti", "Dapat menghapus pengajuan izin/cuti karyawan", "Izin & Cuti Karyawan"},

	// 7. Rekap & Laporan Absensi (HR - Reports)
	{"report.view", "Lihat Rekap Absensi", "Dapat mengakses dan melihat laporan rekap absensi", "Rekap Absensi"},
	{"report.export", "Export Laporan Absensi", "Dapat mengekspor laporan rekap absensi ke file Excel/PDF", "Rekap Absensi"},

	// 8. Master Data Kepegawaian
	{"job_category.view", "Lihat Kategori Pekerjaan", "Dapat melihat master kategori pekerjaan", "Master Kepegawaian"},
	{"job_category.create", "Tambah Kategori Pekerjaan", "Dapat menambah master kategori pekerjaan baru", "Master Kepegawaian"},
	{"job_category.edit", "Edit Kategori Pekerjaan", "Dapat mengedit master kategori pekerjaan", "Master Kepegawaian"},
	{"job_category.delete", "Hapus Kategori Pekerjaan", "Dapat menghapus master kategori pekerjaan", "Master Kepegawaian"},

	{"employment_status.view", "Lihat Status Kepegawaian", "Dapat melihat master status kepegawaian", "Master Kepegawaian"},
	{"employment_status.create", "Tambah Status Kepegawaian", "Dapat menambah master status kepegawaian baru", "Master Kepegawaian"},
	{"employment_status.edit", "Edit Status Kepegawaian", "Dapat mengedit master status kepegawaian", "Master Kepegawaian"},
	{"employment_status.delete", "Hapus Status Kepegawaian", "Dapat menghapus master status kepegawaian", "Master Kepegawaian"},

	{"education_level.view", "Lihat Tingkat Pendidikan", "Dapat melihat master tingkat pendidikan", "Master Kepegawaian"},
	{"education_level.create", "Tambah Tingkat Pendidikan", "Dapat menambah master tingkat pendidikan baru", "Master Kepegawaian"},
	{"education_level.edit", "Edit Tingkat Pendidikan", "Dapat mengedit master tingkat pendidikan", "Master Kepegawaian"},
	{"education_level.delete", "Hapus Tingkat Pendidikan", "Dapat menghapus master tingkat pendidikan", "Master Kepegawaian"},

	{"leave_type.view", "Lihat Jenis Cuti", "Dapat melihat master jenis cuti", "Master Kepegawaian"},
	{"leave_type.create", "Tambah Jenis Cuti", "Dapat menambah master jenis cuti baru", "Master Kepegawaian"},
	{"leave_type.edit", "Edit Jenis Cuti", "Dapat mengedit master jenis cuti", "Master Kepegawaian"},
	{"leave_type.delete", "Hapus Jenis Cuti", "Dapat menghapus master jenis cuti", "Master Kepegawaian"},

	{"work_location.view", "Lihat Lokasi Presensi (GPS)", "Dapat melihat master lokasi presensi dan titik geofence", "Master Kepegawaian"},
	{"work_location.create", "Tambah Lokasi Presensi", "Dapat menambah titik koordinat radius lokasi kerja", "Master Kepegawaian"},
	{"work_location.edit", "Edit Lokasi Presensi", "Dapat mengubah titik koordinat radius lokasi kerja", "Master Kepegawaian"},
	{"work_location.delete", "Hapus Lokasi Presensi", "Dapat menghapus titik lokasi kerja", "Master Kepegawaian"},

	{"work_schedule.view", "Lihat Master Shift", "Dapat melihat daftar jam kerja shift", "Master Kepegawaian"},
	{"work_schedule.create", "Tambah Master Shift", "Dapat menambah master shift jam kerja baru", "Master Kepegawaian"},
	{"work_schedule.edit", "Edit Master Shift", "Dapat mengubah konfigurasi shift jam kerja", "Master Kepegawaian"},
	{"work_schedule.delete", "Hapus Master Shift", "Dapat menghapus master shift jam kerja", "Master Kepegawaian"},

	// 9. Unit Organisasi
	{"organization.view", "Lihat Unit Organisasi", "Dapat melihat struktur dan daftar unit organisasi", "Unit Organisasi"},
	{"organization.create", "Tambah Unit Organisasi", "Dapat membuat unit organisasi baru", "Unit Organisasi"},
	{"organization.edit", "Edit Unit Organisasi", "Dapat mengedit data unit organisasi", "Unit Organisasi"},
	{"organization.delete", "Hapus Unit Organisasi", "Dapat menghapus unit organisasi", "Unit Organisasi"},

	// 10. Surat Masuk
	{"incoming_letter.view", "Lihat Surat Masuk", "Dapat melihat arsip surat masuk", "Surat Masuk"},
	{"incoming_letter.create", "Registrasi Surat Masuk", "Dapat mencatat surat masuk baru", "Surat Masuk"},
	{"incoming_letter.edit", "Edit Surat Masuk", "Dapat mengedit data surat masuk", "Surat Masuk"},
	{"incoming_letter.delete", "Hapus Surat Masuk", "Dapat menghapus surat masuk", "Surat Masuk"},

	// 11. Surat Keluar
	{"outgoing_letter.view", "Lihat Surat Keluar", "Dapat melihat daftar surat keluar", "Surat Keluar"},
	{"outgoing_letter.create", "Buat Surat Keluar", "Dapat membuat draf surat keluar baru", "Surat Keluar"},
	{"outgoing_letter.edit", "Edit Surat Keluar", "Dapat mengedit surat keluar", "Surat Keluar"},
	{"outgoing_letter.delete", "Hapus Surat Keluar", "Dapat menghapus surat keluar", "Surat Keluar"},
	{"outgoing_letter.submit", "Ajukan Surat Keluar", "Dapat mengajukan surat keluar untuk verifikasi", "Surat Keluar"},
	{"outgoing_letter.sign", "Tanda Tangan Surat", "Dapat menyetujui / menandatangani surat keluar", "Surat Keluar"},

	// 12. Disposisi
	{"disposition.view", "Lihat Disposisi", "Dapat melihat lembar disposisi", "Disposisi"},
	{"disposition.create", "Buat Disposisi", "Dapat memberikan instruksi disposisi baru", "Disposisi"},
	{"disposition.edit", "Edit Disposisi", "Dapat mengubah instruksi disposisi", "Disposisi"},
	{"disposition.delete", "Hapus Disposisi", "Dapat menghapus lembar disposisi", "Disposisi"},
	{"disposition.update_status", "Update Status Disposisi", "Dapat mengubah progres tindak lanjut disposisi", "Disposisi"},
	{"disposition.add_follow_up", "Tambah Tindak Lanjut", "Dapat menambahkan catatan tindak lanjut disposisi", "Disposisi"},
	{"disposition.create_child", "Buat Sub-Disposisi", "Dapat mendelegasikan disposisi ke bawahan", "Disposisi"},

	// 13. Template Surat
	{"document_template.view", "Lihat Template Surat", "Dapat melihat daftar master template surat", "Template Surat"},
	{"document_template.create", "Buat Template Surat", "Dapat membuat master template surat baru", "Template Surat"},
	{"document_template.edit", "Edit Template Surat", "Dapat mengubah master template surat", "Template Surat"},
	{"document_template.delete", "Hapus Template Surat", "Dapat menghapus master template surat", "Template Surat"},

	// 14. Arsip
	{"archive.view", "Lihat Arsip", "Dapat melihat daftar berkas arsip", "Arsip"},
	{"archive.create", "Tambah Arsip Baru", "Dapat mengunggah berkas arsip baru", "Arsip"},
	{"archive.edit", "Edit Arsip", "Dapat mengubah data berkas arsip", "Arsip"},
	{"archive.delete", "Hapus Arsip", "Dapat menghapus berkas arsip", "Arsip"},
	{"archive.download", "Download Arsip", "Dapat mengunduh file berkas arsip", "Arsip"},

	// 15. Manajemen Rapat
	{"meeting.view", "Lihat Daftar Rapat", "Dapat melihat agenda rapat", "Manajemen Rapat"},
	{"meeting.create", "Buat Rapat Baru", "Dapat menjadwalkan rapat baru", "Manajemen Rapat"},
	{"meeting.edit", "Edit Rapat", "Dapat mengubah jadwal atau rincian rapat", "Manajemen Rapat"},
	{"meeting.delete", "Hapus Rapat", "Dapat membatalkan / menghapus rapat", "Manajemen Rapat"},
	{"meeting.manage-participants", "Kelola Peserta Rapat", "Dapat mengatur daftar undangan peserta rapat", "Manajemen Rapat"},
	{"meeting.generate-documents", "Generate Dokumen Rapat", "Dapat mencetak undangan, memo, dan daftar hadir", "Manajemen Rapat"},
	{"meeting.mark-attendance", "Presensi Rapat", "Dapat memverifikasi kehadiran peserta rapat", "Manajemen Rapat"},
	{"meeting.complete", "Selesaikan Rapat", "Dapat menyelesaikan rapat dan mencatat notulen", "Manajemen Rapat"},

	// 16. Ruangan Rapat
	{"room.view", "Lihat Ruangan", "Dapat melihat daftar ruangan rapat", "Manajemen Ruangan"},
	{"room.create", "Tambah Ruangan", "Dapat menambah master ruangan rapat", "Manajemen Ruangan"},
	{"room.edit", "Edit Ruangan", "Dapat mengubah data ruangan rapat", "Manajemen Ruangan"},
	{"room.delete", "Hapus Ruangan", "Dapat menghapus ruangan rapat", "Manajemen Ruangan"},

	// 17. Access Control - User
	{"user.view", "Lihat Daftar User", "Dapat melihat akun pengguna sistem", "User Management"},
	{"user.create", "Tambah User Baru", "Dapat membuat akun login baru", "User Management"},
	{"user.edit", "Edit User", "Dapat mengubah informasi dan password akun user", "User Management"},
	{"user.delete", "Hapus User", "Dapat menghapus akun user dari sistem", "User Management"},

	// 18. Access Control - Role
	{"role.view", "Lihat Daftar Role", "Dapat melihat daftar role / peran sistem", "Role Management"},
	{"role.create", "Tambah Role Baru", "Dapat membuat role baru", "Role Management"},
	{"role.edit", "Edit Role", "Dapat mengubah nama dan deskripsi role", "Role Management"},
	{"role.delete", "Hapus Role", "Dapat menghapus role", "Role Management"},
	{"role.manage_permissions", "Atur Hak Akses Role", "Dapat mengatur dan menyimpan hak akses permission role", "Role Management"},

	// 19. Access Control - Permission
	{"permission.view", "Lihat Daftar Permission", "Dapat melihat seluruh daftar permission", "Permission Management"},
	{"permission.create", "Tambah Permission", "Dapat menambah permission teknis baru", "Permission Management"},
	{"permission.edit", "Edit Permission", "Dapat mengubah permission", "Permission Management"},
	{"permission.delete", "Hapus Permission", "Dapat menghapus permission", "Permission Management"},

	// 20. Settings
	{"settings.view", "Lihat Pengaturan", "Dapat melihat konfigurasi sistem", "Settings"},
	{"settings.edit", "Edit Pengaturan", "Dapat mengubah konfigurasi dan pengaturan sistem", "Settings"},
}

// SeedAllPermissions ensures that every single module and permission exists in database
func SeedAllPermissions(db *sqlx.DB) error {
	query := `
		INSERT INTO permissions (name, display_name, description, module, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		ON CONFLICT (name) DO UPDATE SET 
			display_name = EXCLUDED.display_name,
			description = EXCLUDED.description,
			module = EXCLUDED.module,
			updated_at = NOW()
	`

	for _, p := range AllPermissions {
		_, err := db.Exec(query, p.Name, p.DisplayName, p.Description, p.Module)
		if err != nil {
			log.Printf("Warning: failed to seed permission %s: %v", p.Name, err)
		}
	}

	// Synchronize all permissions to Admin roles (role_id 1 and 7, and any role named 'admin' or 'administrator')
	syncAdminQuery := `
		INSERT INTO role_permission (role_id, permission_id)
		SELECT r.id, p.id
		FROM roles r
		CROSS JOIN permissions p
		WHERE r.id IN (1, 7) OR LOWER(r.name) IN ('admin', 'administrator', 'superadmin', 'super admin')
		ON CONFLICT DO NOTHING
	`
	_, _ = db.Exec(syncAdminQuery)

	log.Printf("Permissions seeded successfully. Total: %d permissions registered across all modules.", len(AllPermissions))
	return nil
}
