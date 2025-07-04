import mongoose from "../db/conn.js";
import Empresa from "./Empresa.js"; // Importe o modelo Empresa

const { Schema } = mongoose;

const candidatoSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  dataCandidatura: {
    type: Date,
    default: Date.now,
  },
  cartaApresentacao: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pendente", "visualizada", "aprovada", "rejeitada"],
    default: "pendente",
  },
});

const vagaExternaSchema = new Schema(
  {
    id_: {
      type: String,
      required: true,
      unique: true,
    }, // <-- ESSENCIAL!

    titulo: {
      type: String,
      required: true,
    },
    descricao: {
      type: String,
      required: true,
    },
    responsabilidades: {
      type: [String],
    },
    requisitos: {
      type: [String],
      required: true,
    },
    diferenciais: {
      type: [String],
      default: [],
    },
    beneficios: {
      type: [String],
    },
    modalidade: {
      type: String,
      required: true,
    },
    localizacao: {
      type: String,
      required: true,
    },
    tipoContrato: {
      type: String,
      enum: ["CLT", "PJ", "Estágio", "Freelance"],
      required: true,
    },
    nivel: {
      type: String,
      enum: ["Júnior", "Pleno", "Sênior", "Estagiário"],
      required: true,
    },
    salario: {
      type: String,
      required: true,
    },
    vagasDisponiveis: {
      type: Number,
    },
    empresa: {
      type: String, // String pois só vem o nome da empresa da api
      ref: "Empresa", // Deve ser igual ao nome do modelo
      required: true,
    },
    email_contato: {
      type: String,
      /*match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, informe um e-mail válido",
      ],*/
    },
    link_candidatura: {
      type: String,
      required: true,
    },
    candidatos: {
      type: [candidatoSchema],
      default: [],
    },
    publicadoEm: {
      type: String,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const VagaExterna = mongoose.model("VagaExterna", vagaExternaSchema);
export default VagaExterna;
