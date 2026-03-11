const express = require('express');
const sequelize = require('./config/database');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// Serve static HTML
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Manager</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .btn { padding: 10px 20px; margin: 5px; background: #007cba; color: white; border: none; cursor: pointer; }
            .btn:hover { background: #005a87; }
            .form-group { margin: 10px 0; }
            input, select { padding: 8px; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Database Manager</h1>
            
            <h2>Users</h2>
            <button class="btn" onclick="loadUsers()">Load Users</button>
            <div id="users"></div>
            
            <h2>Add New User</h2>
            <div class="form-group">
                <input type="text" id="userName" placeholder="Name">
                <input type="email" id="userEmail" placeholder="Email">
                <input type="password" id="userPassword" placeholder="Password">
                <select id="userRole">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button class="btn" onclick="addUser()">Add User</button>
            </div>
            
            <h2>Execute SQL Query</h2>
            <div class="form-group">
                <textarea id="sqlQuery" rows="4" cols="80" placeholder="SELECT * FROM users;"></textarea><br>
                <button class="btn" onclick="executeQuery()">Execute</button>
            </div>
            <div id="queryResult"></div>
        </div>
        
        <script>
            async function loadUsers() {
                const response = await fetch('/api/users');
                const users = await response.json();
                
                let html = '<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr>';
                users.forEach(user => {
                    html += \`<tr>
                        <td>\${user.id}</td>
                        <td>\${user.name}</td>
                        <td>\${user.email}</td>
                        <td>\${user.role}</td>
                        <td>\${user.created_at}</td>
                    </tr>\`;
                });
                html += '</table>';
                document.getElementById('users').innerHTML = html;
            }
            
            async function addUser() {
                const name = document.getElementById('userName').value;
                const email = document.getElementById('userEmail').value;
                const password = document.getElementById('userPassword').value;
                const role = document.getElementById('userRole').value;
                
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });
                
                const result = await response.json();
                alert(result.message || 'User added successfully');
                loadUsers();
            }
            
            async function executeQuery() {
                const query = document.getElementById('sqlQuery').value;
                
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const result = await response.json();
                
                if (result.error) {
                    document.getElementById('queryResult').innerHTML = \`<p style="color: red;">Error: \${result.error}</p>\`;
                } else {
                    let html = '<table><tr>';
                    if (result.length > 0) {
                        Object.keys(result[0]).forEach(key => {
                            html += \`<th>\${key}</th>\`;
                        });
                        html += '</tr>';
                        
                        result.forEach(row => {
                            html += '<tr>';
                            Object.values(row).forEach(value => {
                                html += \`<td>\${value}</td>\`;
                            });
                            html += '</tr>';
                        });
                    }
                    html += '</table>';
                    document.getElementById('queryResult').innerHTML = html;
                }
            }
        </script>
    </body>
    </html>
    `);
});

// API endpoints
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'created_at']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            created_at: new Date(),
            updated_at: new Date()
        });
        
        res.json({ message: 'User created successfully', user: { id: user.id, name, email, role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/query', async (req, res) => {
    try {
        const { query } = req.body;
        const [results] = await sequelize.query(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(\`🔧 Database Manager running on http://localhost:\${PORT}\`);
    console.log(\`📊 Access your database at: http://localhost:\${PORT}\`);
});