<?php
require "db.php";

$method = $_SERVER['REQUEST_METHOD'];

function mapBookRow($row) {
    return [
        "id" => $row['id'],
        "title" => $row['title'],
        "author" => $row['author'],
        "category" => $row['category'],
        "format" => $row['format'],
        "description" => $row['description'],
        "isbn" => $row['isbn'],
        "publisher" => $row['publisher'],
        "publicationDate" => $row['publication_date'],
        "pages" => $row['pages'] !== null ? (int)$row['pages'] : null,
        "copiesTotal" => (int)$row['copies_total'],
        "copiesAvailable" => (int)$row['copies_available'],
        "addedDate" => $row['added_date'],
        "cover" => $row['cover'],
        "fileName" => $row['file_name'],
        "fileData" => $row['file_data']
    ];

    
}

if ($method === 'GET') {
    $result = $conn->query("SELECT * FROM books ORDER BY added_date DESC");
    $books = [];
    while ($row = $result->fetch_assoc()) {
        $books[] = mapBookRow($row);
    }
    echo json_encode($books);
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = 'bk_' . uniqid();
    $pages = isset($data['pages']) ? (int)$data['pages'] : null;
    $copiesTotal = (int)$data['copiesTotal'];

    $stmt = $conn->prepare("INSERT INTO books
        (id, title, author, category, format, description, isbn, publisher, publication_date, pages, copies_total, copies_available, added_date, cover, file_name, file_data)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?,?,?)");
    $stmt->bind_param(
        "sssssssssiiisss",
        $id, $data['title'], $data['author'], $data['category'], $data['format'],
        $data['description'], $data['isbn'], $data['publisher'], $data['publicationDate'],
        $pages, $copiesTotal, $copiesTotal, $data['cover'], $data['fileName'], $data['fileData']
    );
    if ($stmt->execute()) {
        echo json_encode(["id" => $id, "success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
}

elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing book id"]);
        exit;
    }
    $pages = isset($data['pages']) ? (int)$data['pages'] : null;
    $copiesTotal = (int)$data['copiesTotal'];
    $copiesAvailable = (int)$data['copiesAvailable'];

    $stmt = $conn->prepare("UPDATE books SET
        title=?, author=?, category=?, format=?, description=?, isbn=?, publisher=?, publication_date=?,
        pages=?, copies_total=?, copies_available=?, cover=?, file_name=?, file_data=?
        WHERE id=?");
    $stmt->bind_param(
        "ssssssssiiissss",
        $data['title'], $data['author'], $data['category'], $data['format'], $data['description'],
        $data['isbn'], $data['publisher'], $data['publicationDate'], $pages,
        $copiesTotal, $copiesAvailable, $data['cover'], $data['fileName'], $data['fileData'], $id
    );
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
}

elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $stmt = $conn->prepare("DELETE FROM books WHERE id = ?");
    $stmt->bind_param("s", $id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
}

$conn->close();
