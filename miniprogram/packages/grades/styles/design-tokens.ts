// Runtime counterpart of design-tokens.json.
const data = {
  "meta": {
    "source": "docs/UI规范-2.3.1-可读性.md",
    "spec": "docs/SPEC-v1.md §8",
    "theme": "light",
    "note": "前端落地副本，与 miniprogram/styles/design-tokens.wxss **全量对齐**（wxss 的每个 CSS 变量在此都有对应项，命名 kebab 转 camel）；设计师若调整，先改此文件再同步 wxss。"
  },
  "color": {
    "bg": {
      "value": "#FAFAF7",
      "type": "color"
    },
    "surface": {
      "value": "#FFFFFF",
      "type": "color"
    },
    "surface2": {
      "value": "#EFF2EC",
      "type": "color"
    },
    "fg": {
      "value": "#263B37",
      "type": "color"
    },
    "fg2": {
      "value": "#465D56",
      "type": "color"
    },
    "muted": {
      "value": "#65736B",
      "type": "color"
    },
    "meta": {
      "value": "#98A2A5",
      "type": "color"
    },
    "border": {
      "value": "#E2E8E2",
      "type": "color"
    },
    "borderSoft": {
      "value": "#EDF0EB",
      "type": "color"
    },
    "accent": {
      "value": "#245D50",
      "type": "color"
    },
    "accentHover": {
      "value": "#244E40",
      "type": "color"
    },
    "accentActive": {
      "value": "#1C4334",
      "type": "color"
    },
    "accentSubtle": {
      "value": "#EDF3EE",
      "type": "color"
    },
    "accentOn": {
      "value": "#FFFFFF",
      "type": "color"
    },
    "tierChong": {
      "value": "#855C35",
      "type": "color"
    },
    "tierChongBg": {
      "value": "#F7F0E6",
      "type": "color"
    },
    "tierWen": {
      "value": "#245D50",
      "type": "color"
    },
    "tierWenBg": {
      "value": "#EDF3EE",
      "type": "color"
    },
    "tierBao": {
      "value": "#4D6B82",
      "type": "color"
    },
    "tierBaoBg": {
      "value": "#EDF2F7",
      "type": "color"
    },
    "trendUp": {
      "value": "#126A32",
      "type": "color"
    },
    "trendUpBg": {
      "value": "#E9F5EE",
      "type": "color"
    },
    "trendDown": {
      "value": "#C0392B",
      "type": "color"
    },
    "trendDownBg": {
      "value": "#FBECEA",
      "type": "color"
    },
    "success": {
      "value": "#126A32",
      "type": "color"
    },
    "warn": {
      "value": "#B45309",
      "type": "color"
    },
    "warnBg": {
      "value": "#FBF3E4",
      "type": "color"
    },
    "danger": {
      "value": "#B91C1C",
      "type": "color"
    },
    "canvas": {
      "value": "#E9EBEB",
      "type": "color"
    }
  },
  "font": {
    "family": {
      "value": "PingFang SC, HarmonyOS Sans SC, MiSans, Source Han Sans SC, Noto Sans SC, Microsoft YaHei, -apple-system, sans-serif",
      "type": "fontFamily"
    },
    "display": {
      "value": "PingFang SC, HarmonyOS Sans SC, MiSans, Source Han Sans SC, Noto Sans SC, Microsoft YaHei, -apple-system, sans-serif",
      "type": "fontFamily"
    },
    "numFamily": {
      "value": "DIN Alternate, SF Pro Display, Helvetica Neue, PingFang SC, sans-serif",
      "type": "fontFamily"
    },
    "size": {
      "xs": {
        "value": "15px",
        "type": "dimension"
      },
      "sm": {
        "value": "15px",
        "type": "dimension"
      },
      "base": {
        "value": "17px",
        "type": "dimension"
      },
      "lg": {
        "value": "20px",
        "type": "dimension"
      },
      "xl": {
        "value": "24px",
        "type": "dimension"
      },
      "2xl": {
        "value": "28px",
        "type": "dimension"
      },
      "3xl": {
        "value": "34px",
        "type": "dimension"
      },
      "4xl": {
        "value": "40px",
        "type": "dimension"
      }
    },
    "leading": {
      "xs": {
        "value": 1.5,
        "type": "number"
      },
      "sm": {
        "value": 1.5,
        "type": "number"
      },
      "base": {
        "value": 1.55,
        "type": "number"
      },
      "lg": {
        "value": 1.4,
        "type": "number"
      },
      "xl": {
        "value": 1.35,
        "type": "number"
      },
      "2xl": {
        "value": 1.2,
        "type": "number"
      },
      "3xl": {
        "value": 1.1,
        "type": "number"
      },
      "4xl": {
        "value": 1.2,
        "type": "number"
      },
      "relaxed": {
        "value": 1.7,
        "type": "number"
      },
      "body": {
        "value": 1.55,
        "type": "number"
      },
      "tight": {
        "value": 1.35,
        "type": "number"
      },
      "display": {
        "value": 1.2,
        "type": "number"
      }
    }
  },
  "border": {
    "width": {
      "value": "1px",
      "type": "dimension"
    }
  },
  "tap": {
    "min": {
      "value": "48px",
      "type": "dimension"
    }
  },
  "radius": {
    "sm": {
      "value": "6px",
      "type": "dimension"
    },
    "md": {
      "value": "10px",
      "type": "dimension"
    },
    "lg": {
      "value": "14px",
      "type": "dimension"
    },
    "pill": {
      "value": "9999px",
      "type": "dimension"
    }
  },
  "space": {
    "1": {
      "value": "4px",
      "type": "dimension"
    },
    "2": {
      "value": "8px",
      "type": "dimension"
    },
    "3": {
      "value": "12px",
      "type": "dimension"
    },
    "4": {
      "value": "16px",
      "type": "dimension"
    },
    "5": {
      "value": "20px",
      "type": "dimension"
    },
    "6": {
      "value": "24px",
      "type": "dimension"
    },
    "8": {
      "value": "32px",
      "type": "dimension"
    },
    "10": {
      "value": "40px",
      "type": "dimension"
    },
    "12": {
      "value": "48px",
      "type": "dimension"
    }
  },
  "chart": {
    "lineColor": {
      "value": "#4D6B82",
      "type": "color"
    },
    "lineWidth": {
      "value": 3,
      "type": "number"
    },
    "pointRadius": {
      "value": 4.5,
      "type": "number"
    },
    "hollowStroke": {
      "value": "#65736B",
      "type": "color"
    },
    "targetDash": {
      "value": [
        4,
        4
      ],
      "type": "numberArray"
    },
    "invertY": {
      "value": true,
      "type": "boolean"
    }
  },
  "shadow": {
    "flat": {
      "value": "none",
      "type": "boxShadow"
    },
    "ring": {
      "value": "0 0 0 1px var(--border)",
      "type": "boxShadow"
    },
    "raised": {
      "value": "0 1px 2px rgba(20,24,26,0.04), 0 4px 10px rgba(20,24,26,0.05)",
      "type": "boxShadow"
    },
    "focusRing": {
      "value": "0 0 0 3px rgba(11,132,120,0.28)",
      "type": "boxShadow"
    }
  },
  "motion": {
    "fast": {
      "value": "120ms",
      "type": "duration"
    },
    "base": {
      "value": "150ms",
      "type": "duration"
    },
    "enter": {
      "value": "250ms",
      "type": "duration"
    },
    "ease": {
      "value": "cubic-bezier(0.2, 0, 0, 1)",
      "type": "cubicBezier"
    }
  }
};
export default data;
