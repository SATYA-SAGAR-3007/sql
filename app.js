const express = require('express')

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const path = require('path')

const app = express()

app.use(express.json())

const playersToJson = res => ({
  playerId: res.player_id,
  playerName: res.player_name,
})

const matchToJson = res => ({
  matchId: res.match_id,
  match: res.match,
  year: res.year,
})

const scoreToJson = res => ({
  playerMatchId: res.player_match_id,
  playerId: res.player_id,
  matchId: res.match_id,
  score: res.score,
  fours: res.fours,
  sixes: res.sixes,
})

let db

const initializeTheServer = async () => {
  try {
    const dbPath = path.join(__dirname, 'cricket.db')
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('The Server Started at http://localhost:3000'),
    )
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
}

initializeTheServer()

app.get('/players/', async (req, res) => {
  try {
    const dbQuery = `select * from player_details`
    const dbRes = await db.all(dbQuery)
    res.send(dbRes.map(playersToJson))
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})

app.get('/players/:playerId/', async (req, res) => {
  try {
    const {playerId} = req.params
    const dbQuery = `select * from player_details where player_id = ${playerId}`
    const dbRes = await db.get(dbQuery)
    res.send(playersToJson(dbRes))
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})

app.put('/players/:playerId/', async (req, res) => {
  try {
    const {playerId} = req.params
    const {playerName} = req.body
    const dbQuery = `update player_details set player_name = '${playerName}' where player_id = ${playerId}`
    const dbRes = await db.run(dbQuery)
    res.send('Player Details Updated')
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})

app.get('/matches/:matchId/', async (req, res) => {
  try {
    const {matchId} = req.params
    const dbQuery = `select * from match_details where match_id = ${matchId}`
    const dbRes = await db.get(dbQuery)
    res.send(matchToJson(dbRes))
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})

app.get('/players/:playerId/matches', async (req, res) => {
  try {
    const {playerId} = req.params
    const dbQuery = `
            select 
                m.match_id, m.match, m.year 
            from 
                match_details m join player_match_score pm on m.match_id = pm.match_id
                join player_details p on p.player_id = pm.player_id 
            where 
                p.player_id = ${playerId}
        `
    const dbRes = await db.all(dbQuery)
    res.send(dbRes.map(matchToJson))
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})

app.get('/matches/:matchId/players/', async (req, res) => {
  try {
    const {matchId} = req.params
    const dbQuery = `
            select 
                p.player_id, p.player_name 
            from 
                match_details m join player_match_score pm on m.match_id = pm.match_id
                join player_details p on p.player_id = pm.player_id 
            where 
                m.match_id = ${matchId}
        `
    const dbRes = await db.all(dbQuery)
    res.send(dbRes.map(playersToJson))
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})

app.get('/players/:playerId/playerScores/', async (req, res) => {
  try {
    const {playerId} = req.params
    const dbQuery = `
            select 
                p.player_id, p.player_name, sum(pm.score) as totalScore, sum(pm.fours) as totalFours, sum(pm.sixes) as totalSixes
            from 
                match_details m join player_match_score pm on m.match_id = pm.match_id
                join player_details p on p.player_id = pm.player_id 
            where 
                p.player_id = ${playerId}
        `
    const dbRes = await db.get(dbQuery)
    res.send({
      playerId: dbRes.player_id,
      playerName: dbRes.player_name,
      totalScore: dbRes.totalScore,
      totalFours: dbRes.totalFours,
      totalSixes: dbRes.totalSixes,
    })
  } catch (e) {
    console.error(`DB Error : ${e.message}`)
  }
})