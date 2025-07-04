import User from "../models/User.js";
import Argon2 from "argon2";
import createUserToken from "../helpers/create-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Empresa from "../models/Empresa.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class UserController {
  static async register(req, res) {
    const {
      nome,
      email,
      cpf,
      telefone,
      password,
      tipo,
      status,
      curso,
      instituicao_ensino,
      github,
      linkedin,
      razao_social,
      sobre,
      portifolio,
      localizacao,
      setor,
      site,
    } = req.body;

    try {
      // Verifica se já existe um usuário com o mesmo e-mail
      const userExist = await User.findOne({ email });

      if (userExist) {
        return res.status(422).json({ message: "E-mail já cadastrado" });
      }

      // Criptografa a senha
      const passwordhash = await Argon2.hash(password, {
        type: Argon2.argon2id,
        memoryCost: 2 ** 16,
        parallelism: 1,
      });

      // Cria o novo usuário com os dados recebidos
      const user = new User({
        nome,
        email,
        cpf: tipo === "empresa" ? cpf : cpf,
        telefone,
        password: passwordhash,
        tipo,
        status,
        curso,
        instituicao_ensino,
        github,
        linkedin,
        sobre,
        portifolio,
      });

      // Tenta salvar o usuário
      const newUser = await user.save();

      //se salvar usuario e o tipo for empresa, salvar tambem no model empresa
      if (tipo === "empresa") {
        const empresa = new Empresa({
          nome: razao_social,
          cnpj: cpf,
          localizacao,
          email_contato: email,
          setor,
          site,
          telefone,
          status,
          user: newUser._id, // Associa o usuário ao modelo Empresa
        });
        await empresa.save();
      }

      return res.status(201).json({
        message: "Usuário inserido com sucesso",
        newUser,
      });
    } catch (error) {
      // Se o erro for de validação do Mongoose
      if (error.name === "ValidationError") {
        const errors = Object.keys(error.errors).map((field) => ({
          field,
          message: error.errors[field].message,
        }));

        return res.status(400).json({
          message: "Erro de validação",
          errors,
        });
      }

      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro interno. Tente novamente mais tarde." });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(422)
        .json({ message: "Preencha os campos obrigatórios" });
    }

    try {
      const userExist = await User.findOne({ email: email });

      if (!userExist) {
        return res.status(422).json({ message: "Credenciais inválidas" });
      }

      // Check if password hash is valid
      if (!userExist.password || !userExist.password.startsWith("$")) {
        return res
          .status(500)
          .json({ message: "Problema com a senha armazenada" });
      }

      // Verify password
      const checkPassword = await Argon2.verify(userExist.password, password);

      if (!checkPassword) {
        return res.status(422).json({ message: "Credenciais inválidas" });
      }

      // Generate token
      await createUserToken(userExist, req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  static async update(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
      const user = await getUserByToken(token);
      const updatedData = req.body;
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Atualiza os campos do usuário com os dados recebidos
      const updatedUser = await User.findByIdAndUpdate(user._id, updatedData, {
        new: true,
      });
      return res
        .status(200)
        .json({ message: "Usuário atualizado com sucesso", updatedUser });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar usuário", error: error.message });
    }
  }

  static async getUsers(req, res) {
    try {
      const { search } = req.query;
      let query = {};

      if (search) {
        const regex = new RegExp(search, "i"); // Busca case-insensitive

        //Ele faz uma busca com OR, ele vai testando em cada coluna para ver se tem algo semelhante ao que foi digitado pelo usuario
        query.$or = [
          { nome: { $regex: regex } },
          { email: { $regex: regex } },
          { tipo: { $regex: regex } },
          { status: { $regex: regex } },
          { curso: { $regex: regex } },
          { instituicao_ensino: { $regex: regex } },
          { github: { $regex: regex } },
          { linkedin: { $regex: regex } },
          { sobre: { $regex: regex } },
          { portifolio: { $regex: regex } },
        ];
      }
      const users = await User.find(query).select("-password");
      return res.status(200).json({ users });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao obter usuários" });
    }
  }

  static async getUserByID(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      return res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao obter usuário" });
    }
  }

  static async updateByID(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "Usuario não encontrada" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          ...req.body,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Usuario atualizada com sucesso",
        usuario: updatedUser,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar usuário", error: error.message });
    }
  }

  static async perfilByToken(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
    const user = await getUserByToken(token);

    if (!user)
      return res.status(404).json({ message: "Usuário não encontrado" });

    try {
      return res.status(200).json({ user });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao obter usuário", error: error });
    }
  }

  static async uploadFoto(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
    const user = await getUserByToken(token);

    if (!user)
      return res.status(404).json({ message: "Usuário não encontrado" });

    try {
      // 1. Verificar se o arquivo foi enviado
      if (!req.files || !req.files.foto) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      const foto = req.files.foto;

      // 2. Verificar se é uma imagem
      if (foto.mimetype !== "image/jpeg" && foto.mimetype !== "image/png") {
        return res
          .status(400)
          .json({ message: "Apenas arquivos de imagem são permitidos." });
      }

      // 3. Configurar caminhos
      const uploadDir = path.join(__dirname, "../public/fotos");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 4. Gerar nome único
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileName = `foto-${uniqueSuffix}${path.extname(foto.name)}`;
      const uploadPath = path.join(uploadDir, fileName);

      // 5. Mover arquivo
      await foto.mv(uploadPath);

      // 6. Construir URL
      const fileUrl = `/fotos/${fileName}`;

      // 8. Remover arquivo anterior se existir
      if (user.foto) {
        const oldFilePath = path.join(uploadDir, path.basename(user.foto));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // 9. Atualizar usuário
      user.foto = fileUrl;

      await user.save();

      // 10. Responder
      return res.status(200).json({
        message: "Foto enviada com sucesso!",
        foto: user.foto,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao enviar foto", error: error.message });
    }
  }

  // Upload de currículo
  static async uploadCurriculo(req, res) {
    const token = req.headers.authorization.split(" ")[1];
    const user = await getUserByToken(token); // Implemente esta função!

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    try {
      // 1. Verificar se o arquivo foi enviado
      if (!req.files || !req.files.curriculo) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      const curriculo = req.files.curriculo;

      // 2. Verificar se é PDF
      if (curriculo.mimetype !== "application/pdf") {
        return res
          .status(400)
          .json({ message: "Apenas arquivos PDF são permitidos." });
      }

      // 3. Configurar caminhos
      const uploadDir = path.join(__dirname, "../public/curriculos");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 4. Gerar nome único
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileName = `curriculo-${uniqueSuffix}${path.extname(
        curriculo.name
      )}`;
      const uploadPath = path.join(uploadDir, fileName);

      // 5. Mover arquivo
      await curriculo.mv(uploadPath);

      // 6. Construir URL
      const fileUrl = `/curriculos/${fileName}`;

      // 8. Remover arquivo anterior se existir
      if (user.curriculo && user.curriculo.url) {
        const oldFilePath = path.join(
          uploadDir,
          path.basename(user.curriculo.url)
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // 9. Atualizar usuário
      user.curriculo = {
        nome: curriculo.name,
        tamanho: curriculo.size,
        dataUpload: new Date(),
        url: fileUrl,
      };

      await user.save();

      // 10. Responder
      return res.status(200).json({
        message: "Currículo enviado com sucesso!",
        curriculo: user.curriculo,
      });
    } catch (error) {
      console.error("Erro no upload:", error);
      return res.status(500).json({
        message: "Erro ao processar o currículo",
        error: error.message,
      });
    }
  }

  // Remover currículo
  static async removerCurriculo(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Atualizar o usuário removendo o currículo
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $unset: { curriculo: 1 } },
        { new: true }
      );

      return res.status(200).json({
        message: "Currículo removido com sucesso!",
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao remover currículo",
        error: error.message,
      });
    }
  }
}
