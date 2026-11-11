"""현물가 수동 입력.

예)  python3 scripts/add_spot.py --date 2026-11-11 --ddr4 84.1 --ddr5 59.2 --src "dramexchange.com 화면 확인"
"""
import argparse
import datetime as dt

import spotlog

p = argparse.ArgumentParser(description="D램 현물가 한 줄 추가 (data/spot_log.js)")
p.add_argument("--date", default=dt.date.today().isoformat(), help="YYYY-MM-DD (기본: 오늘)")
p.add_argument("--ddr4", type=float, help="DDR4 16Gb 세션 평균 ($)")
p.add_argument("--ddr5", type=float, help="DDR5 16Gb 세션 평균 ($)")
p.add_argument("--src", default="manual", help="출처 URL 또는 메모")
a = p.parse_args()
if a.ddr4 is None and a.ddr5 is None:
    p.error("--ddr4 또는 --ddr5 중 하나는 넣어 주세요.")
dt.date.fromisoformat(a.date)  # 날짜 형식 검사
n = spotlog.append({"d": a.date, "ddr4_16gb": a.ddr4, "ddr5_16gb": a.ddr5, "src": a.src, "how": "manual"})
print(f"추가 완료: {a.date}  (기록 {n}개). 브라우저를 새로고침하세요.")
