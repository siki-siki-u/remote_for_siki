// 매일 쌓이는 현물가 기록. scripts/fetch_dramexchange.py 또는 scripts/add_spot.py 가 이 파일에 한 줄씩 추가합니다.
// 형식: { "d": "YYYY-MM-DD", "ddr4_16gb": 숫자, "ddr5_16gb": 숫자, "src": "출처", "how": "auto|manual" }
// 아래 SPOT_LOG_START/END 표시는 지우지 마세요(스크립트가 이 사이를 읽고 씁니다).
D.spotLog = /*SPOT_LOG_START*/[]/*SPOT_LOG_END*/;
