import { Hono } from "hono";
import type { CreateSchoolBody } from "../types/app";
import { createSchool, listSchools } from "../services/schools";


const schools = new Hono();



schools.post("/create",async (c) => {
	const body = await c.req.json() as CreateSchoolBody;

	if (!body.name) return c.json({ error: true, message: "n tem o nome" }, 400);

	const school = await createSchool(body.name);

	if(school.error) return c.json(school, 505);
	return c.json(school);
});


schools.get("/", async (c) => {

	const schools = await listSchools();

	if (schools.error) return c.json(schools, 505);

	return c.json(schools);
});



export default schools;
