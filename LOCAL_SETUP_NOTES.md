# Local TAK Server MCP Setup Notes

## What I set up

- Cloned `https://github.com/jfuginay/tak-server-mcp` into `/Users/zeus/tools/tak-server-mcp`
- Installed dependencies with `npm install`
- Added a local `config.json` that points the MCP server at:
  - `https://152.42.155.95:8443`
  - client cert: `/tmp/ac.pem`
  - client key: `/tmp/ak.pem`
  - SSL verification disabled for the self-signed TAK cert (`verifySsl: false`)
- Fixed the project so it builds cleanly with `npm run build`
- Verified the MCP server starts in stdio mode and answers a real tool call

## Local code changes made

### 1) Fixed config precedence for SSL verification
`src/config/index.ts` originally ignored `config.json` for `verifySsl` and always defaulted to `true` unless the environment variable was set to `false`.

I changed it so the file value is honored when the env var is absent.

### 2) Made stdio transport safe for MCP
`src/index.ts` was logging to stdout, which can interfere with MCP stdio.

I redirected pretty logs to stderr (`destination: 2`). I made the same stderr-safe logging change in the HTTP/SSE transport loggers.

### 3) Fixed TypeScript build issues
- Excluded `src/demo/**/*` from `tsconfig.json`
- Replaced SDK type imports that no longer exist in the installed MCP SDK version
- Cast the internal `handleRequest` access to `any` in the HTTP/SSE transports
- Fixed the SSE cleanup timer type

### 4) Added missing tool implementations
The registry imported tools that were not present in the repo:
- `src/tools/missions/get-missions.ts`
- `src/tools/data-packages/manage-data-packages.ts`

These are now implemented locally so the build succeeds and the server exposes the expected tool names.

## Local config file

`config.json` contains:

- TAK server URL: `https://152.42.155.95:8443`
- Client cert/key: `/tmp/ac.pem` and `/tmp/ak.pem`
- `verifySsl: false`
- MCP transport: `stdio`
- Enabled tools:
  - `tak_get_cot_events`
  - `tak_get_entities`
  - `tak_send_cot_event`
  - `tak_spatial_query`
  - `tak_create_geofence`
  - `tak_get_missions`
  - `tak_send_emergency`
  - `tak_get_alerts`
  - `tak_manage_data_packages`

## Verification performed

### TAK API connectivity
Confirmed the TAK server responds to the admin cert with:

```bash
curl -sk --cert /tmp/ac.pem --key /tmp/ak.pem \
  https://152.42.155.95:8443/Marti/api/version
```

Result:
- `5.7-RELEASE-43-HEAD`

### MCP server build

```bash
npm run build
```

Result: success

### MCP tool call

I used the MCP SDK client to spawn the local server in stdio mode and called:

- `tak_get_missions`

It connected successfully and returned a valid response from the TAK server.

## Re-run instructions

From `/Users/zeus/tools/tak-server-mcp`:

```bash
npm install
npm run build
```

Make sure these files exist on the machine:

- `/tmp/ac.pem`
- `/tmp/ak.pem`
- `config.json`

Then use stdio MCP clients with:

- command: `node`
- args: `/Users/zeus/tools/tak-server-mcp/dist/index.js`
- env: `TAK_MCP_CONFIG=/Users/zeus/tools/tak-server-mcp/config.json`

## Notes for Legacy / Hermes

For a NATS-native agent framework, the cleanest setup is to run the MCP server in stdio mode and let the agent framework spawn it as a subprocess. The enabled tools now cover the requested TAK workflows:

- spatial queries
- entity lookup
- geofence creation
- CoT send/query
- mission lookup
- emergency broadcasts

