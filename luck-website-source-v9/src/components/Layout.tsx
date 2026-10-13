import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  Globe,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { config } from "../config";
import { useApp } from "../hooks";
import { mock, service } from "../services";
import { Brand, CopyButton, Modal, Spinner, ToastContext } from "./ui";
import { DevSettings } from "./Settings";
const nav = [
  ["/", "首页"],
  ["/daily", "每日开奖"],
  ["/quick", "快速骰战"],
  ["/pools", "奖池与规则"],
  ["/history", "历史记录"],
];
export function Layout() {
  const state = useApp();
  useEffect(() => {
    mock.refreshStage();
    const timer = window.setInterval(() => mock.refreshStage(), 500);
    return () => window.clearInterval(timer);
  }, []);
  const [walletOpen, setWalletOpen] = useState(false),
    [menu, setMenu] = useState(false),
    [dropdown, setDropdown] = useState(false),
    [settings, setSettings] = useState(false),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState("");
  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4500);
  }, []);
  const closeWallet = useCallback(() => setWalletOpen(false), []),
    closeSettings = useCallback(() => setSettings(false), []);
  async function connect() {
    setBusy(true);
    try {
      await service.connect();
      closeWallet();
      showToast("演示钱包已连接 · 余额 250,000 luck 起始额度");
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToastContext.Provider value={showToast}>
      <div className="site-shell">
        <header className="site-header">
          <div className="header-inner">
            <Brand />
            <nav
              className={menu ? "main-nav nav-open" : "main-nav"}
              aria-label="主导航"
            >
              {nav.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMenu(false)}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="header-actions">
              <span className="network">
                <span className="bnb-icon">◆</span> BNB Chain <i />
              </span>
              <div className="wallet-wrap">
                <button
                  className="button wallet-button"
                  onClick={() =>
                    state.wallet.connected
                      ? setDropdown(!dropdown)
                      : setWalletOpen(true)
                  }
                >
                  <Wallet size={16} />
                  <span>
                    {state.wallet.connected ? "DEMO…0001" : "连接钱包"}
                  </span>
                  {state.wallet.connected && <ChevronDown size={13} />}
                </button>
                {dropdown && (
                  <div className="wallet-dropdown">
                    <p>
                      演示钱包 <CopyButton value={state.wallet.address} />
                    </p>
                    <Link to="/account" onClick={() => setDropdown(false)}>
                      <UserRound size={16} />
                      个人中心
                    </Link>
                    <button
                      onClick={async () => {
                        await service.disconnect();
                        setDropdown(false);
                      }}
                    >
                      <LogOut size={16} />
                      断开连接
                    </button>
                  </div>
                )}
              </div>
              <button
                className="icon-button mobile-menu"
                aria-label={menu ? "关闭导航" : "打开导航"}
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </header>
        <div className="demo-strip">
          <div>
            <FlaskConical size={13} />
            <strong>示例数据</strong>
            <span>当前为交互演示环境，所有参与及领奖均为模拟操作</span>
            <span className="demo-strip-right">
              探索你的链上幸运 <ArrowRight size={13} />
            </span>
          </div>
        </div>
        <main>
          <Outlet />
        </main>
        <footer>
          <div className="footer-top">
            <Brand small />
            <p>每一次选择，都有新的可能。</p>
            <div className="footer-links">
              <Link to="/pools">
                <CircleHelp size={14} />
                玩法规则
              </Link>
              <button onClick={() => setSettings(true)}>
                <Settings2 size={14} />
                开发设置
              </button>
              <span>
                <Globe size={14} />
                简体中文
              </span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} luck. All rights reserved.</span>
            <span>
              <ShieldCheck size={13} />
              演示预览 · 真实钱包、合约与链上开奖待接入
            </span>
            <span className="footer-status">
              <i /> {config.network.name} 展示网络
            </span>
          </div>
        </footer>
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
            <button aria-label="关闭提示" onClick={() => setToast("")}>
              <X size={14} />
            </button>
          </div>
        )}
        {walletOpen && (
          <Modal title="连接钱包" onClose={closeWallet}>
            <div className="wallet-illustration">
              <Wallet size={42} />
            </div>
            <h3 className="center">准备好开启幸运了吗？</h3>
            <p className="modal-description">
              连接演示钱包，体验选号、参与和领奖流程。
            </p>
            <button className="wallet-option" disabled={busy} onClick={connect}>
              <span className="wallet-option-icon">
                <FlaskConical />
              </span>
              <span>
                <strong>luck 演示钱包</strong>
                <small>浏览器本地体验 · 无需安装插件</small>
              </span>
              {busy ? <Spinner /> : <ArrowRight size={20} />}
            </button>
            <p className="info-note">
              演示钱包不使用真实私钥，不会发起真实 Token 转账。
            </p>
          </Modal>
        )}
        {settings && <DevSettings onClose={closeSettings} />}
      </div>
    </ToastContext.Provider>
  );
}
