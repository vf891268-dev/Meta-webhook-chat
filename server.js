const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static(__dirname));

const VERIFY_TOKEN = "orion_token_secreto_123";

io.on('connection', (socket) => {
    console.log('ORION IA: Cliente conectado ao painel:', socket.id);
});

// Endpoint GET para verificação da Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log('Webhook verificado com sucesso!');
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

// Endpoint POST para receber mensagens da Meta
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const messageData = body.entry[0].changes[0].value.messages[0];

            const payload = {
                from: messageData.from,
                text: messageData.text ? messageData.text.body : 'Mídia ou formato não suportado',
                timestamp: messageData.timestamp
            };

            console.log(`[WhatsApp] Mensagem de ${payload.from}: ${payload.text}`);
            io.emit('meta_message', payload);
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor ORION IA a rodar na porta ${PORT}`);
});
