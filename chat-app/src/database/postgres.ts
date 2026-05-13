import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()
const {Client} = pg
const connectionString = process.env.POSTGRES_CONNECTION_STRING
export let postgresClient: pg.Client

export async function connectDB() {
    postgresClient = new Client({
        connectionString
    })
    try {
        await postgresClient.connect()
    } catch (error) {
        console.log(`Error connecting to postgres ${error}`)
    }
}

