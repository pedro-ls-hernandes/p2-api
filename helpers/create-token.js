import { strict } from "assert";
import jwt from "jsonwebtoken";
import { promisify } from "util";
const signAsync = promisify(jwt.sign);
const createUserToken = async (user, req, res) => {
  try {
    const token = await signAsync(
      {
        name: user.name,
        id: user._id,
      },
      process.env.JWT_SECRET || "meusegredo"
      //{expiresIn:"1h"}
    );
    res.cookie("token", token, {
      httpOnly: true, //evita que scripts maliciosos rodem e consumam os cookies
      secure: false,
      sameSite: "Strict", //permite que todas as ações serão feitas com segurança
      maxAge: 3600000,
    });
    // Remover senha do objeto retornado
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.status(200).json({
      //tirar depois
      message: "Você está logado",
      token: token,
      userId: user._id,
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao gerar token", error });
  }
};
export default createUserToken;
