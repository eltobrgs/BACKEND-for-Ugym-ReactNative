import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();


router.get('/listar-usuarios', async(req, res) => {

    try{
        //const users = await prisma.user.findMany({omit: {password: true}});
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                // add other fields you want to include
                password: false
            }
        });
        res.status(200).json({ message: "usuarios listados no sistema com sucesso", users });

    }catch{
        res.status(500).json({ error: err.message });
    }
})


// Endpoint para buscar as preferências do usuário
router.get("/preferences", async (req, res) => {
    try {
        // Verificar o token de autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Token não fornecido" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar usuário pelo ID decodificado no token
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Buscar as preferências do usuário
        const preferences = await prisma.preferences.findUnique({
            where: { userId: user.id },
        });

        if (!preferences) {
            return res.status(404).json({ error: "Preferências não encontradas" });
        }

        // Retornar as preferências do usuário
        res.status(200).json(preferences);
    } catch (err) {
        console.error("Erro ao buscar preferências:", err);
        res.status(500).json({ error: "Erro ao buscar preferências" });
    }
});



// Endpoint para buscar as preferências do usuário
router.get("/preferences", async (req, res) => {
    try {
        // Verificar o token de autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Token não fornecido" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar usuário pelo ID decodificado no token
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Buscar as preferências do usuário
        const preferences = await prisma.preferences.findUnique({
            where: { userId: user.id },
        });

        if (!preferences) {
            return res.status(404).json({ error: "Preferências não encontradas" });
        }

        // Retornar as preferências do usuário
        res.status(200).json(preferences);
    } catch (err) {
        console.error("Erro ao buscar preferências:", err);
        res.status(500).json({ error: "Erro ao buscar preferências" });
    }
});


export default router;