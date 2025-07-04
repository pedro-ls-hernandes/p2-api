import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getUserByToken = async (token) => {
  if (!token) {
    return null; // Retorna null se não houver token
  }

  try {
    const decode = jwt.verify(token, "meusegredo");
    const userid = decode.id;
    const user = await User.findOne({ _id: userid });
    return user;
  } catch (error) {
    // Loga o erro de verificação do JWT, mas não envia resposta HTTP aqui
    console.error("Erro na verificação do token JWT:", error.message);
    return null; // Retorna null em caso de token inválido ou erro
  }
};

export default getUserByToken;
