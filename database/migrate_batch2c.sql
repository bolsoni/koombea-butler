UPDATE users 
SET created_by_admin = FALSE, timezone = 'UTC' 
WHERE email = 'admin@awscosts.com';

-- Update all existing users to have default values (garantia)
UPDATE users 
SET timezone = 'UTC' 
WHERE timezone IS NULL;