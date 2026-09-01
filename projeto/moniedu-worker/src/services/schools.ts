import { env } from "cloudflare:workers";


async function createSchool(name: string) {
	const school = await env.moniedu
		.prepare("SELECT id FROM schools WHERE name = ? LIMIT 1")
		.bind(name)
		.first();

	if (school) return { error: true, message: "Já existe essa escola" };

	const newSchool = await env.moniedu.prepare("INSERT INTO schools (name) VALUES (?)").bind(name).run();

	return {
		error: false,
		school: {
			id: newSchool.meta.last_row_id,
			name,
		},
	}
}

async function listSchools() {
	const schools = await env.moniedu.prepare("SELECT id, name FROM schools").run();

	return {
		error: false,
		schools: schools.results
	}
}



export {
	createSchool,
	listSchools
}
