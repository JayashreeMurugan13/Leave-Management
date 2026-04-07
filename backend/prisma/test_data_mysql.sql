-- Demo account password for all users: Test@1234

INSERT IGNORE INTO User (id, name, email, password, role, department, leaveBalance, status, createdAt, updatedAt) VALUES
('u1', 'Student One',    'student@sece.ac.in',        '$2b$10$X0LvuekEGDiOHUk8geYiGOZpLSnhQQ8VysGAOhCYx/FPpXdroBEBy', 'STUDENT',   'AIML',  12, 'ACTIVE', NOW(), NOW()),
('u2', 'Professor One',  'prof@sece.ac.in',           '$2b$10$X0LvuekEGDiOHUk8geYiGOZpLSnhQQ8VysGAOhCYx/FPpXdroBEBy', 'PROFESSOR', 'CSE',   12, 'ACTIVE', NOW(), NOW()),
('u3', 'HOD One',        'hod@sece.ac.in',            '$2b$10$X0LvuekEGDiOHUk8geYiGOZpLSnhQQ8VysGAOhCYx/FPpXdroBEBy', 'HOD',       'CSE',   12, 'ACTIVE', NOW(), NOW()),
('u4', 'Principal One',  'principal@sece.ac.in',      '$2b$10$X0LvuekEGDiOHUk8geYiGOZpLSnhQQ8VysGAOhCYx/FPpXdroBEBy', 'PRINCIPAL', 'ADMIN', 12, 'ACTIVE', NOW(), NOW()),
('u5', 'Jshree Murugan', 'jshreemurugan88@gmail.com', '$2b$10$X0LvuekEGDiOHUk8geYiGOZpLSnhQQ8VysGAOhCYx/FPpXdroBEBy', 'STUDENT',   'AIML',  12, 'ACTIVE', NOW(), NOW());
