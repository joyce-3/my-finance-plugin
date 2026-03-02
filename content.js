
/*
version 1
function highlightTables() {
  const financeKeywords = ["资产负债表", "利润表", "现金流量表", "Equity", "Balance Sheet", "Income Statement"];
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    if (financeKeywords.some(key => table.innerText.includes(key))) {
      table.style.outline = "3px dashed #ff4757";
      table.style.backgroundColor = "rgba(255, 71, 87, 0.05)";
      
      const label = document.createElement('div');
      label.innerText = "检测到财务报表";
      label.style = "background:#ff4757; color:white; padding:2px 5px; font-size:12px; position:absolute; z-index:9999;";
      table.parentNode.insertBefore(label, table);
    }
  });
}

version 2
// 延迟运行，确保异步加载的表格也能被抓到
setTimeout(highlightTables, 2000);

function highlightTables() {
  // 增加核心科目关键词，只要看到这些词，大概率就是报表
  const financeKeywords = [
    "Revenue", "Income", "Assets", "Liabilities", "Equity", "Cash flows", 
    "Operating expenses", "Net loss", "Comprehensive loss", "Balance Sheet"
  ];
  
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    const text = table.innerText;
    // 逻辑升级：只要表格内包含 2 个以上关键词，或者包含特定的科目名就标记
    const matchCount = financeKeywords.filter(key => text.includes(key)).length;
    
    if (matchCount >= 1) {
      table.style.outline = "3px dashed #ff4757";
      table.style.backgroundColor = "rgba(255, 71, 87, 0.05)";
    }
  });
}
// 文远知行这种页面建议给 3 秒，等它渲染完
setTimeout(highlightTables, 3000);


function highlightTables() {
  // 1. 极度扩充关键词，只要沾边就抓
  const financeKeywords = [
    "Revenue", "Income", "Assets", "Liabilities", "Equity", "Cash flows", 
    "Operating expenses", "Net loss", "Balance Sheet", "资产", "负债", "收入", "支出"
  ];
  
  // 2. 找到页面上所有的 table
  const tables = document.querySelectorAll('table');
  
  tables.forEach((table, index) => {
    // 检查这个表格是否已经被我们贴过按钮了
    if (table.dataset.detected) return;

    const text = table.innerText;
    // 逻辑：只要包含任何一个财务词汇
    const hasKeyword = financeKeywords.some(key => text.includes(key));
    
    // 或者：如果表格非常大（行数>3，列数>2），通常也是数据表
    const isDataHeavy = table.rows.length > 3 && table.rows[0].cells.length > 2;

    if (hasKeyword || isDataHeavy) {
      table.dataset.detected = "true"; 
      table.style.outline = "3px dashed #ff4757";
      table.style.backgroundColor = "rgba(255, 71, 87, 0.05)";
      table.style.position = "relative";

      // 创建下载按钮容器
      const btnContainer = document.createElement('div');
      btnContainer.style = "margin-top: 10px; margin-bottom: 5px; position: relative; z-index: 1000;";

      const downloadBtn = document.createElement('button');
      // 尝试自动识别表名作为按钮文字
      let possibleTitle = table.previousElementSibling?.innerText?.split('\n')[0] || "财务报表";
      downloadBtn.innerText = `📥 下载: ${possibleTitle.substring(0, 15)}...`;
      
      downloadBtn.style = `
        background: #ff4757; color: white; border: none; padding: 6px 12px; 
        cursor: pointer; border-radius: 4px; font-weight: bold;
      `;

      downloadBtn.onclick = () => {
        const tableData = processSingleTable(table);
        sendToDownload(tableData);
        downloadBtn.innerText = "✅ 已导出";
        downloadBtn.style.background = "#2ed573";
      };

      btnContainer.appendChild(downloadBtn);
      // 插入到表格最前面
      table.parentNode.insertBefore(btnContainer, table);
    }
  });
}

// 提取与清洗逻辑（保留之前的括号修复功能）
function processSingleTable(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  const content = rows.map(row => {
    let cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
    let cleanedRow = [];
    for (let i = 0; i < cells.length; i++) {
      let val = cells[i].replace(/,/g, '');
      // 修复括号拆分： ( 123 ) -> -123
      if (val === "(" && i + 2 < cells.length && cells[i+2] === ")") {
        cleanedRow.push(`"-${cells[i+1].replace(/,/g, '')}"`);
        i += 2; continue;
      }
      cleanedRow.push(`"${val}"`);
    }
    return cleanedRow;
  });
  const title = table.previousElementSibling?.innerText?.split('\n')[0] || "Report";
  return { title, content };
}

function sendToDownload(data) {
  const csvContent = data.content.map(row => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title.replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '_')}.csv`;
  a.click();
}

// --- 关键：解决 WeRide 抓不到的关键就在这里 ---
// 1. 进入页面跑一次
setTimeout(highlightTables, 1000);
// 2. 3秒后再跑一次（等动态加载）
setTimeout(highlightTables, 3000);
// 3. 滚动时实时检测（最管用！）
window.onscroll = () => {
  highlightTables();
};
*/
// ====== 核心检测逻辑 ======
const financeKeywords = [
  "Revenue", "Income", "Assets", "Liabilities", "Equity", "Cash",
  "Operating", "Net loss", "Net income", "Balance", "Earnings", "EPS",
  "资产", "负债", "收入", "支出", "利润", "现金流", "股东权益"
];

