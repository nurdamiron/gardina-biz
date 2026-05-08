-- Create Manager user
INSERT INTO users (name, email, phone, password_hash, role)
VALUES (
  'Сергей Менеджер',
  'manager@gardina.kz',
  '+77771111111',
  crypt('manager123', gen_salt('bf')),
  'manager'
);
