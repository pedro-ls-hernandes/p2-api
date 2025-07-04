import Empresa from "../models/Empresa.js";
import Vaga from "../models/Vaga.js";
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

export default class VagaController {
  static async createVaga(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = await getUserByToken(token);

    try {
      // Verifica se a empresa existe, caso seja um usuario do tipo empresa, ele captura o id da empresa automaticamente pelo token
      const empresa =
        user.tipo === "empresa"
          ? await Empresa.findOne({ user: user._id })
          : await Empresa.findById(req.body.empresa);

      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      req.body["empresa"] = empresa._id;

      // Cria a vaga
      const vaga = new Vaga(req.body);
      const savedVaga = await vaga.save();

      // Atualiza a empresa com a nova vaga
      await Empresa.findByIdAndUpdate(
        req.body.empresa,
        { $push: { vagas: savedVaga._id } },
        { new: true }
      );

      res.status(201).json(savedVaga);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getVagas(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = await getUserByToken(token);

    const empresaSelected =
      user?.tipo === "empresa"
        ? await Empresa.findOne({ user: user._id })
        : null;

    try {
      let {
        search,
        modalidade,
        tipoContrato,
        nivel,
        empresa,
        localizacao,
        sortBy = "-createdAt",
      } = req.query;

      if (empresaSelected) empresa = empresaSelected.nome;

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
          { "empresa.nome": { $regex: regex } }, // Busca no nome da empresa populada
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
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(empresa);

        if (isObjectId) {
          query.empresa = empresa;
        } else {
          // Busca por nome da empresa usando lookup
          const empresas = await Empresa.find({
            nome: new RegExp(empresa, "i"),
          });
          query.empresa = { $in: empresas.map((e) => e._id) };
        }
      }

      // Executar query
      const vagas = await Vaga.find(query).populate("empresa").sort(sortBy);

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
      const vaga = await Vaga.findOne({ titulo })
        .populate("empresa")
        .sort("-createdAt");
      if (!vaga || vaga.length === 0) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      res.status(200).json({ vaga });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateVaga(req, res) {
    const id = req.params.id;

    try {
      const vaga = await Vaga.findById(id);
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }

      const updatedVaga = await Vaga.findByIdAndUpdate(
        id,
        {
          ...req.body,
        },
        { new: true }
      );

      return res
        .status(200)
        .json({ message: "Vaga atualizada com sucesso", vaga: updatedVaga });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar vaga" });
    }
  }

  static async deleteVaga(req, res) {
    const id = req.params.id;
    try {
      const vaga = await Vaga.findByIdAndDelete(id);
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
    const vaga = await Vaga.findById(vagaId);
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
      const addingUser = await Vaga.findByIdAndUpdate(
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
      const candidaturas = await Vaga.findById(vaga).select("candidatos");
      return res.status(200).json({ candidaturas });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao obter candidatos da vaga" });
    }
  }

  static async getCandidaturas(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = await getUserByToken(token);

    if (!user) {
      return res.status(422).json({ message: "Usuário não encontrado" });
    }

    try {
      const candidaturas = await Vaga.aggregate([
        {
          $match: {
            "candidatos.usuarioId": user._id,
          },
        },
        // Filtra e transforma candidatos em um único objeto
        {
          $addFields: {
            minhaCandidatura: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$candidatos",
                    as: "candidato",
                    cond: {
                      $eq: ["$$candidato.usuarioId", user._id],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        // Remove o array original de candidatos
        { $unset: "candidatos" },
        // Join com empresas
        {
          $lookup: {
            from: "empresas",
            localField: "empresa",
            foreignField: "_id",
            as: "empresa",
          },
        },
        {
          $unwind: {
            path: "$empresa",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Projeção final
        {
          $project: {
            _id: 1,
            titulo: 1,
            descricao: 1,
            modalidade: 1,
            localizacao: 1,
            tipoContrato: 1,
            nivel: 1,
            salario: 1,
            minhaCandidatura: 1,
            publicadoEm: 1,
            "empresa.nome": 1,
            "empresa.logo": 1,
            "empresa.localizacao": 1,
            "empresa.descricao": 1,
          },
        },
      ]);

      return res.status(200).json({ candidaturas });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao obter candidaturas",
        error: error.message,
      });
    }
  }

  static async getCandidatosByEmpresa(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = await getUserByToken(token);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Não autorizado: Token inválido ou ausente." });
    }

    let empresaSelected;
    if (user.tipo === "empresa") {
      empresaSelected = await Empresa.findOne({ user: user._id });
    } else if (user.tipo === "admin" && req.params.id) {
      empresaSelected = await Empresa.findById(req.params.id);
    } else {
      return res
        .status(403)
        .json({ message: "Acesso negado ou ID da empresa não fornecido." });
    }

    if (!empresaSelected) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    try {
      // 1. Buscar as vagas da empresa e popular os candidatos (User) e a própria Empresa
      const vagasRaw = await Vaga.find({ empresa: empresaSelected._id })
        // Seleciona todos os campos da vaga para serem incluídos na resposta
        // ou você pode especificar campos como .select('titulo descricao modalidade ... candidatos empresa')
        .populate({
          path: "candidatos.usuarioId",
          model: "User",
          // Seleciona os campos específicos do usuário candidato
          select:
            "nome email telefone localizacao foto tipo instituicao_ensino curso curriculo.url", // Adicionado 'instituicao_ensino' e 'curso' do modelo User
        })
        .populate({
          path: "empresa", // Popula os detalhes da empresa na vaga
          model: "Empresa",
          select: "nome", // Apenas o nome da empresa, se precisar de mais, adicione aqui
        })
        .exec();

      let candidaturasFormatadas = []; // Array para armazenar as candidaturas no formato desejado
      let totalCandidatos = 0; // Contador para o total de candidaturas

      // 2. Processar cada vaga e seus candidatos para reformatar os dados
      vagasRaw.forEach((vaga) => {
        vaga.candidatos.forEach((candidatura) => {
          // Garante que o usuarioId foi populado com sucesso
          if (candidatura.usuarioId) {
            totalCandidatos++; // Incrementa o contador de candidaturas

            candidaturasFormatadas.push({
              id: candidatura._id, // ID da candidatura específica
              candidato: {
                nome: candidatura.usuarioId.nome,
                email: candidatura.usuarioId.email,
                telefone: candidatura.usuarioId.telefone,
                localizacao:
                  candidatura.usuarioId.localizacao || "Não informado", // Adapte conforme seu User.js
                foto:
                  candidatura.usuarioId.foto ||
                  "https://placehold.co/40x40/EEE/31343C", // Use um placeholder padrão se não houver foto
                tipo: candidatura.usuarioId.tipo,
                instituicao:
                  candidatura.usuarioId.instituicao_ensino || "Não informado", // Do campo 'instituicao_ensino' do User
                curso: candidatura.usuarioId.curso || "Não informado", // Do campo 'curso' do User
                // semestre: candidatura.usuarioId.semestre || "Não informado", // Se você tiver um campo 'semestre' no modelo User
                curriculoUrl: candidatura.usuarioId.curriculo?.url || null, // URL do currículo
              },
              vaga: {
                titulo: vaga.titulo,
                id: vaga._id, // ID da vaga
              },
              // Formata a data para 'YYYY-MM-DD'
              dataCandidatura: candidatura.dataCandidatura
                ? candidatura.dataCandidatura.toISOString().split("T")[0]
                : null,
              status: candidatura.status,
              cartaApresentacao: candidatura.cartaApresentacao || "",
            });
          }
        });
      });

      // 3. Enviar a resposta com os dados formatados
      return res.status(200).json({
        message: "Candidaturas obtidas com sucesso",
        totalVagas: vagasRaw.length, // Total de vagas distintas da empresa
        totalCandidatos: totalCandidatos, // Total de candidaturas (uma candidatura = um usuário em uma vaga)
        candidaturas: candidaturasFormatadas, // O array de candidaturas no formato plano
      });
    } catch (error) {
      console.error("Erro ao obter candidaturas por empresa:", error);
      return res.status(500).json({
        message: "Erro interno do servidor ao obter candidaturas.",
        error: error.message,
      });
    }
  }

  static async alterarStatusCandidatura(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = await getUserByToken(token);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Não autorizado: Token inválido ou ausente." });
    }

    let empresaSelected;
    if (user.tipo === "empresa") {
      empresaSelected = await Empresa.findOne({ user: user._id });
    } else {
      return res.status(403).json({ message: "Acesso negado" });
    }

    if (!empresaSelected)
      return res.status(403).json({ message: "Acesso negado" });

    const { vagaId, candidaturaId, status } = req.body;

    //checar se user esta cadastrado na empresa para poder executar esta acao

    try {
      const vaga = await Vaga.findById(vagaId);
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada." });
      }

      const candidatura = vaga.candidatos.find(
        (c) => c._id.toString() === candidaturaId
      );
      if (!candidatura) {
        return res.status(404).json({ message: "Candidatura não encontrada." });
      }

      candidatura.status = status;
      await vaga.save();

      return res.status(200).json({
        message: "Candidatura aprovada com sucesso.",
        candidatura: candidatura,
      });
    } catch (error) {
      console.error("Erro ao aprovar candidatura:", error);
      return res.status(500).json({
        message: "Erro interno do servidor ao aprovar candidatura.",
        error: error.message,
      });
    }
  }
}
