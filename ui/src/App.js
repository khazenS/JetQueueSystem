import AdminPage from "./pages/AdminPage";
import MainPage from "./pages/MainPage";
import { Routes, Route, HashRouter } from "react-router-dom";
import NoPage from "./pages/NoPage";
import AdminEntryPage from "./pages/AdminEntryPage.js";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Add title
    document.title = process.env.REACT_APP_SHOP_NAME;

    // Add favicon
    const appFavicon = process.env.REACT_APP_LOGO_NAME;
    if (appFavicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = appFavicon;
    }
  }, []);

  
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/adminLogin" element={<AdminEntryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NoPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;