import type { Language } from "../types";

export const DEFAULT_LANGUAGE: Language = "zh-CN";

export const copy = {
  "zh-CN": {
    accountFallback: "ACCOUNT",
    active: "正在消耗额度",
    availableLabel: (percent: number) => `5 小时额度剩余 ${percent}%`,
    clickThroughOff: "取消鼠标穿透",
    controls: "悬浮窗控制",
    creditExpiresUnknown: "到期时间未知",
    creditItem: (index: number, label: string) => `第 ${index + 1} 次：${label}`,
    dataSynced: "额度数据已同步",
    dataStale: "额度数据已过期",
    dateUnknown: "日期未知",
    errorUnavailable: "额度接口暂时不可用，将自动重试。",
    loadingQuota: "正在读取额度",
    noCreditExpiration: "当前接口只返回数量，未返回到期时间。",
    notSignedIn: "未登录",
    pinOff: "取消置顶",
    pinOn: "置顶显示",
    refresh: "刷新",
    refreshQuota: "刷新额度数据",
    resetCreditUnknown: "重置机会未知",
    resetCredits: (count: number) => `${count} 次重置机会`,
    resetInDays: (days: number, hours: number) => `${days} 天 ${hours} 小时后重置`,
    resetInHours: (hours: number, minutes: number) => minutes ? `${hours} 小时 ${minutes} 分钟后重置` : `${hours} 小时后重置`,
    resetInMinutes: (minutes: number) => `${minutes} 分钟后重置`,
    resetTimeUnknown: "重置时间未知",
    resetUpdating: "正在更新额度",
    servicePrevious: "上一个服务",
    serviceNext: "下一个服务",
    shortRemaining: "5 小时剩余",
    signedInRequired: "请先登录 Codex",
    staleExpired: "额度数据已过期",
    temporarilyUnavailable: "暂时无法读取",
    unavailableStatus: "暂时无法读取额度",
    view: "查看",
    weeklyRemaining: "本周剩余",
    weeklyUntil: (date: string) => `本周剩余 · 至 ${date}`,
  },
} as const;

export function normalizeLanguage(_value: unknown): Language {
  return DEFAULT_LANGUAGE;
}
