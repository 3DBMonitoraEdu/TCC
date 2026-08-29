export const TRUSTED_ORIGINS = [
	"http://127.0.0.1:8080",
	"https://monitoraedu.vercel.app",
];

const TRUSTED_ORIGIN_SET = new Set(TRUSTED_ORIGINS);

export function isTrustedOrigin(origin: string) {
	return TRUSTED_ORIGIN_SET.has(origin);
}
