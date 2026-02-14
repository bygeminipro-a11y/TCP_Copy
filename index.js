const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 10000;

// ตัวแปรเก็บสัญญาณล่าสุดในหน่วยความจำ (แทน Redis ชั่วคราว)
let lastSignal = "NO_DATA";

// รองรับการรับข้อมูลแบบ Text จาก Master EA
app.use(express.text());

// Endpoint สำหรับ Master EA ส่งสัญญาณ (POST)
app.post('/update', (req, res) => {
    lastSignal = req.body;
    console.log("Master Sent:", lastSignal);
    
    // ส่งต่อให้ลูกข่ายที่เชื่อมต่อแบบ WebSocket ด้วย (ถ้ามี)
    broadcast(lastSignal);
    res.status(200).send("OK");
});

// Endpoint สำหรับ Slave EA มาดึงสัญญาณ (GET)
app.get('/get-signal', (req, res) => {
    res.status(200).send(lastSignal);
    // เมื่อ Slave อ่านแล้ว อาจจะเลือกเคลียร์ค่าทิ้งหรือไม่ก็ได้
    // lastSignal = "NO_DATA"; 
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data.toString());
        }
    });
}

wss.on('connection', (ws) => {
    console.log("New WebSocket client connected");
    ws.on('message', (data) => {
        lastSignal = data.toString();
        broadcast(lastSignal);
    });
});

server.listen(PORT, () => {
    console.log(`Hybrid Server is running on port ${PORT}`);
});;
