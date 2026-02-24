
UPDATE users SET password_hash = '$2b$10$OXn5L.86RMmuRx.IoDHgV.NaKd0l.pVNRK6tesSmedBA5rzB9H6wK' WHERE email = 'admin@hotel.com';
UPDATE employees SET access_pin_hash = '$2b$10$JkxMVMUETBa0tDgeYOLQJOFRqNFVtbc3S2kUjIhORir1ICtofORQS' WHERE employee_code = 'EMP-001';
UPDATE employees SET access_pin_hash = '$2b$10$9pS0GEV35/8E9aI7kJRz..ZLf1bnJ7U6O6Da67ft1FLJVVOw3hDrO' WHERE employee_code = 'EMP-002';
UPDATE employees SET access_pin_hash = '$2b$10$MYtrOrZsFUOcvJ4uIv2rpuUhkb6B239Mg/BEYiYaJ1n2zbw6S8nqC' WHERE employee_code = 'EMP-003';
