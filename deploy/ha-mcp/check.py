"""Check the private MCP connection, or call one named tool using JSON arguments."""
import argparse
import json
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:18086/mcp')
parser.add_argument('--tool')
parser.add_argument('--describe')
parser.add_argument('--arguments', default='{}')
args = parser.parse_args()
headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
sequence = 0

def request(method, params, notification=False):
    global sequence
    sequence += 1
    payload = {'jsonrpc': '2.0', 'method': method, 'params': params}
    if not notification:
        payload['id'] = sequence
    req = urllib.request.Request(args.url, data=json.dumps(payload).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=60) as response:
        session = response.headers.get('Mcp-Session-Id')
        if session:
            headers['Mcp-Session-Id'] = session
        if notification:
            return None
        if 'text/event-stream' in response.headers.get('Content-Type', ''):
            for line in response:
                if not line.startswith(b'data:'):
                    continue
                message = json.loads(line[5:])
                if message.get('id') == sequence:
                    break
            else:
                raise RuntimeError('MCP response missing')
        else:
            message = json.load(response)
    if 'error' in message:
        raise RuntimeError(message['error'])
    return message['result']

initialized = request('initialize', {'protocolVersion': '2025-03-26',
    'capabilities': {}, 'clientInfo': {'name': 'room-ha-check', 'version': '1.0'}})
headers['MCP-Protocol-Version'] = initialized['protocolVersion']
request('notifications/initialized', {}, notification=True)
if args.tool:
    result = request('tools/call', {'name': args.tool, 'arguments': json.loads(args.arguments)})
else:
    result = {'server': initialized['serverInfo'], 'tools': []}
    params = {}
    while True:
        page = request('tools/list', params)
        result['tools'].extend(t if args.describe else {'name': t['name']}
            for t in page['tools'] if not args.describe or t['name'] == args.describe)
        if not page.get('nextCursor'):
            break
        params = {'cursor': page['nextCursor']}
print(json.dumps(result, ensure_ascii=False, indent=2))
if args.tool and result.get('isError'):
    raise SystemExit(1)
