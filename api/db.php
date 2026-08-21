<?php
$host = "hopper.proxy.rlwy.net";
$dbname = "dlib";
$user = "root";
$pass = "jKtwGJmJGWjLAMeejvIPZTxBiIyhGIxn";
$port = 38500;

$conn = new mysqli($host, $user, $pass, $dbname, $port);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Database connection failed"]));
}
$conn->set_charset("utf8mb4");
header("Content-Type: application/json");
