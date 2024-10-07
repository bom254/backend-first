-- Creating patients table
CREATE TABLE patients(
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    date_of_birth DATE,
    gender ENUM('Male', 'Female'),
    address TEXT
);

-- Creating doctors table
CREATE TABLE doctors(
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    schedule TEXT
);

-- Create appointments table
CREATE TABLE appointments(
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctors_id INT,
    appointments__date DATE,
    appointment_time TIME,
    status ENUM('schedule', 'completed', 'canceled') DEFAULT 'scheduled',
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Creating admin table
CREATE TABLE Admin(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin') DEFAULT 'admin'
);