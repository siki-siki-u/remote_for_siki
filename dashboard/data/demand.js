// ─────────────────────────────────────────────────────────────
// 섹션 1. 수요: 빅테크 설비투자(Capex) — 단위: 십억 달러(B$)
// 값 형식: { v: 숫자, t: 'official'|'guidance'|'estimate', s: '출처키', n: '메모', uv: true(=검증 대기) }
//   official = 회사 공식 실적 / guidance = 회사 가이던스 / estimate = 증권가·리서치·계산 추정
//   uv:true  = 작성자 기억 기반 숫자. 웹 검색으로 직접 확인하지 못함 → 그래프에서 흐리게, '확인 못 한 항목'에 표시
//   null     = 모름(빈칸)
// 분기는 '달력 기준'(1~3월=Q1). MS(6월 결산)·오라클(5월 결산)도 달력 분기로 맞춤.
// 회사마다 Capex 정의가 다름: MS·Meta=리스 포함, 알파벳·아마존=현금 설비구매
// ─────────────────────────────────────────────────────────────
D.demand = {
  quarters: ["24Q1","24Q2","24Q3","24Q4","25Q1","25Q2","25Q3","25Q4","26Q1","26Q2","26Q3"],

  capexQ: {
    "마이크로소프트": [
      {v:14.0,t:"official",s:"memory_recall",uv:true},{v:19.0,t:"official",s:"memory_recall",uv:true},
      {v:20.0,t:"official",s:"memory_recall",uv:true},{v:22.6,t:"official",s:"memory_recall",uv:true},
      {v:21.4,t:"official",s:"memory_recall",uv:true},{v:24.2,t:"official",s:"memory_recall",uv:true},
      {v:34.9,t:"official",s:"memory_recall",uv:true},{v:37.5,t:"official",s:"memory_recall",uv:true},
      {v:31.9,t:"official",s:"q1_26_ainews",n:"리스 포함 여부 불명확 — 다른 분기와 정의가 다를 수 있음"},
      {v:41.0,t:"official",s:"q2_26_tmt",n:"FY26 4분기(4~6월). 2차 자료"},
      {v:45.2,t:"official",s:"msft_q1_27",n:"리스 포함. 현금 설비구매만은 394억$, 리스 74억$. 7월 가이던스(500억$)보다 낮음 — 외부 데이터센터 인도 지연"}
    ],
    "알파벳": [
      {v:12.0,t:"official",s:"memory_recall",uv:true},{v:13.2,t:"official",s:"memory_recall",uv:true},
      {v:13.1,t:"official",s:"memory_recall",uv:true},{v:14.3,t:"official",s:"memory_recall",uv:true},
      {v:17.2,t:"official",s:"memory_recall",uv:true},{v:22.4,t:"official",s:"memory_recall",uv:true},
      {v:24.0,t:"official",s:"googl_q3_26c"},
      {v:27.9,t:"official",s:"googl_q4_25"},
      {v:35.7,t:"official",s:"googl_q3_26"},
      {v:44.9,t:"official",s:"googl_q3_26"},
      {v:51.4,t:"official",s:"googl_q3_26",n:"정확히 513.55억$. 1~9월 누적 약 1,320억$"}
    ],
    "아마존": [
      {v:14.9,t:"official",s:"memory_recall",uv:true},{v:17.6,t:"official",s:"memory_recall",uv:true},
      {v:22.6,t:"official",s:"memory_recall",uv:true},{v:27.8,t:"official",s:"memory_recall",uv:true},
      {v:24.3,t:"official",s:"memory_recall",uv:true},{v:31.4,t:"official",s:"memory_recall",uv:true},
      {v:34.2,t:"official",s:"amzn_q3_26"},
      {v:39.5,t:"official",s:"memory_recall",uv:true},
      {v:44.2,t:"official",s:"q1_26_costar"},
      {v:53.1,t:"official",s:"q2_26_tmt",n:"2차 자료. 1~9월 누적 1,722억$와 1억$ 내외 차이"},
      {v:75.9,t:"official",s:"amzn_q3_26",n:"순액 기준. 총액 기준은 773억$(FactSet 예상 587억$)"}
    ],
    "메타": [
      {v:6.72,t:"official",s:"memory_recall",uv:true},{v:8.47,t:"official",s:"memory_recall",uv:true},
      {v:9.20,t:"official",s:"memory_recall",uv:true},{v:14.84,t:"official",s:"memory_recall",uv:true},
      {v:13.69,t:"official",s:"memory_recall",uv:true},{v:17.01,t:"official",s:"memory_recall",uv:true},
      {v:19.37,t:"official",s:"meta_q3_26b"},
      {v:22.15,t:"estimate",s:"meta_fy25",n:"계산값: 2025 연간 722.2억$ − 1~3분기 합계"},
      {v:19.8,t:"estimate",s:"meta_q3_26c",n:"계산값: 1~9월 858억$ − 2Q − 3Q. 직접 공시 확인 못 함"},
      {v:31.1,t:"official",s:"q2_26_tmt",n:"2차 자료"},
      {v:34.91,t:"official",s:"meta_q3_26",n:"리스 원금 포함. 전년 대비 +80%"}
    ],
    "오라클": [
      null,null,null,null,null,null,null,null,null,null,
      {v:28.5,t:"official",s:"orcl_q1_27b",n:"FY27 1분기(6~8월). 고객 선급금 차감 순현금 Capex는 약 180억$"}
    ],
    "코어위브": [
      null,null,null,null,null,null,null,null,null,null,
      {v:12.5,t:"guidance",s:"crwv_q2_26b",n:"3분기 가이던스 115~135억$의 중간값. 실적 아님 (11월 실적 발표 후 교체)"}
    ],
    "애플·엔비디아·테슬라": [null,null,null,null,null,null,null,null,null,null,null]
  },

  // 영업현금흐름(OCF) vs Capex — 최신 분기(26Q3) 기준
  fcf: [
    { co:"알파벳",       ocf:{v:42.3,t:"official",s:"googl_q3_26b"}, capex:{v:51.4,t:"official",s:"googl_q3_26"}, fcf:{v:-9.1,t:"official",s:"googl_q3_26b",n:"2004년 상장 이후 첫 분기 FCF 마이너스"} },
    { co:"메타",         ocf:{v:32.79,t:"official",s:"meta_q3_26b"}, capex:{v:34.91,t:"official",s:"meta_q3_26"}, fcf:{v:-2.12,t:"official",s:"meta_q3_26b"} },
    { co:"마이크로소프트", ocf:{v:58.0,t:"estimate",s:"msft_q1_27b",n:"계산값: FCF 186억$ + 현금 설비구매 394억$"}, capex:{v:39.4,t:"official",s:"msft_q1_27",n:"현금 설비구매만(리스 제외)"}, fcf:{v:18.6,t:"official",s:"msft_q1_27b",n:"전년 257억$에서 감소"} },
    { co:"아마존",       ocf:{v:42.2,t:"estimate",s:"amzn_q3_26b",n:"계산값: Capex가 OCF의 1.8배라는 보도에서 역산"}, capex:{v:75.9,t:"official",s:"amzn_q3_26"}, fcf:{v:-33.5,t:"estimate",s:"amzn_q3_26c",n:"제3자 계산. 회사 공식은 최근 12개월 FCF −424억$, 분기 중 481억$ 차입"} },
    { co:"오라클",       ocf:null, capex:{v:28.5,t:"official",s:"orcl_q1_27b"}, fcf:{v:-5.4,t:"official",s:"orcl_q1_27",n:"FY27 1분기(6~8월). 보도자료는 −50억$로 반올림"} },
    { co:"코어위브",     ocf:null, capex:null, fcf:null }
  ],

  // 연간 Capex 가이던스 이력 — lo~hi (B$). 같은 값이면 '유지'
  guidance: {
    "알파벳 (2026)": [
      {d:"2026-02", lo:175, hi:185, t:"guidance", s:"googl_q4_25"},
      {d:"2026-04", lo:180, hi:190, t:"guidance", s:"q1_26_tnw"},
      {d:"2026-07", lo:195, hi:205, t:"guidance", s:"googl_raise", n:"상향 시점이 7월(2Q 실적)인지 재확인 필요 — 10월에는 '유지'로 보도"},
      {d:"2026-10", lo:195, hi:205, t:"guidance", s:"googl_guid_q3", n:"2027년은 '크게 증가' 예고 (일부 보도: 3,000억$ 이상)"}
    ],
    "메타 (2026)": [
      {d:"2026-01", lo:115, hi:135, t:"guidance", s:"q1_26_costar"},
      {d:"2026-04", lo:125, hi:145, t:"guidance", s:"q1_26_costar"},
      {d:"2026-07", lo:130, hi:145, t:"guidance", s:"meta_jul"},
      {d:"2026-10", lo:135, hi:145, t:"guidance", s:"meta_guid_q3", n:"하단만 상향. 2027 Capex 숫자는 미제시"}
    ],
    "아마존 (2026)": [
      {d:"2026-02", lo:200, hi:200, t:"guidance", s:"q1_26_costar", n:"약 2,000억$"},
      {d:"2026-04", lo:200, hi:200, t:"guidance", s:"q1_26_costar"},
      {d:"2026-07", lo:220, hi:220, t:"guidance", s:"amzn_q3_26c"},
      {d:"2026-10", lo:220, hi:220, t:"guidance", s:"amzn_q3_26c", n:"2027년은 '의미 있게 더' 지출 예고"}
    ],
    "마이크로소프트 (달력 2026)": [
      {d:"2026-04", lo:190, hi:190, t:"guidance", s:"q1_26_vested", n:"출처 간 숫자 충돌 — 재확인 필요"},
      {d:"2026-07", lo:175, hi:175, t:"guidance", s:"guid_oct_gate"},
      {d:"2026-10", lo:170, hi:170, t:"guidance", s:"guid_oct_gate", n:"하향은 회계 변경(데이터센터 리스 상각 15→25년) 때문, 실제 투자 계획은 그대로라고 설명"}
    ],
    "오라클 (회계연도)": [
      {d:"FY26 계획", lo:50, hi:50, t:"guidance", s:"orcl_q1_27d"},
      {d:"FY26 실적", lo:55.7, hi:55.7, t:"official", s:"orcl_q1_27d", n:"계획 500억$ 초과. FY26 FCF −237억$"},
      {d:"FY27 (2026-09)", lo:70, hi:95, t:"guidance", s:"orcl_q1_27c", n:"순현금 Capex 700억$ + 부품 선급금 200~250억$ = 최대 950억$"}
    ],
    "코어위브 (2026)": [
      {d:"2026-05", lo:31, hi:35, t:"guidance", s:"crwv_may"},
      {d:"2026-08", lo:35, hi:39, t:"guidance", s:"crwv_q2_26"}
    ]
  },

  // 5년물 CDS (bp = 0.01%p). 값이 클수록 '부도 보험료'가 비쌈 = 시장이 신용 위험을 크게 봄
  cds: [
    { co:"코어위브",     start:null, now:{v:1100,t:"market",s:"cds_reuters",n:"10/15 1,100bp 돌파. 다른 보도는 855bp — 출처마다 차이 큼"} },
    { co:"오라클",       start:{v:144,t:"market",s:"cds_spinel"}, now:{v:322,t:"market",s:"cds_spinel",n:"FT 10/19. 다른 보도는 288~300bp"} },
    { co:"메타",         start:null, now:{v:108,t:"market",s:"cds_fwmba",n:"사상 최고. 다른 보도는 90~108bp"} },
    { co:"아마존",       start:{v:36,t:"market",s:"cds_cb"}, now:{v:68,t:"market",s:"cds_cb"} },
    { co:"알파벳",       start:null, now:{v:67,t:"market",s:"cds_fwmba",n:"첫 FCF 마이너스 발표 며칠 뒤"} },
    { co:"마이크로소프트", start:null, now:null }
  ],
  cdsAsOf: "2026-10 중순"
};
