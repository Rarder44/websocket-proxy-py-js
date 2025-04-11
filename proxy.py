import aiohttp
import asyncio
import base64
import json
import websockets

HOST = "localhost"
PORT = 8765

async def fetch(session, req):
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "*/*", "Connection": "keep-alive"}
    try:
        method = req.get("method", "GET").upper()
        url = req["url"]
        params = req.get("params", {})
        data = req.get("data", {})

        async with session.request(
            method, url, params=params, data=data, headers=headers
        ) as resp:
            raw = await resp.read()
            encoded = base64.b64encode(raw).decode("utf-8")
            return {
                "status": resp.status,
                "headers": dict(resp.headers),
                "body": encoded,
                "is_base64": True,
            }

    except Exception as e:
        return json.dumps({"error": str(e)})


async def handler(websocket):
    async with aiohttp.ClientSession() as session:
        async for message in websocket:
            req = json.loads(message)
            response = await fetch(session, req)
            await websocket.send(json.dumps(response))


async def main():
    async with websockets.serve(handler, HOST, PORT):
        print(f"WebSocket proxy server started on ws://{HOST}:{PORT}")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
