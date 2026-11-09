/**
 * 本文件由 scripts/build_embedded_modules.py 自动生成，请勿手改。
 *
 * 源数据：miniprogram/data/dataset-2026.cs.1.json
 * 生成原因：微信小程序运行时无法 require/import .json（会去找 `xxx.json.js`），
 *          必须以 JS/TS 模块形式随包发布。
 * 修改数据请改源 .json，然后重跑该脚本；二者不同步会被 scripts/gate_frontend.py 判为 FAIL。
 */

import type { Dataset } from '../core/types';

const data = {
  "dataVersion": "2026.CS.1",
  "region": "长沙",
  "effectiveFrom": "2026-07",
  "effectiveTo": null,
  "note": "长沙城区 2026 年中考实际数据（总分630，体育50，生物地理为考查科目不计总分）。2027 年以长沙市教育局正式文件为准。",
  "sourceNote": "来源：副本27初三成绩追踪定位表.xlsx 表④⑤⑥⑦。录取线为2026年长沙城区实际录取分数线；带*者该分数高于2026年一分段表最高分段（593分），位次参考2025年数据。2027年指标生计划以长沙市教育局4月底公布为准。",
  "disclaimer": "本数据为2026年实际数据整理，仅供位次定位参照，不构成录取承诺或分数预测。2027年以长沙市教育局正式文件为准。",
  "examTotalScore": 630,
  "sportsScore": 50,
  "surveySubjects": [
    "生物",
    "地理"
  ],
  "countedSubjects": [],
  "tierThresholds": [
    {
      "upTo": 4212,
      "tier": "四大本部"
    },
    {
      "upTo": 7250,
      "tier": "四大新校区"
    },
    {
      "upTo": 11389,
      "tier": "明德周南"
    },
    {
      "upTo": 15516,
      "tier": "麓山南雅中坚"
    },
    {
      "upTo": 23221,
      "tier": "第三梯队"
    },
    {
      "upTo": 27000,
      "tier": "第四梯队"
    },
    {
      "upTo": 35000,
      "tier": "第五梯队"
    },
    {
      "upTo": null,
      "tier": "普高线附近"
    }
  ],
  "controlLines": {
    "tier1": 563,
    "tier2": 553,
    "tier3": 516
  },
  "groupCoeffs": {
    "长郡": 3.52,
    "雅礼": 4.23,
    "师大附中": 5.11,
    "长沙市一中": 7.82
  },
  "groupSizes": {
    "长郡": 21363,
    "雅礼": 17774,
    "师大附中": 14724,
    "长沙市一中": 9620
  },
  "groupTiers": [
    {
      "groupRankLabel": "前 800",
      "cityRankLabel": "3003",
      "tier": "长郡本部 / 雅礼本部"
    },
    {
      "groupRankLabel": "前 1000",
      "cityRankLabel": "3850",
      "tier": "雅礼本部"
    },
    {
      "groupRankLabel": "前 1200",
      "cityRankLabel": "4639",
      "tier": "附中本部 / 一中本部"
    },
    {
      "groupRankLabel": "前 1600",
      "cityRankLabel": "5159 - 6100",
      "tier": "四大新校区（郡新 / 雅新）"
    },
    {
      "groupRankLabel": "前 2500",
      "cityRankLabel": "9500",
      "tier": "附中新 / 一中新 / 麓山国际 / 南雅"
    },
    {
      "groupRankLabel": "前 3500",
      "cityRankLabel": "12500",
      "tier": "明德 / 周南"
    },
    {
      "groupRankLabel": "前 5000",
      "cityRankLabel": "18500",
      "tier": "第三梯队：中坚八校 + 南雅东"
    },
    {
      "groupRankLabel": "前 7200",
      "cityRankLabel": "27000",
      "tier": "第四梯队高中（9所）"
    },
    {
      "groupRankLabel": "前 9200",
      "cityRankLabel": "35000",
      "tier": "第五梯队高中（14所）"
    },
    {
      "groupRankLabel": "前 11000",
      "cityRankLabel": "43000",
      "tier": "城区公办普高线附近"
    },
    {
      "groupRankLabel": "前 13740",
      "cityRankLabel": "52899",
      "tier": "仍在中考范围内，继续努力"
    }
  ],
  "admissionLines": [
    {
      "seq": 1,
      "school": "长郡中学",
      "plan": 1150,
      "cutoff": 597,
      "cityRank": 2500,
      "rankKind": "before",
      "rankRaw": "前2500*",
      "rankNote": "带*：该分数高于2026年一分段表最高分段（593分），位次参考2025年数据",
      "langMathEngTotal": 316,
      "batch": "第一批次"
    },
    {
      "seq": 2,
      "school": "雅礼中学",
      "plan": 1150,
      "cutoff": 594,
      "cityRank": 3500,
      "rankKind": "before",
      "rankRaw": "前3500",
      "rankNote": "",
      "langMathEngTotal": 320,
      "batch": "第一批次"
    },
    {
      "seq": 3,
      "school": "湖南师大附中",
      "plan": 1150,
      "cutoff": 592,
      "cityRank": 4212,
      "rankKind": "exact",
      "rankRaw": "4212",
      "rankNote": "",
      "langMathEngTotal": 316,
      "batch": "第一批次"
    },
    {
      "seq": 4,
      "school": "长沙市一中",
      "plan": 1150,
      "cutoff": 592,
      "cityRank": 4212,
      "rankKind": "exact",
      "rankRaw": "4212",
      "rankNote": "",
      "langMathEngTotal": 304,
      "batch": "第一批次"
    },
    {
      "seq": 5,
      "school": "雅礼中学（光达）",
      "plan": 700,
      "cutoff": 590,
      "cityRank": 5373,
      "rankKind": "exact",
      "rankRaw": "5373",
      "rankNote": "",
      "langMathEngTotal": 312,
      "batch": "第一批次"
    },
    {
      "seq": 6,
      "school": "长郡中学（奥体城）",
      "plan": 700,
      "cutoff": 589,
      "cityRank": 5971,
      "rankKind": "exact",
      "rankRaw": "5971",
      "rankNote": "",
      "langMathEngTotal": 315,
      "batch": "第一批次"
    },
    {
      "seq": 7,
      "school": "师大附中（大泽湖）",
      "plan": 700,
      "cutoff": 588,
      "cityRank": 6631,
      "rankKind": "exact",
      "rankRaw": "6631",
      "rankNote": "",
      "langMathEngTotal": 310,
      "batch": "第一批次"
    },
    {
      "seq": 8,
      "school": "长沙一中（科学城）",
      "plan": 700,
      "cutoff": 587,
      "cityRank": 7250,
      "rankKind": "exact",
      "rankRaw": "7250",
      "rankNote": "",
      "langMathEngTotal": 312,
      "batch": "第一批次"
    },
    {
      "seq": 9,
      "school": "麓山国际实验学校",
      "plan": 1200,
      "cutoff": 586,
      "cityRank": 7896,
      "rankKind": "exact",
      "rankRaw": "7896",
      "rankNote": "",
      "langMathEngTotal": 311,
      "batch": "第二批次"
    },
    {
      "seq": 10,
      "school": "南雅中学",
      "plan": 1200,
      "cutoff": 585,
      "cityRank": 8632,
      "rankKind": "exact",
      "rankRaw": "8632",
      "rankNote": "",
      "langMathEngTotal": 311,
      "batch": "第一批次"
    },
    {
      "seq": 11,
      "school": "明德中学",
      "plan": 1350,
      "cutoff": 583,
      "cityRank": 10034,
      "rankKind": "exact",
      "rankRaw": "10034",
      "rankNote": "",
      "langMathEngTotal": 307,
      "batch": "第一批次"
    },
    {
      "seq": 12,
      "school": "周南中学",
      "plan": 1400,
      "cutoff": 581,
      "cityRank": 11389,
      "rankKind": "exact",
      "rankRaw": "11389",
      "rankNote": "",
      "langMathEngTotal": 312,
      "batch": "第一批次"
    },
    {
      "seq": 13,
      "school": "南雅东校区",
      "plan": 600,
      "cutoff": 581,
      "cityRank": 11389,
      "rankKind": "exact",
      "rankRaw": "11389",
      "rankNote": "",
      "langMathEngTotal": 306,
      "batch": "第一批次"
    },
    {
      "seq": 14,
      "school": "长郡双语高中部",
      "plan": 550,
      "cutoff": 580,
      "cityRank": 12107,
      "rankKind": "exact",
      "rankRaw": "12107",
      "rankNote": "",
      "langMathEngTotal": 305,
      "batch": "第二批次"
    },
    {
      "seq": 15,
      "school": "师大附中梅溪湖中学",
      "plan": 500,
      "cutoff": 578,
      "cityRank": 13523,
      "rankKind": "exact",
      "rankRaw": "13523",
      "rankNote": "",
      "langMathEngTotal": 299,
      "batch": "第二批次"
    },
    {
      "seq": 16,
      "school": "雅礼洋湖实验中学",
      "plan": 550,
      "cutoff": 577,
      "cityRank": 14169,
      "rankKind": "exact",
      "rankRaw": "14169",
      "rankNote": "",
      "langMathEngTotal": 307,
      "batch": "第二批次"
    },
    {
      "seq": 17,
      "school": "长郡梅溪湖中学",
      "plan": 400,
      "cutoff": 575,
      "cityRank": 15516,
      "rankKind": "exact",
      "rankRaw": "15516",
      "rankNote": "",
      "langMathEngTotal": 303,
      "batch": "第二批次"
    },
    {
      "seq": 18,
      "school": "长沙市实验中学",
      "plan": 910,
      "cutoff": 575,
      "cityRank": 15516,
      "rankKind": "exact",
      "rankRaw": "15516",
      "rankNote": "",
      "langMathEngTotal": 298,
      "batch": "第一批次"
    },
    {
      "seq": 19,
      "school": "雅礼实验中学",
      "plan": 450,
      "cutoff": 574,
      "cityRank": 16204,
      "rankKind": "exact",
      "rankRaw": "16204",
      "rankNote": "",
      "langMathEngTotal": 311,
      "batch": "第二批次"
    },
    {
      "seq": 20,
      "school": "周南梅溪湖中学",
      "plan": 500,
      "cutoff": 573,
      "cityRank": 16854,
      "rankKind": "exact",
      "rankRaw": "16854",
      "rankNote": "",
      "langMathEngTotal": 307,
      "batch": "第二批次"
    },
    {
      "seq": 21,
      "school": "长郡滨江中学",
      "plan": 550,
      "cutoff": 572,
      "cityRank": 17526,
      "rankKind": "exact",
      "rankRaw": "17526",
      "rankNote": "",
      "langMathEngTotal": 302,
      "batch": "第二批次"
    },
    {
      "seq": 22,
      "school": "长沙市六中",
      "plan": 850,
      "cutoff": 570,
      "cityRank": 18795,
      "rankKind": "exact",
      "rankRaw": "18795",
      "rankNote": "",
      "langMathEngTotal": 295,
      "batch": "第二批次"
    },
    {
      "seq": 23,
      "school": "附中博才实验（湘江校区）",
      "plan": 450,
      "cutoff": 569,
      "cityRank": 19458,
      "rankKind": "exact",
      "rankRaw": "19458",
      "rankNote": "",
      "langMathEngTotal": 301,
      "batch": "第二批次"
    },
    {
      "seq": 24,
      "school": "长沙外国语学校",
      "plan": 820,
      "cutoff": 568,
      "cityRank": 20146,
      "rankKind": "exact",
      "rankRaw": "20146",
      "rankNote": "",
      "langMathEngTotal": 298,
      "batch": "第二批次"
    },
    {
      "seq": 25,
      "school": "麓山梅溪湖实验中学",
      "plan": 950,
      "cutoff": 566,
      "cityRank": 21418,
      "rankKind": "exact",
      "rankRaw": "21418",
      "rankNote": "",
      "langMathEngTotal": 296,
      "batch": "第二批次"
    },
    {
      "seq": 26,
      "school": "望城区一中",
      "plan": 900,
      "cutoff": 564,
      "cityRank": 22614,
      "rankKind": "exact",
      "rankRaw": "22614",
      "rankNote": "",
      "langMathEngTotal": 288,
      "batch": "第二批次"
    },
    {
      "seq": 27,
      "school": "长郡会展中学",
      "plan": 700,
      "cutoff": 563,
      "cityRank": 23221,
      "rankKind": "exact",
      "rankRaw": "23221",
      "rankNote": "",
      "langMathEngTotal": 306,
      "batch": "第二批次"
    },
    {
      "seq": 28,
      "school": "麓山滨江实验学校",
      "plan": 750,
      "cutoff": 562,
      "cityRank": 23816,
      "rankKind": "exact",
      "rankRaw": "23816",
      "rankNote": "",
      "langMathEngTotal": 296,
      "batch": "第二批次"
    },
    {
      "seq": 29,
      "school": "明德华兴中学",
      "plan": 370,
      "cutoff": 560,
      "cityRank": 24941,
      "rankKind": "exact",
      "rankRaw": "24941",
      "rankNote": "",
      "langMathEngTotal": 290,
      "batch": "第二批次"
    },
    {
      "seq": 30,
      "school": "东雅中学",
      "plan": 700,
      "cutoff": 557,
      "cityRank": 26598,
      "rankKind": "exact",
      "rankRaw": "26598",
      "rankNote": "",
      "langMathEngTotal": 303,
      "batch": "第二批次"
    },
    {
      "seq": 31,
      "school": "长郡湘府中学",
      "plan": 900,
      "cutoff": 557,
      "cityRank": 26598,
      "rankKind": "exact",
      "rankRaw": "26598",
      "rankNote": "",
      "langMathEngTotal": 292,
      "batch": "第二批次"
    },
    {
      "seq": 32,
      "school": "南雅梅溪湖中学",
      "plan": 950,
      "cutoff": 556,
      "cityRank": 27175,
      "rankKind": "exact",
      "rankRaw": "27175",
      "rankNote": "",
      "langMathEngTotal": 291,
      "batch": "第二批次"
    },
    {
      "seq": 33,
      "school": "长沙铁路第一中学",
      "plan": 650,
      "cutoff": 556,
      "cityRank": 27175,
      "rankKind": "exact",
      "rankRaw": "27175",
      "rankNote": "",
      "langMathEngTotal": 288,
      "batch": "第二批次"
    },
    {
      "seq": 34,
      "school": "周南实验中学",
      "plan": 360,
      "cutoff": 553,
      "cityRank": 28773,
      "rankKind": "exact",
      "rankRaw": "28773",
      "rankNote": "",
      "langMathEngTotal": 293,
      "batch": "第二批次"
    },
    {
      "seq": 35,
      "school": "长沙市十五中",
      "plan": 700,
      "cutoff": 553,
      "cityRank": 28773,
      "rankKind": "exact",
      "rankRaw": "28773",
      "rankNote": "",
      "langMathEngTotal": 292,
      "batch": "第二批次"
    },
    {
      "seq": 36,
      "school": "长郡智谷中学",
      "plan": 950,
      "cutoff": 552,
      "cityRank": 29268,
      "rankKind": "exact",
      "rankRaw": "29268",
      "rankNote": "",
      "langMathEngTotal": 285,
      "batch": "第二批次"
    },
    {
      "seq": 37,
      "school": "国防科大附中",
      "plan": 200,
      "cutoff": 551,
      "cityRank": 29755,
      "rankKind": "exact",
      "rankRaw": "29755",
      "rankNote": "",
      "langMathEngTotal": 296,
      "batch": "第二批次"
    },
    {
      "seq": 38,
      "school": "湖南省地质中学",
      "plan": 700,
      "cutoff": 550,
      "cityRank": 30288,
      "rankKind": "exact",
      "rankRaw": "30288",
      "rankNote": "",
      "langMathEngTotal": 290,
      "batch": "第二批次"
    },
    {
      "seq": 39,
      "school": "雅礼书院中学",
      "plan": 750,
      "cutoff": 549,
      "cityRank": 30774,
      "rankKind": "exact",
      "rankRaw": "30774",
      "rankNote": "",
      "langMathEngTotal": 290,
      "batch": "第二批次"
    },
    {
      "seq": 40,
      "school": "长沙市十一中（城南路）",
      "plan": 500,
      "cutoff": 549,
      "cityRank": 30774,
      "rankKind": "exact",
      "rankRaw": "30774",
      "rankNote": "",
      "langMathEngTotal": 288,
      "batch": "第二批次"
    },
    {
      "seq": 41,
      "school": "长郡斑马湖中学",
      "plan": 750,
      "cutoff": 548,
      "cityRank": 31249,
      "rankKind": "exact",
      "rankRaw": "31249",
      "rankNote": "",
      "langMathEngTotal": 289,
      "batch": "第二批次"
    },
    {
      "seq": 42,
      "school": "长沙市二十一中",
      "plan": 650,
      "cutoff": 548,
      "cityRank": 31249,
      "rankKind": "exact",
      "rankRaw": "31249",
      "rankNote": "",
      "langMathEngTotal": 286,
      "batch": "第二批次"
    },
    {
      "seq": 43,
      "school": "长沙市一中城南中学",
      "plan": 950,
      "cutoff": 545,
      "cityRank": 32653,
      "rankKind": "exact",
      "rankRaw": "32653",
      "rankNote": "",
      "langMathEngTotal": 278,
      "batch": "第二批次"
    },
    {
      "seq": 44,
      "school": "长沙市十一中（融城）",
      "plan": 430,
      "cutoff": 543,
      "cityRank": 33542,
      "rankKind": "exact",
      "rankRaw": "33542",
      "rankNote": "",
      "langMathEngTotal": 290,
      "batch": "第二批次"
    },
    {
      "seq": 45,
      "school": "田家炳实验中学",
      "plan": 400,
      "cutoff": 543,
      "cityRank": 33542,
      "rankKind": "exact",
      "rankRaw": "33542",
      "rankNote": "",
      "langMathEngTotal": 287,
      "batch": "第二批次"
    },
    {
      "seq": 46,
      "school": "明德雨花实验中学",
      "plan": 450,
      "cutoff": 541,
      "cityRank": 34432,
      "rankKind": "exact",
      "rankRaw": "34432",
      "rankNote": "",
      "langMathEngTotal": 279,
      "batch": "第二批次"
    },
    {
      "seq": 47,
      "school": "稻田中学",
      "plan": 250,
      "cutoff": 540,
      "cityRank": 34848,
      "rankKind": "exact",
      "rankRaw": "34848",
      "rankNote": "",
      "langMathEngTotal": 285,
      "batch": "第二批次"
    },
    {
      "seq": 48,
      "school": "雷锋学校",
      "plan": 950,
      "cutoff": 539,
      "cityRank": 35289,
      "rankKind": "exact",
      "rankRaw": "35289",
      "rankNote": "",
      "langMathEngTotal": 283,
      "batch": "第二批次"
    },
    {
      "seq": 49,
      "school": "师大附中雨花学校",
      "plan": 300,
      "cutoff": 538,
      "cityRank": 35680,
      "rankKind": "exact",
      "rankRaw": "35680",
      "rankNote": "",
      "langMathEngTotal": 282,
      "batch": "第二批次"
    },
    {
      "seq": 50,
      "school": "麓山外国语实验中学",
      "plan": 210,
      "cutoff": 538,
      "cityRank": 35680,
      "rankKind": "exact",
      "rankRaw": "35680",
      "rankNote": "",
      "langMathEngTotal": 280,
      "batch": "第二批次"
    },
    {
      "seq": 51,
      "school": "湖南大学附属中学",
      "plan": 100,
      "cutoff": 536,
      "cityRank": 36490,
      "rankKind": "exact",
      "rankRaw": "36490",
      "rankNote": "",
      "langMathEngTotal": 289,
      "batch": "第二批次"
    },
    {
      "seq": 52,
      "school": "长沙市一中广雅中学",
      "plan": 450,
      "cutoff": 535,
      "cityRank": 36892,
      "rankKind": "exact",
      "rankRaw": "36892",
      "rankNote": "",
      "langMathEngTotal": 281,
      "batch": "第二批次"
    },
    {
      "seq": 53,
      "school": "中南附属中学（岳麓山）",
      "plan": 120,
      "cutoff": 534,
      "cityRank": 37337,
      "rankKind": "exact",
      "rankRaw": "37337",
      "rankNote": "",
      "langMathEngTotal": 281,
      "batch": "第二批次"
    },
    {
      "seq": 54,
      "school": "长沙大学附属中学",
      "plan": 800,
      "cutoff": 532,
      "cityRank": 38128,
      "rankKind": "exact",
      "rankRaw": "38128",
      "rankNote": "",
      "langMathEngTotal": 281,
      "batch": "第二批次"
    },
    {
      "seq": 55,
      "school": "岳麓实验中学",
      "plan": 710,
      "cutoff": 529,
      "cityRank": 39262,
      "rankKind": "exact",
      "rankRaw": "39262",
      "rankNote": "",
      "langMathEngTotal": 267,
      "batch": "第二批次"
    },
    {
      "seq": 56,
      "school": "望城区二中",
      "plan": 750,
      "cutoff": 525,
      "cityRank": 40695,
      "rankKind": "exact",
      "rankRaw": "40695",
      "rankNote": "",
      "langMathEngTotal": 272,
      "batch": "第二批次"
    },
    {
      "seq": 57,
      "school": "望城区六中",
      "plan": 750,
      "cutoff": 519,
      "cityRank": 42589,
      "rankKind": "exact",
      "rankRaw": "42589",
      "rankNote": "",
      "langMathEngTotal": 262,
      "batch": "第二批次"
    },
    {
      "seq": 58,
      "school": "明德中学（美术班）",
      "plan": 50,
      "cutoff": 560,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "2024年*",
      "rankNote": "原表为历史年度数据（2024年）",
      "langMathEngTotal": 300,
      "batch": "第二批次"
    },
    {
      "seq": 59,
      "school": "明德华兴中学（美术班）",
      "plan": 30,
      "cutoff": 542,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "市排百分位",
      "rankNote": "原表为市排百分位口径，无绝对位次",
      "langMathEngTotal": 283,
      "batch": "第二批次"
    },
    {
      "seq": 60,
      "school": "望城区一中（美术班）",
      "plan": 40,
      "cutoff": 525,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "0.2083",
      "rankNote": "原表为百分位口径（0.2083），无绝对位次",
      "langMathEngTotal": 275,
      "batch": "第二批次"
    },
    {
      "seq": 61,
      "school": "十一中融城（美术班）",
      "plan": 300,
      "cutoff": 514,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "0.3065",
      "rankNote": "原表为百分位口径（0.3065），无绝对位次",
      "langMathEngTotal": 267,
      "batch": "第二批次"
    },
    {
      "seq": 62,
      "school": "明德中学（音乐班）",
      "plan": 35,
      "cutoff": 516,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "0.5223",
      "rankNote": "原表为百分位口径（0.5223），无绝对位次",
      "langMathEngTotal": 274,
      "batch": "第二批次"
    },
    {
      "seq": 63,
      "school": "长铁一中（美术班）",
      "plan": 100,
      "cutoff": 492,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "None*",
      "rankNote": "该班型无全市位次参照（单独录取）",
      "langMathEngTotal": 257,
      "batch": "第二批次"
    },
    {
      "seq": 64,
      "school": "市实验（音乐班）",
      "plan": 40,
      "cutoff": 420,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "None*",
      "rankNote": "该班型无全市位次参照（单独录取）",
      "langMathEngTotal": 219,
      "batch": "第二批次"
    },
    {
      "seq": 65,
      "school": "雷锋中学（美术班）",
      "plan": 70,
      "cutoff": 458,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "None*",
      "rankNote": "该班型无全市位次参照（单独录取）",
      "langMathEngTotal": 239,
      "batch": "第二批次"
    },
    {
      "seq": 66,
      "school": "十一中融城（音乐班）",
      "plan": 135,
      "cutoff": 448,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "2025年*",
      "rankNote": "原表为历史年度数据（2025年）",
      "langMathEngTotal": 236,
      "batch": "第二批次"
    },
    {
      "seq": 67,
      "school": "周南实验中学（音乐班）",
      "plan": 40,
      "cutoff": 433,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "市排百分位，%",
      "rankNote": "原表为市排百分位口径，无绝对位次",
      "langMathEngTotal": 200,
      "batch": "第二批次"
    },
    {
      "seq": 68,
      "school": "十一中融城（舞蹈班）",
      "plan": 35,
      "cutoff": 391,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "6.18",
      "rankNote": "原表为百分位口径（6.18），无绝对位次",
      "langMathEngTotal": null,
      "batch": "第二批次"
    },
    {
      "seq": 69,
      "school": "雷锋中学（音乐班）",
      "plan": 80,
      "cutoff": 380,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "11.3",
      "rankNote": "原表为百分位口径（11.3），无绝对位次",
      "langMathEngTotal": null,
      "batch": "第二批次"
    },
    {
      "seq": 70,
      "school": "长外小语种",
      "plan": 80,
      "cutoff": 568,
      "cityRank": null,
      "rankKind": "percentile",
      "rankRaw": "16.26",
      "rankNote": "原表为百分位口径（16.26），无绝对位次",
      "langMathEngTotal": 298,
      "batch": "第二批次"
    },
    {
      "seq": 71,
      "school": "长沙财经学校",
      "plan": null,
      "cutoff": 516,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "None*",
      "rankNote": "该班型无全市位次参照（单独录取）",
      "langMathEngTotal": 259,
      "batch": "第二批次"
    },
    {
      "seq": 72,
      "school": "长沙航天学校",
      "plan": null,
      "cutoff": 513,
      "cityRank": null,
      "rankKind": "unknown",
      "rankRaw": "None*",
      "rankNote": "该班型无全市位次参照（单独录取）",
      "langMathEngTotal": 265,
      "batch": "第二批次"
    }
  ],
  "indicatorSchools": [
    {
      "seq": 1,
      "group": "雅礼",
      "school": "国防科大附属中学",
      "district": "开福区",
      "graduates": 284,
      "indicatorTotal": 56,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 11,
          "fillRatio": null,
          "minScore": 604
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 16,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 22,
          "fillRatio": null,
          "minScore": 519
        }
      }
    },
    {
      "seq": 2,
      "group": "长郡",
      "school": "湘珺未来学校",
      "district": "星沙",
      "graduates": 542,
      "indicatorTotal": 51,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 10,
          "fillRatio": null,
          "minScore": 602
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "6中",
          "plan": 20,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 3,
      "group": "长郡",
      "school": "麓山外国语实验中学",
      "district": "湘江新区",
      "graduates": 571,
      "indicatorTotal": 103,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 20,
          "fillRatio": 7.9,
          "minScore": 601
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 12,
          "fillRatio": 2.9,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 30,
          "fillRatio": 4.7,
          "minScore": 582
        },
        "other": {
          "counterpart": "六中",
          "plan": 41,
          "fillRatio": null,
          "minScore": 534
        }
      }
    },
    {
      "seq": 4,
      "group": "长郡",
      "school": "长郡雨花外国语（环科园）",
      "district": "雨花区",
      "graduates": 702,
      "indicatorTotal": 133,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 26,
          "fillRatio": null,
          "minScore": 601
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 16,
          "fillRatio": null,
          "minScore": 588
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 25,
          "fillRatio": null,
          "minScore": 581
        },
        "other": {
          "counterpart": "21中",
          "plan": 53,
          "fillRatio": null,
          "minScore": 526
        }
      }
    },
    {
      "seq": 5,
      "group": "长郡",
      "school": "长郡外国语实验中学",
      "district": "天心区",
      "graduates": 1318,
      "indicatorTotal": 251,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 49,
          "fillRatio": 5.8,
          "minScore": 601
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 30,
          "fillRatio": 5.5,
          "minScore": 590
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 72,
          "fillRatio": 4.9,
          "minScore": 575
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 100,
          "fillRatio": null,
          "minScore": 523
        }
      }
    },
    {
      "seq": 6,
      "group": "长郡",
      "school": "长郡双语实验中学",
      "district": "湘江新区",
      "graduates": 1312,
      "indicatorTotal": 242,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 49,
          "fillRatio": 8.22448979591837,
          "minScore": 600
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 28,
          "fillRatio": 2.42857142857143,
          "minScore": 577
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 69,
          "fillRatio": 3.1304347826087,
          "minScore": 573
        },
        "other": {
          "counterpart": "六中",
          "plan": 96,
          "fillRatio": null,
          "minScore": 519
        }
      }
    },
    {
      "seq": 7,
      "group": "雅礼",
      "school": "长沙市怡海中学",
      "district": "天心区",
      "graduates": 617,
      "indicatorTotal": 108,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 21,
          "fillRatio": 5.42857142857143,
          "minScore": 599
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 13,
          "fillRatio": 3.61538461538462,
          "minScore": 585
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 21,
          "fillRatio": 3.71428571428571,
          "minScore": 578
        },
        "other": {
          "counterpart": "长外",
          "plan": 43,
          "fillRatio": null,
          "minScore": 536
        }
      }
    },
    {
      "seq": 8,
      "group": "附中",
      "school": "湖南师大附中（初中部）",
      "district": "湘江新区",
      "graduates": 242,
      "indicatorTotal": 39,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 8,
          "fillRatio": null,
          "minScore": 598
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 9,
      "group": "长郡",
      "school": "湘郡培粹实验中学",
      "district": "天心区",
      "graduates": 689,
      "indicatorTotal": 123,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 24,
          "fillRatio": 5.2,
          "minScore": 598
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 15,
          "fillRatio": 4.0,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 35,
          "fillRatio": 5.4,
          "minScore": 577
        },
        "other": {
          "counterpart": "11中（城南）",
          "plan": 49,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 10,
      "group": "雅礼",
      "school": "中雅培粹学校（北校区）",
      "district": "雨花区",
      "graduates": 532,
      "indicatorTotal": 85,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 17,
          "fillRatio": null,
          "minScore": 598
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 10,
          "fillRatio": null,
          "minScore": 586
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 16,
          "fillRatio": null,
          "minScore": 578
        },
        "other": {
          "counterpart": "15中",
          "plan": 34,
          "fillRatio": null,
          "minScore": 531
        }
      }
    },
    {
      "seq": 11,
      "group": "附中",
      "school": "师大附中博才学士中学",
      "district": "湘江新区",
      "graduates": 905,
      "indicatorTotal": 171,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 34,
          "fillRatio": 6.4,
          "minScore": 597
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 20,
          "fillRatio": 3.9,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 49,
          "fillRatio": 6.5,
          "minScore": 573
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 68,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 12,
      "group": "长郡",
      "school": "长郡双语白石湖学校",
      "district": "望城区",
      "graduates": 1288,
      "indicatorTotal": 248,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 49,
          "fillRatio": 4.6,
          "minScore": 597
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 30,
          "fillRatio": 3.5,
          "minScore": 577
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 71,
          "fillRatio": 4.8,
          "minScore": 572
        },
        "other": {
          "counterpart": "长斑",
          "plan": 98,
          "fillRatio": null,
          "minScore": 522
        }
      }
    },
    {
      "seq": 13,
      "group": "雅礼",
      "school": "长沙市南雅中学",
      "district": "雨花区",
      "graduates": 764,
      "indicatorTotal": 143,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 28,
          "fillRatio": null,
          "minScore": 597
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 17,
          "fillRatio": null,
          "minScore": 584
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 27,
          "fillRatio": null,
          "minScore": 588
        },
        "other": {
          "counterpart": "长外",
          "plan": 57,
          "fillRatio": null,
          "minScore": 543
        }
      }
    },
    {
      "seq": 14,
      "group": "长郡",
      "school": "麓山国际实验学校",
      "district": "湘江新区",
      "graduates": 942,
      "indicatorTotal": 178,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 35,
          "fillRatio": 2.8,
          "minScore": 597
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 21,
          "fillRatio": 3.5,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 51,
          "fillRatio": 6.2,
          "minScore": 587
        },
        "other": {
          "counterpart": "6中",
          "plan": 71,
          "fillRatio": null,
          "minScore": 550
        }
      }
    },
    {
      "seq": 15,
      "group": "附中",
      "school": "师大附中梅溪湖中学",
      "district": "湘江新区",
      "graduates": 846,
      "indicatorTotal": 162,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 32,
          "fillRatio": 6.65625,
          "minScore": 596
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 19,
          "fillRatio": 5.84210526315789,
          "minScore": 585
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 46,
          "fillRatio": null,
          "minScore": 571
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 65,
          "fillRatio": null,
          "minScore": 534
        }
      }
    },
    {
      "seq": 16,
      "group": "一中",
      "school": "青竹湖湘一外国语学校",
      "district": "开福区",
      "graduates": 1033,
      "indicatorTotal": 195,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 38,
          "fillRatio": 6.92105263157895,
          "minScore": 596
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 23,
          "fillRatio": 4.04347826086957,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 56,
          "fillRatio": 4.19642857142857,
          "minScore": 571
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 78,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 17,
      "group": "明德",
      "school": "明德麓谷学校",
      "district": "湘江新区",
      "graduates": 367,
      "indicatorTotal": 70,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 14,
          "fillRatio": 3.1,
          "minScore": 596
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 8,
          "fillRatio": 4.1,
          "minScore": 589
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 20,
          "fillRatio": 7.7,
          "minScore": 584
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 28,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 18,
      "group": "雅礼",
      "school": "中雅培粹学校（南校区）",
      "district": "天心区",
      "graduates": 787,
      "indicatorTotal": 149,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 29,
          "fillRatio": null,
          "minScore": 596
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 18,
          "fillRatio": null,
          "minScore": 590
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 29,
          "fillRatio": null,
          "minScore": 577
        },
        "other": {
          "counterpart": "长外",
          "plan": 59,
          "fillRatio": null,
          "minScore": 546
        }
      }
    },
    {
      "seq": 19,
      "group": "附中",
      "school": "高新区思沁学校（民办）",
      "district": "湘江新区",
      "graduates": 458,
      "indicatorTotal": 70,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 14,
          "fillRatio": null,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 8,
          "fillRatio": null,
          "minScore": 580
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 20,
          "fillRatio": null,
          "minScore": 572
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 28,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 20,
      "group": "一中",
      "school": "长沙市一中双语实验学校",
      "district": "芙蓉区",
      "graduates": 909,
      "indicatorTotal": 175,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 34,
          "fillRatio": 5.4,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 21,
          "fillRatio": 4.6,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 50,
          "fillRatio": 3.4,
          "minScore": 570
        },
        "other": {
          "counterpart": "6中",
          "plan": 70,
          "fillRatio": null,
          "minScore": 547
        }
      }
    },
    {
      "seq": 21,
      "group": "雅礼",
      "school": "长雅中学",
      "district": "开福区",
      "graduates": 761,
      "indicatorTotal": 147,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 29,
          "fillRatio": 2.89655172413793,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 18,
          "fillRatio": 3.66666666666667,
          "minScore": 587
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 28,
          "fillRatio": 4.28571428571429,
          "minScore": 578
        },
        "other": {
          "counterpart": "地质",
          "plan": 58,
          "fillRatio": null,
          "minScore": 521
        }
      }
    },
    {
      "seq": 22,
      "group": "雅礼",
      "school": "雅礼实验中学",
      "district": "雨花区",
      "graduates": 621,
      "indicatorTotal": 116,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 23,
          "fillRatio": 3.4,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 14,
          "fillRatio": 3.2,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 22,
          "fillRatio": 4.5,
          "minScore": 576
        },
        "other": {
          "counterpart": "15中",
          "plan": 46,
          "fillRatio": null,
          "minScore": 531
        }
      }
    },
    {
      "seq": 23,
      "group": "雅礼",
      "school": "中南附属中学（天心校区）",
      "district": "天心区",
      "graduates": 169,
      "indicatorTotal": 31,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 6,
          "fillRatio": null,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 4,
          "fillRatio": null,
          "minScore": 585
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 6,
          "fillRatio": null,
          "minScore": 579
        },
        "other": {
          "counterpart": "15中",
          "plan": 12,
          "fillRatio": null,
          "minScore": 533
        }
      }
    },
    {
      "seq": 24,
      "group": "长郡",
      "school": "长郡梅溪湖中学",
      "district": "湘江新区",
      "graduates": 872,
      "indicatorTotal": 167,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 33,
          "fillRatio": 4.60606060606061,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 20,
          "fillRatio": 2.35,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 47,
          "fillRatio": 5.21276595744681,
          "minScore": 581
        },
        "other": {
          "counterpart": "6中",
          "plan": 67,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 25,
      "group": "雅礼",
      "school": "长沙市雅境中学",
      "district": "雨花区",
      "graduates": 770,
      "indicatorTotal": 147,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 29,
          "fillRatio": 1.8,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 18,
          "fillRatio": 1.9,
          "minScore": 586
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 28,
          "fillRatio": 3.4,
          "minScore": 584
        },
        "other": {
          "counterpart": "地质",
          "plan": 58,
          "fillRatio": null,
          "minScore": 540
        }
      }
    },
    {
      "seq": 26,
      "group": "雅礼",
      "school": "长沙外国语学校",
      "district": "雨花区",
      "graduates": 746,
      "indicatorTotal": 141,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 28,
          "fillRatio": 3.0,
          "minScore": 595
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 17,
          "fillRatio": 2.9,
          "minScore": 590
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 25,
          "fillRatio": 3.8,
          "minScore": 582
        },
        "other": {
          "counterpart": "长外",
          "plan": 58,
          "fillRatio": null,
          "minScore": 556
        }
      }
    },
    {
      "seq": 27,
      "group": "附中",
      "school": "师大附中双语实验学校（南）",
      "district": "天心区",
      "graduates": 651,
      "indicatorTotal": 124,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 24,
          "fillRatio": null,
          "minScore": 594
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 15,
          "fillRatio": null,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 36,
          "fillRatio": null,
          "minScore": 576
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 49,
          "fillRatio": null,
          "minScore": 540
        }
      }
    },
    {
      "seq": 28,
      "group": "附中",
      "school": "湖南师大附属滨江学校",
      "district": "湘江新区",
      "graduates": 469,
      "indicatorTotal": 91,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 18,
          "fillRatio": null,
          "minScore": 594
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 11,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 26,
          "fillRatio": null,
          "minScore": 571
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 36,
          "fillRatio": null,
          "minScore": 528
        }
      }
    },
    {
      "seq": 29,
      "group": "雅礼",
      "school": "北雅中学",
      "district": "开福区",
      "graduates": 968,
      "indicatorTotal": 186,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 37,
          "fillRatio": 2.9,
          "minScore": 594
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 22,
          "fillRatio": 3.1,
          "minScore": 588
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 35,
          "fillRatio": 3.5,
          "minScore": 579
        },
        "other": {
          "counterpart": "11中（城南）",
          "plan": 74,
          "fillRatio": null,
          "minScore": 522
        }
      }
    },
    {
      "seq": 30,
      "group": "长郡",
      "school": "望城金海实验学校（民办）",
      "district": "望城区",
      "graduates": 525,
      "indicatorTotal": 76,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 15,
          "fillRatio": null,
          "minScore": 594
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 9,
          "fillRatio": null,
          "minScore": 584
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 22,
          "fillRatio": null,
          "minScore": 559
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 30,
          "fillRatio": null,
          "minScore": 535
        }
      }
    },
    {
      "seq": 31,
      "group": "雅礼",
      "school": "雅礼洋湖实验中学",
      "district": "湘江新区",
      "graduates": 726,
      "indicatorTotal": 141,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 28,
          "fillRatio": 3.0,
          "minScore": 593
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 17,
          "fillRatio": 8.9,
          "minScore": 588
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 40,
          "fillRatio": 4.7,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 56,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 32,
      "group": "附中",
      "school": "湘江新区培圣学校（民办）",
      "district": "湘江新区",
      "graduates": 360,
      "indicatorTotal": 60,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 12,
          "fillRatio": null,
          "minScore": 593
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 7,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 17,
          "fillRatio": null,
          "minScore": 577
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 24,
          "fillRatio": null,
          "minScore": 534
        }
      }
    },
    {
      "seq": 33,
      "group": "附中",
      "school": "师大附中博才梅溪湖中学",
      "district": "湘江新区",
      "graduates": 883,
      "indicatorTotal": 171,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 34,
          "fillRatio": 3.2,
          "minScore": 593
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 20,
          "fillRatio": 2.2,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 49,
          "fillRatio": 7.2,
          "minScore": 574
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 68,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 34,
      "group": "一中",
      "school": "长沙市立信学校（民办）",
      "district": "开福区",
      "graduates": 747,
      "indicatorTotal": 136,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 27,
          "fillRatio": null,
          "minScore": 593
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 16,
          "fillRatio": null,
          "minScore": 582
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 39,
          "fillRatio": null,
          "minScore": 571
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 54,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 35,
      "group": "雅礼",
      "school": "雅礼外国语学校",
      "district": "天心区",
      "graduates": 1155,
      "indicatorTotal": 220,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 43,
          "fillRatio": 2.6,
          "minScore": 593
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 26,
          "fillRatio": 2.3,
          "minScore": 586
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 42,
          "fillRatio": 2.5,
          "minScore": 586
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 88,
          "fillRatio": null,
          "minScore": 547
        }
      }
    },
    {
      "seq": 36,
      "group": "附中",
      "school": "长沙市华益中学（民办）",
      "district": "雨花区",
      "graduates": 1280,
      "indicatorTotal": 224,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 44,
          "fillRatio": null,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 27,
          "fillRatio": null,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 43,
          "fillRatio": null,
          "minScore": 580
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 89,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 37,
      "group": "周南",
      "school": "周南梅溪湖中学",
      "district": "湘江新区",
      "graduates": 636,
      "indicatorTotal": 121,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 24,
          "fillRatio": 3.2,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 14,
          "fillRatio": 4.0,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 35,
          "fillRatio": 5.0,
          "minScore": 579
        },
        "other": {
          "counterpart": "6中",
          "plan": 48,
          "fillRatio": null,
          "minScore": 537
        }
      }
    },
    {
      "seq": 38,
      "group": "一中",
      "school": "长沙市一中初级中学",
      "district": "芙蓉区",
      "graduates": 629,
      "indicatorTotal": 118,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 23,
          "fillRatio": null,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 14,
          "fillRatio": null,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 34,
          "fillRatio": null,
          "minScore": 563
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 47,
          "fillRatio": null,
          "minScore": 536
        }
      }
    },
    {
      "seq": 39,
      "group": "附中",
      "school": "附中博才实验中学(天顶)",
      "district": "湘江新区",
      "graduates": 1026,
      "indicatorTotal": 189,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 37,
          "fillRatio": null,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 23,
          "fillRatio": null,
          "minScore": 580
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 55,
          "fillRatio": null,
          "minScore": 569
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 74,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 40,
      "group": "雅礼",
      "school": "西雅中学",
      "district": "湘江新区",
      "graduates": 950,
      "indicatorTotal": 183,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 36,
          "fillRatio": 2.3,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "雅礼（光达）",
          "plan": 22,
          "fillRatio": 3.5,
          "minScore": 587
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 35,
          "fillRatio": 3.7,
          "minScore": 581
        },
        "other": {
          "counterpart": "15中",
          "plan": 73,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 41,
      "group": "长郡",
      "school": "长郡双语谷山实验中学",
      "district": "湘江新区",
      "graduates": 986,
      "indicatorTotal": 187,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 37,
          "fillRatio": 3.5,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 22,
          "fillRatio": 5.7,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 54,
          "fillRatio": 4.5,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 74,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 42,
      "group": "长郡",
      "school": "湖南大学附属中学",
      "district": "湘江新区",
      "graduates": 159,
      "indicatorTotal": 29,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 6,
          "fillRatio": null,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 3,
          "fillRatio": null,
          "minScore": 590
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 8,
          "fillRatio": null,
          "minScore": 582
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 12,
          "fillRatio": null,
          "minScore": 540
        }
      }
    },
    {
      "seq": 43,
      "group": "长郡",
      "school": "长郡双语雨花中学",
      "district": "雨花区",
      "graduates": 757,
      "indicatorTotal": 146,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 29,
          "fillRatio": null,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 17,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 28,
          "fillRatio": null,
          "minScore": 584
        },
        "other": {
          "counterpart": "21中",
          "plan": 58,
          "fillRatio": null,
          "minScore": 533
        }
      }
    },
    {
      "seq": 44,
      "group": "附中",
      "school": "师大附中星城实验学校",
      "district": "望城区",
      "graduates": 1393,
      "indicatorTotal": 266,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 51,
          "fillRatio": 2.3,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 33,
          "fillRatio": 2.9,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 76,
          "fillRatio": 3.2,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 106,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 45,
      "group": "一中",
      "school": "长沙市一中新华都学校",
      "district": "雨花区",
      "graduates": 809,
      "indicatorTotal": 157,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 31,
          "fillRatio": null,
          "minScore": 592
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 19,
          "fillRatio": null,
          "minScore": 585
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 45,
          "fillRatio": null,
          "minScore": 575
        },
        "other": {
          "counterpart": "21中",
          "plan": 62,
          "fillRatio": null,
          "minScore": 536
        }
      }
    },
    {
      "seq": 46,
      "group": "长郡",
      "school": "长郡双语洋湖实验中学",
      "district": "湘江新区",
      "graduates": 417,
      "indicatorTotal": 78,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 15,
          "fillRatio": 2.9,
          "minScore": 591
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 9,
          "fillRatio": 4.6,
          "minScore": 588
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 23,
          "fillRatio": 7.0,
          "minScore": 579
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 31,
          "fillRatio": null,
          "minScore": 522
        }
      }
    },
    {
      "seq": 47,
      "group": "长郡",
      "school": "望城区珺琟学校（民办）",
      "district": "湘江新区",
      "graduates": 398,
      "indicatorTotal": 58,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 11,
          "fillRatio": null,
          "minScore": 590
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": 584
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 17,
          "fillRatio": null,
          "minScore": 573
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 23,
          "fillRatio": null,
          "minScore": 537
        }
      }
    },
    {
      "seq": 48,
      "group": "长郡",
      "school": "长郡滨江中学",
      "district": "湘江新区",
      "graduates": 554,
      "indicatorTotal": 106,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 21,
          "fillRatio": null,
          "minScore": 590
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 13,
          "fillRatio": null,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 30,
          "fillRatio": null,
          "minScore": 572
        },
        "other": {
          "counterpart": "长斑",
          "plan": 42,
          "fillRatio": null,
          "minScore": 521
        }
      }
    },
    {
      "seq": 49,
      "group": "一中",
      "school": "长沙市一中岳麓中学",
      "district": "湘江新区",
      "graduates": 679,
      "indicatorTotal": 131,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 26,
          "fillRatio": 3.5,
          "minScore": 589
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 16,
          "fillRatio": 6.1,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 37,
          "fillRatio": 3.8,
          "minScore": 563
        },
        "other": {
          "counterpart": "21中",
          "plan": 52,
          "fillRatio": null,
          "minScore": 518
        }
      }
    },
    {
      "seq": 50,
      "group": "雅礼",
      "school": "长沙市第一十五中学",
      "district": "雨花区",
      "graduates": 421,
      "indicatorTotal": 81,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 16,
          "fillRatio": 1.375,
          "minScore": 589
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 10,
          "fillRatio": 1.6,
          "minScore": 585
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 15,
          "fillRatio": null,
          "minScore": 577
        },
        "other": {
          "counterpart": "15中",
          "plan": 32,
          "fillRatio": null,
          "minScore": 577
        }
      }
    },
    {
      "seq": 51,
      "group": "长郡",
      "school": "长郡天心实验学校",
      "district": "天心区",
      "graduates": 367,
      "indicatorTotal": 70,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 14,
          "fillRatio": null,
          "minScore": 589
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 8,
          "fillRatio": null,
          "minScore": 586
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 20,
          "fillRatio": null,
          "minScore": 577
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 28,
          "fillRatio": null,
          "minScore": 527
        }
      }
    },
    {
      "seq": 52,
      "group": "长郡",
      "school": "长郡芙蓉",
      "district": "芙蓉区",
      "graduates": 681,
      "indicatorTotal": 133,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 26,
          "fillRatio": null,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 16,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 38,
          "fillRatio": null,
          "minScore": 568
        },
        "other": {
          "counterpart": "地质",
          "plan": 53,
          "fillRatio": null,
          "minScore": 523
        }
      }
    },
    {
      "seq": 53,
      "group": "附中",
      "school": "师大附中高新实验中学",
      "district": "湘江新区",
      "graduates": 971,
      "indicatorTotal": 185,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 36,
          "fillRatio": 2.44444444444444,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 22,
          "fillRatio": 4.04545454545455,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 53,
          "fillRatio": 6.22641509433962,
          "minScore": 569
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 74,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 54,
      "group": "一中",
      "school": "长沙市一中马王堆中学",
      "district": "芙蓉区",
      "graduates": 601,
      "indicatorTotal": 116,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 23,
          "fillRatio": 2.1,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 14,
          "fillRatio": 3.0,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 33,
          "fillRatio": 4.3,
          "minScore": 570
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 46,
          "fillRatio": null,
          "minScore": 534
        }
      }
    },
    {
      "seq": 55,
      "group": "长郡",
      "school": "雨花区金海中学（民办）",
      "district": "雨花区",
      "graduates": 735,
      "indicatorTotal": 123,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 24,
          "fillRatio": null,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 15,
          "fillRatio": null,
          "minScore": 587
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 23,
          "fillRatio": null,
          "minScore": 579
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 49,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 56,
      "group": "长郡",
      "school": "长郡雨花外国语左家塘学校",
      "district": "雨花区",
      "graduates": 385,
      "indicatorTotal": 71,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 14,
          "fillRatio": null,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 9,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 20,
          "fillRatio": null,
          "minScore": 567
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 28,
          "fillRatio": null,
          "minScore": 550
        }
      }
    },
    {
      "seq": 57,
      "group": "长郡",
      "school": "麓山国际洋湖实验学校",
      "district": "湘江新区",
      "graduates": 287,
      "indicatorTotal": 55,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 11,
          "fillRatio": null,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 6,
          "fillRatio": null,
          "minScore": 580
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 16,
          "fillRatio": null,
          "minScore": 577
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 22,
          "fillRatio": null,
          "minScore": 516
        }
      }
    },
    {
      "seq": 58,
      "group": "长郡",
      "school": "长郡开福中学",
      "district": "开福区",
      "graduates": 526,
      "indicatorTotal": 101,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 20,
          "fillRatio": null,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 12,
          "fillRatio": null,
          "minScore": 574
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 29,
          "fillRatio": null,
          "minScore": 573
        },
        "other": {
          "counterpart": "6中",
          "plan": 40,
          "fillRatio": null,
          "minScore": 554
        }
      }
    },
    {
      "seq": 59,
      "group": "附中",
      "school": "师大附中双语树人学校",
      "district": "天心区",
      "graduates": 408,
      "indicatorTotal": 75,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 15,
          "fillRatio": null,
          "minScore": 588
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 21,
          "fillRatio": null,
          "minScore": 572
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 30,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 60,
      "group": "一中",
      "school": "长沙市一中金山桥学校",
      "district": "望城区",
      "graduates": 645,
      "indicatorTotal": 123,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 24,
          "fillRatio": 1.8,
          "minScore": 587
        },
        "fourNew": {
          "counterpart": "一中（科学城）",
          "plan": 15,
          "fillRatio": 2.1,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 35,
          "fillRatio": 4.9,
          "minScore": 573
        },
        "other": {
          "counterpart": "长斑",
          "plan": 49,
          "fillRatio": null,
          "minScore": 530
        }
      }
    },
    {
      "seq": 61,
      "group": "雅礼",
      "school": "雅礼麓谷中学",
      "district": "湘江新区",
      "graduates": 847,
      "indicatorTotal": 164,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 32,
          "fillRatio": 1.9,
          "minScore": 587
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 20,
          "fillRatio": 3.1,
          "minScore": 582
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 47,
          "fillRatio": 6.1,
          "minScore": 572
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 65,
          "fillRatio": null,
          "minScore": 523
        }
      }
    },
    {
      "seq": 62,
      "group": "一中",
      "school": "长沙市一中广雅中学",
      "district": "开福区",
      "graduates": 413,
      "indicatorTotal": 79,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 16,
          "fillRatio": 2.6,
          "minScore": 586
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 9,
          "fillRatio": 2.3,
          "minScore": 578
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 23,
          "fillRatio": 3.3,
          "minScore": 564
        },
        "other": {
          "counterpart": "地质",
          "plan": 31,
          "fillRatio": null,
          "minScore": 532
        }
      }
    },
    {
      "seq": 63,
      "group": "附中",
      "school": "湖南师大附中雨花学校",
      "district": "雨花区",
      "graduates": 546,
      "indicatorTotal": 102,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 20,
          "fillRatio": null,
          "minScore": 586
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 12,
          "fillRatio": null,
          "minScore": 581
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 29,
          "fillRatio": null,
          "minScore": 571
        },
        "other": {
          "counterpart": "21中",
          "plan": 41,
          "fillRatio": null,
          "minScore": 539
        }
      }
    },
    {
      "seq": 64,
      "group": "长郡",
      "school": "长郡月亮岛学校",
      "district": "望城区",
      "graduates": 915,
      "indicatorTotal": 176,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 35,
          "fillRatio": 1.5,
          "minScore": 586
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 21,
          "fillRatio": 3.6,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 50,
          "fillRatio": 5.2,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 70,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 65,
      "group": "雅礼",
      "school": "南雅双语实验中学",
      "district": "雨花区",
      "graduates": 768,
      "indicatorTotal": 148,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 29,
          "fillRatio": null,
          "minScore": 586
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 18,
          "fillRatio": null,
          "minScore": 587
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 28,
          "fillRatio": null,
          "minScore": 580
        },
        "other": {
          "counterpart": "长外",
          "plan": 59,
          "fillRatio": null,
          "minScore": 550
        }
      }
    },
    {
      "seq": 66,
      "group": "附中",
      "school": "附中博才实验中学(大科城)",
      "district": "湘江新区",
      "graduates": 317,
      "indicatorTotal": 59,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 12,
          "fillRatio": null,
          "minScore": 586
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 7,
          "fillRatio": null,
          "minScore": 571
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 17,
          "fillRatio": null,
          "minScore": 562
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 23,
          "fillRatio": null,
          "minScore": 524
        }
      }
    },
    {
      "seq": 67,
      "group": "附中",
      "school": "师大附中凌云中学",
      "district": "湘江新区",
      "graduates": 528,
      "indicatorTotal": 101,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 20,
          "fillRatio": 1.7,
          "minScore": 586
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 12,
          "fillRatio": 1.9,
          "minScore": 575
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 29,
          "fillRatio": 3.8,
          "minScore": 567
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 40,
          "fillRatio": null,
          "minScore": 521
        }
      }
    },
    {
      "seq": 68,
      "group": "长郡",
      "school": "麓山高岭实验学校",
      "district": "开福区",
      "graduates": 329,
      "indicatorTotal": 62,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 12,
          "fillRatio": 1.8,
          "minScore": 585
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 7,
          "fillRatio": 2.3,
          "minScore": 577
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 18,
          "fillRatio": 4.4,
          "minScore": 574
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 25,
          "fillRatio": null,
          "minScore": 543
        }
      }
    },
    {
      "seq": 69,
      "group": "市实验",
      "school": "长沙市田家炳实验中学",
      "district": "开福区",
      "graduates": 222,
      "indicatorTotal": 42,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 8,
          "fillRatio": null,
          "minScore": 585
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 5,
          "fillRatio": null,
          "minScore": 573
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 12,
          "fillRatio": null,
          "minScore": 570
        },
        "other": {
          "counterpart": "地质",
          "plan": 17,
          "fillRatio": null,
          "minScore": 538
        }
      }
    },
    {
      "seq": 70,
      "group": "长郡",
      "school": "开福区第一中学",
      "district": "开福区",
      "graduates": 477,
      "indicatorTotal": 91,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 18,
          "fillRatio": null,
          "minScore": 585
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 11,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 26,
          "fillRatio": null,
          "minScore": 575
        },
        "other": {
          "counterpart": "地质",
          "plan": 36,
          "fillRatio": null,
          "minScore": 543
        }
      }
    },
    {
      "seq": 71,
      "group": "附中",
      "school": "湘江新区博才雨敞坪学校",
      "district": "湘江新区",
      "graduates": 111,
      "indicatorTotal": 22,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 4,
          "fillRatio": null,
          "minScore": 585
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 3,
          "fillRatio": null,
          "minScore": 569
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 5,
          "fillRatio": null,
          "minScore": 569
        },
        "other": {
          "counterpart": "15中",
          "plan": 10,
          "fillRatio": null,
          "minScore": 536
        }
      }
    },
    {
      "seq": 72,
      "group": "长郡",
      "school": "麓山滨江实验学校",
      "district": "湘江新区",
      "graduates": 437,
      "indicatorTotal": 82,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 16,
          "fillRatio": 4.3,
          "minScore": 585
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 10,
          "fillRatio": 1.25,
          "minScore": 578
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 24,
          "fillRatio": 5.33333333333333,
          "minScore": 580
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 32,
          "fillRatio": null,
          "minScore": 527
        }
      }
    },
    {
      "seq": 73,
      "group": "一中",
      "school": "长沙市第二十一中学",
      "district": "雨花区",
      "graduates": 424,
      "indicatorTotal": 82,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 16,
          "fillRatio": null,
          "minScore": 585
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 10,
          "fillRatio": null,
          "minScore": 576
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 23,
          "fillRatio": null,
          "minScore": 571
        },
        "other": {
          "counterpart": "21中",
          "plan": 33,
          "fillRatio": null,
          "minScore": 554
        }
      }
    },
    {
      "seq": 74,
      "group": "一中",
      "school": "青雅丽发学校",
      "district": "天心区",
      "graduates": 493,
      "indicatorTotal": 93,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 18,
          "fillRatio": 1.4,
          "minScore": 584
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 11,
          "fillRatio": 1.6,
          "minScore": 577
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 27,
          "fillRatio": 3.9,
          "minScore": 573
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 37,
          "fillRatio": null,
          "minScore": 548
        }
      }
    },
    {
      "seq": 75,
      "group": "长郡",
      "school": "长沙市第六中学",
      "district": "芙蓉区",
      "graduates": 389,
      "indicatorTotal": 75,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 15,
          "fillRatio": null,
          "minScore": 584
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 9,
          "fillRatio": null,
          "minScore": 583
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 20,
          "fillRatio": null,
          "minScore": 561
        },
        "other": {
          "counterpart": "6中",
          "plan": 31,
          "fillRatio": null,
          "minScore": 558
        }
      }
    },
    {
      "seq": 76,
      "group": "雅礼",
      "school": "湖南省地质中学",
      "district": "雨花区",
      "graduates": 461,
      "indicatorTotal": 87,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 17,
          "fillRatio": null,
          "minScore": 584
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 10,
          "fillRatio": null,
          "minScore": 570
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 17,
          "fillRatio": null,
          "minScore": 562
        },
        "other": {
          "counterpart": "地质",
          "plan": 35,
          "fillRatio": null,
          "minScore": 545
        }
      }
    },
    {
      "seq": 77,
      "group": "明德",
      "school": "明德天心中学",
      "district": "天心区",
      "graduates": 1098,
      "indicatorTotal": 208,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 41,
          "fillRatio": 1.7,
          "minScore": 584
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 25,
          "fillRatio": 3.3,
          "minScore": 580
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 59,
          "fillRatio": 5.6,
          "minScore": 580
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 83,
          "fillRatio": null,
          "minScore": 544
        }
      }
    },
    {
      "seq": 78,
      "group": "一中",
      "school": "一中城南中学（初中部）",
      "district": "天心区",
      "graduates": 820,
      "indicatorTotal": 158,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 31,
          "fillRatio": null,
          "minScore": 584
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 19,
          "fillRatio": null,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 45,
          "fillRatio": null,
          "minScore": 572
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 63,
          "fillRatio": null,
          "minScore": 524
        }
      }
    },
    {
      "seq": 79,
      "group": "雅礼",
      "school": "稻田中学",
      "district": "雨花区",
      "graduates": 699,
      "indicatorTotal": 133,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 26,
          "fillRatio": 1.5,
          "minScore": 583
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 16,
          "fillRatio": 1.6,
          "minScore": 578
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 25,
          "fillRatio": 3.0,
          "minScore": 573
        },
        "other": {
          "counterpart": "15中",
          "plan": 53,
          "fillRatio": null,
          "minScore": 542
        }
      }
    },
    {
      "seq": 80,
      "group": "一中",
      "school": "长沙铁路第一中学",
      "district": "芙蓉区",
      "graduates": 427,
      "indicatorTotal": 82,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 16,
          "fillRatio": 1.4,
          "minScore": 583
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 10,
          "fillRatio": 2.7,
          "minScore": 578
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 23,
          "fillRatio": 2.2,
          "minScore": 565
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 33,
          "fillRatio": null,
          "minScore": 548
        }
      }
    },
    {
      "seq": 81,
      "group": "长郡",
      "school": "长郡湘府中学",
      "district": "天心区",
      "graduates": 588,
      "indicatorTotal": 112,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 22,
          "fillRatio": null,
          "minScore": 583
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 32,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长外",
          "plan": 45,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 82,
      "group": "雅礼",
      "school": "雅礼雨花中学",
      "district": "雨花区",
      "graduates": 600,
      "indicatorTotal": 114,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 22,
          "fillRatio": null,
          "minScore": 583
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 14,
          "fillRatio": null,
          "minScore": 574
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 22,
          "fillRatio": null,
          "minScore": 575
        },
        "other": {
          "counterpart": "长外",
          "plan": 45,
          "fillRatio": null,
          "minScore": 553
        }
      }
    },
    {
      "seq": 83,
      "group": "一中",
      "school": "清水塘实验学校",
      "district": "开福区",
      "graduates": 292,
      "indicatorTotal": 56,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 11,
          "fillRatio": null,
          "minScore": 583
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 16,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 22,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 84,
      "group": "附中",
      "school": "湖南师大附中芙蓉中学",
      "district": "芙蓉区",
      "graduates": 863,
      "indicatorTotal": 165,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 32,
          "fillRatio": null,
          "minScore": 582
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 20,
          "fillRatio": null,
          "minScore": 578
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 47,
          "fillRatio": null,
          "minScore": 568
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 66,
          "fillRatio": null,
          "minScore": 543
        }
      }
    },
    {
      "seq": 85,
      "group": "集团外",
      "school": "望城一中外国语学校",
      "district": "望城区",
      "graduates": 624,
      "indicatorTotal": 119,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 23,
          "fillRatio": null,
          "minScore": 582
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 14,
          "fillRatio": null,
          "minScore": 572
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 23,
          "fillRatio": null,
          "minScore": 563
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 48,
          "fillRatio": null,
          "minScore": 567
        }
      }
    },
    {
      "seq": 86,
      "group": "雅礼",
      "school": "中雅培粹双语中学",
      "district": "雨花区",
      "graduates": 639,
      "indicatorTotal": 121,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 24,
          "fillRatio": 1.1,
          "minScore": 582
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 14,
          "fillRatio": 1.8,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 23,
          "fillRatio": 2.9,
          "minScore": null
        },
        "other": {
          "counterpart": "21中",
          "plan": 48,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 87,
      "group": "市实验",
      "school": "长沙市实验中学",
      "district": "芙蓉区",
      "graduates": 194,
      "indicatorTotal": 37,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 7,
          "fillRatio": null,
          "minScore": 582
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 4,
          "fillRatio": null,
          "minScore": 553
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 12,
          "fillRatio": null,
          "minScore": 575
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 14,
          "fillRatio": null,
          "minScore": 540
        }
      }
    },
    {
      "seq": 88,
      "group": "附中",
      "school": "师大附中星城实验青石学校",
      "district": "望城区",
      "graduates": 182,
      "indicatorTotal": 33,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 7,
          "fillRatio": null,
          "minScore": 580
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 4,
          "fillRatio": null,
          "minScore": 571
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 9,
          "fillRatio": null,
          "minScore": 556
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 13,
          "fillRatio": null,
          "minScore": 543
        }
      }
    },
    {
      "seq": 89,
      "group": "长郡",
      "school": "长郡雨花外国语洪塘学校",
      "district": "雨花区",
      "graduates": 528,
      "indicatorTotal": 102,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 20,
          "fillRatio": null,
          "minScore": 580
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 12,
          "fillRatio": null,
          "minScore": 579
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 29,
          "fillRatio": null,
          "minScore": 574
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 41,
          "fillRatio": null,
          "minScore": 541
        }
      }
    },
    {
      "seq": 90,
      "group": "附中",
      "school": "师大附中特立学校",
      "district": "雨花区",
      "graduates": 466,
      "indicatorTotal": 91,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 18,
          "fillRatio": null,
          "minScore": 580
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 11,
          "fillRatio": null,
          "minScore": 573
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 26,
          "fillRatio": null,
          "minScore": 572
        },
        "other": {
          "counterpart": "21中",
          "plan": 36,
          "fillRatio": null,
          "minScore": 545
        }
      }
    },
    {
      "seq": 91,
      "group": "长郡",
      "school": "长郡麓谷中学（金洲中学）",
      "district": "湘江新区",
      "graduates": 616,
      "indicatorTotal": 118,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 23,
          "fillRatio": null,
          "minScore": 580
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 14,
          "fillRatio": null,
          "minScore": 567
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 34,
          "fillRatio": null,
          "minScore": 571
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 47,
          "fillRatio": null,
          "minScore": 536
        }
      }
    },
    {
      "seq": 92,
      "group": "雅礼",
      "school": "望城区雅礼丁江学校",
      "district": "望城区",
      "graduates": 250,
      "indicatorTotal": 48,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 9,
          "fillRatio": null,
          "minScore": 579
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 19,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 93,
      "group": "周南",
      "school": "周南望城学校",
      "district": "望城区",
      "graduates": 417,
      "indicatorTotal": 81,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 16,
          "fillRatio": null,
          "minScore": 579
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 10,
          "fillRatio": null,
          "minScore": 575
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 23,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 32,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 94,
      "group": "明德",
      "school": "明德望城学校",
      "district": "望城区",
      "graduates": 278,
      "indicatorTotal": 52,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 10,
          "fillRatio": null,
          "minScore": 579
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 21,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 95,
      "group": "明德",
      "school": "明德洞井中学",
      "district": "雨花区",
      "graduates": 456,
      "indicatorTotal": 87,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 17,
          "fillRatio": null,
          "minScore": 577
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 10,
          "fillRatio": null,
          "minScore": 577
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 25,
          "fillRatio": null,
          "minScore": 572
        },
        "other": {
          "counterpart": "地质",
          "plan": 35,
          "fillRatio": null,
          "minScore": 542
        }
      }
    },
    {
      "seq": 96,
      "group": "雅礼",
      "school": "南雅湘江中学",
      "district": "湘江新区",
      "graduates": 563,
      "indicatorTotal": 108,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 21,
          "fillRatio": null,
          "minScore": 577
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 13,
          "fillRatio": null,
          "minScore": 573
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 31,
          "fillRatio": null,
          "minScore": 565
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 43,
          "fillRatio": null,
          "minScore": 537
        }
      }
    },
    {
      "seq": 97,
      "group": "明德",
      "school": "明德华兴中学",
      "district": "开福区",
      "graduates": 568,
      "indicatorTotal": 108,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 21,
          "fillRatio": 1.3,
          "minScore": 577
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 13,
          "fillRatio": 2.1,
          "minScore": 568
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 31,
          "fillRatio": 4.5,
          "minScore": 570
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 43,
          "fillRatio": null,
          "minScore": 539
        }
      }
    },
    {
      "seq": 98,
      "group": "雅礼",
      "school": "雅礼实验望城学校",
      "district": "望城区",
      "graduates": 180,
      "indicatorTotal": 32,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 6,
          "fillRatio": null,
          "minScore": 577
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 4,
          "fillRatio": null,
          "minScore": 574
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 6,
          "fillRatio": null,
          "minScore": 554
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 13,
          "fillRatio": null,
          "minScore": 554
        }
      }
    },
    {
      "seq": 99,
      "group": "长郡",
      "school": "长郡梅溪湖智谷中学",
      "district": "湘江新区",
      "graduates": 326,
      "indicatorTotal": 62,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 12,
          "fillRatio": null,
          "minScore": 577
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": 567
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 18,
          "fillRatio": null,
          "minScore": 566
        },
        "other": {
          "counterpart": "6中",
          "plan": 25,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 100,
      "group": "一中",
      "school": "湘一史家坡学校",
      "district": "开福区",
      "graduates": 533,
      "indicatorTotal": 103,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 20,
          "fillRatio": null,
          "minScore": 576
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 12,
          "fillRatio": null,
          "minScore": 576
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 30,
          "fillRatio": null,
          "minScore": 564
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 41,
          "fillRatio": null,
          "minScore": 537
        }
      }
    },
    {
      "seq": 101,
      "group": "长郡",
      "school": "长郡斑马湖中学",
      "district": "望城区",
      "graduates": 611,
      "indicatorTotal": 116,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 23,
          "fillRatio": null,
          "minScore": 575
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 14,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 33,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 46,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 102,
      "group": "周南",
      "school": "周南启明实验学校",
      "district": "湘江新区",
      "graduates": 313,
      "indicatorTotal": 57,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 11,
          "fillRatio": null,
          "minScore": 575
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 16,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 23,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 103,
      "group": "雅礼",
      "school": "望城区南雅望城学校",
      "district": "望城区",
      "graduates": 354,
      "indicatorTotal": 66,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 13,
          "fillRatio": null,
          "minScore": 574
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 8,
          "fillRatio": null,
          "minScore": 575
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 13,
          "fillRatio": null,
          "minScore": 564
        },
        "other": {
          "counterpart": "长斑",
          "plan": 26,
          "fillRatio": null,
          "minScore": 544
        }
      }
    },
    {
      "seq": 104,
      "group": "雅礼",
      "school": "南雅马栏山文创中学",
      "district": "开福区",
      "graduates": 409,
      "indicatorTotal": 79,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 16,
          "fillRatio": null,
          "minScore": 574
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 9,
          "fillRatio": null,
          "minScore": 567
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 15,
          "fillRatio": null,
          "minScore": 567
        },
        "other": {
          "counterpart": "地质",
          "plan": 31,
          "fillRatio": null,
          "minScore": 547
        }
      }
    },
    {
      "seq": 105,
      "group": "长郡",
      "school": "麓山国际望城实验学校",
      "district": "望城区",
      "graduates": 249,
      "indicatorTotal": 46,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 9,
          "fillRatio": null,
          "minScore": 573
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 106,
      "group": "明德",
      "school": "明德雨花实验中学",
      "district": "雨花区",
      "graduates": 488,
      "indicatorTotal": 92,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 18,
          "fillRatio": null,
          "minScore": 571
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 11,
          "fillRatio": null,
          "minScore": 573
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 26,
          "fillRatio": null,
          "minScore": 567
        },
        "other": {
          "counterpart": "长外",
          "plan": 37,
          "fillRatio": null,
          "minScore": 537
        }
      }
    },
    {
      "seq": 107,
      "group": "雅礼",
      "school": "中南附属中学（岳麓山）",
      "district": "湘江新区",
      "graduates": 83,
      "indicatorTotal": 15,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中（大泽湖）",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 108,
      "group": "长郡",
      "school": "长沙市德成学校",
      "district": "开福区",
      "graduates": 209,
      "indicatorTotal": 31,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 109,
      "group": "明德",
      "school": "长沙市明达中学（民办）",
      "district": "天心区",
      "graduates": 427,
      "indicatorTotal": 70,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 14,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 20,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "地质",
          "plan": 28,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 110,
      "group": "长郡",
      "school": "中嘉学校",
      "district": "湘江新区",
      "graduates": 328,
      "indicatorTotal": 50,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 10,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长外",
          "plan": 19,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 111,
      "group": "附中",
      "school": "附中博才实验中学(湘江)",
      "district": "湘江新区",
      "graduates": 506,
      "indicatorTotal": 98,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 19,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 28,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长外",
          "plan": 39,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 112,
      "group": "雅礼",
      "school": "东雅中学",
      "district": "芙蓉区",
      "graduates": 478,
      "indicatorTotal": 92,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 17,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 37,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 113,
      "group": "附中",
      "school": "湘仪中学",
      "district": "湘江新区",
      "graduates": 276,
      "indicatorTotal": 50,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 10,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 16,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 114,
      "group": "市实验",
      "school": "长沙市实验高裕学校",
      "district": "望城区",
      "graduates": 232,
      "indicatorTotal": 45,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 115,
      "group": "长郡",
      "school": "长沙市第一十一中学",
      "district": "雨花区",
      "graduates": 348,
      "indicatorTotal": 66,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 27,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 116,
      "group": "周南",
      "school": "周南实验中学",
      "district": "开福区",
      "graduates": 341,
      "indicatorTotal": 66,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 19,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 26,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 117,
      "group": "集团外",
      "school": "向阳中学",
      "district": "望城区",
      "graduates": 334,
      "indicatorTotal": 62,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 25,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 118,
      "group": "附中",
      "school": "同升湖实验学校",
      "district": "雨花区",
      "graduates": 308,
      "indicatorTotal": 49,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 10,
          "fillRatio": 1.5,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 6,
          "fillRatio": 1.7,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 9,
          "fillRatio": 4.0,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 19,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 119,
      "group": "集团外",
      "school": "友仁中学",
      "district": "望城区",
      "graduates": 197,
      "indicatorTotal": 37,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 120,
      "group": "市实验",
      "school": "桥驿中学",
      "district": "望城区",
      "graduates": 137,
      "indicatorTotal": 25,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 10,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 121,
      "group": "明德",
      "school": "明德美琪学校",
      "district": "望城区",
      "graduates": 258,
      "indicatorTotal": 49,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 10,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 14,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 19,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 122,
      "group": "一中",
      "school": "长沙市一中博雅学校",
      "district": "望城区",
      "graduates": 166,
      "indicatorTotal": 31,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 123,
      "group": "周南",
      "school": "周南学士实验学校",
      "district": "湘江新区",
      "graduates": 320,
      "indicatorTotal": 60,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 17,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 24,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 124,
      "group": "市实验",
      "school": "长沙实验雨花中学",
      "district": "雨花区",
      "graduates": 458,
      "indicatorTotal": 87,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 17,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 10,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 25,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "11中(城南)",
          "plan": 35,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 125,
      "group": "雅礼",
      "school": "长沙大学附属中学",
      "district": "开福区",
      "graduates": 127,
      "indicatorTotal": 22,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 126,
      "group": "周南",
      "school": "周南秀峰学校",
      "district": "开福区",
      "graduates": 393,
      "indicatorTotal": 75,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 21,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长铁一中",
          "plan": 30,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 127,
      "group": "集团外",
      "school": "书堂中学",
      "district": "望城区",
      "graduates": 144,
      "indicatorTotal": 27,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 128,
      "group": "附中",
      "school": "湖南师大附中植基中学",
      "district": "开福区",
      "graduates": 488,
      "indicatorTotal": 93,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 27,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "地质",
          "plan": 37,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 129,
      "group": "附中",
      "school": "靖港中学",
      "district": "望城区",
      "graduates": 166,
      "indicatorTotal": 32,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 130,
      "group": "集团外",
      "school": "大湖中学",
      "district": "望城区",
      "graduates": 463,
      "indicatorTotal": 89,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 18,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 17,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 35,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 131,
      "group": "集团外",
      "school": "望城区思源学校",
      "district": "望城区",
      "graduates": 154,
      "indicatorTotal": 27,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 132,
      "group": "集团外",
      "school": "白箬中学",
      "district": "望城区",
      "graduates": 144,
      "indicatorTotal": 27,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 133,
      "group": "集团外",
      "school": "黄金中学",
      "district": "望城区",
      "graduates": 127,
      "indicatorTotal": 24,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 134,
      "group": "集团外",
      "school": "贺龙中学",
      "district": "长沙县",
      "graduates": 110,
      "indicatorTotal": 17,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "21中",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 135,
      "group": "集团外",
      "school": "丁字中学",
      "district": "望城区",
      "graduates": 109,
      "indicatorTotal": 20,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 136,
      "group": "集团外",
      "school": "简文中学",
      "district": "望城区",
      "graduates": 96,
      "indicatorTotal": 17,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 137,
      "group": "集团外",
      "school": "含浦学校",
      "district": "岳麓区",
      "graduates": 76,
      "indicatorTotal": 14,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 138,
      "group": "集团外",
      "school": "长沙高新区白马中学",
      "district": "湘江新区",
      "graduates": 65,
      "indicatorTotal": 11,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 139,
      "group": "集团外",
      "school": "东城中学",
      "district": "望城区",
      "graduates": 54,
      "indicatorTotal": 10,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "麓山",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长斑",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 140,
      "group": "集团外",
      "school": "育红中学",
      "district": "望城区",
      "graduates": 41,
      "indicatorTotal": 7,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "15中",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 141,
      "group": "明德",
      "school": "明德启南中学",
      "district": "天心区",
      "graduates": 219,
      "indicatorTotal": 41,
      "tiers": {
        "fourBig": {
          "counterpart": "长郡",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 16,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 142,
      "group": "市实验",
      "school": "岳麓区莲花实验中学",
      "district": "湘江新区",
      "graduates": 304,
      "indicatorTotal": 58,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "长郡(奥体城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 17,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雅礼书院",
          "plan": 23,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 143,
      "group": "市实验",
      "school": "梅园中学",
      "district": "望城区",
      "graduates": 78,
      "indicatorTotal": 15,
      "tiers": {
        "fourBig": {
          "counterpart": "一中",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 6,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 144,
      "group": "市实验",
      "school": "望城区铜官中学",
      "district": "望城区",
      "graduates": 36,
      "indicatorTotal": 6,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 1,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "周南",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 145,
      "group": "周南",
      "school": "周南石燕湖中学",
      "district": "雨花区",
      "graduates": 561,
      "indicatorTotal": 108,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 21,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 13,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 31,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "11中(融城)",
          "plan": 43,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 146,
      "group": "附中",
      "school": "长沙市岳麓区博致学校",
      "district": "湘江新区",
      "graduates": 75,
      "indicatorTotal": 14,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 3,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 2,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "实验",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "望城一中",
          "plan": 5,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 147,
      "group": "明德",
      "school": "明德华兴智谷学校",
      "district": "湘江新区",
      "graduates": 187,
      "indicatorTotal": 35,
      "tiers": {
        "fourBig": {
          "counterpart": "附中",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "附中(大泽湖)",
          "plan": 4,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "明德",
          "plan": 10,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "雷锋",
          "plan": 14,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 148,
      "group": "雅礼",
      "school": "雅礼实验毓秀学校",
      "district": "雨花区",
      "graduates": 417,
      "indicatorTotal": 77,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "雅礼(光达)",
          "plan": 9,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 15,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长外",
          "plan": 31,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 149,
      "group": "雅礼",
      "school": "雅礼洋湖英才学校湘江校区",
      "district": "湘江新区",
      "graduates": 331,
      "indicatorTotal": 63,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 8,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 12,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长外",
          "plan": 25,
          "fillRatio": null,
          "minScore": null
        }
      }
    },
    {
      "seq": 150,
      "group": "雅礼",
      "school": "雅礼洋湖英才学校蓝天校区",
      "district": "湘江新区",
      "graduates": 297,
      "indicatorTotal": 57,
      "tiers": {
        "fourBig": {
          "counterpart": "雅礼",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "fourNew": {
          "counterpart": "一中(科学城)",
          "plan": 7,
          "fillRatio": null,
          "minScore": null
        },
        "fiveSmall": {
          "counterpart": "南雅",
          "plan": 11,
          "fillRatio": null,
          "minScore": null
        },
        "other": {
          "counterpart": "长外",
          "plan": 23,
          "fillRatio": null,
          "minScore": null
        }
      }
    }
  ],
  "indicatorTotals": {
    "graduates": 75207,
    "indicatorPlan": 14052,
    "planByTier": {
      "fourBig": 2760,
      "fourNew": 1680,
      "fiveSmall": 3660,
      "other": 5592
    },
    "admitted": 13607,
    "completionRate": 0.9683
  },
  "rulePoints": [
    {
      "title": "指标生是校内竞争，不是全市竞争",
      "detail": "举例：A初中分到B高中15个指标，A初中有20人填报B高中指标生志愿，B高中今年的指标生最低控制线是516分。那么A初中516分及以上的考生按分数从高到低排，录取前15名。所以关键不是全市排名，是你在本校填同一所高中的这批人里排第几。"
    },
    {
      "title": "指标生最低控制线 ≠ 录取线",
      "detail": "2026年三层次控制线：第一层次563分、第二层次553分、第三层次516分。它只是一条入围线。实际录取线可能高于控制线，也可能恰好等于控制线——取决于本校填报人数和分数分布。"
    },
    {
      "title": "录取了不能放弃，网上志愿会作废",
      "detail": "网上填报志愿在指标生录取之前进行，已填指标生志愿的考生仍需上网填志愿；但一旦被指标生录取，网上所填志愿自动无效，且不得放弃、不参与其他学校录取。所以指标生不是「多一个机会」，而是「提前锁定」，填之前要想清楚。"
    },
    {
      "title": "入围是硬门槛",
      "detail": "① 报考第一批次学校（含四大本部及新校区、明德、周南、市实验、麓山国际、南雅、南雅东校），生物学、地理成绩须均达B等及以上；② 综合素质评价须达规定等第。这两条不达标，分数再高也不能录。"
    },
    {
      "title": "同分怎么比",
      "detail": "总分相同时，不比较综合素质评价，改为比较语文、数学、英语三科总成绩。所以语数英三科的稳定性，直接决定同分段的排序位置。"
    },
    {
      "title": "指标生名额怎么来的",
      "detail": "每所初中通常分配到四所不同层次高中的指标：四大之一、四新之一、五小之一、其他高中之一。每个学生只能填报其中一所。2026年全市指标生计划14052个，实际录取13607个，完成率96.83%。"
    },
    {
      "title": "一个容易被忽略的连带影响",
      "detail": "指标生完成率越高，滚入划线录取的名额就越少，划线生的竞争反而更激烈。2026年四大四新指标生完成率已达97.09%。也就是说：靠指标生进名校越来越普遍，靠裸分挤名校的窗口在收窄。"
    },
    {
      "title": "什么时候做决定",
      "detail": "指标生志愿填报一般在明年5月五一假期后启动。但真正的准备是现在：9月到明年4月的每一次大考位次，就是你判断「敢不敢填、填哪一所」的全部底气。"
    }
  ]
} as unknown as Dataset;

export default data;
