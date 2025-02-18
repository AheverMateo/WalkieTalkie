const express = require('express');
const router = require('./routes/routes');
const socketIo = require('socket.io');
const socketController = require('./controllers/socketController');

const app = express();
const server = require('http').createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

socketController(io);

app.use(express.json());
app.use('/', router);

module.exports = server;