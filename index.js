//Importamos las librarías requeridas
const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose();

//Documentación en https://expressjs.com/en/starter/hello-world.html
const app = express()

//Creamos un parser de tipo application/json
//Documentación en https://expressjs.com/en/resources/middleware/body-parser.html
const jsonParser = bodyParser.json()


// Abre la base de datos de SQLite
let db = new sqlite3.Database('./base.sqlite3', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos SQLite.');

    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        todo TEXT NOT NULL,
        created_at INTEGER
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Tabla tareas creada o ya existente.');
        }
    });
});


app.post('/agregar-todo', jsonParser, async (req, res) => {
    try {
        // Extraemos el campo 'todo' del cuerpo de la solicitud
        const { todo } = req.body;
        console.log(todo);
        
        if (!todo || typeof todo !== 'string' || todo.trim().length === 0) {
            res.status(400).send('The "todo" field must be a string and cannot be empty');
            return;
        }
        const stmt  =  db.prepare('INSERT INTO todos (todo, created_at) VALUES (?, CURRENT_TIMESTAMP)');

        stmt.run(todo, (err) => {
            if (err) {
            console.error("Error running stmt:", err);
            res.status(500).send(err);
            return;

            } else {
            console.log("Insert was successful!");
            }
        });

        stmt.finalize();
        
        //Enviamos de regreso la respuesta
        res.setHeader('Content-Type', 'application/json');
        res.status(201).json({ message: 'Todo created successfully'});
            
        
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});




app.get('/', function (req, res) {
    //Enviamos de regreso la respuesta
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'status': 'ok' }));
})

app.get('/todos', (req, res) => {
    db.all('SELECT * FROM todos ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error("Error fetching todos:", err);
            res.status(500).json({ error: 'Error interno del servidor', details: err.message });
            return;
        }
        
        //console.log("Todos fetched:", rows); // Log para depuración
        
        // Enviamos de regreso la respuesta
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ todos: rows }); // Envolvemos los todos en un objeto
    });
});

app.delete('/done/:id', (req, res) => {
    const { id } = req.params;

    // Verificamos si el id es válido
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'El parámetro id debe ser un número válido.' });
    }

    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');

    stmt.run(id, function(err) {
        if (err) {
            console.error("Error al borrar la tarea:", err);
            res.status(500).json({ error: 'Error interno del servidor', details: err.message });
            return;
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada con el id proporcionado.' });
        }

        res.status(200).json({ message: `Tarea con id ${id} eliminada exitosamente.` });
        console.log(`Tarea con id ${id} eliminada exitosamente.`);
    });

    stmt.finalize();
});

app.put('/todos/:id', jsonParser, (req, res) => {
    const { id } = req.params;  // Obtener el ID desde los parámetros de la URL
    const { todo } = req.body;  // Obtener el nuevo valor del todo

    if (!todo || typeof todo !== 'string' || todo.trim().length === 0) {
        return res.status(400).send('El campo "todo" debe ser una cadena no vacía');
    }

    const stmt = db.prepare('UPDATE todos SET todo = ? WHERE id = ?');
    stmt.run(todo, id, function (err) {
        if (err) {
            console.error("Error al actualizar el todo:", err);
            return res.status(500).send('Error interno del servidor');
        }

        if (this.changes === 0) {
            // Si no se encuentra el todo con el id proporcionado
            return res.status(404).send('Todo no encontrado');
        }

        console.log(`Todo con id ${id} actualizado con éxito`);
        res.status(200).json({ message: 'Todo actualizado con éxito' });
    });

    stmt.finalize();
});

//Creamos un endpoint de login que recibe los datos como json
app.post('/login', jsonParser, function (req, res) {
    //Imprimimos el contenido del body
    console.log(req.body);

    // Enviamos de regreso la respuesta
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'status': 'ok' }));
    console.log("Se inicio el login");
})

//Corremos el servidor en el puerto 3000
const port = 3000;

app.listen(port, () => {
    console.log(`Aplicación corriendo en http://localhost:${port}`)
})
