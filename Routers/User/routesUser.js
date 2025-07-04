import { Router } from "express";
import verifyToken from '../../helpers/verify-token.js'
import UserController from "../../controllers/UserController.js";

const routesUser = Router();

routesUser.post("/Register", UserController.register);
routesUser.post("/Login", UserController.login);
routesUser.post("/Update", UserController.update);
routesUser.get("/", UserController.getUsers);
routesUser.get("/Perfil", UserController.perfilByToken);
routesUser.post('/upload-foto', UserController.uploadFoto);
routesUser.post('/upload-curriculo', UserController.uploadCurriculo);
routesUser.delete('/remover-curriculo', UserController.removerCurriculo)
routesUser.post("/Update/:id", UserController.updateByID);
routesUser.get("/:id", UserController.getUserByID);


export default routesUser;
