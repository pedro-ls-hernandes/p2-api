import {Router} from 'express';
import VagaExternaController from '../../controllers/VagaExternaController.js';

const routesVagaExterna = Router();

routesVagaExterna.get('/', VagaExternaController.getVagasExternas);
routesVagaExterna.get('/ImportarVagas', VagaExternaController.importarVagas);
routesVagaExterna.get('/:titulo', VagaExternaController.getVagaByTitulo);


export default routesVagaExterna;