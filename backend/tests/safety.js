if (!process.env.MONGO_URI) {
	throw new Error("❌ SAFETY STOP: MONGO_URI is not set!");
}

if (!process.env.MONGO_URI.includes("testdb")) {
	throw new Error("❌ SAFETY STOP: Not using test database!");
}