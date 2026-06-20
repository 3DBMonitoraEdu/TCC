import db from "../db/index.js"

export function CreateCommand(agent_uuid, command){
     db.prepare("INSERT OR REPLACE INTO command (agent_uuid, command, status) VALUES (?, ?, 1)").run(agent_uuid, command)
     console.log(`comando criado/atualizado agent_uuid: ${agent_uuid} command: ${command}`)
}

export function UpdateCommand(agent_uuid){
     const deleted = db.prepare("DELETE FROM command WHERE agent_uuid = ?").run(agent_uuid)
     if(deleted.changes === 0){
          console.log(`comando não encontrado para deletar agent_uuid: ${agent_uuid}`)
     }
}

export function returnJsonForAgent(agent_uuid){
     const row = db.prepare("SELECT command FROM command WHERE status = 1 AND agent_uuid = ?").get(agent_uuid)
     if(typeof row !== "undefined"){
          return { 
               status: 1,
               command: row.command
          }
     }else{
          return
     }
}

export default { CreateCommand, UpdateCommand, returnJsonForAgent }
