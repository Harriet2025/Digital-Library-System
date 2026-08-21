CREATE DATABASE IF NOT EXISTS dlib CHARACTER SET utf8mb4;
USE dlib;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','student') NOT NULL DEFAULT 'student',
  joined_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  format VARCHAR(20) NOT NULL,
  description TEXT,
  isbn VARCHAR(50),
  publisher VARCHAR(255),
  publication_date DATE NULL,
  pages INT NULL,
  copies_total INT NOT NULL DEFAULT 1,
  copies_available INT NOT NULL DEFAULT 1,
  added_date DATE NOT NULL,
  cover LONGTEXT,
  file_name VARCHAR(255) NULL,
  file_data LONGTEXT NULL
);

INSERT INTO users (id, name, email, password, role, joined_date) VALUES
('u_admin', 'Library Admin', 'admin@library.edu', 'admin123', 'admin', DATE_SUB(CURDATE(), INTERVAL 120 DAY)),
('u_demo', 'Ama Serwaa', 'student@library.edu', 'student123', 'student', DATE_SUB(CURDATE(), INTERVAL 60 DAY)),
('u_kwame', 'Kwame Boateng', 'kwame.boateng@student.edu', 'student123', 'student', DATE_SUB(CURDATE(), INTERVAL 52 DAY)),
('u_abena', 'Abena Owusu', 'abena.owusu@student.edu', 'student123', 'student', DATE_SUB(CURDATE(), INTERVAL 30 DAY));

