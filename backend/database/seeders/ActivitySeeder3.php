<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;

class ActivitySeeder3 extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $activities = [

    // ==========================================================
    // TAMBAHAN KATEGORI: KESEHATAN
    // ==========================================================

    [
        'title' => 'Senam Sehat Jasmani Masyarakat',
        'category' => 'kesehatan',
        'description' => 'Kegiatan senam bersama yang dilaksanakan mahasiswa KKN bersama masyarakat untuk meningkatkan kebugaran jasmani dan mendorong pola hidup sehat. Output kegiatan berupa pelaksanaan aktivitas senam rutin dan meningkatnya partisipasi warga dalam kegiatan kesehatan masyarakat.',
        'min_budget' => 1500000,
        'max_budget' => 2500000,
        'required_people' => 6,
        'duration_days' => 7
    ],

    [
        'title' => 'Cek Kesehatan Gratis bagi Lansia',
        'category' => 'kesehatan',
        'description' => 'Kegiatan pemeriksaan kesehatan gratis bagi warga lanjut usia yang dilaksanakan dengan melibatkan kader kesehatan dan pihak desa. Output kegiatan berupa terlaksananya pemeriksaan kesehatan dasar dan pemberian informasi kesehatan kepada lansia.',
        'min_budget' => 2500000,
        'max_budget' => 4500000,
        'required_people' => 8,
        'duration_days' => 3
    ],

    [
        'title' => 'Donor Darah dan Senam Sehat Desa',
        'category' => 'kesehatan',
        'description' => 'Kegiatan donor darah dan senam sehat dilaksanakan melalui kolaborasi mahasiswa KKN dengan Karang Taruna, organisasi masyarakat, dan PMI. Output kegiatan berupa terselenggaranya layanan donor darah serta aktivitas senam kesehatan bagi masyarakat.',
        'min_budget' => 3000000,
        'max_budget' => 6000000,
        'required_people' => 10,
        'duration_days' => 2
    ],


    // ==========================================================
    // TAMBAHAN KATEGORI: PENDIDIKAN
    // ==========================================================

    [
        'title' => 'Membaca Bersama dan Pengumpulan Buku Desa',
        'category' => 'pendidikan',
        'description' => 'Kegiatan membaca bersama dan pengumpulan buku ditujukan untuk mendukung budaya literasi anak-anak dan remaja di lingkungan desa. Output kegiatan berupa tersedianya koleksi buku tambahan serta pelaksanaan kegiatan membaca secara rutin.',
        'min_budget' => 2000000,
        'max_budget' => 4000000,
        'required_people' => 5,
        'duration_days' => 21
    ],

    [
        'title' => 'Pengenalan Dasar Microsoft Word untuk Masyarakat',
        'category' => 'pendidikan',
        'description' => 'Pelatihan dasar Microsoft Word diberikan kepada masyarakat untuk meningkatkan kemampuan menggunakan aplikasi pengolah dokumen. Output kegiatan berupa peserta yang mampu melakukan pekerjaan dasar seperti membuat, mengedit, dan menyimpan dokumen.',
        'min_budget' => 2000000,
        'max_budget' => 3500000,
        'required_people' => 4,
        'duration_days' => 7
    ],

    [
        'title' => 'Mengajar PAUD dan Pembelajaran Anak Usia Dini',
        'category' => 'pendidikan',
        'description' => 'Mahasiswa KKN membantu guru dalam proses pembelajaran PAUD melalui kegiatan belajar yang disesuaikan dengan usia anak. Output kegiatan berupa terlaksananya sesi pembelajaran tambahan dan dukungan terhadap kegiatan belajar mengajar di PAUD.',
        'min_budget' => 1500000,
        'max_budget' => 3000000,
        'required_people' => 5,
        'duration_days' => 14
    ],


    // ==========================================================
    // TAMBAHAN KATEGORI: INTERNET
    // ==========================================================

    [
        'title' => 'Sosialisasi Literasi Digital Masyarakat',
        'category' => 'internet',
        'description' => 'Kegiatan sosialisasi literasi digital untuk meningkatkan pemahaman masyarakat mengenai penggunaan internet secara bijak, aman, dan produktif. Materi mencakup etika berinternet, penggunaan media digital, dan perlindungan data pribadi.',
        'min_budget' => 1500000,
        'max_budget' => 3000000,
        'required_people' => 5,
        'duration_days' => 3
    ],

    [
        'title' => 'Pembuatan Website Informasi Desa',
        'category' => 'internet',
        'description' => 'Pembuatan website desa ditujukan untuk menyediakan media resmi penyampaian informasi dan publikasi kegiatan pemerintah desa kepada masyarakat. Output kegiatan berupa website desa yang dapat digunakan sebagai media informasi dan pelayanan publik.',
        'min_budget' => 3000000,
        'max_budget' => 6000000,
        'required_people' => 5,
        'duration_days' => 30
    ],

    [
        'title' => 'Pengaktifan dan Pembaruan Website Desa',
        'category' => 'internet',
        'description' => 'Kegiatan dilakukan untuk mengaktifkan kembali dan memperbarui konten website desa agar informasi pembangunan dan kegiatan desa dapat diakses masyarakat. Output kegiatan berupa website yang aktif dengan konten informasi desa yang lebih terbarui.',
        'min_budget' => 2000000,
        'max_budget' => 4000000,
        'required_people' => 4,
        'duration_days' => 21
    ],


    // ==========================================================
    // TAMBAHAN KATEGORI: INFRASTRUKTUR
    // ==========================================================

    [
        'title' => 'Pembuatan Papan Informasi Desa',
        'category' => 'infrastruktur',
        'description' => 'Pembuatan papan informasi dilakukan untuk menyediakan media informasi fisik yang dapat digunakan masyarakat di tingkat dusun atau desa. Output kegiatan berupa papan informasi yang selesai dibuat dan dipasang pada lokasi yang telah ditentukan.',
        'min_budget' => 2000000,
        'max_budget' => 4000000,
        'required_people' => 6,
        'duration_days' => 14
    ],

    [
        'title' => 'Kerja Bakti Perbaikan Jalan Lingkungan',
        'category' => 'infrastruktur',
        'description' => 'Kegiatan kerja bakti dilakukan bersama masyarakat untuk memperbaiki kondisi jalan lingkungan yang membutuhkan penanganan sederhana. Output kegiatan berupa bagian jalan lingkungan yang telah diperbaiki dan dapat digunakan masyarakat dengan lebih baik.',
        'min_budget' => 2500000,
        'max_budget' => 5000000,
        'required_people' => 10,
        'duration_days' => 7
    ],

    [
        'title' => 'Pembangunan Rabat Beton Jalan Dk. Lemah Putih RT 21',
        'category' => 'infrastruktur',
        'description' => 'Pembangunan rabat beton dilaksanakan untuk meningkatkan kualitas akses jalan lingkungan di Dk. Lemah Putih RT 21. Output kegiatan berupa ruas jalan lingkungan yang diperkeras dengan konstruksi rabat beton untuk mendukung mobilitas masyarakat.',
        'min_budget' => 48167000,
        'max_budget' => 48167000,
        'required_people' => 12,
        'duration_days' => 30
    ],

        ];

        foreach ($activities as $activity) {
            Activity::updateOrCreate(
                ['title' => $activity['title']],
                $activity
            );
        }
    }
}
