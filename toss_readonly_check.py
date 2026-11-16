"""토스증권 Open API 조회 전용 테스트 (주문 기능 없음).

- 표준 라이브러리만 사용 (pip 설치 불필요, Python 3.8+)
- 키는 환경 변수에서 읽고, 화면에 출력하지 않음
  TOSS_CLIENT_ID / TOSS_CLIENT_SECRET (없으면 client_id / client_secret)
- 호출 가능한 경로를 토큰 발급 + 현재가 + 캔들 조회로 고정 (주문 경로는 코드 레벨에서 차단)

사용법:  python toss_readonly_check.py [종목코드]   (기본 416180 신성에스티)
"""
import gzip
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://openapi.tossinvest.com"
ALLOWED = {("POST", "/oauth2/token"), ("GET", "/api/v1/prices"), ("GET", "/api/v1/candles")}


def env(*names):
    for n in names:
        v = os.environ.get(n)
        if v:
            return v
    sys.exit(f"환경 변수가 없습니다: {' 또는 '.join(names)}")


def call(method, path, token=None, query=None, form=None):
    if (method, path) not in ALLOWED:
        raise PermissionError(f"조회 전용 스크립트: {method} {path} 차단")
    url = BASE + path + ("?" + urllib.parse.urlencode(query) if query else "")
    headers = {"Accept": "application/json"}
    body = None
    if token:
        headers["Authorization"] = "Bearer " + token
    if form:
        body = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw, status = r.read(), r.status
    except urllib.error.HTTPError as e:
        raw, status = e.read(), e.code
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    text = raw.decode("utf-8", "replace")
    try:
        return status, json.loads(text)
    except json.JSONDecodeError:
        return status, text


def main():
    symbol = sys.argv[1] if len(sys.argv) > 1 else "416180"

    st, tok = call("POST", "/oauth2/token", form={
        "grant_type": "client_credentials",
        "client_id": env("TOSS_CLIENT_ID", "client_id"),
        "client_secret": env("TOSS_CLIENT_SECRET", "client_secret"),
    })
    if st != 200:
        sys.exit(f"[토큰 실패] HTTP {st}: {tok}")
    token = tok["access_token"]
    print(f"[토큰 OK] expires_in={tok.get('expires_in')}")

    st, p = call("GET", "/api/v1/prices", token, {"symbols": symbol})
    if st != 200:
        print(f"[현재가 실패] HTTP {st}: {p}")
    else:
        for it in p["result"]:
            print(f"[현재가] {it['symbol']}  {int(float(it['lastPrice'])):,} {it['currency']}  ({it.get('timestamp')})")

    st, c = call("GET", "/api/v1/candles", token, {"symbol": symbol, "interval": "1d", "count": 10})
    if st != 200:
        print(f"[일봉 실패] HTTP {st}: {c}")
        return
    print("[최근 일봉 10개]  날짜        시가      고가      저가      종가        거래량")
    for k in c["result"]["candles"]:
        f = lambda key: int(float(k[key]))
        print(f"                 {k['timestamp'][:10]}  {f('openPrice'):>8,}  {f('highPrice'):>8,}  "
              f"{f('lowPrice'):>8,}  {f('closePrice'):>8,}  {f('volume'):>12,}")


if __name__ == "__main__":
    main()
