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