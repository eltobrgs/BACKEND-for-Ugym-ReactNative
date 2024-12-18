// routes/public.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET= process.env.JWT_SECRET;
//cadastro, funciona como um middleware que recebe requisição, resposta e next, 
router.post("/cadastro", async (req, res) => {
    try {
        const user = req.body;
        console.log("Dados do usuário recebidos:", user); // Log dos dados recebidos

        const salt = await bcrypt.genSalt(10);
        console.log("Salt gerado:", salt); // Log do salt gerado

        const hash = await bcrypt.hash(user.password, salt);
        console.log("Hash da senha gerado:", hash); // Log do hash gerado

        const savedUser = await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: hash
            }
        });
        console.log("Usuário salvo no banco de dados:", savedUser); // Log do usuário salvo

        res.status(201).json(user);
    } catch (err) {
        console.error("Ocorreu um erro:", err); // Log do erro
        res.status(500).json({ error: err.message });
    }
});



// Login, funciona como um middleware que recebe requisição, resposta e next
router.post("/login", async (req, res) => {
    try {
        const userInfo = req.body;
        console.log("Dados do usuário recebidos:", userInfo); // Log dos dados recebidos

        const user = await prisma.user.findUnique({
            where: {
                email: userInfo.email
            }
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Comparando a senha fornecida com a senha armazenada
        const isMatch = await bcrypt.compare(userInfo.password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Senha incorreta" });
        }

        // Gerando um token JWT
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '10m' });

        res.status(200).json({ message: "Login bem-sucedido", token: token });


    } catch (err) {
        console.error("Ocorreu um erro:", err); // Log do erro
        res.status(500).json({ error: err.message });
    }
});



export default router; //exportando o router para ser utilizado em outro arquivo
