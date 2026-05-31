/* ForexBonusWhale - Connected to Realtime Database */
(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))s(u);new MutationObserver(u=>{for(const d of u)if(d.type==="childList")for(const h of d.addedNodes)h.tagName==="LINK"&&h.rel===\"modulepreload\"&&s(h)}).observe(document,{childList:!0,subtree:!0});function i(u){const d={};return u.integrity&&(d.integrity=u.integrity),u.referrerPolicy&&(d.referrerPolicy=u.referrerPolicy),u.crossOrigin===\"use-credentials\"?d.credentials=\"include\":u.crossOrigin===\"anonymous\"?d.credentials=\"omit\":d.credentials=\"same-origin\",d}function s(u){if(u.ep)return;u.ep=!0;const d=i(u);fetch(u.href,d)}})();var f={exports:{}};import*as React from "react";import*as ReactDOM from "react-dom/client";var React__default=React&&React.__esModule?React:{"default":React};
const FIREBASE_URL = "https://froexbonuswhale-default-rtdb.firebaseio.com/brokers.json";

// UI Components Embedded for Client Rendering
function App() {
  const [brokers, setBrokers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentTab, setCurrentTab] = React.useState(window.location.hash || '#/');

  React.useEffect(() => {
    const handleHash = () => setCurrentTab(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHash);
    
    // Fetch data directly from Firebase Realtime Database
    fetch(FIREBASE_URL)
      .then(res => res.json())
      .then(data => {
        if (data) {
          // Convert Firebase Object layout to array structure matching layout
          const list = Object.keys(data).map(key => ({
            fbKey: key,
            ...data[key]
          })).filter(b => b.status === 'active');
          setBrokers(list);
        } else {
          setBrokers([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const incrementView = async (fbKey, currentViews) => {
    const baseUrl = FIREBASE_URL.replace('.json', '');
    fetch(`${baseUrl}/${fbKey}/viewCount.json`, {
      method: 'PUT',
      body: JSON.stringify((currentViews || 0) + 1)
    }).catch(e => console.error(e));
  };

  // Filter based on routing simulation matching compiled code
  const getCategory = () => {
    if (currentTab === '#/deposit') return 'deposit';
    if (currentTab === '#/contests') return 'contest';
    return 'no_deposit';
  };

  const filtered = brokers.filter(b => b.category === getCategory());

  return (
    React__default.default.createElement("div", { className: "min-height-screen bg-slate-950 text-slate-100" },
      React__default.default.createElement("header", { className: "border-b border-slate-900 bg-slate-950/50 backdrop-blur sticky top-0 z-50 py-4" },
        React__default.default.createElement("div", { className: "max-w-5xl mx-auto px-4 flex items-center justify-between" },
          React__default.default.createElement("a", { href: "#/", className: "text-xl font-black tracking-tight text-white flex items-center gap-2" }, "🐋 ForexBonusWhale"),
          React__default.default.createElement("div", { className: "flex gap-4 text-sm font-medium" },
            React__default.default.createElement("a", { href: "#/", className: `hover:text-yellow-400 ${getCategory()==='no_deposit'?'text-yellow-400':''}` }, "No Deposit"),
            React__default.default.createElement("a", { href: "#/deposit", className: `hover:text-yellow-400 ${getCategory()==='deposit'?'text-yellow-400':''}` }, "Deposit Bonus"),
            React__default.default.createElement("a", { href: "#/contests", className: `hover:text-yellow-400 ${getCategory()==='contest'?'text-yellow-400':''}` }, "Contests")
          )
        )
      ),
      React__default.default.createElement("main", { className: "max-w-5xl mx-auto px-4 py-12" },
        React__default.default.createElement("div", { className: "text-center max-w-2xl mx-auto mb-12" },
          React__default.default.createElement("h1", { className: "text-4xl font-extrabold text-white mb-3" }, "Free Forex Bonuses & Trading Contests"),
          React__default.default.createElement("p", { className: "text-slate-400 text-sm" }, "Verified list of live offers globally. Controlled live via Firebase cloud backend.")
        ),
        loading ? React__default.default.createElement("p", { className: "text-center text-slate-500" }, "Loading brokers...") : 
        filtered.length === 0 ? React__default.default.createElement("p", { className: "text-center text-slate-500" }, "No active bonuses available in this category right now.") :
        React__default.default.createElement("div", { className: "grid gap-6" },
          filtered.map(b => (
            React__default.default.createElement("div", { key: b.fbKey, className: "bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" },
              React__default.default.createElement("div", { className: "space-y-2" },
                React__default.default.createElement("div", { className: "flex items-center gap-3" },
                  React__default.default.createElement("h3", { className: "text-xl font-bold text-white" }, b.name),
                  React__default.default.createElement("span", { className: "text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400" }, b.category)
                ),
                React__default.default.createElement("p", { className: "text-sm text-slate-400 max-w-xl whitespace-pre-line" }, b.rules)
              ),
              React__default.default.createElement("div", { className: "flex flex-row md:flex-col items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 gap-4" },
                React__default.default.createElement("div", { className: "text-left md:text-right" },
                  React__default.default.createElement("div", { className: "text-2xl font-black text-yellow-400" }, b.bonusAmount),
                  React__default.default.createElement("div", { className: "text-xs text-slate-500 mt-1" }, `👁️ ${b.viewCount || 0} views | ⭐ ${b.ratingAvg || 0} rating`)
                ),
                React__default.default.createElement("a", { 
                  href: b.link, 
                  target: "_blank", 
                  onClick: () => incrementView(b.fbKey, b.viewCount),
                  className: "px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-500/10"
                }, "Claim Bonus")
              )
            )
          ))
        )
      )
    )
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(React__default.default.createElement(App, null));
                                                                                                                                                                                                                   }
                                                                                                                                                                                                                    