function isFinancialTable(element) {
  const text = element.innerText || element.textContent;
  const hasKeyword = financeKeywords.some(key =>
    text.toLowerCase().includes(key.toLowerCase())
  );
  // 对于真实 <table>，检查行列数
  if (element.tagName === 'TABLE') {
    const isDataHeavy = element.rows.length > 3 && element.rows[0]?.cells.length > 2;
    return hasKeyword || isDataHeavy;
  }
  // 对于 div 模拟的表格，至少要有关键词
  return hasKeyword;
}

// ====== 处理真实 <table> ======
function processNativeTables() {
  document.querySelectorAll('table').forEach(table => {
    if (table.dataset.detected) return;
    if (isFinancialTable(table)) {
      markAndAddButton(table, () => processSingleTable(table));
    }
  });
}

// ====== 处理 div 模拟的表格 ======
function processDivTables() {
  // 常见的 div 表格 role 属性
  document.querySelectorAll('[role="table"], [role="grid"]').forEach(el => {
    if (el.dataset.detected) return;
    if (isFinancialTable(el)) {
      markAndAddButton(el, () => processDivTable(el));
    }
  });

  // 通过 class 名猜测（常见财务网站的规律）
  const tableClassPatterns = /table|grid|spreadsheet|financ|report/i;
  document.querySelectorAll('div[class]').forEach(el => {
    if (el.dataset.detected) return;
    if (!tableClassPatterns.test(el.className)) return;
    // 子元素要有一定数量的行结构
    const rows = el.querySelectorAll('[role="row"], .row, .tr');
    if (rows.length > 3 && isFinancialTable(el)) {
      markAndAddButton(el, () => processDivTable(el));
    }
  });
}

// ====== 处理 iframe 内的表格 ======
function processIframes() {
  document.querySelectorAll('iframe').forEach(iframe => {
    try {
      // 同源 iframe 才能访问
      const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iDoc) return;
      iDoc.querySelectorAll('table').forEach(table => {
        if (table.dataset.detected) return;
        if (isFinancialTable(table)) {
          markAndAddButton(table, () => processSingleTable(table));
        }
      });
    } catch (e) {
      // 跨域 iframe 会报错，忽略
      console.log('跨域 iframe，无法访问:', iframe.src);
    }
  });
}

// ====== 标记 + 插入按钮 ======
function markAndAddButton(element, extractFn) {
  element.dataset.detected = "true";
  element.style.outline = "3px dashed #ff4757";
  element.style.backgroundColor = "rgba(255, 71, 87, 0.05)";

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = "margin: 5px 0; position: relative; z-index: 9999;";

  const downloadBtn = document.createElement('button');
  const possibleTitle = element.previousElementSibling?.innerText?.split('\n')[0]
    || element.closest('section')?.querySelector('h1,h2,h3,h4')?.innerText
    || "财务报表";
  downloadBtn.innerText = `📥 下载: ${possibleTitle.substring(0, 20)}`;
  downloadBtn.style.cssText = `
    background: #ff4757; color: white; border: none; padding: 6px 12px;
    cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 13px;
  `;
  downloadBtn.addEventListener('click', () => {  // 用 addEventListener 替代 onclick
    const tableData = extractFn();
    if (tableData) {
      sendToDownload(tableData);
      downloadBtn.innerText = "✅ 已导出";
      downloadBtn.style.background = "#2ed573";
    }
  });

  btnContainer.appendChild(downloadBtn);
  element.parentNode.insertBefore(btnContainer, element);
}

