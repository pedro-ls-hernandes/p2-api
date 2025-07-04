//Armazenamento de tokens de refresh
import mongoose from '../db/conn.js';

const { Schema } = mongoose;
const sessaoSchema = new Schema({
    user: {
        type: Object,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // O token expira após 30 dias
    }
});

const Sessao = mongoose.model('Sessao', sessaoSchema);
export default Sessao;
