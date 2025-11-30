module.exports = {
	apps: [
		{
			name: "buildplanner",
			script: "npm",
			args: "start",
			cwd: "/home/heimse/build/buildplanner", // project path on the server
			env: {
				NODE_ENV: "production",
				// add other env vars here
			},
			// PM2 will restart the app if it crashes
			instances: 1,
			exec_mode: "fork",
			// Logging
			error_file: "./logs/pm2-error.log",
			out_file: "./logs/pm2-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			// Auto restart settings
			watch: false,
			max_memory_restart: "1G",
			// Graceful shutdown
			kill_timeout: 5000,
			wait_ready: true,
			listen_timeout: 10000,
		},
	],
};
