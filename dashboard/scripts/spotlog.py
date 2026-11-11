"""data/spot_log.js 읽기·쓰기 공용 함수."""
import json
import re
from pathlib import Path

LOG = Path(__file__).resolve().parent.parent / "data" / "spot_log.js"
PAT = re.compile(r"/\*SPOT_LOG_START\*/(.*?)/\*SPOT_LOG_END\*/", re.S)


def read():
    m = PAT.search(LOG.read_text(encoding="utf-8"))
    if not m:
        raise SystemExit("spot_log.js 안의 SPOT_LOG_START/END 표시를 찾지 못했습니다.")
    return json.loads(m.group(1) or "[]")


def append(row):
    """같은 날짜가 있으면 교체, 없으면 추가. 날짜순 정렬."""
    rows = [r for r in read() if r.get("d") != row["d"]]
    rows.append(row)
    rows.sort(key=lambda r: r["d"])
    body = "[\n" + ",\n".join("  " + json.dumps(r, ensure_ascii=False) for r in rows) + "\n]"
    text = LOG.read_text(encoding="utf-8")
    text = PAT.sub(lambda _: "/*SPOT_LOG_START*/" + body + "/*SPOT_LOG_END*/", text)
    LOG.write_text(text, encoding="utf-8")
    return len(rows)
