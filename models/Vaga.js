import mongoose from "../db/conn.js";

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

const vagaSchema = new Schema(
  {
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
      required: true,
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
      required: true,
    },
    modalidade: {
      type: String,
      enum: ["Presencial", "Remoto", "Híbrido"],
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
      required: true,
      min: 1,
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: "Empresa", // Deve ser igual ao nome do modelo
      required: true,
    },
    email_contato: {
      type: String,
      required: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, informe um e-mail válido",
      ],
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
      type: Date,
      default: Date.now,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Vaga = mongoose.model("Vaga", vagaSchema);
export default Vaga;
