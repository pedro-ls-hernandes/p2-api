import Empresa from "../models/Empresa.js";
import mongoose from "../db/conn.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import getUserByToken from "../helpers/get-user-by-token.js";
import Vaga from "../models/Vaga.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class EmpresaController {
  static async createEmpresa(req, res) {
    const logo = req.file?.path;

    const empresa = new Empresa({
      ...req.body,
      logo,
      vagas: [],
    });

    try {
      const newEmpresa = await empresa.save();
      return res
        .status(201)
        .json({ message: "Empresa criada com sucesso", empresa: newEmpresa });
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = Object.keys(error.errors).map((field) => ({
          field,
          message: error.errors[field].message,
        }));
        return res.status(400).json({ message: "Erro de validação", errors });
      }
      return res.status(500).json({ message: "Erro ao criar empresa" });
    }
  }

  static async getEmpresas(req, res) {
    try {
      const { search, sortBy = "-createdAt" } = req.query;
      const query = {};

      if (search) {
        // Verifica se a busca é um ObjectId válido
        if (mongoose.Types.ObjectId.isValid(search)) {
          // Busca EXCLUSIVAMENTE por ID se for válido
          query._id = search;
        } else {
          // Busca textual nos outros campos
          const regex = new RegExp(search, "i");
          query.$or = [
            { nome: { $regex: regex } },
            { localizacao: { $regex: regex } },
            { site: { $regex: regex } },
          ];
        }
      }

      const empresas = await Empresa.find(query)
        .populate("empresa")
        .sort(sortBy);

      res.status(200).json({ empresas });
    } catch (error) {
      res.status(500).json({
        message: error.message,
        details: "Erro ao buscar Empresas",
      });
    }
  }

  static async getEmpresaByNome(req, res) {
    const { nome } = req.params;
    if (!nome) {
      return res
        .status(422)
        .json({ message: "Nome da empresa obrigatório na busca" });
    }
    const empresa = await Empresa.findOne({ nome }).sort("-createdAt");
    if (!empresa || empresa.length === 0) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }
    res.status(200).json({ empresa });
  }

  static async updateEmpresa(req, res) {
    const { id } = req.params;
    const logo = req?.files?.logo;

    try {
      const empresa = await Empresa.findById(id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      if (logo) {
        // 2. Verificar se e uma imagem
        if (logo.mimetype !== "image/jpeg" && logo.mimetype !== "image/png") {
          return res
            .status(400)
            .json({ message: "Apenas arquivos de imagem são permitidos." });
        }

        // 3. Configurar caminhos
        const uploadDir = path.join(__dirname, "../public/logos");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 4. Gerar nome único
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileName = `logo-${uniqueSuffix}${path.extname(logo.name)}`;
        const uploadPath = path.join(uploadDir, fileName);

        // 5. Mover arquivo
        await logo.mv(uploadPath);

        // 6. Construir URL
        const fileUrl = `/logos/${fileName}`;

        // 8. Remover arquivo anterior se existir
        if (empresa.logo) {
          const oldFilePath = path.join(uploadDir, path.basename(empresa.logo));
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // 9. Atualizar usuário
        req.body["logo"] = fileUrl;
      }
      const updatedEmpresa = await Empresa.findByIdAndUpdate(
        id,
        {
          ...req.body,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Empresa atualizada com sucesso",
        empresa: updatedEmpresa,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao atualizar empresa", error: error });
    }
  }

  static async uploadLogo(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
    const user = await getUserByToken(token);

    if (!user)
      return res.status(404).json({ message: "Usuário não encontrado" });

    try {
      const empresa = await Empresa.findOne({ user: user._id });
      if (!empresa)
        return res.status(404).json({ message: "Empresa não encontrada" });
      // 1. Verificar se o arquivo foi enviado
      if (!req.files || !req.files.logo) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      const logo = req.files.logo;

      // 2. Verificar se é uma imagem
      if (logo.mimetype !== "image/jpeg" && logo.mimetype !== "image/png") {
        return res
          .status(400)
          .json({ message: "Apenas arquivos de imagem são permitidos." });
      }

      // 3. Configurar caminhos
      const uploadDir = path.join(__dirname, "../public/logos");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 4. Gerar nome único
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileName = `logo-${uniqueSuffix}${path.extname(logo.name)}`;
      const uploadPath = path.join(uploadDir, fileName);

      // 5. Mover arquivo
      await logo.mv(uploadPath);

      // 6. Construir URL
      const fileUrl = `/logos/${fileName}`;

      // 8. Remover arquivo anterior se existir
      if (empresa.logo) {
        const oldFilePath = path.join(uploadDir, path.basename(empresa.logo));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // 9. Atualizar usuário
      empresa.logo = fileUrl;

      await empresa.save();

      // 10. Responder
      return res.status(200).json({
        message: "logo enviada com sucesso!",
        logo: empresa.logo,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao enviar logo", error: error.message });
    }
  }

  static async deleteEmpresa(req, res) {
    const { id } = req.params;
    try {
      const empresa = await Empresa.findByIdAndDelete(id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      return res.status(200).json({ message: "Empresa removida com sucesso" });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao remover empresa" });
    }
  }

  static async getPerfilEmpresa(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = await getUserByToken(token);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Não autorizado: Token inválido ou ausente." });
    }

    try {
      const empresa = await Empresa.findOne({ user: user._id });
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      return res.status(200).json({ empresa });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar empresa" });
    }
  }

  static async getDashboardEmpresa(req, res) {
    try {
      // 1. Identificar o usuário logado
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      const user = await getUserByToken(token);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Não autorizado: Token inválido ou ausente." });
      }

      // 2. Buscar a empresa vinculada ao usuário
      const empresa = await Empresa.findOne({ user: user._id });
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // 3. Buscar todas as vagas dessa empresa
      const vagas = await Vaga.find({ empresa: empresa._id });

      // Estatísticas
      const vagasAtivas = vagas.filter((vaga) => vaga.ativo).length;
      const totalCandidaturas = vagas.reduce(
        (acc, vaga) => acc + (vaga.candidatos?.length || 0),
        0
      );

      const statusContagem = {
        pendente: 0,
        visualizada: 0,
        aprovada: 0,
        rejeitada: 0,
      };

      vagas.forEach((vaga) => {
        vaga.candidatos.forEach((c) => {
          if (statusContagem[c.status] !== undefined) {
            statusContagem[c.status]++;
          }
        });
      });

      // Últimas 3 vagas criadas
      const vagasRecentes = vagas
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map((vaga) => ({
          id: vaga._id,
          titulo: vaga.titulo,
          status: vaga.ativo ? "Ativa" : "Pausada",
          candidatos: vaga.candidatos.length,
          visualizacoes: 0, // Placeholder, se quiser adicionar no futuro
          dataPublicacao: vaga.publicadoEm,
          localizacao: vaga.localizacao,
          modalidade: vaga.modalidade,
        }));

      // Últimas 4 candidaturas de todas as vagas
      let candidaturasRecentes = [];
      for (let vaga of vagas) {
        for (let c of vaga.candidatos) {
          const usuario = await User.findById(c.usuarioId);
          if (usuario) {
            candidaturasRecentes.push({
              id: c._id,
              candidato: usuario.nome,
              vaga: vaga.titulo,
              data: c.dataCandidatura,
              status: c.status,
              foto: usuario.foto || "/placeholder.svg",
            });
          }
        }
      }

      candidaturasRecentes = candidaturasRecentes
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 4);

      // Retorno final
      return res.status(200).json({
        estatisticas: {
          vagasAtivas,
          totalCandidaturas,
          statusContagem,
          // visualizacoesTotal: opcional se for implementado
        },
        vagasRecentes,
        candidaturasRecentes,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao buscar dados do dashboard da empresa" });
    }
  }

  static async getDashboardAdmin(req, res) {
    try {
      // 1. Contadores dos cards
      const totalVagas = await Vaga.countDocuments();
      const totalEmpresas = await Empresa.countDocuments();
      const totalUsuarios = await User.countDocuments({
        tipo: { $in: ["estudante", "empresa"] },
      });

      // 2. Vagas recentes (5 últimas)
      const vagasRecentes = await Vaga.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("empresa");

      const vagasFormatadas = vagasRecentes.map((vaga) => ({
        id: vaga._id,
        titulo: vaga.titulo,
        tipo: vaga.tipoContrato,
        localizacao: `${vaga.localizacao} (${vaga.modalidade})`,
        data: vaga.createdAt,
        empresa: vaga.empresa?.nome || "Não informado",
        status: vaga.ativo ? "Ativa" : "Pausada",
      }));

      // 3. Retornar dados
      return res.status(200).json({
        estatisticas: {
          totalVagas,
          totalEmpresas,
          totalUsuarios,
        },
        vagasRecentes: vagasFormatadas,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Erro ao buscar dados do dashboard admin",
        error: error.message,
      });
    }
  }
}
