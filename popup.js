/*
document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeFinancialTables
  }, (results) => {
    if (results && results[0].result) {
      const data = results[0].result;
      if (data.length > 0) {
        downloadCSV(data[0].content); // 默认下载识别到的第一个表
        document.getElementById('status').innerText = `成功提取 ${data.length} 张表格！`;
      } else {
        document.getElementById('status').innerText = "未发现匹配的财务表格";
      }
    }
  });
});

function scrapeFinancialTables() {
  const tables = Array.from(document.querySelectorAll('table'));
  
  return tables.map(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const content = rows.map(row => {
      let cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
      
      // --- 关键逻辑：修复括号拆分问题 ---
      let cleanedRow = [];
      for (let i = 0; i < cells.length; i++) {
        let val = cells[i].replace(/,/g, ''); // 移除千分位
        
        // 如果当前格是 "("，且下一格有内容，尝试合并
        if (val === "(" && i + 1 < cells.length) {
          let nextVal = cells[i+1].replace(/,/g, '');
          // 检查再下一格是不是 ")"
          if (i + 2 < cells.length && cells[i+2] === ")") {
            cleanedRow.push(`"-${nextVal}"`); // 合并为负数
            i += 2; // 跳过后面两格
            continue;
          }
        }
        
        // 处理自带括号的情况 (123)
        if (val.startsWith('(') && val.endsWith(')')) {
          val = '-' + val.substring(1, val.length - 1);
        }
        
        cleanedRow.push(`"${val}"`);
      }
      return cleanedRow;
    });
    
    // 尝试找表格标题
    let tableName = table.previousElementSibling?.innerText?.split('\n')[0] || "Table";
    return { tableName, content };
  });
}

function downloadCSV(contentRows) {
  const csvContent = contentRows.map(row => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Financial_Data_${new Date().getTime()}.csv`;
  a.click();
}

*/

// ── 入口：点击抓取按钮 ────────────────────────────────────────
document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  statusEl.innerText = '⏳ 扫描中...';

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) {
    statusEl.innerText = '❌ 无法获取当前页面';
    return;
  }

  // executeScript 注入的函数在页面上下文里跑，无法访问 popup 的任何变量/函数
  // 所以清洗逻辑必须完整内联在 scrapeFinancialTables 里
  chrome.scripting.executeScript(
    { target: { tabId: tab.id }, func: scrapeFinancialTables },
    (results) => {
      // 1. 处理注入失败（chrome:// 页面、扩展页面等不允许注入）
      if (chrome.runtime.lastError) {
        statusEl.innerText = '❌ 该页面不支持脚本注入';
        console.error(chrome.runtime.lastError.message);
        return;
      }

      // 2. 处理返回值为空
      if (!results || !results[0]?.result) {
        statusEl.innerText = '❌ 脚本执行失败，请刷新页面后重试';
        return;
      }

      const tables = results[0].result;

      // 3. 没找到财务表格
      if (tables.length === 0) {
        statusEl.innerText = '😶 未发现匹配的财务表格';
        return;
      }

      // 4. 找到了：渲染可选列表，让用户自己选下载哪张
      statusEl.innerText = `✅ 识别到 ${tables.length} 张财务表格`;
      renderTableList(tables);
    }
  );
});

// ── 渲染表格列表，支持逐张下载 ───────────────────────────────
function renderTableList(tables) {
  // 先找或创建列表容器
  let listEl = document.getElementById('tableList');
  if (!listEl) {
    listEl = document.createElement('div');
    listEl.id = 'tableList';
    document.body.appendChild(listEl);
  }
  listEl.innerHTML = '';

  tables.forEach((table, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:8px; margin:6px 0;';

    const label = document.createElement('span');
    label.style.cssText = 'flex:1; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    label.title = table.tableName;  // hover 显示完整名
    label.textContent = `[${idx + 1}] ${table.tableName}（${table.content.length} 行）`;

    const btn = document.createElement('button');
    btn.textContent = '↓ CSV';
    btn.style.cssText = 'flex-shrink:0; padding:3px 8px; font-size:11px; cursor:pointer;';
    btn.addEventListener('click', () => {
      downloadCSV(table.content, table.tableName);
      btn.textContent = '✅';
      setTimeout(() => btn.textContent = '↓ CSV', 2000);
    });

    row.appendChild(label);
    row.appendChild(btn);
    listEl.appendChild(row);
  });

  // 如果超过一张，额外提供"全部下载"按钮
  if (tables.length > 1) {
    const allBtn = document.createElement('button');
    allBtn.textContent = `⬇ 全部下载 (${tables.length} 个 CSV)`;
    allBtn.style.cssText = 'width:100%; margin-top:8px; padding:6px; cursor:pointer; font-size:12px;';
    allBtn.addEventListener('click', () => {
      // 逐个下载，加延迟避免浏览器拦截多个 blob URL
      tables.forEach((t, i) => setTimeout(() => downloadCSV(t.content, t.tableName), i * 300));
    });
    listEl.appendChild(allBtn);
  }
}

// ── 注入到页面的函数（必须完全自包含，不能引用外部任何东西）──
function scrapeFinancialTables() {
  const KEYWORDS = [
    "资产", "负债", "利润", "营收", "净利", "现金流", "股东权益",
    "Revenue", "Income", "Assets", "Liabilities", "Equity",
    "Cash", "Balance Sheet", "Operating", "Earnings"
  ];

  // 内联清洗函数（作用域隔离，必须写在这里）
  function cleanCell(raw) {
    let val = raw.trim().replace(/,/g, '');
    // 自带括号的整体负数：(123.45) → -123.45
    if (/^\([\d.]+\)$/.test(val)) {
      val = '-' + val.slice(1, -1);
    }
    // 转义 CSV 里的双引号
    return '"' + val.replace(/"/g, '""') + '"';
  }

  const tables = Array.from(document.querySelectorAll('table'));

  // 过滤：只要包含财务关键词的表格
//  const financialTables = tables.filter(t =>
 //   KEYWORDS.some(key => t.innerText.includes(key))
//  );

  return financialTables.map(table => {
    const rows = Array.from(table.querySelectorAll('tr'));

    const content = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.innerText.trim());
      const cleaned = [];

      for (let i = 0; i < cells.length; i++) {
        const val = cells[i].replace(/,/g, '');

        // 括号被拆成三格的情况：["(", "123", ")"] → "-123"
        if (val === '(' && i + 2 < cells.length && cells[i + 2] === ')') {
          cleaned.push('"' + '-' + cells[i + 1].replace(/,/g, '') + '"');
          i += 2;
          continue;
        }

        cleaned.push(cleanCell(cells[i]));
      }
      return cleaned;
    });

    const tableName =
      table.previousElementSibling?.innerText?.split('\n')[0]?.trim()
      || table.querySelector('caption')?.innerText?.trim()   // 有些表格用 <caption>
      || `Table_${Date.now()}`;

    return { tableName, content };
  });
}

// ── CSV 下载 ─────────────────────────────────────────────────
function downloadCSV(contentRows, name = 'Financial_Data') {
  const safeName = name.replace(/[^\u4e00-\u9fa5\w]/g, '_').slice(0, 50);
  const csv = contentRows.map(row => row.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}_${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // 释放内存
}
