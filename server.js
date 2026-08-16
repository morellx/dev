const express = require('express');
const path = require('path');
const app = express();

// Sirve los archivos estáticos de tu proyecto
app.use(express.static(path.join(__dirname, 'public')));