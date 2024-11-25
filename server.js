const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234', // Cambia la contraseña según tu configuración
    database: 'social_skills_db'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API Backend para Flutter y MySQL');
});

// Registrar Usuario con hasheo de contraseña y preferencia
app.post('/register', async (req, res) => {
    const { username, password, name, age, email, preference } = req.body;

    // Verificar si todos los campos están presentes
    if (!username || !password || !name || !age || !email || !preference) {
        return res.status(400).send({
            message: 'Por favor, ingresa todos los campos',
            fields: {
                username: !username ? 'El usuario es obligatorio' : null,
                password: !password ? 'La contraseña es obligatoria' : null,
                name: !name ? 'El nombre es obligatorio' : null,
                age: !age ? 'La edad es obligatoria' : null,
                email: !email ? 'El correo es obligatorio' : null,
                preference: !preference ? 'La preferencia es obligatoria' : null
            }
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);  // Hashear la contraseña

        const query = 'INSERT INTO users (username, password, name, age, email, preference) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [username, hashedPassword, name, age, email, preference], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send({
                        message: 'El correo ya está registrado',
                        fields: { email: 'Este correo ya está registrado' }
                    });
                }
                return res.status(500).send({ message: 'Error al registrar el usuario', error: err });
            }

            res.status(201).send({ message: 'Usuario registrado exitosamente', userId: results.insertId });
        });
    } catch (err) {
        res.status(500).send({ message: 'Error al procesar la solicitud', error: err });
    }
});

// Registrar Usuario con hasheo de contraseña y preferencia
/* app.post('/register', async (req, res) => {
    const { username, password, name, age, email, preference } = req.body;

    if (!username || !password || !name || !age || !email || !preference) {
        return res.status(400).send({ message: 'Por favor, ingresa todos los campos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);  // Hashear la contraseña

        const query = 'INSERT INTO users (username, password, name, age, email, preference) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [username, hashedPassword, name, age, email, preference], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send({ message: 'El correo ya está registrado' });
                }
                return res.status(500).send({ message: 'Error al registrar el usuario', error: err });
            }

            res.status(201).send({ message: 'Usuario registrado exitosamente', userId: results.insertId });
        });
    } catch (err) {
        res.status(500).send({ message: 'Error al procesar la solicitud', error: err });
    }
});    */

// Iniciar Sesión con comparación de contraseña hasheada
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Por favor, ingresa todos los campos' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            return res.status(500).send({ message: 'Error al iniciar sesión', error: err });
        }

        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);  // Comparar contraseña hasheada

            if (isMatch) {
                res.status(200).send({
                    message: 'Inicio de sesión exitoso',
                    user: {
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        age: user.age,
                        email: user.email,
                        preference: user.preference,
                    }
                });
            } else {
                res.status(401).send({ message: 'Usuario o contraseña incorrectos' });
            }
        } else {
            res.status(401).send({ message: 'Usuario o contraseña incorrectos' });
        }
    });
});

// Obtener Todos los Usuarios
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send({ message: 'Error al obtener usuarios', error: err });
        }
        res.status(200).send(results);
    });
});

// Registrar respuestas del test
app.post('/test-responses', (req, res) => {
    const { user_id, question, response } = req.body;

    if (!user_id || !question || response == null) {
        return res.status(400).send({ message: 'Por favor, completa todas las respuestas' });
    }

    // Validar que la pregunta esté en el formato correcto
    const validQuestions = [
        'dim1_q1', 'dim1_q2', 'dim1_q3', 'dim1_q4', 'dim1_q5', 'dim1_q6', 'dim1_q7', 'dim1_q8',
        'dim2_q1', 'dim2_q2', 'dim2_q3', 'dim2_q4', 'dim2_q5', 'dim2_q6', 'dim2_q7', 'dim2_q8',
        'dim3_q1', 'dim3_q2', 'dim3_q3', 'dim3_q4', 'dim3_q5', 'dim3_q6', 'dim3_q7', 'dim3_q8',
        'dim4_q1', 'dim4_q2', 'dim4_q3', 'dim4_q4', 'dim4_q5', 'dim4_q6', 'dim4_q7', 'dim4_q8',
        'dim5_q1', 'dim5_q2', 'dim5_q3', 'dim5_q4', 'dim5_q5', 'dim5_q6', 'dim5_q7', 'dim5_q8',
        'dim6_q1', 'dim6_q2', 'dim6_q3', 'dim6_q4', 'dim6_q5', 'dim6_q6', 'dim6_q7', 'dim6_q8'
    ];

    if (!validQuestions.includes(question)) {
        return res.status(400).send({ message: 'Pregunta no válida' });
    }

    const query = 'INSERT INTO test_responses (user_id, question, response) VALUES (?, ?, ?)';
    db.query(query, [user_id, question, response], (err, results) => {
        if (err) {
            return res.status(500).send({ message: 'Error al registrar las respuestas del test', error: err });
        }
        res.status(201).send({ message: 'Respuestas del test guardadas exitosamente' });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
