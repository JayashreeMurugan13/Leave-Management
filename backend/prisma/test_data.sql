-- Passwords are bcrypt hashes of 'Test@1234'
INSERT IGNORE INTO User (id, name, email, password, role, department, leaveBalance, status, createdAt, updatedAt) VALUES
('u1', 'Student One',    'student@sece.ac.in',        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT',   'AIML',  12, 'ACTIVE', NOW(), NOW()),
('u2', 'Professor One',  'prof@sece.ac.in',           '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PROFESSOR', 'AIML',  12, 'ACTIVE', NOW(), NOW()),
('u3', 'HOD One',        'hod@sece.ac.in',            '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HOD',       'AIML',  12, 'ACTIVE', NOW(), NOW()),
('u4', 'Principal One',  'principal@sece.ac.in',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PRINCIPAL', 'ADMIN', 12, 'ACTIVE', NOW(), NOW()),
('u5', 'Jshree Murugan', 'jshreemurugan88@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT',   'AIML',  12, 'ACTIVE', NOW(), NOW());
