import { Router } from "express";
import EmpresaController from "../../controllers/EmpresaController.js";

const routesEmpresa = Router();

routesEmpresa.get("/", EmpresaController.getEmpresas);
routesEmpresa.post("/CadastrarEmpresa", EmpresaController.createEmpresa);
routesEmpresa.get("/DashboardEmpresa", EmpresaController.getDashboardEmpresa);
routesEmpresa.get("/DashboardAdmin", EmpresaController.getDashboardAdmin);
routesEmpresa.get("/EmpresaPerfil/", EmpresaController.getPerfilEmpresa);
routesEmpresa.post("/upload-logo", EmpresaController.uploadLogo);
routesEmpresa.post("/EditarEmpresa/:id", EmpresaController.updateEmpresa);
routesEmpresa.get("/:nome", EmpresaController.getEmpresaByNome);
routesEmpresa.delete("/:id", EmpresaController.deleteEmpresa);

export default routesEmpresa;
