import express from "express"
import pg from "pg"
import router from "./routers/user-route.js"
import cors from "cors"
import {config} from "dotenv"

config()
const { Pool } = pg
const port = 4321
const app = express()

export const pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'sheukete_user_data',
    password: '2007luka2007',
    port: 5432,
})

app.use(cors({
    origin: ['http://localhost:5555', 'http://localhost:3000'],
    credentials: true
}))
app.use(express.json())
app.use(router)

app.listen(port, () => {
    console.log(`postgresql server is listening on port:${port}`)
})