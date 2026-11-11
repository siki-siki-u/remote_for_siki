# 반도체 선행지표 대시보드

## 여는 법
`dashboard/index.html`을 더블클릭해서 브라우저(크롬·엣지)로 엽니다. 그래프 라이브러리를 인터넷에서 불러오기 때문에 인터넷이 연결돼 있어야 합니다.

## 숫자 고치는 곳 (`data/` 폴더)
| 파일 | 내용 |
|---|---|
| `demand.js` | 1 수요: 빅테크 분기 Capex, 가이던스, FCF, CDS |
| `inventory.js` | 2 재고: 서버·PC 회사 재고, 메모리 콜 표현 |
| `prices.js` / `spot_log.js` | 3 가격: 계약가·현물가 / 매일 쌓이는 현물가 기록 |
| `supply.js` | 4 공급: 메모리 업체 설비투자, 팹 일정 |
| `results.js` | 5 결과: B/G·ASP, 영업이익률 |
| `checklist.js` | 6 점검판: 지표 목록, 가설표 |
| `sources.js` | 출처 목록 (숫자마다 `s:'키'`로 연결) |

값 형식: `{v: 숫자, t: 'official'|'guidance'|'estimate', s: '출처키', n: '메모'}`. 모르면 `null`.

## 분기마다 업데이트 (1·4·7·10월 말 실적 시즌)
1. 실적 발표 뒤 `sources.js`에 출처 한 줄을 추가합니다.
2. `demand.js`의 `quarters`에 새 분기(예: `"26Q4"`)를 넣고, 회사마다 배열 끝에 값을 하나씩 추가합니다. 가이던스가 바뀌었으면 `guidance`에 한 줄 추가합니다.
3. `results.js`, `supply.js`, `inventory.js`도 같은 방식으로 넣습니다.
4. 브라우저를 새로고침하면 점검판 상태가 자동으로 다시 판정됩니다.

## 현물가 매일 기록
- 수동 입력: `python3 scripts/add_spot.py --ddr4 84.1 --ddr5 59.2 --src "확인한 곳"`
- 자동 기록: D램익스체인지 이용약관을 직접 읽고 자동 조회가 허용될 때만 `python3 scripts/fetch_dramexchange.py --i-read-terms`를 한 번 실행하고, 이후 하루 한 번 `python3 scripts/fetch_dramexchange.py`를 돌립니다. robots.txt 차단, 403, 캡차가 나오면 우회하지 않고 멈추니 그때는 수동 입력을 쓰세요.
  - 맥·리눅스 예약 실행: `crontab -e`에 `30 18 * * * cd /경로/dashboard && python3 scripts/fetch_dramexchange.py`
  - 윈도우: 작업 스케줄러에서 위 명령을 매일 실행