INSERT INTO books (id, title, author, category, format, description, isbn, publisher, publication_date, pages, copies_total, copies_available, added_date, cover, file_name, file_data) VALUES
('bk_1','Introduction to Algorithms','T. H. Cormen','Computer Science','PDF','A comprehensive guide to algorithm design, analysis, and complexity, covering sorting, graphs, and dynamic programming.','9780262033848','MIT Academic Press','2019-03-10',1312,3,2,DATE_SUB(CURDATE(), INTERVAL 90 DAY),'img/covers/bk_1.jpg',NULL,NULL),
('bk_2','Calculus: Early Transcendentals','James Stewart','Mathematics','PDF','Core calculus concepts including limits, derivatives, integrals, and series with worked examples.','9781285741550','Cengage Learning','2020-01-15',1368,2,1,DATE_SUB(CURDATE(), INTERVAL 85 DAY),'img/covers/bk_2.jpg',NULL,NULL),
('bk_3','Principles of Marketing','Philip Kotler','Business','EPUB','An introduction to marketing strategy, consumer behaviour, branding, and digital marketing channels.','9780134492513','Pearson Education','2021-06-01',716,4,4,DATE_SUB(CURDATE(), INTERVAL 70 DAY),'img/covers/bk_3.jpg',NULL,NULL),
('bk_4','Clean Code','Robert C. Martin','Computer Science','PDF','A handbook of agile software craftsmanship focused on writing readable, maintainable code.','9780132350884','Prentice Hall','2018-08-01',464,2,0,DATE_SUB(CURDATE(), INTERVAL 65 DAY),'img/covers/bk_4.jpg',NULL,NULL),
('bk_5','Fundamentals of Database Systems','Elmasri & Navathe','Computer Science','PDF','Covers relational databases, SQL, normalization, transactions, and database design.','9780133970777','Addison-Wesley','2020-02-20',1242,3,3,DATE_SUB(CURDATE(), INTERVAL 55 DAY),'img/covers/bk_5.jpg',NULL,NULL),
('bk_6','Engineering Mechanics: Statics','R. C. Hibbeler','Engineering','PDF','Foundational statics concepts for engineering students, including forces, equilibrium, and trusses.','9780133918922','Wiley','2019-05-05',640,2,2,DATE_SUB(CURDATE(), INTERVAL 50 DAY),'img/covers/bk_6.jpg',NULL,NULL),
('bk_8','Organic Chemistry Essentials','Paula Bruice','Science','PDF','An accessible introduction to organic chemistry structures, reactions, and mechanisms.','9780134042282','Oxford University Press','2017-09-12',812,2,2,DATE_SUB(CURDATE(), INTERVAL 35 DAY),'img/covers/bk_8.jpg',NULL,NULL),
('bk_9','Rich Dad Poor Dad','Robert Kiyosaki','Business','PDF','A personal finance classic contrasting two approaches to money, work, and building wealth.','9781612680194','Plata Publishing','2017-04-25',336,3,3,DATE_SUB(CURDATE(), INTERVAL 30 DAY),'img/covers/bk_9.jpg',NULL,NULL),
('bk_10','Data Communications and Networking','Behrouz Forouzan','Computer Science','PDF','Explores networking fundamentals, protocols, the OSI model, and network security basics.','9780073376226','McGraw-Hill','2018-04-22',1176,2,2,DATE_SUB(CURDATE(), INTERVAL 25 DAY),'img/covers/bk_10.jpg',NULL,NULL),
('bk_11','Introduction to Psychology','David G. Myers','Science','EPUB','A survey of core psychological concepts including cognition, development, and behaviour.','9781464140815','Worth Publishers','2019-10-01',768,3,3,DATE_SUB(CURDATE(), INTERVAL 20 DAY),'img/covers/bk_11.jpg',NULL,NULL),
('bk_12','Graphic Design: The New Basics','Ellen Lupton','Arts & Design','PDF','A visual guide to design fundamentals: layout, typography, colour, and composition.','9781568989695','Princeton Architectural Press','2015-03-01',240,2,2,DATE_SUB(CURDATE(), INTERVAL 15 DAY),'img/covers/bk_12.jpg',NULL,NULL),
('bk_13','Eloquent JavaScript','Marijn Haverbeke','Computer Science','PDF','A modern introduction to JavaScript, programming, and the wonders of the digital.','9781593279509','No Starch Press','2018-12-04',472,4,4,DATE_SUB(CURDATE(), INTERVAL 10 DAY),'img/covers/bk_13.jpg',NULL,NULL),
('bk_7','Things Fall Apart','Chinua Achebe','Literature','EPUB','A classic novel depicting pre-colonial life in Nigeria and the arrival of European colonialism.','9780385474542','Heinemann African Writers Series','1994-11-01',209,5,5,DATE_SUB(CURDATE(), INTERVAL 40 DAY),'img/covers/bk_7.jpg',NULL,NULL),
('bk_14','Long Walk to Freedom','Nelson Mandela','History','EPUB','The autobiography of Nelson Mandela, tracing his journey from rural childhood to the presidency of South Africa.','9780316548182','Back Bay Books','1995-09-16',656,3,3,DATE_SUB(CURDATE(), INTERVAL 5 DAY),'img/covers/bk_14.jpg',NULL,NULL),
('bk_15','Half of a Yellow Sun','Chimamanda Ngozi Adichie','Fiction','EPUB','A powerful novel set during the Biafran War, following the intertwined lives of five characters.','9781400095209','Anchor Books','2007-09-04',543,4,4,DATE_SUB(CURDATE(), INTERVAL 48 DAY),'img/covers/bk_15.jpg',NULL,NULL),
('bk_16','The Hobbit','J. R. R. Tolkien','Fantasy','EPUB','A classic fantasy adventure following Bilbo Baggins on an unexpected journey to reclaim a lost kingdom.','9780547928227','Houghton Mifflin Harcourt','2012-09-18',366,3,3,DATE_SUB(CURDATE(), INTERVAL 42 DAY),'img/covers/bk_16.jpg',NULL,NULL),
('bk_17','And Then There Were None','Agatha Christie','Mystery & Thriller','PDF','Ten strangers are lured to an island and murdered one by one in an all-time best-selling mystery.','9780062073488','William Morrow','2011-08-30',264,3,2,DATE_SUB(CURDATE(), INTERVAL 38 DAY),'img/covers/bk_17.jpg',NULL,NULL),
('bk_18','Pride and Prejudice','Jane Austen','Romance','EPUB','A classic novel of manners, following Elizabeth Bennet as she navigates love, class, and first impressions.','9780141439518','Penguin Classics','2003-01-30',480,4,4,DATE_SUB(CURDATE(), INTERVAL 33 DAY),'img/covers/bk_18.jpg',NULL,NULL),
('bk_19','Dune','Frank Herbert','Science Fiction','PDF','A science fiction epic set on the desert planet Arrakis, following the rise of Paul Atreides.','9780441013593','Ace Books','2005-09-01',604,2,2,DATE_SUB(CURDATE(), INTERVAL 28 DAY),'img/covers/bk_19.jpg',NULL,NULL),
('bk_20','Educated','Tara Westover','Biography','PDF','A memoir about a woman who leaves her survivalist family and pursues education, eventually earning a PhD.','9780399590504','Random House','2018-02-20',334,2,2,DATE_SUB(CURDATE(), INTERVAL 22 DAY),'img/covers/bk_20.jpg',NULL,NULL),
('bk_21','Atomic Habits','James Clear','Self-Help','EPUB','A practical guide to building good habits and breaking bad ones through small, incremental changes.','9780735211292','Avery','2018-10-16',320,3,3,DATE_SUB(CURDATE(), INTERVAL 18 DAY),'img/covers/bk_21.jpg',NULL,NULL),
('bk_22','Leaves of Grass','Walt Whitman','Poetry','PDF','A landmark poetry collection celebrating nature, democracy, and the human spirit.','9780486456768','Dover Publications','2007-06-14',128,3,3,DATE_SUB(CURDATE(), INTERVAL 12 DAY),'img/covers/bk_22.jpg',NULL,NULL),
('bk_23','Treasure Island','Robert Louis Stevenson','Adventure','EPUB','A classic adventure novel of pirates, mutiny, and buried treasure, following young Jim Hawkins.','9780141321004','Puffin Classics','2008-05-01',240,3,3,DATE_SUB(CURDATE(), INTERVAL 8 DAY),'img/covers/bk_23.jpg',NULL,NULL),
('bk_24','Gone Girl','Gillian Flynn','Mystery & Thriller','PDF','A psychological thriller about a marriage gone terribly wrong after a woman disappears on her anniversary.','9780307588371','Crown Publishing','2012-06-05',432,2,2,DATE_SUB(CURDATE(), INTERVAL 3 DAY),'img/covers/bk_24.jpg',NULL,NULL);
