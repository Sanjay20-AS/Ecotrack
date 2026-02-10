-- Update any existing users with null roles to have DONOR role
UPDATE users SET role = 'DONOR' WHERE role IS NULL;

-- Check the results
SELECT id, name, email, role FROM users;