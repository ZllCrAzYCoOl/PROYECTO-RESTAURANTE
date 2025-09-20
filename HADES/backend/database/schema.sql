CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(200) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- se guarda encriptada con bcrypt
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'mesero', 'cliente')),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT chk_age CHECK (DATE_PART('year', AGE(birth_date)) >= 18)
);

CREATE TABLE dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'plato','bebida','postre'
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  capacity INT NOT NULL,
  available BOOLEAN DEFAULT true
);

CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  people_count INTEGER NOT NULL CHECK (people_count BETWEEN 1 AND 8),
  table_id INTEGER REFERENCES tables(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente','confirmada','cancelada')),
  total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE reservation_details (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  dish_id INTEGER NOT NULL REFERENCES dishes(id),
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL
);
