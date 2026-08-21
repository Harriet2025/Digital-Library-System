<?php
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $conn->prepare("SELECT id, name, email, role, joined_date FROM users WHERE email = ? AND password = ?");
$stmt->bind_param("ss", $email, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(["success" => true, "user" => [
        "id" => $row['id'],
        "name" => $row['name'],
        "email" => $row['email'],
        "role" => $row['role'],
        "joinedDate" => $row['joined_date']
    ]]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid email or password"]);
}

$conn->close();
