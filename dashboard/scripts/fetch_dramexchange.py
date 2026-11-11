"""D램익스체인지 공개 현물가 페이지를 하루 한 번 읽어 data/spot_log.js 에 추가합니다.

지키는 원칙
  1) robots.txt 가 막으면 읽지 않습니다.
  2) 처음 실행할 때 이용약관을 직접 읽고 동의했다는 표시(--i-read-terms)가 있어야 동작합니다.
     (자동 수집·재배포를 금지하는 조항이 있으면 이 스크립트를 쓰지 말고 add_spot.py 수동 입력을 쓰세요.)
  3) 하루 1회만 요청합니다. 같은 날 기록이 이미 있으면 요청하지 않습니다.
  4) 403/429, 로그인·캡차 요구, 표 구조 변경 등으로 막히면 우회하지 않고 멈춥니다 → 수동 입력으로 전환.

실행)  python3 scripts/fetch_dramexchange.py            (dashboard 폴더에서)
"""
import argparse
import datetime as dt
import sys
import urllib.error
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path

import spotlog

URL = "https://www.dramexchange.com/"
UA = "personal-dram-dashboard/1.0 (daily, 1 request)"
AGREE = Path(__file__).resolve().parent / ".terms_ok"
TARGETS = {"ddr4_16gb": "DDR4 16Gb", "ddr5_16gb": "DDR5 16Gb"}


class Tables(HTMLParser):
    """페이지 안 모든 표를 [행[칸 텍스트]] 목록으로 모읍니다."""

    def __init__(self):
        super().__init__()
        self.tables, self._row, self._cell, self._in = [], None, None, 0

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables.append([]); self._in += 1
        elif tag == "tr" and self._in:
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(" ".join("".join(self._cell).split())); self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._row and self.tables:
                self.tables[-1].append(self._row)
            self._row = None
        elif tag == "table" and self._in:
            self._in -= 1

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def stop(msg, code=2):
    print("⛔ " + msg)
    print("   → 수동 입력으로 전환하세요:  python3 scripts/add_spot.py --ddr4 값 --ddr5 값 --src \"확인한 곳\"")
    print("     또는 대시보드 3번 섹션의 [현물가 수동 입력] 양식")
    sys.exit(code)


def parse(html):
    t = Tables(); t.feed(html)
    found = {}
    for table in t.tables:
        header = next((r for r in table if any("Session Average" in c or "Average" in c for c in r)), None)
        if not header:
            continue
        col = next(i for i, c in enumerate(header) if "Average" in c)
        for row in table:
            name = row[0] if row else ""
            for key, label in TARGETS.items():
                if key not in found and label.lower() in name.lower() and len(row) > col:
                    try:
                        found[key] = float(row[col].replace(",", ""))
                    except ValueError:
                        pass
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--i-read-terms", action="store_true", help="이용약관을 읽었고 개인 기록용 하루 1회 조회가 허용된다고 판단함")
    a = ap.parse_args()

    if a.i_read_terms:
        AGREE.write_text(dt.date.today().isoformat())
    if not AGREE.exists():
        stop("먼저 https://www.dramexchange.com/ 하단의 이용약관(Terms of Use)을 직접 읽어 주세요.\n"
             "   자동 수집 금지 조항이 없을 때만:  python3 scripts/fetch_dramexchange.py --i-read-terms", 3)

    today = dt.date.today().isoformat()
    if any(r.get("d") == today and r.get("how") == "auto" for r in spotlog.read()):
        print(f"오늘({today}) 기록이 이미 있어 요청하지 않습니다."); return

    rp = urllib.robotparser.RobotFileParser(URL + "robots.txt")
    try:
        rp.read()
    except Exception as e:  # robots.txt 를 못 읽으면 보수적으로 중단
        stop(f"robots.txt 를 읽지 못했습니다({e}).")
    if not rp.can_fetch(UA, URL):
        stop("robots.txt 가 이 페이지의 자동 조회를 허용하지 않습니다.")

    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read().decode(r.headers.get_content_charset() or "utf-8", "replace")
    except urllib.error.HTTPError as e:
        stop(f"사이트가 요청을 거절했습니다(HTTP {e.code}). 우회하지 않습니다.")
    except Exception as e:
        stop(f"접속 실패: {e}")
    if any(w in html.lower() for w in ("captcha", "please log in", "access denied")):
        stop("로그인·캡차 등 접근 제한 화면이 나왔습니다. 우회하지 않습니다.")

    v = parse(html)
    if not v:
        stop("페이지에서 DDR4/DDR5 16Gb 현물가 표를 찾지 못했습니다(사이트 구조 변경 가능).")
    row = {"d": today, "ddr4_16gb": v.get("ddr4_16gb"), "ddr5_16gb": v.get("ddr5_16gb"),
           "src": URL + " (Session Average, 자동)", "how": "auto"}
    n = spotlog.append(row)
    print(f"✅ {today} DDR4 16Gb={row['ddr4_16gb']}  DDR5 16Gb={row['ddr5_16gb']}  (기록 {n}개)")


if __name__ == "__main__":
    main()
