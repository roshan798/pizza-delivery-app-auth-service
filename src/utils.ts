// examle method to get the current date and time
export function getCurrentDateTime(): string {
	const now = new Date();
	return now.toISOString();
}
