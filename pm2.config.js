module.exports = {
		apps: [
				{
						"name": "auth",
						"script": "./app.js",
						"exec_mode": "fork",
						"timestamp": "MM-DD-YYYY HH:mm Z",
						"log_date_format": "MM-DD-YYYY HH:mm Z",
						"max_memory_restart": "1G",
						"env": {
								"NODE_ENV": "production"
						}
				}
		]
}
