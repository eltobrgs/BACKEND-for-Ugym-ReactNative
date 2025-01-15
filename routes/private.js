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
                password: false,
            },
        });
        res.status(200).json({ message: "Usuários listados com sucesso", users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/preferences', async (req, res) => {
    try {
      const { birthDate, gender, goal, healthCondition, experience } = req.body;
  
      // Validando a data (se está no formato correto: YYYY-MM-DD)
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!birthDate.match(regex)) {
        return res.status(400).json({ error: 'Data de nascimento inválida, formato esperado: YYYY-MM-DD' });
      }
  
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
  
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  
      const existingPreferences = await prisma.preferences.findUnique({ where: { userId: user.id } });
  
      if (existingPreferences) {
        const updatedPreferences = await prisma.preferences.update({
          where: { userId: user.id },
          data: { 
            birthDate,  // Salvar a data como string
            gender,
            goal,
            healthCondition,
            experience,
          },
        });
        return res.status(200).json({ message: "Preferências atualizadas", preferences: updatedPreferences });
      }
  
      const newPreferences = await prisma.preferences.create({
        data: { 
          birthDate,  // Salvar a data como string
          gender,
          goal,
          healthCondition,
          experience,
          userId: user.id,
        },
      });
      res.status(201).json({ message: "Preferências salvas", preferences: newPreferences });
    } catch (err) {
      res.status(500).json({ error: "Erro ao salvar preferências" });
    }
  });
  
  

// Buscar preferências
router.get('/preferences', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
  
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  
      const preferences = await prisma.preferences.findUnique({ where: { userId: user.id } });
      if (!preferences) return res.status(404).json({ error: "Preferências não encontradas" });
  
      res.status(200).json(preferences);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar preferências" });
    }
  });
  

export default router;


