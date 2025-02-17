const express = require('express');
const router = require('./routes/routes');
const https = require('https');
const path = require('path');
const fs = require('fs');
const socketIo = require('socket.io')
const socketController = require('./controllers/socketController');

const app = express();


const credentials = {
    key: fs.readFileSync(path.join(__dirname, '../certs/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/server.cert'))
}

const httpsServer = https.createServer(credentials, app);

const io = socketIo(httpsServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

socketController(io)

app.use(express.json())

app.use('/', router);

module.exports = httpsServer;