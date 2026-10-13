import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import "@fontsource-variable/manrope";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Daily from "./pages/Daily";
import Quick from "./pages/Quick";
import Pools from "./pages/Pools";
import History from "./pages/History";
import Account from "./pages/Account";
import { config, TOKEN_LOGO } from "./config";
import "./styles.css";
import "./experience.css";
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="unavailable">
        <h1>页面暂时无法显示</h1>
        <p>请刷新重试；如果问题持续，清除 luck-preview-v1 演示缓存后再访问。</p>
        <button className="button primary" onClick={() => location.reload()}>
          刷新页面
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  if (config.mode === "real")
    return (
      <div className="unavailable">
        <img src={TOKEN_LOGO} width="60" alt="luck" />
        <h1>真实服务待接入</h1>
        <p>
          当前为 real 模式。请配置并实现
          API、钱包和合约适配器后启用真实资金操作。
        </p>
        <p>
          此模式不会退回演示数据。预览请设置 VITE_SERVICE_MODE=mock 后重启。
        </p>
      </div>
    );
  return (
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="daily" element={<Daily />} />
          <Route path="quick" element={<Quick />} />
          <Route path="pools" element={<Pools />} />
          <Route path="history" element={<History />} />
          <Route path="account" element={<Account />} />
          <Route
            path="*"
            element={
              <div className="unavailable">
                <h1>这份幸运，还没有被找到。</h1>
                <Link to="/" className="button primary">
                  返回首页
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
