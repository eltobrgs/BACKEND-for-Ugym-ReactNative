//private.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Listar usuários
router.get('/listar-usuarios', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    res.status(200).json({ message: "Usuários listados com sucesso", users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/atividades", async (req, res) => {
  try {
    const { activityName, status, lightColor, color, darkColor } = req.body;

    // Validar o token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    // Buscar o usuário pelo ID decodificado no token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Validar os dados enviados
    if (!activityName || !status || !lightColor || !color || !darkColor) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Validar o status
    if (isNaN(status) || status < 0 || status > 100) {
      return res.status(400).json({ error: "O status deve ser um número entre 0 e 100" });
    }

    // Criar a atividade no banco de dados
    const activity = await prisma.activity.create({
      data: {
        name: activityName,
        status: parseInt(status, 10), // Converter status para número
        lightColor,
        color,
        darkColor,
        userId: user.id, // Associar a atividade ao usuário
      },
    });

    res.status(201).json({
      message: "Atividade registrada com sucesso",
      activity: {
        id: activity.id,
        name: activity.name,
        status: activity.status,
        lightColor: activity.lightColor,
        color: activity.color,
        darkColor: activity.darkColor,
      },
    });
  } catch (err) {
    console.error("Erro ao registrar atividade:", err);
    res.status(500).json({ error: "Erro ao registrar atividade" });
  }
});


export default router;
