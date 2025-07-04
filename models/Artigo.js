import mongoose from '../db/conn.js';

const { Schema } = mongoose;
const artigoSchema = new Schema({
    titulo: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    resumo:{
        type: String,
        required: true
    },
    conteudo: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    autor: {
        type: Object,
        required: true
    },
    imagem_capa: {
        type: String
    },
    tags: {
        type: [String]
    },
    cargo_autor: {
        type: String
    },
    status:{
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
}, {timestamps:true});

const Artigo = mongoose.model('Artigo', artigoSchema);
export default Artigo;
