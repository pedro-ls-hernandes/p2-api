import { Router } from "express";
import ArtigoController from "../../controllers/ArtigoController.js";

const routesArtigo = Router();
routesArtigo.get('/', ArtigoController.getArtigos);
routesArtigo.post('/CadastrarArtigo', ArtigoController.createArtigo);
routesArtigo.post('/EditarArtigo/:id', ArtigoController.updateArtigo);
routesArtigo.get('/:titulo', ArtigoController.getArtigoByTitulo);
routesArtigo.delete('/:id', ArtigoController.deleteArtigo);

export default routesArtigo;