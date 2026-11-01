<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;

class ActivitySeeder2 extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $activities = [
            // =========================
            // KATEGORI: PENDIDIKAN
            // =========================

            // S4
            [
                'title' => 'Peningkatan Mutu Pendidikan Agama terhadap Anak-Anak',
                'category' => 'pendidikan',
                'description' => 'Program pendampingan belajar untuk meningkatkan kualitas pembelajaran agama bagi anak-anak di lokasi KKN. Kegiatan mencakup pemberian materi, alat belajar, aktivitas edukatif, dan pendampingan belajar.',
                'min_budget' => 1500000,
                'max_budget' => 3000000,
                'required_people' => 6,
                'duration_days' => 14,
            ],

            // S3
            [
                'title' => 'Pembelajaran Kreatif di PAUD',
                'category' => 'pendidikan',
                'description' => 'Kegiatan pembelajaran di PAUD dengan memanfaatkan media sederhana seperti kertas, alat kerajinan, dan permainan edukatif. Output kegiatan berupa pelaksanaan pembelajaran kreatif yang dapat membantu meningkatkan keterlibatan anak dalam proses belajar.',
                'min_budget' => 1500000,
                'max_budget' => 2500000,
                'required_people' => 5,
                'duration_days' => 10,
            ],

            // S5
            [
                'title' => 'Bimbingan Belajar Anak Desa',
                'category' => 'pendidikan',
                'description' => 'Pendampingan belajar diberikan kepada anak-anak desa untuk membantu memahami materi sekolah dan menyelesaikan tugas belajar. Output kegiatan berupa sesi bimbingan belajar rutin dengan dukungan alat tulis dan media pembelajaran.',
                'min_budget' => 1500000,
                'max_budget' => 3000000,
                'required_people' => 4,
                'duration_days' => 21,
            ],

            // S14
            [
                'title' => 'Penyelenggaraan TK Werdhi Kumara',
                'category' => 'pendidikan',
                'description' => 'Kegiatan penyelenggaraan pendidikan TK Werdhi Kumara yang mencakup kebutuhan operasional, perlengkapan pembelajaran, dan dukungan tenaga pendidik. Output kegiatan berupa terlaksananya layanan pendidikan TK di tingkat desa.',
                'min_budget' => 60000000,
                'max_budget' => 85000000,
                'required_people' => 8,
                'duration_days' => 60,
            ],

            // S14
            [
                'title' => 'Operasional Penyelenggaraan TK Werdhi Kumara',
                'category' => 'pendidikan',
                'description' => 'Program operasional pendidikan TK yang mencakup kebutuhan administrasi, seragam, dokumentasi, serta honorarium pendidik. Output kegiatan berupa keberlangsungan operasional layanan pendidikan TK selama periode pelaksanaan.',
                'min_budget' => 180000000,
                'max_budget' => 220000000,
                'required_people' => 10,
                'duration_days' => 60,
            ],

            // S14
            [
                'title' => 'Pembuatan Canopi TK Werdhi Kumara',
                'category' => 'pendidikan',
                'description' => 'Pembangunan canopi sebagai bagian dari peningkatan sarana dan prasarana pendidikan di TK Werdhi Kumara. Output kegiatan berupa tersedianya fasilitas pelindung tambahan bagi lingkungan sekolah.',
                'min_budget' => 45000000,
                'max_budget' => 60000000,
                'required_people' => 8,
                'duration_days' => 30,
            ],

            // =========================
            // KATEGORI: INTERNET
            // =========================

            // S7
            [
                'title' => 'Rebranding Website Desa Pesodongan',
                'category' => 'internet',
                'description' => 'Kegiatan pembaruan website Desa Pesodongan agar informasi desa lebih mudah diakses dan disajikan dengan tampilan yang lebih modern. Output kegiatan berupa website desa yang memuat informasi dan potensi desa secara lebih terstruktur.',
                'min_budget' => 1000000,
                'max_budget' => 2500000,
                'required_people' => 4,
                'duration_days' => 30,
            ],

            // S8
            [
                'title' => 'Pembuatan dan Pengembangan Website Desa Jeruklegi Wetan',
                'category' => 'internet',
                'description' => 'Pembuatan website desa digunakan sebagai media informasi publik yang memuat database, berita, dan informasi desa. Output kegiatan berupa website yang dapat dikelola bersama pemerintah desa dan diperbarui secara berkala.',
                'min_budget' => 1500000,
                'max_budget' => 3500000,
                'required_people' => 5,
                'duration_days' => 21,
            ],

            // S9
            [
                'title' => 'Webinar Literasi Digital "Internet Sehat Indonesia Hebat"',
                'category' => 'internet',
                'description' => 'Kegiatan edukasi literasi digital untuk meningkatkan pemahaman masyarakat mengenai penggunaan internet secara sehat dan bertanggung jawab. Output kegiatan berupa sesi webinar dengan materi literasi digital yang dapat diakses peserta secara daring.',
                'min_budget' => 1500000,
                'max_budget' => 3000000,
                'required_people' => 5,
                'duration_days' => 7,
            ],

            // S15
            [
                'title' => 'Penyediaan Layanan Internet Kantor Desa Air Belo',
                'category' => 'internet',
                'description' => 'Penyediaan layanan internet untuk mendukung operasional dan akses informasi di kantor desa. Output kegiatan berupa tersedianya koneksi internet yang mendukung administrasi dan layanan informasi desa.',
                'min_budget' => 18000000,
                'max_budget' => 25000000,
                'required_people' => 4,
                'duration_days' => 30,
            ],

            // S16
            [
                'title' => 'Penguatan Layanan Internet dan Server Desa Cerdas',
                'category' => 'internet',
                'description' => 'Kegiatan desa untuk mendukung layanan digital melalui langganan server dan internet pada konsep Desa Cerdas. Output kegiatan berupa konektivitas internet dan dukungan layanan server untuk kebutuhan informasi serta pelayanan desa.',
                'min_budget' => 20000000,
                'max_budget' => 30000000,
                'required_people' => 5,
                'duration_days' => 30,
            ],

            // S17
            [
                'title' => 'Pengadaan Jaringan Internet Desa Gempolsewu',
                'category' => 'internet',
                'description' => 'Pengadaan jaringan internet desa untuk memperluas akses konektivitas pada fasilitas desa dan titik layanan masyarakat. Output kegiatan berupa jaringan internet desa yang dapat digunakan untuk mendukung pelayanan dan akses informasi.',
                'min_budget' => 55000000,
                'max_budget' => 75000000,
                'required_people' => 10,
                'duration_days' => 45,
            ],

            // =========================
            // KATEGORI: INFRASTRUKTUR
            // =========================

            // S10
            [
                'title' => 'Pembangunan MCK Balai Padukuhan',
                'category' => 'infrastruktur',
                'description' => 'Pembangunan fasilitas MCK untuk menunjang kebutuhan sanitasi di balai padukuhan. Output kegiatan berupa tersedianya fasilitas toilet dan sanitasi yang dapat digunakan oleh masyarakat saat kegiatan di balai padukuhan.',
                'min_budget' => 3000000,
                'max_budget' => 6000000,
                'required_people' => 6,
                'duration_days' => 21,
            ],

            // S11
            [
                'title' => 'Plangisasi Padukuhan',
                'category' => 'infrastruktur',
                'description' => 'Pembuatan dan pemasangan papan nama padukuhan untuk memperjelas identitas wilayah dan membantu masyarakat menemukan lokasi. Output kegiatan berupa beberapa papan nama yang terpasang pada titik yang telah ditentukan.',
                'min_budget' => 1000000,
                'max_budget' => 2000000,
                'required_people' => 6,
                'duration_days' => 3,
            ],

            // S12
            [
                'title' => 'Pembuatan Plang Informasi Tempat',
                'category' => 'infrastruktur',
                'description' => 'Pembuatan plang informasi untuk membantu masyarakat dan pengguna jalan mengenali fasilitas atau lokasi tertentu di lingkungan desa. Output kegiatan berupa papan informasi yang dibuat, dicat, dan dipasang pada titik yang telah disepakati.',
                'min_budget' => 1000000,
                'max_budget' => 2000000,
                'required_people' => 5,
                'duration_days' => 7,
            ],

            // S14
            [
                'title' => 'Pemeliharaan Jalan Lingkungan Permukiman',
                'category' => 'infrastruktur',
                'description' => 'Pemeliharaan jalan lingkungan permukiman dilakukan untuk memperbaiki kondisi akses jalan dan menjaga kelancaran mobilitas masyarakat. Output kegiatan berupa jalan lingkungan yang diperbaiki pada ruas yang menjadi prioritas desa.',
                'min_budget' => 70000000,
                'max_budget' => 95000000,
                'required_people' => 12,
                'duration_days' => 30,
            ],

            // S14
            [
                'title' => 'Pemapingan Gang Mutiara II dan Jalan Lingkungan',
                'category' => 'infrastruktur',
                'description' => 'Pekerjaan pemapingan jalan lingkungan menggunakan material paving untuk meningkatkan kualitas permukaan jalan di kawasan permukiman. Output kegiatan berupa ruas jalan lingkungan yang telah dipasang atau ditingkatkan permukaannya.',
                'min_budget' => 130000000,
                'max_budget' => 170000000,
                'required_people' => 15,
                'duration_days' => 45,
            ],

            // S18
            [
                'title' => 'Pembangunan Rabat Beton Jalan Desa',
                'category' => 'infrastruktur',
                'description' => 'Pembangunan jalan rabat beton dengan pekerjaan persiapan, pengadaan material, penggunaan peralatan, dan tenaga kerja konstruksi. Output kegiatan berupa ruas jalan beton yang lebih kuat dan dapat digunakan untuk meningkatkan akses masyarakat.',
                'min_budget' => 70000000,
                'max_budget' => 95000000,
                'required_people' => 15,
                'duration_days' => 45,
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
