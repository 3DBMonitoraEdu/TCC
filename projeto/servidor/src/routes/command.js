import { Router } from "express";

import { CreateCommand } from "../services/command.js"


const commandRouter = Router()

commandRouter.post("/createcommand", async (req, res) => {
    const {agent_uuid, command} = req.body
    console.log(`tentando bloquear agent_uuid: ${agent_uuid} command: ${command}`)

    if(!agent_uuid || !command){
        return res.status(400).json({err : "sem agent_uuid/command"})
    }

    try{
        CreateCommand(agent_uuid, command)
        return res.status(200).json({message: "command created"})
    }catch (err){
        return res.status(400).json(err)
    }

})

export default commandRouter