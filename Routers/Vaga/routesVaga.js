import {Router} from 'express';
import verifyToken from '../../helpers/verify-token.js'
import VagaController from '../../controllers/VagaController.js';

const routesVaga = Router();

routesVaga.post('/CadastrarVaga', VagaController.createVaga);
routesVaga.get('/', VagaController.getVagas);
routesVaga.get('/Candidaturas', VagaController.getCandidaturas);
routesVaga.get('/CandidatosByEmpresa/', VagaController.getCandidatosByEmpresa);
routesVaga.put('/AlterarStatusCandidatura/', VagaController.alterarStatusCandidatura);
routesVaga.post('/EditarVaga/:id', VagaController.updateVaga);
routesVaga.post('/CandidatarVaga/:id', VagaController.addCandidato);
routesVaga.get('/Candidatos/:id', verifyToken, VagaController.getCandidatos);
routesVaga.get('/:titulo', VagaController.getVagaByTitulo);
routesVaga.delete('/:id', VagaController.deleteVaga);


export default routesVaga;