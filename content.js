
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
*/

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

