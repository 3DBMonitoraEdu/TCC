import { Hono } from "hono";
import { AppVariables, CreateRoomBody } from "../types/app";
import { createRoom, getRoomsByTeacher, getRoomAgents, deleteRoom } from "../services/rooms";



const rooms = new Hono<{ Variables: AppVariables }>();


rooms.post("/", async (c) => {
	const { name } = await c.req.json() as CreateRoomBody;
	const teacher = c.get("user");



	if (!name) return c.json({ error: true, message: "name obrigatorio" }, 400);

	const data = await createRoom(teacher.schoolId!, teacher.id, name);

	if (data.error) return c.json(data, 505);

	return c.json(data, 201);
});

rooms.get("/", async (c) => {

	const teacher = c.get("user");

	const data = await getRoomsByTeacher(teacher.id);

	if (data.error) return c.json(data, 505);

	return c.json(data);
});

rooms.get("/:id/agents",async (c) => {
	const teacher = c.get("user");
	const roomId = c.req.param("id");

	const data = await getRoomAgents(roomId, teacher.id);

	if (data.error) return c.json(data, 404);


	return c.json(data);
});

rooms.delete("/:id", async (c) => {
	const roomId = c.req.param("id");
	const teacher = c.get("user");

	const data = await deleteRoom(roomId, teacher.id);

	if (data.error) return c.json(data, 401);

	return c.json(data);
});



export default rooms;
