import mongoose from "../db/conn.js";

const { Schema } = mongoose;
const empresaSchema = new Schema({
  nome: {
    type: String,
    required: true,
  },
  cnpj: {
    type: String,
    required: true,
  },
  localizacao: {
    type: String,
    required: true,
  },
  email_contato: {
    type: String,
    required: true,
    unique: true,
  },
  descricao: {
    type: String,
  },
  cultura: {
    type: String,
  },
  setor: {
    type: String,
  },
  site: {
    type: String,
  },
  telefone: {
    type: String,
  },
  logo: {
    type: String,
  },
  status: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User", // Referência ao modelo User
  },
  vagas: [
    {
      type: Schema.Types.ObjectId,
      ref: "Vaga", // Referência ao modelo Vaga
    },
  ],
});

const Empresa = mongoose.model("Empresa", empresaSchema);
export default Empresa;

/*
    password: {
        type: String,
        required: true
    },
*/
