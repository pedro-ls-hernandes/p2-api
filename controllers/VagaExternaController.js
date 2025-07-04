import Empresa from "../models/Empresa.js";
import VagaExterna from "../models/VagaExterna.js";
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import axios from "axios";
import * as cheerio from "cheerio";
import NodeCache from "node-cache";
import puppeteer from "puppeteer";

const cache = new NodeCache({ stdTTL: 3600 }); // Cache de 1 hora

export default class VagaExternaController {
  static async importarVagas(req, res) {
    try {
      const key_api = process.env.JSEARCH_API_KEY;
      const response = await axios.get(
        "https://jsearch.p.rapidapi.com/search",
        {
          headers: {
            "x-rapidapi-key": key_api,
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
          params: {
            query: req.query.query || "desenvolvedor",
            num_pages: req.query.num_pages || "20",
            country: req.query.country || "br",
            date_posted: "all",
            employment_types: "INTERN",
          },
        }
      );

      const vagas = response.data.data;
      const vagasExternas = [];

      for (const vaga of vagas) {
        const novaVaga = new VagaExterna({
          id_: vaga.job_id,
          titulo: vaga.job_title,
          descricao: vaga.job_description,
          responsabilidades: vaga.job_responsibilities
            ? vaga.job_responsibilities
            : "Não informado",
          requisitos: vaga.job_requirements
            ? vaga.job_requirements
            : "Não informado",
          beneficios: vaga.job_benefits ? vaga.job_benefits : "Não informado",
          modalidade: vaga.job_is_remote ? "Remoto" : "Presencial",
          responsabilidades: vaga.job_responsibilities
            ? vaga.job_responsibilities
            : "Não informado",
          tipoContrato: "Estágio", //esses dois estão fixos como estagio por padrão da query e por ser o foco do projeto
          nivel: "Estagiário",
          salario: vaga.job_salary ? vaga.job_salary : "Não informado",
          vagasDisponiveis: vaga.num_available_positions
            ? vaga.num_available_positions
            : 1,
          localizacao: vaga.job_city
            ? vaga.job_city
            : "Não informado" + ", " + vaga.job_location,
          empresa: vaga.employer_name,
          email_contato: vaga.job_apply_email
            ? vaga.job_apply_email
            : "Não informado",
          publicadoEm: vaga.job_posted_at
            ? new Date(vaga.job_posted_at)
            : new Date(),
          link_candidatura: vaga.job_apply_link, // Link para candidatura
          url: vaga.employer_website, // Link para o site da empresa
        });

        // Verifica se a vaga já existe no banco de dados
        const id = novaVaga.id_;
        console.log("Tentando encontrar vaga com id_:", id); // Log 1
        const verificacao = await VagaExterna.findOne({ id_: id });
        console.log(
          "Resultado da verificação para id_ " + id + ":",
          verificacao ? "Encontrada" : "Não encontrada"
        ); // Log 2

        if (!verificacao) {
          await novaVaga.save();
          vagasExternas.push(novaVaga);
        }
      }
      if (vagasExternas.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhuma vaga nova encontrada para importar" });
      } else {
        res.status(200).json({
          message: "Vagas importadas com sucesso",
          vagas: vagasExternas,
        });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erro ao importar vagas", error: error.message });
    }
  }

  static async getVagasExternas(req, res) {
    try {
      const {
        search,
        modalidade,
        tipoContrato,
        nivel,
        empresa,
        localizacao,
        sortBy = "-createdAt",
      } = req.query;

      // Construir query dinâmica
      const query = {};

      // Busca textual (case-insensitive)
      if (search) {
        const regex = new RegExp(search, "i");
        query.$or = [
          { titulo: { $regex: regex } },
          { descricao: { $regex: regex } },
          { responsabilidades: { $regex: regex } },
          { requisitos: { $regex: regex } },
          { beneficios: { $regex: regex } },
          { empresa: { $regex: regex } }, // Busca no nome da empresa populada
        ];
      }

      // Filtros exatos
      if (modalidade) query.modalidade = modalidade;
      if (tipoContrato) query.tipoContrato = tipoContrato;
      if (nivel) query.nivel = nivel;
      if (localizacao) {
        query.localizacao = new RegExp(localizacao, "i");
      }

      // Filtro por empresa (ID ou nome)
      if (empresa) {
        query.empresa = new RegExp(empresa, "i");
      }

      // Executar query
      const vagas = await VagaExterna.find(query).sort(sortBy);

      res.status(200).json({ vagas });
    } catch (error) {
      res.status(500).json({
        message: error.message,
        details: "Erro ao buscar vagas",
      });
    }
  }

  static async getVagaByTitulo(req, res) {
    try {
      const { titulo } = req.params;
      console.log(titulo);
      if (!titulo) {
        return res.status(422).json({ message: "Nome da vaga obrigatório" });
      }
      const vaga = await VagaExterna.findOne({ titulo })
        .sort("-createdAt");
      if (!vaga || vaga.length === 0) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      res.status(200).json({ vaga });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteVaga(req, res) {
    const id = req.params.id;
    try {
      const vaga = await VagaExterna.findByIdAndDelete(id);
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      return res.status(200).json({ message: "Vaga removida com sucesso" });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao remover vaga" });
    }
  }

  static async addCandidato(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
    const user = await getUserByToken(token);
    const vagaId = req.params.id; //id da vaga
    if (!user) {
      return res.status(422).json({ message: "Usuário não logado" });
    }

    // Primeiro verifica se a vaga existe
    const vaga = await VagaExterna.findById(vagaId);
    if (!vaga) {
      return res.status(404).json({ message: "Vaga não encontrada" });
    }

    const jaCandidato = vaga.candidatos.some(
      (candidato) => candidato.usuarioId.toString() === user._id.toString()
    );

    if (jaCandidato) {
      return res
        .status(409)
        .json({ message: "Usuário já se candidatou a esta vaga" });
    }

    try {
      const addingUser = await VagaExterna.findByIdAndUpdate(
        vagaId,
        {
          $addToSet: {
            candidatos: {
              usuarioId: user._id,
              cartaApresentacao: req.body.cartaApresentacao || "",
            },
          },
        },
        { new: true }
      );
      return res.status(200).json({
        message: "Usuário adicionado à vaga com sucesso",
        vaga: addingUser,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao adicionar usuário à vaga", error: error });
    }
  }

  static async getCandidatos(req, res) {
    const vaga = req.params.id;
    if (!vaga) {
      return res.status(422).json({ message: "Vaga não encontrada" });
    }
    try {
      const listaCandidatos = await VagaExterna.findById(vaga).select(
        "candidatos"
      );
      return res.status(200).json({ listaCandidatos });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao obter candidatos da vaga" });
    }
  }
}
