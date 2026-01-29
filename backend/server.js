require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Email (Ajusta con tus credenciales reales)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});
const JWT_SECRET = process.env.JWT_SECRET;

// Mapeo de campos DB <-> Frontend
const mapShipmentFromDB = (row, milestones) => ({
  id: row.id_embarque,
  identifier: row.identificador,
  origin: row.pais_origen,
  destination: row.pais_destino,
  etd: row.fecha_etd,
  etaPuerto: row.fecha_eta_puerto,
  dimValidationDate: row.fecha_validacion_dim,
  etaWh: row.fecha_eta_wh,
  createdAt: row.created_at,
  milestones: milestones.map(m => ({
    id: m.hito_id,
    name: m.nombre,
    description: m.descripcion,
    dueDate: m.fecha_vencimiento,
    alertDate: m.fecha_alerta,
    completedDate: m.fecha_completado,
    status: m.estado,
    emailSent: Boolean(m.email_enviado)
  }))
});

// --- RUTAS DE AUTENTICACIÓN ---

// Registro de usuario (Para crear el primer usuario)
app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO Usuario (nombre, email, password) VALUES (?, ?, ?)', 
      [nombre, email, hashedPassword]);
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario (posible email duplicado)' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solicitar recuperación de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'Email no encontrado' });

    // Generar token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await db.query('UPDATE Usuario SET reset_token = ?, reset_token_expires = ? WHERE email = ?', 
      [token, expires, email]);

    // Enviar email (apuntando al frontend en el puerto 3000)
    const resetUrl = `http://localhost:3000/?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de Contraseña - ImporTrack',
      html: `
        <h3>Recuperación de Contraseña</h3>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este enlace expira en 1 hora.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Correo de recuperación enviado' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// Restablecer contraseña
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const [users] = await db.query(
      'SELECT * FROM Usuario WHERE reset_token = ? AND reset_token_expires > NOW()', 
      [token]
    );

    if (users.length === 0) return res.status(400).json({ error: 'Token inválido o expirado' });

    const user = users[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE Usuario SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Obtener todos los embarques
app.get('/api/shipments', async (req, res) => {
  try {
    const [imports] = await db.query('SELECT * FROM Importacion ORDER BY created_at DESC');
    const [milestones] = await db.query('SELECT * FROM Hito');

    const shipments = imports.map(imp => {
      const impMilestones = milestones.filter(m => m.id_embarque === imp.id_embarque);
      return mapShipmentFromDB(imp, impMilestones);
    });

    res.json(shipments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// POST: Crear nuevo embarque
app.post('/api/shipments', async (req, res) => {
  const s = req.body;
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO Importacion (id_embarque, identificador, pais_origen, pais_destino, fecha_etd, fecha_eta_puerto, fecha_validacion_dim, fecha_eta_wh, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.identifier, s.origin, s.destination, s.etd, s.etaPuerto, s.dimValidationDate, s.etaWh, new Date(s.createdAt)]
    );

    for (const m of s.milestones) {
      await conn.query(
        `INSERT INTO Hito (id_embarque, hito_id, nombre, descripcion, fecha_vencimiento, fecha_alerta, fecha_completado, estado, email_enviado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, m.id, m.name, m.description, m.dueDate, m.alertDate, m.completedDate || null, m.status, m.emailSent]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Embarque creado' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al guardar' });
  } finally {
    conn.release();
  }
});

// PUT: Actualizar embarque
app.put('/api/shipments/:id', async (req, res) => {
  const s = req.body;
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE Importacion SET identificador=?, pais_origen=?, pais_destino=?, fecha_etd=?, fecha_eta_puerto=?, fecha_validacion_dim=?, fecha_eta_wh=? WHERE id_embarque=?`,
      [s.identifier, s.origin, s.destination, s.etd, s.etaPuerto, s.dimValidationDate, s.etaWh, id]
    );

    // Actualizar hitos (Estrategia simple: actualizar uno por uno o borrar e insertar. Aquí actualizamos fechas y estado)
    for (const m of s.milestones) {
      await conn.query(
        `UPDATE Hito SET fecha_vencimiento=?, fecha_alerta=?, estado=? WHERE id_embarque=? AND hito_id=?`,
        [m.dueDate, m.alertDate, m.status, id, m.id]
      );
    }

    await conn.commit();
    res.json({ message: 'Actualizado correctamente' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE: Eliminar embarque
app.delete('/api/shipments/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Importacion WHERE id_embarque = ?', [req.params.id]);
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Toggle Hito (Completar/Descompletar)
app.patch('/api/shipments/:id/milestones/:milestoneId', async (req, res) => {
  const { completedDate } = req.body;
  const { id, milestoneId } = req.params;
  
  try {
    await db.query(
      'UPDATE Hito SET fecha_completado = ?, estado = ? WHERE id_embarque = ? AND hito_id = ?',
      [completedDate, completedDate ? 'COMPLETED' : 'PENDING', id, milestoneId]
    );
    res.json({ message: 'Hito actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Enviar notificación de hito
app.post('/api/notify/milestone-alert', async (req, res) => {
  const { shipment, milestone } = req.body;

  if (!shipment || !milestone) {
    return res.status(400).json({ error: 'Faltan datos del embarque o del hito' });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'ejordan@digicorp.com.bo', // O un email de usuario/configuración
      subject: `[ALERTA] Hito Crítico: ${milestone.name} - Operación ${shipment.identifier}`,
      html: `
        <h3>Alerta de Hito Crítico</h3>
        <p>La operación <strong>${shipment.identifier}</strong> con origen en <strong>${shipment.origin}</strong> tiene un vencimiento próximo.</p>
        <ul>
          <li><strong>Hito:</strong> ${milestone.name}</li>
          <li><strong>Descripción:</strong> ${milestone.description}</li>
          <li><strong>Fecha de Vencimiento:</strong> ${milestone.dueDate}</li>
        </ul>
        <p>Por favor, tome las acciones necesarias.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Notificación de hito enviada correctamente' });

  } catch (err) {
    console.error('Error al enviar email de hito:', err);
    res.status(500).json({ error: 'Error al enviar la notificación' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
