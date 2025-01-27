//publi.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Endpoint de Cadastro
router.post("/cadastro", async (req, res) => {
  try {
    const user = req.body;
    console.log("Dados do usuário recebidos:", user);

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    // Salvar usuário no banco de dados
    const savedUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hash,
      },
    });
    console.log("Usuário salvo no banco de dados:", savedUser);

    // Gerar o token JWT
    const token = jwt.sign({ userId: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

    // Retornar o token e dados do usuário (sem a senha)
    res.status(201).json({
      message: "Cadastro realizado com sucesso",
      token: token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.error("Erro ao realizar cadastro:", err);
    res.status(500).json({ error: "Erro ao realizar cadastro" });
  }
});

// Endpoint de Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Tentativa de login com email:", email);

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("Usuário não encontrado:", email);
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Senha incorreta para o usuário:", email);
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Gerar o token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '10m' });

    res.status(200).json({
      message: "Login bem-sucedido",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Erro ao realizar login:", err);
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});

// Endpoint para buscar dados do usuário
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }, // Campos retornados
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err);
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

// Rota para salvar preferências
router.post("/preferences", async (req, res) => {
  try {
    const { birthDate, gender, goal, healthCondition, experience } = req.body;

    // Converter de DD/MM/YYYY para o formato aceito pelo JavaScript (YYYY-MM-DD)
    const [day, month, year] = birthDate.split('/');
    const parsedBirthDate = new Date(`${year}-${month}-${day}`);

    if (isNaN(parsedBirthDate)) {
      return res.status(400).json({ error: "Formato de data inválido para birthDate. Use DD/MM/YYYY" });
    }
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

    // Verificar se o usuário já tem preferências registradas
    const existingPreferences = await prisma.preferences.findUnique({
      where: { userId: user.id },
    });

    if (existingPreferences) {
      // Se já existirem preferências, atualizar
      const updatedPreferences = await prisma.preferences.update({
        where: { userId: user.id },
        data: {
          birthDate: parsedBirthDate.toISOString(),
          gender,
          goal,
          healthCondition,
          experience,
        },
      });
      return res.status(200).json({
        message: "Preferências atualizadas com sucesso",
        preferences: updatedPreferences,
      });
    }

    // Se não existir, criar novas preferências
    const newPreferences = await prisma.preferences.create({
      data: {
        birthDate: parsedBirthDate.toISOString(),
        gender,
        goal,
        healthCondition,
        experience,
        userId: user.id, // Associar as preferências ao usuário
      },
    });

    res.status(201).json({
      message: "Preferências salvas com sucesso",
      preferences: newPreferences,
    });
  } catch (err) {
    console.error("Erro ao salvar preferências:", err);
    res.status(500).json({ error: "Erro ao salvar preferências" });
  }
});


//endpoint para buscar preferências
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

    // Formatar a data de nascimento
    const formattedBirthDate = new Date(preferences.birthDate).toLocaleDateString('pt-BR');

    // Retornar as preferências com a data formatada
    res.status(200).json({
      ...preferences,
      birthDate: formattedBirthDate, // Sobrescrever a data formatada
    });
  } catch (err) {
    console.error("Erro ao buscar preferências:", err);
    res.status(500).json({ error: "Erro ao buscar preferências" });
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

// Endpoint para obter atividades do usuário autenticado
router.get('/atividades', async (req, res) => {
  try {
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

    // Buscar atividades associadas ao usuário
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        lightColor: true,
        color: true,
        darkColor: true,
      },
    });

    res.status(200).json({
      message: "Atividades listadas com sucesso",
      activities,
    });
  } catch (err) {
    console.error("Erro ao listar atividades:", err);
    res.status(500).json({ error: "Erro ao listar atividades" });
  }
});


export default router;
