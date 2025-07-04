import Artigo from "../models/Artigo.js";
import createUserToken from "../helpers/create-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class ArtigoController {
  static async createArtigo(req, res) {
    try {
      const imagem_capa = req.files?.imagem_capa;
      if (imagem_capa) {
        // 2. Verificar se e uma, nao importa o tipo
        if (imagem_capa.mimetype.split("/")[0] !== "image") {
          return res
            .status(400)
            .json({ message: "Apenas arquivos de imagem são permitidos." });
        }

        // 3. Configurar caminhos
        const uploadDir = path.join(__dirname, "../public/imagem_capas");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 4. Gerar nome único
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileName = `imagem_capa-${uniqueSuffix}${path.extname(
          imagem_capa.name
        )}`;
        const uploadPath = path.join(uploadDir, fileName);

        // 5. Mover arquivo
        await imagem_capa.mv(uploadPath);

        // 6. Construir URL
        const fileUrl = `/imagem_capas/${fileName}`;

        // 9. Atualizar usuário
        req.body["imagem_capa"] = fileUrl;
      }
      const artigo = new Artigo(req.body);
      const newArtigo = await artigo.save();
      return res
        .status(201)
        .json({ message: "Artigo criado com sucesso", artigo: newArtigo });
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = Object.keys(error.errors).map((field) => ({
          field,
          message: error.errors[field].message,
        }));
        return res.status(400).json({ message: "Erro de validação", errors });
      }
      return res.status(500).json({ message: "Erro ao criar artigo" });
    }
  }

  static async getArtigos(req, res) {
    try {
      const { search } = req.query;
      let query = {};

      if (search) {
        const regex = new RegExp(search, "i"); // Busca case-insensitive

        //Ele faz uma busca com OR, ele vai testando em cada coluna para ver se tem algo semelhante ao que foi digitado pelo usuario
        query.$or = [
          { titulo: { $regex: regex } },
          { conteudo: { $regex: regex } },
          { resumo: { $regex: regex } },
          { categoria: { $regex: regex } },
          { tags: { $regex: regex } },
        ];
      }

      const artigos = await Artigo.find(query).sort("-createdAt");

      res.status(200).json({ artigos });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        details: "Erro ao buscar artigos",
      });
    }
  }

  static async getArtigoByTitulo(req, res) {
    const { titulo } = req.params;
    if (!titulo) {
      return res
        .status(422)
        .json({ message: "Titulo do artigo obrigatório na busca" });
    }
    const artigo = await Artigo.findOne({ titulo }).sort("-createdAt");
    if (!artigo || artigo.length === 0) {
      return res.status(404).json({ message: "Artigo não encontrado" });
    }
    res.status(200).json({ artigo });
  }

  static async getArtigoBySlug(req, res) {
    const { slug } = req.params;
    console.log(slug);
    if (!slug) {
      return res
        .status(422)
        .json({ message: "Slug do artigo obrigatório na busca" });
    }
    const artigo = await Artigo.findOne({ slug });
    if (!artigo || artigo.length === 0) {
      return res.status(404).json({ message: "Artigo não encontrado" });
    }
    res.status(200).json({ artigo });
  }

  static async updateArtigo(req, res) {
    try {
      const { id } = req.params;
      const imagem_capa = req?.files?.imagem_capa;
      const artigo = await Artigo.findById(id);
      if (!artigo) {
        return res.status(404).json({ message: "Artigo não encontrado" });
      }
      if (imagem_capa) {
        // 2. Verificar se e uma, nao importa o tipo
        if (imagem_capa.mimetype.split("/")[0] !== "image") {
          return res
            .status(400)
            .json({ message: "Apenas arquivos de imagem são permitidos." });
        }

        // 3. Configurar caminhos
        const uploadDir = path.join(__dirname, "../public/imagem_capas");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 4. Gerar nome único
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileName = `imagem_capa-${uniqueSuffix}${path.extname(
          imagem_capa.name
        )}`;
        const uploadPath = path.join(uploadDir, fileName);

        // 5. Mover arquivo
        await imagem_capa.mv(uploadPath);

        // 6. Construir URL
        const fileUrl = `/imagem_capas/${fileName}`;

        // 8. Remover arquivo anterior se existir
        if (artigo.imagem_capa) {
          const oldFilePath = path.join(
            uploadDir,
            path.basename(artigo.imagem_capa)
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // 9. Atualizar usuário
        req.body["imagem_capa"] = fileUrl;
      }

      const updatedArtigo = await Artigo.findByIdAndUpdate(
        id,
        {
          ...req.body,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Artigo atualizado com sucesso",
        artigo: updatedArtigo,
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar artigo" });
    }
  }

  static async deleteArtigo(req, res) {
    const { id } = req.params;
    try {
      const artigo = await Artigo.findByIdAndDelete(id);
      if (!artigo) {
        return res.status(404).json({ message: "Artigo não encontrado" });
      }
      return res.status(200).json({ message: "Artigo deletado com sucesso" });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao deletar artigo" });
    }
  }
}
