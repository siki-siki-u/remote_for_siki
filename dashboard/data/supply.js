// ─────────────────────────────────────────────────────────────
// 섹션 4. 공급: 메모리 5사 설비투자와 팹 일정
// 값 형식은 demand.js와 같음 ({v,t,s,n,uv}).
// 원화·위안화는 아래 환율로 달러 환산해 그래프에 표시(원래 값은 메모에 남김).
// ─────────────────────────────────────────────────────────────
D.supply = {
  fx: { KRW: 1400, CNY: 7.2, note: "환산 환율은 비교용 가정값(원/달러 1,400, 위안/달러 7.2). 실제 환율로 바꿔도 됩니다." },
  years: ["2024","2025","2026","2027"],

  // 연간 설비투자. cur: 'USD'|'KRW'|'CNY', v는 해당 통화 '십억' 단위(원화는 '조원' → 1조 = 1,000십억)
  capex: {
    "삼성전자(※전사 기준)": { cur:"KRW", unit:"조원", vals:[
      null,
      {v:47.4,t:"guidance",s:"ss_capex_25",n:"⚠ 메모리만이 아닌 전사 시설투자 전망(25Q3 컨콜). 메모리 몫은 확인 못 함"},
      null, null ]},
    "SK하이닉스": { cur:"KRW", unit:"조원", vals:[
      null, null,
      {v:47,t:"guidance",s:"hy_q2_capex",n:"'40조 후반' 보도를 47조로 표시(근사). 3분기 콜에서 확정 금액은 미제시"},
      null ], note:"2027년은 '2026년보다 크게 증가'라고만 밝힘(금액 미제시)" },
    "마이크론": { cur:"USD", unit:"십억$", fiscal:"회계연도(9월~이듬해 8월)", vals:[
      null,
      {v:13.8,t:"official",s:"mu_mar26",uv:true,n:"FY25. 사용자 제공 값(작성자 기억과 일치). 이번 검색에서 직접 확인 못 함"},
      {v:27.37,t:"official",s:"mu_q4_26",n:"FY26 실적. 3월 가이던스(최소 250억$)를 넘음"},
      {v:42.5,t:"estimate",s:"mu_q4_26",n:"FY27: 회사는 상반기만 약 250억$, 하반기 더 높다고 가이던스. 연간 400~450억$는 애널리스트 추정(중간값 표시)"} ]},
    "CXMT(창신)": { cur:"CNY", unit:"십억 위안", china:true, vals:[ null, null, null, null ] },
    "YMTC(창장)": { cur:"CNY", unit:"십억 위안", china:true, vals:[ null, null, null, null ] },
    "CXMT+YMTC 합산(장비)": { cur:"CNY", unit:"십억 위안", china:true, vals:[
      null, null,
      {v:63,t:"estimate",s:"cn_technews",n:"두 회사 2026년 반도체 장비 구매 계획 합계 630억 위안(대만 매체 보도). 건물·클린룸 투자는 미포함"},
      null ]}
  },
  capexNotes: [
    "TrendForce 집계(2차 인용): 2026년 D램 산업 전체 설비투자 약 613억$",
    "UBS 추정: 중국 메모리 2026년 신규 캐파 월 12만~14만 장",
    "키움증권 추정: CXMT 2026년 D램 비트 증가율 48%",
    "CXMT 2026년 7월 상장으로 579.2억 위안(약 86억$) 조달 — 증설 자금"
  ],

  // 팹 일정. 시점은 '연도.소수'(예: 2027.5 = 2027년 7월쯤). t: 해당 구간의 근거 종류
  // phase: build(착공→클린룸 개방) / tool(장비 반입·셋업) / ramp(양산 시작→램프업) / full(풀캐파)
  fabs: [
    { name:"하이닉스 M15X (청주)", co:"SK하이닉스", product:"D램(HBM)", capa:{v:100,unit:"천 장/월",t:"estimate",uv:true,s:"memory_recall",n:"증권가 추정 월 10만 장 — 이번 검색에서 출처 확인 못 함"},
      phases:[
        {p:"build", a:2024.33, b:2025.75, t:"official", s:"hy_m15x_24", n:"2024년 4월 이사회에서 건설 결정·착공"},
        {p:"tool",  a:2025.75, b:2025.95, t:"official", s:"hy_m15x_25", n:"2025년 4분기 팹 오픈 목표(25Q1 컨콜)"},
        {p:"ramp",  a:2025.95, b:2026.95, t:"official", s:"hy_q3_call", n:"26Q3 컨콜: 2026년 말까지 생산능력 최대로"},
        {p:"full",  a:2026.95, b:2028.99, t:"guidance", s:"hy_q3_call"} ]},
    { name:"하이닉스 용인 1기 (Y1)", co:"SK하이닉스", product:"D램(HBM)", capa:{v:165,unit:"천 장/월",t:"estimate",uv:true,s:"memory_recall",n:"업계 추정 2028년 말 월 16.5만 장 — 출처 확인 못 함. 클러스터 4기 전체 월 80만 장도 추정"},
      phases:[
        {p:"build", a:2025.17, b:2027.08, t:"official", s:"hy_y1_feb", uv:true, n:"착공 2025년 2월은 작성자 기억(재확인 필요). 2개 동·클린룸 6개, 1기 총 투자 약 31조원"},
        {p:"tool",  a:2027.08, b:2027.5,  t:"official", s:"hy_y1_feb", n:"첫 클린룸(페이즈1) 2027년 5월→2월로 3개월 앞당김"},
        {p:"ramp",  a:2027.5,  b:2028.99, t:"estimate", s:"hy_y1_feb", n:"페이즈2~6 클린룸 순차 구축. 램프 기간은 추정"} ]},
    { name:"삼성 평택 P5", co:"삼성전자", product:"D램(HBM)", capa:null,
      phases:[
        {p:"build", a:2026.08, b:2027.4,  t:"official", s:"ss_p5_feb", n:"2026년 2월 기초공사 시작, 2028년 양산 목표"},
        {p:"tool",  a:2027.4,  b:2028.0,  t:"estimate", s:"ss_p5_feb", n:"2026년 7월 보도: 2027년 장비 반입, 2028년 클린룸 가동 목표"},
        {p:"ramp",  a:2028.0,  b:2028.99, t:"estimate", s:"ss_p5_feb", uv:true, n:"물량 본격화 2028년 하반기(씨티 이세철 전무) — 이번 검색에서 원문 확인 못 함"} ]},
    { name:"마이크론 아이다호 1공장 (ID1)", co:"마이크론", product:"D램",  capa:null,
      phases:[
        {p:"build", a:2022.8,  b:2027.0, t:"official", s:"mu_fab_th", uv:true, n:"착공 2022년 말은 작성자 기억"},
        {p:"ramp",  a:2027.45, b:2028.99, t:"guidance", s:"mu_fab_tf", n:"첫 웨이퍼 2027년 하반기→2027년 중반으로 앞당김"} ]},
    { name:"마이크론 아이다호 2공장 (ID2)", co:"마이크론", product:"D램", capa:null,
      phases:[ {p:"ramp", a:2028.8, b:2029.5, t:"guidance", s:"mu_fab_tf", n:"2028년 말 초기 가동"} ]},
    { name:"마이크론 히로시마 HBM 증설", co:"마이크론", product:"HBM", capa:null,
      phases:[
        {p:"build", a:2026.33, b:2027.9, t:"official", s:"mu_fab_tf", n:"2026년 5월 착공 계획"},
        {p:"ramp",  a:2028.0,  b:2028.99, t:"guidance", s:"mu_fab_tf", n:"HBM 출하 2028년 전후 목표"} ]},
    { name:"마이크론 싱가포르 HBM 패키징", co:"마이크론", product:"HBM 패키징", capa:null,
      phases:[ {p:"ramp", a:2027.0, b:2027.99, t:"guidance", s:"mu_fab_tf", n:"2027년 생산 기여. 일부 보도는 2026년 가동"} ]},
    { name:"마이크론 뉴욕 메가팹", co:"마이크론", product:"D램", capa:null,
      phases:[
        {p:"build", a:2026.0, b:2029.9, t:"official", s:"mu_fab_th", n:"첫 콘크리트 타설(예정보다 1분기 빠름)"},
        {p:"ramp",  a:2030.0, b:2030.99, t:"guidance", s:"mu_fab_th", n:"생산 2030년 전후"} ]},
    { name:"YMTC 우한 3공장", co:"YMTC", product:"낸드", capa:{v:null,n:"낸드 캐파 월 20만→40~50만 장 확대 보도(추정)"}, china:true,
      phases:[], note:"우한 3공장 건설 중이라는 보도만 확인, 시점 모름" },
    { name:"CXMT 증설", co:"CXMT", product:"D램", capa:null, china:true, phases:[] }
  ]
};
