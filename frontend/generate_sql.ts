import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';

const sql = `
UPDATE users SET password_hash = '${bcrypt.hashSync('Admin123!', 10)}' WHERE email = 'admin@hotel.com';
UPDATE employees SET access_pin_hash = '${bcrypt.hashSync('1234', 10)}' WHERE employee_code = 'EMP-001';
UPDATE employees SET access_pin_hash = '${bcrypt.hashSync('5678', 10)}' WHERE employee_code = 'EMP-002';
UPDATE employees SET access_pin_hash = '${bcrypt.hashSync('9012', 10)}' WHERE employee_code = 'EMP-003';
`;

fs.writeFileSync('reset.sql', sql);
console.log('reset.sql created successfully!');
