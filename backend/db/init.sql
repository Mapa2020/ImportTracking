CREATE DATABASE IF NOT EXISTS import_tracking;
USE import_tracking;

CREATE TABLE IF NOT EXISTS Usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME
);

CREATE TABLE IF NOT EXISTS Importacion (
    id_embarque VARCHAR(255) PRIMARY KEY,
    identificador VARCHAR(255),
    pais_origen VARCHAR(255),
    pais_destino VARCHAR(255),
    fecha_etd DATE,
    fecha_eta_puerto DATE,
    fecha_validacion_dim DATE,
    fecha_eta_wh DATE,
    created_at DATETIME
);

CREATE TABLE IF NOT EXISTS Hito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_embarque VARCHAR(255),
    hito_id VARCHAR(50),
    nombre VARCHAR(255),
    descripcion TEXT,
    fecha_vencimiento DATE,
    fecha_alerta DATE,
    fecha_completado DATE,
    estado VARCHAR(50),
    email_enviado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_embarque) REFERENCES Importacion(id_embarque) ON DELETE CASCADE
);
```

#### `e:\Proyectos REACT\ImportTracking\docker-compose.yml`
El archivo maestro que orquesta todo.

```diff
