<?php
/**
 * API Proxy for OpenRouter
 * Optimized for Stability and Security
 */

// 1. Pengaturan Header CORS
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// --- KONFIGURASI ---
// PENTING: Jangan membagikan API Key secara publik. 
$apiKey = "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"; 
$baseUrl = "https://openrouter.ai/api/v1";
$siteUrl = "https://tanyaariaja.infinityfreeapp.com"; 
$siteName = "Ari Tanya Aja";

$models = [
    ["id" => "openrouter/auto", "name" => "UNLIMITED"],
];

// --- LOGIKA ROUTING ---

// Mode Config: Memberikan daftar model ke frontend
if (isset($_GET['mode']) && $_GET['mode'] === 'config') {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($models);
    exit;
}

// Ambil input JSON
$inputJSON = file_get_contents("php://input");
$input = json_decode($inputJSON, true);

// Validasi input sederhana agar tidak error jika body kosong
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$input) {
    header("HTTP/1.1 400 Bad Request");
    echo json_encode(["error" => "Invalid JSON input"]);
    exit;
}

// Cek Streaming
$isStream = isset($input['stream']) && $input['stream'] === true;

if ($isStream) {
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache, no-transform'); // Tambahkan no-transform
    header('Connection: keep-alive');
    header('X-Accel-Buffering: no'); 
    
    // Matikan output buffering bawaan PHP agar streaming lancar
    while (ob_get_level()) ob_end_flush();
} else {
    header("Content-Type: application/json; charset=UTF-8");
}

// --- EKSEKUSI CURL ---

$endpoint = $_GET['endpoint'] ?? 'chat/completions';
$targetUrl = "$baseUrl/$endpoint";

$ch = curl_init($targetUrl);

$headers = [
    "Authorization: Bearer " . $apiKey,
    "HTTP-Referer: " . $siteUrl,
    "X-Title: " . $siteName,
    "Content-Type: application/json"
];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $inputJSON);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false); 
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Ikuti redirect jika ada
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Pastikan SSL diverifikasi untuk keamanan

// Timeout agar script tidak menggantung terlalu lama
curl_setopt($ch, CURLOPT_TIMEOUT, 120); 

curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use ($isStream) {
    echo $data;
    if ($isStream) {
        // Langsung kirim data ke browser
        flush();
    }
    return strlen($data);
});

curl_exec($ch);

// Cek jika ada error pada cURL
if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    // Jika bukan streaming, kirim error dalam format JSON
    if (!$isStream) {
        echo json_encode(["error" => "CURL Error: $error_msg"]);
    }
}

curl_close($ch);
?>
