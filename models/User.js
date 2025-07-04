import mongoose from "../db/conn.js";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // Informações básicas
    nome: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    cpf: {
      type: String,
      required: true,
      unique: true,
    },
    telefone: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    foto: {
      type: String,
      default: "https://placehold.co/120x120/EEE/31343C",
    },
    localizacao: {
      type: String,
    },
    dataNascimento: {
      type: Date,
    },
    resumo: {
      type: String,
    },
    // Tipo e status
    tipo: {
      type: String,
      required: true,
      enum: ["estudante", "empresa", "admin"],
      default: "estudante",
    },
    status: {
      type: String,
      required: true,
      enum: ["Ativo", "Inativo", "Pendente"],
      default: "Ativo",
    },

    // Informações acadêmicas
    curso: {
      type: String,
    },
    instituicao_ensino: {
      type: String,
    },
    semestre: {
      type: String,
    },
    previsaoFormatura: {
      type: String,
    },

    // Informações profissionais
    empresa: {
      type: String,
    },
    cargo: {
      type: String,
    },
    experiencia: {
      type: String,
    },

    // Habilidades e idiomas
    habilidades: {
      type: [String],
      default: [],
    },
    idiomas: [
      {
        idioma: String,
        nivel: String,
      },
    ],

    // Experiências profissionais
    experiencias: [
      {
        cargo: String,
        empresa: String,
        periodo: String,
        descricao: String,
      },
    ],

    // Educação
    educacao: [
      {
        curso: String,
        instituicao: String,
        periodo: String,
        status: String,
      },
    ],

    // Certificações
    certificacoes: [
      {
        nome: String,
        emissor: String,
        data: String,
        credencial: String,
      },
    ],

    // Links e portfólio
    github: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    sobre: {
      type: String,
    },
    portifolio: {
      type: String,
    },
    curriculo: {
      nome: String,
      tamanho: String,
      dataUpload: Date,
      url: String,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
