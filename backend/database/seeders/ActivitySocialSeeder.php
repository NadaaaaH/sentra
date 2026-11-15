<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActivitySocialSeeder extends Seeder
{
    public function run(): void
    {
        $activities = [
            [
                'title' => 'Cek Kesehatan Gratis Masyarakat Desa Sukadana',
                'category' => 'kesehatan',
                'description' => 'Kegiatan pemeriksaan kesehatan gratis bagi masyarakat Desa Sukadana yang dilaksanakan mahasiswa KKN-PPM bersama masyarakat. Pemeriksaan mencakup tekanan darah, gula darah, kolesterol, asam urat, skrining keluhan, serta konsultasi kesehatan.',
                'min_budget' => 3000000,
                'max_budget' => 6000000,
                'required_people' => 8,
                'duration_days' => 3,
            ],
            [
                'title' => 'Pemberian Makanan Tambahan bagi Balita Stunting',
                'category' => 'kesehatan',
                'description' => 'Program pemberian makanan tambahan kepada balita stunting dilakukan bersama pemerintah desa dan kader PKK untuk membantu meningkatkan status gizi serta pertumbuhan anak. Kegiatan dilaksanakan melalui distribusi makanan dan susu serta pemantauan selama program berlangsung.',
                'min_budget' => 6000000,
                'max_budget' => 10000000,
                'required_people' => 8,
                'duration_days' => 15,
            ],
            [
                'title' => 'Senam Bersama Lansia dan Pemeriksaan Kesehatan',
                'category' => 'kesehatan',
                'description' => 'Kegiatan kesehatan masyarakat berupa senam bersama lansia dan pemeriksaan kesehatan yang dilaksanakan oleh mahasiswa bersama masyarakat desa. Program ditujukan untuk meningkatkan aktivitas fisik, kesadaran kesehatan, dan pemantauan kondisi kesehatan warga lanjut usia.',
                'min_budget' => 2000000,
                'max_budget' => 4000000,
                'required_people' => 7,
                'duration_days' => 3,
            ],
            [
                'title' => 'Edukasi Pencegahan Perundungan bagi Siswa Desa',
                'category' => 'pendidikan',
                'description' => 'Kegiatan edukasi mengenai perundungan diberikan kepada siswa sekolah dasar untuk membantu mereka mengenali bentuk, dampak, dan cara mencegah bullying. Kegiatan dilakukan secara interaktif melalui penyampaian materi, diskusi, dan contoh kasus sederhana.',
                'min_budget' => 1500000,
                'max_budget' => 3000000,
                'required_people' => 6,
                'duration_days' => 3,
            ],
            [
                'title' => 'Rumah Belajar BERSINAR untuk Anak Desa',
                'category' => 'pendidikan',
                'description' => 'Rumah Belajar BERSINAR merupakan kegiatan pendampingan belajar bagi anak usia PAUD hingga sekolah dasar. Mahasiswa membantu mengerjakan tugas, memberikan penjelasan tambahan, serta melatih kemampuan membaca, menulis, dan berhitung dalam suasana belajar yang menyenangkan.',
                'min_budget' => 2000000,
                'max_budget' => 4000000,
                'required_people' => 5,
                'duration_days' => 21,
            ],
            [
                'title' => 'Les Bahasa Inggris Dasar untuk Anak Desa',
                'category' => 'pendidikan',
                'description' => 'Kegiatan les Bahasa Inggris diberikan kepada anak-anak desa dengan materi dasar seperti greetings, angka, memperkenalkan diri, dan percakapan sederhana. Pembelajaran dilakukan secara interaktif agar anak lebih mudah memahami materi dan tertarik belajar bahasa Inggris.',
                'min_budget' => 1500000,
                'max_budget' => 3000000,
                'required_people' => 5,
                'duration_days' => 14,
            ],
            [
                'title' => 'Literasi Digital dan Keamanan Bermedia Sosial',
                'category' => 'internet',
                'description' => 'Kegiatan literasi digital diberikan kepada masyarakat desa untuk meningkatkan kemampuan menggunakan teknologi dan media sosial secara aman dan bertanggung jawab. Materi mencakup etika digital, informasi publik, keamanan penggunaan internet, dan cara menghadapi risiko kejahatan siber.',
                'min_budget' => 1500000,
                'max_budget' => 3500000,
                'required_people' => 6,
                'duration_days' => 7,
            ],
            [
                'title' => 'Pelatihan Komputer Dasar untuk Anak Desa',
                'category' => 'internet',
                'description' => 'Pelatihan komputer dasar ditujukan kepada anak sekolah di Desa Cisarua, Kabupaten Bogor, untuk meningkatkan literasi dan keterampilan teknologi. Peserta diberikan pengenalan penggunaan komputer serta keterampilan dasar yang dapat mendukung kegiatan belajar.',
                'min_budget' => 2500000,
                'max_budget' => 5000000,
                'required_people' => 8,
                'duration_days' => 14,
            ],
            [
                'title' => 'Workshop Digitalisasi Administrasi Desa',
                'category' => 'internet',
                'description' => 'Workshop diberikan kepada perangkat desa untuk meningkatkan kemampuan dalam mengelola administrasi secara digital. Kegiatan membantu perangkat desa memahami penggunaan teknologi untuk penyimpanan, pengelolaan, dan pencarian dokumen agar pelayanan masyarakat lebih tertata.',
                'min_budget' => 2000000,
                'max_budget' => 4000000,
                'required_people' => 6,
                'duration_days' => 7,
            ],
            [
                'title' => 'Pembuatan Tempat Sampah Fasilitas Umum Desa',
                'category' => 'infrastruktur',
                'description' => 'Mahasiswa KKN membuat tempat sampah sederhana untuk ditempatkan pada balai desa, fasilitas umum, dan titik keramaian masyarakat. Kegiatan dilakukan secara gotong royong bersama warga dan pemuda setempat untuk meningkatkan kebersihan lingkungan desa.',
                'min_budget' => 2000000,
                'max_budget' => 4500000,
                'required_people' => 10,
                'duration_days' => 7,
            ],
            [
                'title' => 'Renovasi Balai Warga untuk Fasilitas Bersama',
                'category' => 'infrastruktur',
                'description' => 'Renovasi balai warga dilakukan untuk memperbaiki fasilitas umum agar lebih nyaman dan layak digunakan masyarakat. Pekerjaan mencakup pengecatan, perbaikan bagian bangunan yang rusak, serta pembersihan area balai yang digunakan untuk kegiatan masyarakat.',
                'min_budget' => 3000000,
                'max_budget' => 7000000,
                'required_people' => 8,
                'duration_days' => 14,
            ],
            [
                'title' => 'Kerja Bakti Pembersihan Drainase Lingkungan',
                'category' => 'infrastruktur',
                'description' => 'Kegiatan kerja bakti dilakukan bersama aparat dan masyarakat untuk membersihkan drainase serta area lingkungan yang membutuhkan penanganan. Output kegiatan berupa drainase dan lingkungan sekitar yang lebih bersih sehingga membantu menjaga kelancaran aliran air.',
                'min_budget' => 1500000,
                'max_budget' => 3000000,
                'required_people' => 10,
                'duration_days' => 3,
            ],
        ];

        DB::transaction(function () use ($activities): void {
            foreach ($activities as $activity) {
                Activity::updateOrCreate(
                    ['title' => $activity['title']],
                    $activity,
                );
            }
        });
    }
}
