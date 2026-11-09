/**
 * 存储适配层 —— 把「wx.* 调用」与「纯逻辑」彻底分离
 *
 * 目的：core/ 与 datasource 的纯逻辑必须能在 node 下直接单测（SPEC §12 第 2 步）。
 *   - StorageLike 是唯一存储契约，datasource 只依赖它；
 *   - 小程序运行期用 createWxStorage(wx) 适配；
 *   - node 单测用 MemoryStorage（同语义：值经序列化往返，避免引用别名假象）。
 */

export interface StorageLike {
  /** 不存在返回 undefined（不返回 null / ''，避免歧义） */
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
}

/** wx 存储最小接口（无需引入 @types/wechat-miniprogram，便于 node 下注入桩） */
export interface WxStorageApi {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, data: unknown): void;
  removeStorageSync(key: string): void;
}

/** 内存存储：node 单测用，语义与 wx.storage 一致（JSON 往返，隔绝外部引用改动） */
export class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  get(key: string): unknown {
    if (!key) return undefined;
    const raw = this.map.get(key);
    if (raw === undefined) return undefined;
    return JSON.parse(raw) as unknown;
  }

  set(key: string, value: unknown): void {
    if (!key) throw new Error('storage key 不能为空');
    this.map.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.map.delete(key);
  }

  /** 仅供测试断言用（不属于 StorageLike 契约） */
  rawKeys(): string[] {
    return Array.from(this.map.keys());
  }
}

/**
 * 把 wx.storage 适配为 StorageLike。
 *
 * 为什么写入前显式 JSON.stringify（而不是直接把对象交给 wx）：
 *   wx.getStorageSync 对「字符串值」与「对象值」返回类型不同，若直接存裸值，
 *   遇到 activeDatasetVersion 这类本来就是字符串的值，读取时无法区分
 *   「存的就是字符串 JSON」和「存的是一个 JSON 文档」——显式序列化后，
 *   读回来的一定是合法 JSON 文本，JSON.parse 恒可判定，避免歧义。
 *   wx.getStorageSync 在 key 不存在时返回 ''，同样需要归一化为 undefined。
 */
export function createWxStorage(wx: WxStorageApi): StorageLike {
  return {
    get(key: string): unknown {
      if (!key) return undefined;
      const raw = wx.getStorageSync(key);
      if (raw === '' || raw === null || raw === undefined) return undefined;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as unknown;
        } catch {
          // 历史脏数据：按「无数据」处理，由 datasource 决定兜底策略
          return undefined;
        }
      }
      return raw;
    },
    set(key: string, value: unknown): void {
      if (!key) throw new Error('storage key 不能为空');
      wx.setStorageSync(key, JSON.stringify(value));
    },
    remove(key: string): void {
      if (!key) return;
      wx.removeStorageSync(key);
    },
  };
}
