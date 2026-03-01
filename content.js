
/*
VERSION 1
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

// 延迟运行，确保异步加载的表格也能被抓到
setTimeout(highlightTables, 2000);
*/
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