// ====== 提取 <table> 数据（保留你的括号修复逻辑）======
function processSingleTable(table) {
  const rows = Array.from(table.querySelectorAll('tr'));

  // ── 第一步：提取所有行的原始 cells ──
  const parsedRows = rows.map(row => {
    return Array.from(row.querySelectorAll('td, th')).map(cell => ({
      text: cell.innerText.trim(),
      colspan: parseInt(cell.getAttribute('colspan') || 1)
    }));
  });

  // ── 第二步：找出哪些列是货币列 ──
  const colCurrencyCount = {};
  parsedRows.forEach(cells => {
    let colIndex = 0;
    cells.forEach(({ text, colspan }) => {
      const val = text.replace(/,/g, '').trim();
      if (/^[$€£¥₩]$/.test(val)) {
        colCurrencyCount[colIndex] = (colCurrencyCount[colIndex] || 0) + 1;
      }
      colIndex += colspan;
    });
  });

  const currencyCols = new Set(
    Object.entries(colCurrencyCount)
      .filter(([, count]) => count > 1)
      .map(([col]) => parseInt(col))
  );

  // ── 第三步：清洗每一行 ──
  const content = parsedRows.map(cells => {
    const cleanedRow = [];
    let colIndex = 0;

    for (let i = 0; i < cells.length; i++) {
      const { text, colspan } = cells[i];
      const val = text.replace(/,/g, '').trim();

      // 1. 跳过孤立括号残留格
      if (val === '(' || val === ')') {
        colIndex += colspan;
        continue;
      }

      // 2. 货币符号单独一格 → 货币列 + 数字列分开
      if (/^[$€£¥₩]$/.test(val) && i + 1 < cells.length) {
        const nextVal = cells[i + 1].text.replace(/,/g, '').trim();
        if (/^-?[\d.]+$/.test(nextVal)) {
          cleanedRow.push(`"${val}"`);
          cleanedRow.push(`"${nextVal}"`);
          for (let c = 1; c < colspan; c++) cleanedRow.push('""');
          colIndex += colspan + 1;
          i += 1;
          continue;
        }
      }

      // 3. 当前列是货币列，但这行没有货币符号 → 补空列占位
      if (currencyCols.has(colIndex) && !/^[$€£¥₩]$/.test(val)) {
        cleanedRow.push('""');
        colIndex += 1;
        // 不推进 i，继续处理当前 cell 的数字内容
      }

      // 4. 左括号和数字在同一格，右括号在下一格：(89715 | )
      if (val.startsWith('(') && !val.endsWith(')')) {
        cleanedRow.push(`"-${val.slice(1)}"`);
        for (let c = 1; c < colspan; c++) cleanedRow.push('""');
        if (i + 1 < cells.length && cells[i + 1].text.trim() === ')') i += 1;
        colIndex += colspan;
        continue;
      }

      // 5. 整体括号负数在一格：(89715)
      if (/^\([\d.]+\)$/.test(val)) {
        cleanedRow.push(`"-${val.slice(1, -1)}"`);
        for (let c = 1; c < colspan; c++) cleanedRow.push('""');
        colIndex += colspan;
        continue;
      }

      // 6. 普通格
      cleanedRow.push(`"${val.replace(/"/g, '""')}"`);
      for (let c = 1; c < colspan; c++) cleanedRow.push('""');
      colIndex += colspan;
    }

    return cleanedRow;
  });

  const title =
    table.previousElementSibling?.innerText?.split('\n')[0]?.trim()
    || table.querySelector('caption')?.innerText?.trim()
    || 'Report';

  return { title, content };
}



// ====== 提取 div 模拟表格数据 ======
function processDivTable(el) {
  const rows = el.querySelectorAll('[role="row"], .row, .tr');
  if (rows.length === 0) return null;

  const content = Array.from(rows).map(row => {
    const cells = row.querySelectorAll('[role="cell"], [role="columnheader"], .cell, .td, .th');
    return Array.from(cells).map(cell => `"${cell.innerText.trim().replace(/,/g, '')}"`);
  });

  const title = el.closest('section')?.querySelector('h1,h2,h3,h4')?.innerText || "Report";
  return { title, content };
}

// ====== 下载 CSV ======
function sendToDownload(data) {
  const csvContent = data.content.map(row => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title.replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '_')}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // 释放内存
}

// ====== 主入口 ======
function highlightTables() {
  processNativeTables();
  processDivTables();
  processIframes();
}

// ====== 启动策略 ======

// 1. 立即执行一次
highlightTables();

// 2. 用 MutationObserver 替代 setTimeout 轮询，精准监听 DOM 变化
const observer = new MutationObserver((mutations) => {
  // 节流：避免频繁触发
  clearTimeout(window._highlightTimer);
  window._highlightTimer = setTimeout(highlightTables, 300);
});
observer.observe(document.body, { childList: true, subtree: true });

// 3. 修复：用 addEventListener 而不是 onscroll（避免覆盖原有事件）
let scrollTimer;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(highlightTables, 200); // 节流
}, { passive: true });

// 4. 页面完全加载后再跑一次（处理懒加载图片/脚本触发的DOM变化）
window.addEventListener('load', () => setTimeout(highlightTables, 500));
