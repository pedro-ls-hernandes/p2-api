import express from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import axios from "axios";
import fileUpload from "express-fileupload";
//importar os routes como no ex abaixo
import routesArtigo from "./Routers/Artigo/routesArtigo.js";
import routesEmpresa from "./Routers/Empresa/routesEmpresa.js";
//import routesSessao from "./Routers/Sessao/routesSessao.js";
import routesUser from "./Routers/User/routesUser.js";
import routesVaga from "./Routers/Vaga/routesVaga.js";
import cookieparser from "cookie-parser";
import routesVagaExterna from "./Routers/VagaExterna/routesVagaExterna.js";

dotenv.config();
const app = new express();

app.use(cookieparser());
// Configuração CORRETA do file-upload
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    useTempFiles: false, // Importante para evitar problemas
    tempFileDir: "/tmp/",
    debug: true, // Habilita logs para depuração
  })
);

//mensagem json
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

//cors frontend
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.use(express.static("public"));
app.use("/artigos", routesArtigo);
app.use("/empresas", routesEmpresa);
//app.use("/sessao", routesSessao);
app.use("/users", routesUser);
app.use("/vagas", routesVaga);
app.use("/vagasExternas", routesVagaExterna);

const task = cron.schedule(
  "0 */4 * * *", // Esta é a alteração para rodar 1 vez por hora (no minuto 0)
  async () => {
    try {
      console.log("Iniciando importação de vagas externas...");
      await axios.post("http://localhost:5000/vagasExternas/ImportarVagas");
      console.log("Vagas externas importadas com sucesso!");
    } catch (error) {
      console.error("Erro ao encontrar novas vagas externas");
    }
  },
  {
    timezone: "America/Sao_Paulo",
  }
);
task.execute();
//usar os routes como no ex abaixo
//app.use("/users", routes);

app.listen(5000);
