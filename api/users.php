<?php
require "db.php";

$method = $_SERVER['REQUEST_METHOD'];

function mapUserRow($row) {
    return [
        "id" => $row['id'],
        "name" => $row['name'],
        "email" => $row['email'],
        "role" => $row['role'],
        "joinedDate" => $row['joined_date']
    ];
}

if ($method === 'GET') {
    $result = $conn->query("SELECT id, name, email, role, joined_date FROM users ORDER BY joined_date DESC");
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = mapUserRow($row);
    }
    echo json_encode($users);
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');
    $email = trim(strtolower($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $role = ($data['role'] ?? '') === 'admin' ? 'admin' : 'student';

    if (!$name || !$email || !$password) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "All fields are required."]);
        exit;
    }

    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    if ($check->get_result()->fetch_assoc()) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "An account with this email already exists."]);
        exit;
    }

    $id = 'u_' . uniqid();
    $stmt = $conn->prepare("INSERT INTO users (id, name, email, password, role, joined_date) VALUES (?,?,?,?,?,CURDATE())");
    $stmt->bind_param("sssss", $id, $name, $email, $password, $role);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "user" => [
            "id" => $id, "name" => $name, "email" => $email, "role" => $role, "joinedDate" => date('Y-m-d')
        ]]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
}

elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("s", $id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
}

$conn->close();
